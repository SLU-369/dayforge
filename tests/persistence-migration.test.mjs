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

async function createPersistence(t, label) {
  const name = databaseName(label);
  const database = new DayforgeDatabase(name);
  const repository = new IndexedDbPersistenceRepository(database);
  await repository.open();
  t.after(async () => {
    repository.close();
    await Dexie.delete(name);
  });
  return { database, repository };
}

async function createRepository(t, label) {
  return (await createPersistence(t, label)).repository;
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

test("an existing migration reconciles a missing current document", async (t) => {
  const repository = await createRepository(t, "incomplete-retry");
  const state = legacyState();
  const first = await migrateLegacyPlannerV1({
    raw: JSON.stringify(state),
    migratedAt: "2026-09-22T12:00:00.000Z",
    repository,
  });
  await repository.write((transaction) => transaction.deletePlannerDocument(CURRENT_PLANNER_DOCUMENT_ID));
  const retry = await migrateLegacyPlannerV1({
    raw: JSON.stringify(state),
    migratedAt: "2026-09-23T12:00:00.000Z",
    repository,
  });
  assert.equal(retry.outcome, "reconciled");
  assert.equal(
    (await repository.read((transaction) => (
      transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID)
    ))).sourceContentFingerprint,
    first.contentFingerprint,
  );
  const metadata = await repository.read((transaction) => transaction.getMetadata(
    `${LEGACY_V1_MIGRATION_KEY_PREFIX}${first.contentFingerprint}`,
  ));
  assert.deepEqual(metadata.sourceRawFingerprints, [first.rawFingerprint]);
});

test("A-B-A reuses migration identities and converges current back to A", async (t) => {
  const { database, repository } = await createPersistence(t, "a-b-a");
  const rawA = JSON.stringify(legacyState());
  const rawB = JSON.stringify(legacyState({ monthlyGoals: { "2026-09": "Conteúdo B" } }));

  const firstA = await migrateLegacyPlannerV1({
    raw: rawA,
    migratedAt: "2026-09-22T12:00:00.000Z",
    repository,
  });
  assert.equal(
    (await repository.read((transaction) => transaction.getPlannerDocument(
      CURRENT_PLANNER_DOCUMENT_ID,
    ))).sourceContentFingerprint,
    firstA.contentFingerprint,
  );

  const migrationB = await migrateLegacyPlannerV1({
    raw: rawB,
    migratedAt: "2026-09-23T12:00:00.000Z",
    repository,
  });
  assert.equal(
    (await repository.read((transaction) => transaction.getPlannerDocument(
      CURRENT_PLANNER_DOCUMENT_ID,
    ))).sourceContentFingerprint,
    migrationB.contentFingerprint,
  );

  const repeatedA = await migrateLegacyPlannerV1({
    raw: rawA,
    migratedAt: "2026-09-24T12:00:00.000Z",
    repository,
  });
  const current = await repository.read((transaction) => transaction.getPlannerDocument(
    CURRENT_PLANNER_DOCUMENT_ID,
  ));
  const databaseMetadata = await repository.read((transaction) => transaction.getDatabaseMetadata());
  const migrationMetadata = (await database.metadata.toArray()).filter(
    (metadata) => metadata.kind === "legacy-v1-migration",
  );
  const documents = await repository.read((transaction) => transaction.listPlannerDocuments());

  assert.equal(repeatedA.outcome, "reconciled");
  assert.equal(current.sourceContentFingerprint, firstA.contentFingerprint);
  assert.equal(migrationMetadata.length, 2);
  assert.equal(migrationMetadata.filter(
    (metadata) => metadata.contentFingerprint === firstA.contentFingerprint,
  ).length, 1);
  assert.equal(migrationMetadata.filter(
    (metadata) => metadata.contentFingerprint === migrationB.contentFingerprint,
  ).length, 1);
  assert.ok(migrationMetadata.every((metadata) => metadata.status === "validated"));
  assert.equal(documents.length, 3);
  assert.equal(new Set(documents.map((document) => document.id)).size, documents.length);
  assert.equal(databaseMetadata.activeDocumentId, null);
});

test("A(raw1)-B-A(raw2) preserves both A sources and converges current", async (t) => {
  const { database, repository } = await createPersistence(t, "a-b-a-different-raw");
  const stateA = legacyState();
  const rawA1 = JSON.stringify(stateA);
  const rawA2 = JSON.stringify({
    records: stateA.records,
    routine: stateA.routine,
    monthlyGoals: stateA.monthlyGoals,
    version: stateA.version,
  }, null, 2);
  const rawB = JSON.stringify(legacyState({ monthlyGoals: { "2026-09": "Conteúdo B" } }));

  const firstA = await migrateLegacyPlannerV1({
    raw: rawA1,
    migratedAt: "2026-09-22T12:00:00.000Z",
    repository,
  });
  await migrateLegacyPlannerV1({
    raw: rawB,
    migratedAt: "2026-09-23T12:00:00.000Z",
    repository,
  });
  const secondA = await migrateLegacyPlannerV1({
    raw: rawA2,
    migratedAt: "2026-09-24T12:00:00.000Z",
    repository,
  });

  const metadataA = await repository.read((transaction) => transaction.getMetadata(
    `${LEGACY_V1_MIGRATION_KEY_PREFIX}${firstA.contentFingerprint}`,
  ));
  const current = await repository.read((transaction) => transaction.getPlannerDocument(
    CURRENT_PLANNER_DOCUMENT_ID,
  ));
  const sourceDocumentsA = (await repository.read(
    (transaction) => transaction.listPlannerDocuments(),
  )).filter((document) => (
    document.role === "migration-source"
      && document.sourceContentFingerprint === firstA.contentFingerprint
  ));
  const migrationMetadata = (await database.metadata.toArray()).filter(
    (metadata) => metadata.kind === "legacy-v1-migration",
  );

  assert.notEqual(firstA.rawFingerprint, secondA.rawFingerprint);
  assert.equal(firstA.contentFingerprint, secondA.contentFingerprint);
  assert.equal(secondA.outcome, "reconciled");
  assert.equal(sourceDocumentsA.length, 2);
  assert.deepEqual(
    metadataA.sourceRawFingerprints,
    [firstA.rawFingerprint, secondA.rawFingerprint].sort(),
  );
  assert.equal(new Set(metadataA.sourceRawFingerprints).size, 2);
  assert.equal(migrationMetadata.filter(
    (metadata) => metadata.contentFingerprint === firstA.contentFingerprint,
  ).length, 1);
  assert.equal(current.sourceContentFingerprint, firstA.contentFingerprint);
  assert.equal(metadataA.status, "validated");
  assert.equal(
    (await repository.read((transaction) => transaction.getDatabaseMetadata())).activeDocumentId,
    null,
  );
});

