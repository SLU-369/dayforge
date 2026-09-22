import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import Dexie from "dexie";
import {
  CURRENT_PLANNER_DOCUMENT_ID,
  LEGACY_PLANNER_STORAGE_KEY,
  LEGACY_V1_MIGRATION_KEY_PREFIX,
  DayforgeDatabase,
  IndexedDbPersistenceRepository,
  LegacyPlannerValidationError,
  LocalStorageLegacyPlannerSource,
  PersistenceValidationError,
  WebCryptoSha256Hasher,
  canonicalStringify,
  decodeLegacyV1MigrationMetadata,
  migrateLegacyPlannerV1,
} from "../persistence/index.ts";

let databaseSequence = 0;

function databaseName(label) {
  databaseSequence += 1;
  return `dayforge-migration-${label}-${databaseSequence}`;
}

function legacyState(overrides = {}) {
  return {
    version: 1,
    routine: {
      seg: [{
        id: "routine-1",
        start: "22:30",
        end: "06:30",
        title: "Sono",
        notes: "Preservar horário atravessando meia-noite",
        category: "sono",
      }],
      ter: [],
      qua: [],
      qui: [],
      sex: [],
      sab: [],
      dom: [],
    },
    records: {
      "2026-09-21": {
        date: "2026-09-21",
        items: [{
          id: "daily-1",
          start: "09:00",
          end: "10:00",
          title: "Foco",
          notes: "",
          category: "foco",
          completed: true,
          actualMinutes: 55,
        }],
        note: "Dia produtivo",
        energy: 4,
      },
    },
    monthlyGoals: { "2026-09": "Manter consistência" },
    ...overrides,
  };
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function validationError(code) {
  return (error) => error instanceof PersistenceValidationError && error.code === code;
}

async function createRepository(t, label) {
  const name = databaseName(label);
  const repository = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  await repository.open();
  t.after(async () => {
    repository.close();
    await Dexie.delete(name);
  });
  return repository;
}

test("SHA-256 uses the exact UTF-8 source bytes", async () => {
  const raw = "{\"texto\":\"ação ☀️\"}\r\n";
  const fingerprint = await new WebCryptoSha256Hasher().digestUtf8(raw);
  assert.equal(fingerprint, sha256(raw));
});

test("canonical JSON is independent from object key order and preserves array order", () => {
  assert.equal(
    canonicalStringify({ z: 1, a: { c: 3, b: 2 }, list: [2, 1] }),
    "{\"a\":{\"b\":2,\"c\":3},\"list\":[2,1],\"z\":1}",
  );
  assert.notEqual(canonicalStringify([1, 2]), canonicalStringify([2, 1]));
});

test("migrates a valid v1 source atomically without activating IndexedDB", async (t) => {
  const repository = await createRepository(t, "valid");
  const raw = JSON.stringify(legacyState(), null, 2);
  const result = await migrateLegacyPlannerV1({
    raw,
    migratedAt: "2026-09-22T12:00:00.000Z",
    repository,
  });

  assert.equal(result.outcome, "migrated");
  assert.equal(result.rawFingerprint, sha256(raw));
  assert.equal(result.sourceDocumentId, `legacy-v1/source/${result.rawFingerprint}`);
  assert.equal(result.documentId, CURRENT_PLANNER_DOCUMENT_ID);

  const persisted = await repository.read(async (transaction) => ({
    database: await transaction.getDatabaseMetadata(),
    source: await transaction.getPlannerDocument(result.sourceDocumentId),
    current: await transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID),
    migration: await transaction.getMetadata(
      `${LEGACY_V1_MIGRATION_KEY_PREFIX}${result.contentFingerprint}`,
    ),
  }));

  assert.equal(persisted.database.activeDocumentId, null);
  assert.equal(persisted.source.payload.raw, raw);
  assert.equal(persisted.source.payload.rawFingerprint, result.rawFingerprint);
  assert.equal(persisted.source.payload.contentFingerprint, result.contentFingerprint);
  assert.equal(persisted.current.payload.routine.seg[0].start, "22:30");
  assert.equal(persisted.current.payload.routine.seg[0].end, "06:30");
  assert.equal(persisted.current.payload.records["2026-09-21"].items[0].actualMinutes, 55);
  assert.deepEqual(persisted.migration.sourceRawFingerprints, [result.rawFingerprint]);
  assert.equal(persisted.migration.status, "validated");
});

test("an exact retry is idempotent and keeps the original migration audit instant", async (t) => {
  const repository = await createRepository(t, "retry");
  const raw = JSON.stringify(legacyState());
  const first = await migrateLegacyPlannerV1({
    raw,
    migratedAt: "2026-09-22T12:00:00.000Z",
    repository,
  });
  const retry = await migrateLegacyPlannerV1({
    raw,
    migratedAt: "2026-09-23T12:00:00.000Z",
    repository,
  });

  const metadata = await repository.read((transaction) => transaction.getMetadata(
    `${LEGACY_V1_MIGRATION_KEY_PREFIX}${first.contentFingerprint}`,
  ));
  assert.equal(retry.outcome, "already-migrated");
  assert.equal(metadata.migratedAt, "2026-09-22T12:00:00.000Z");
  assert.deepEqual(metadata.sourceRawFingerprints, [first.rawFingerprint]);
  assert.equal((await repository.read((transaction) => transaction.listPlannerDocuments())).length, 2);
});

test("different raw sources with equal content coexist without a second operational migration", async (t) => {
  const repository = await createRepository(t, "same-content");
  const state = legacyState();
  const compact = JSON.stringify(state);
  const formatted = JSON.stringify({
    records: state.records,
    routine: state.routine,
    monthlyGoals: state.monthlyGoals,
    version: state.version,
  }, null, 2);
  const first = await migrateLegacyPlannerV1({
    raw: compact,
    migratedAt: "2026-09-22T12:00:00.000Z",
    repository,
  });
  const second = await migrateLegacyPlannerV1({
    raw: formatted,
    migratedAt: "2026-09-23T12:00:00.000Z",
    repository,
  });

  assert.notEqual(first.rawFingerprint, second.rawFingerprint);
  assert.equal(first.contentFingerprint, second.contentFingerprint);
  assert.equal(second.outcome, "source-recorded");

  const documents = await repository.read((transaction) => transaction.listPlannerDocuments());
  assert.equal(documents.filter((document) => document.role === "migration-source").length, 2);
  assert.equal(documents.filter((document) => document.id === CURRENT_PLANNER_DOCUMENT_ID).length, 1);
  const metadata = await repository.read((transaction) => transaction.getMetadata(
    `${LEGACY_V1_MIGRATION_KEY_PREFIX}${first.contentFingerprint}`,
  ));
  assert.equal(metadata.migratedAt, "2026-09-22T12:00:00.000Z");
  assert.deepEqual(
    metadata.sourceRawFingerprints,
    [first.rawFingerprint, second.rawFingerprint].sort(),
  );
});

test("missing, null, and empty monthly goals share the same semantic fingerprint", async (t) => {
  const repository = await createRepository(t, "normalized-goals");
  const withoutGoals = legacyState();
  delete withoutGoals.monthlyGoals;
  const withNullGoals = legacyState({ monthlyGoals: null });
  const withEmptyGoals = legacyState({ monthlyGoals: {} });

  const results = [];
  for (const [index, state] of [withoutGoals, withNullGoals, withEmptyGoals].entries()) {
    results.push(await migrateLegacyPlannerV1({
      raw: JSON.stringify(state, null, index),
      migratedAt: `2026-09-2${index + 2}T12:00:00.000Z`,
      repository,
    }));
  }

  assert.equal(new Set(results.map((result) => result.contentFingerprint)).size, 1);
  assert.deepEqual(results.map((result) => result.outcome), [
    "migrated",
    "source-recorded",
    "source-recorded",
  ]);
});

test("a semantic change creates a distinct operational migration", async (t) => {
  const repository = await createRepository(t, "changed-content");
  const first = await migrateLegacyPlannerV1({
    raw: JSON.stringify(legacyState()),
    migratedAt: "2026-09-22T12:00:00.000Z",
    repository,
  });
  const second = await migrateLegacyPlannerV1({
    raw: JSON.stringify(legacyState({ monthlyGoals: { "2026-09": "Nova meta" } })),
    migratedAt: "2026-09-23T12:00:00.000Z",
    repository,
  });

  assert.notEqual(first.contentFingerprint, second.contentFingerprint);
  assert.equal(second.outcome, "migrated");
  const current = await repository.read((transaction) => (
    transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID)
  ));
  assert.equal(current.sourceContentFingerprint, second.contentFingerprint);
  assert.equal(current.payload.monthlyGoals["2026-09"], "Nova meta");
  assert.notEqual(
    await repository.read((transaction) => transaction.getMetadata(
      `${LEGACY_V1_MIGRATION_KEY_PREFIX}${first.contentFingerprint}`,
    )),
    null,
  );
});

test("an incomplete prior migration blocks retry and rolls back a new source", async (t) => {
  const repository = await createRepository(t, "incomplete-retry");
  const state = legacyState();
  const first = await migrateLegacyPlannerV1({
    raw: JSON.stringify(state),
    migratedAt: "2026-09-22T12:00:00.000Z",
    repository,
  });
  await repository.write((transaction) => transaction.deletePlannerDocument(CURRENT_PLANNER_DOCUMENT_ID));
  const alternateRaw = JSON.stringify({
    records: state.records,
    routine: state.routine,
    monthlyGoals: state.monthlyGoals,
    version: state.version,
  }, null, 2);
  const alternateRawFingerprint = sha256(alternateRaw);

  await assert.rejects(
    migrateLegacyPlannerV1({
      raw: alternateRaw,
      migratedAt: "2026-09-23T12:00:00.000Z",
      repository,
    }),
    (error) => error?.code === "migration_integrity_error",
  );
  assert.equal(
    await repository.read((transaction) => (
      transaction.getPlannerDocument(`legacy-v1/source/${alternateRawFingerprint}`)
    )),
    null,
  );
  const metadata = await repository.read((transaction) => transaction.getMetadata(
    `${LEGACY_V1_MIGRATION_KEY_PREFIX}${first.contentFingerprint}`,
  ));
  assert.deepEqual(metadata.sourceRawFingerprints, [first.rawFingerprint]);
});