test("A-B-A reconciliation rolls back source, metadata, and current together", async (t) => {
  const repository = await createRepository(t, "a-b-a-rollback");
  const stateA = legacyState();
  const rawA1 = JSON.stringify(stateA);
  const rawA2 = JSON.stringify({
    records: stateA.records,
    routine: stateA.routine,
    monthlyGoals: stateA.monthlyGoals,
    version: stateA.version,
  }, null, 2);
  const rawB = JSON.stringify(legacyState({ monthlyGoals: { "2026-09": "Conteúdo B" } }));
  const firstA = await migrateLegacyPlannerV1({
    raw: rawA1,
    migratedAt: "2026-09-22T12:00:00.000Z",
    repository,
  });
  const migrationB = await migrateLegacyPlannerV1({
    raw: rawB,
    migratedAt: "2026-09-23T12:00:00.000Z",
    repository,
  });
  const metadataABefore = await repository.read((transaction) => transaction.getMetadata(
    `${LEGACY_V1_MIGRATION_KEY_PREFIX}${firstA.contentFingerprint}`,
  ));
  const currentBefore = await repository.read((transaction) => transaction.getPlannerDocument(
    CURRENT_PLANNER_DOCUMENT_ID,
  ));
  assert.equal(currentBefore.sourceContentFingerprint, migrationB.contentFingerprint);
  const rawFingerprintA2 = sha256(rawA2);
  const failingRepository = {
    open: () => repository.open(),
    close: () => repository.close(),
    read: (operation) => repository.read(operation),
    write: (operation) => repository.write((transaction) => operation({
      getDatabaseMetadata: () => transaction.getDatabaseMetadata(),
      getMetadata: (key) => transaction.getMetadata(key),
      listMetadata: () => transaction.listMetadata(),
      getPlannerDocument: (id) => transaction.getPlannerDocument(id),
      listPlannerDocuments: () => transaction.listPlannerDocuments(),
      putDatabaseMetadata: (metadata) => transaction.putDatabaseMetadata(metadata),
      putMetadata: async (metadata) => {
        await transaction.putMetadata(metadata);
        throw new Error("forced reconciliation rollback");
      },
      deleteMetadata: (key) => transaction.deleteMetadata(key),
      deletePlannerDocument: (id) => transaction.deletePlannerDocument(id),
      putPlannerDocument: (document) => transaction.putPlannerDocument(document),
    })),
  };

  await assert.rejects(
    migrateLegacyPlannerV1({
      raw: rawA2,
      migratedAt: "2026-09-24T12:00:00.000Z",
      repository: failingRepository,
    }),
    /forced reconciliation rollback/,
  );

  const currentAfter = await repository.read((transaction) => transaction.getPlannerDocument(
    CURRENT_PLANNER_DOCUMENT_ID,
  ));
  const metadataAAfter = await repository.read((transaction) => transaction.getMetadata(
    `${LEGACY_V1_MIGRATION_KEY_PREFIX}${firstA.contentFingerprint}`,
  ));
  assert.deepEqual(currentAfter, currentBefore);
  assert.deepEqual(metadataAAfter, metadataABefore);
  assert.equal(
    await repository.read((transaction) => transaction.getPlannerDocument(
      `legacy-v1/source/${rawFingerprintA2}`,
    )),
    null,
  );
  assert.equal(
    (await repository.read((transaction) => transaction.getDatabaseMetadata())).activeDocumentId,
    null,
  );
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
      listMetadata: () => transaction.listMetadata(),
      getPlannerDocument: (id) => transaction.getPlannerDocument(id),
      listPlannerDocuments: () => transaction.listPlannerDocuments(),
      putDatabaseMetadata: (metadata) => transaction.putDatabaseMetadata(metadata),
      putPlannerDocument: (document) => transaction.putPlannerDocument(document),
      deletePlannerDocument: (id) => transaction.deletePlannerDocument(id),
      putMetadata: async (metadata) => {
        await transaction.putMetadata(metadata);
        throw new Error("forced migration rollback");
      },
      deleteMetadata: (key) => transaction.deleteMetadata(key),
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
  assert.deepEqual(decodeLegacyV1MigrationMetadata(valid), {
    ...valid,
    importOrigins: ["local-storage-v1"],
  });
  assert.deepEqual(decodeLegacyV1MigrationMetadata({
    ...valid,
    importOrigins: ["backup-v1", "local-storage-v1"],
  }).importOrigins, ["backup-v1", "local-storage-v1"]);
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
  assert.throws(
    () => decodeLegacyV1MigrationMetadata({ ...valid, importOrigins: ["unknown"] }),
    validationError("invalid_migration_metadata"),
  );
});