test("invalid legacy data is rejected before any IndexedDB write", async (t) => {
  const repository = await createRepository(t, "invalid");
  for (const [raw, code] of [
    ["{", "invalid_legacy_json"],
    [JSON.stringify({ ...legacyState(), version: 2 }), "invalid_legacy_payload"],
    [JSON.stringify({ ...legacyState(), unexpected: true }), "invalid_legacy_payload"],
    [JSON.stringify({ ...legacyState(), routine: { ...legacyState().routine, seg: [{
      ...legacyState().routine.seg[0],
      category: "invalid",
    }] } }), "invalid_legacy_payload"],
  ]) {
    await assert.rejects(
      migrateLegacyPlannerV1({
        raw,
        migratedAt: "2026-09-22T12:00:00.000Z",
        repository,
      }),
      (error) => error instanceof LegacyPlannerValidationError && error.code === code,
    );
  }
  assert.deepEqual(await repository.read((transaction) => transaction.listPlannerDocuments()), []);
});

test("the localStorage source is read-only and leaves the original bytes intact", () => {
  const raw = JSON.stringify(legacyState(), null, 2);
  const calls = [];
  const storage = {
    getItem(key) {
      calls.push(["getItem", key]);
      return raw;
    },
    setItem() {
      calls.push(["setItem"]);
      throw new Error("must not write");
    },
  };

  const source = new LocalStorageLegacyPlannerSource(storage);
  assert.equal(source.readRaw(), raw);
  assert.deepEqual(calls, [["getItem", LEGACY_PLANNER_STORAGE_KEY]]);
});

test("a failure after both tables were written rolls the whole migration back", async (t) => {
  const repository = await createRepository(t, "rollback");
  const failingRepository = {
    open: () => repository.open(),
    close: () => repository.close(),
    read: (operation) => repository.read(operation),
    write: (operation) => repository.write((transaction) => operation({
      getDatabaseMetadata: () => transaction.getDatabaseMetadata(),
      getMetadata: (key) => transaction.getMetadata(key),
      getPlannerDocument: (id) => transaction.getPlannerDocument(id),
      listPlannerDocuments: () => transaction.listPlannerDocuments(),
      putDatabaseMetadata: (metadata) => transaction.putDatabaseMetadata(metadata),
      putPlannerDocument: (document) => transaction.putPlannerDocument(document),
      deletePlannerDocument: (id) => transaction.deletePlannerDocument(id),
      putMetadata: async (metadata) => {
        await transaction.putMetadata(metadata);
        throw new Error("forced migration rollback");
      },
    })),
  };

  await assert.rejects(
    migrateLegacyPlannerV1({
      raw: JSON.stringify(legacyState()),
      migratedAt: "2026-09-22T12:00:00.000Z",
      repository: failingRepository,
    }),
    /forced migration rollback/,
  );
  assert.deepEqual(await repository.read((transaction) => transaction.listPlannerDocuments()), []);
  assert.equal((await repository.read((transaction) => transaction.getDatabaseMetadata())).activeDocumentId, null);
});

test("migration metadata is strict, content-addressed, and source-addressed", () => {
  const contentFingerprint = "a".repeat(64);
  const rawFingerprint = "b".repeat(64);
  const valid = {
    key: `${LEGACY_V1_MIGRATION_KEY_PREFIX}${contentFingerprint}`,
    kind: "legacy-v1-migration",
    sourceVersion: 1,
    contentFingerprint,
    sourceRawFingerprints: [rawFingerprint],
    status: "validated",
    migratedAt: "2026-09-22T12:00:00.000Z",
    documentId: CURRENT_PLANNER_DOCUMENT_ID,
  };
  assert.deepEqual(decodeLegacyV1MigrationMetadata(valid), valid);
  assert.throws(
    () => decodeLegacyV1MigrationMetadata({ ...valid, key: "migration/v1" }),
    validationError("invalid_migration_metadata"),
  );
  assert.throws(
    () => decodeLegacyV1MigrationMetadata({ ...valid, sourceRawFingerprints: [rawFingerprint, rawFingerprint] }),
    validationError("invalid_migration_metadata"),
  );
  assert.throws(
    () => decodeLegacyV1MigrationMetadata({ ...valid, migratedAt: "now" }),
    validationError("invalid_migration_metadata"),
  );
});
