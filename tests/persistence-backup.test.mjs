import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import Dexie from "dexie";
import {
  BackupValidationError,
  CURRENT_PLANNER_DOCUMENT_ID,
  DATABASE_METADATA_KEY,
  DEXIE_SCHEMA_VERSION,
  LEGACY_V1_MIGRATION_KEY_PREFIX,
  DayforgeDatabase,
  IndexedDbPersistenceRepository,
  canonicalStringify,
  createDatabaseMetadata,
  createLegacyPlannerDocument,
  decodeDayforgeBackupV2,
  encodeNormalizedLegacyPlannerV1,
  exportDayforgeBackupV2,
  migrateLegacyPlannerV1,
  restoreDayforgeBackup,
  restoreDayforgeBackupV2,
} from "../persistence/index.ts";

let databaseSequence = 0;

function databaseName(label) {
  databaseSequence += 1;
  return `dayforge-backup-${label}-${databaseSequence}`;
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
      "2026-09-22": {
        date: "2026-09-22",
        items: [],
        note: "Backup validado",
        energy: 4,
      },
    },
    monthlyGoals: { "2026-09": "Preservar dados" },
    ...overrides,
  };
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function backupError(code) {
  return (error) => error instanceof BackupValidationError && error.code === code;
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
  return { name, database, repository };
}

async function migrate(repository, state, migratedAt = "2026-09-23T12:00:00.000Z", extra = {}) {
  return migrateLegacyPlannerV1({
    raw: typeof state === "string" ? state : JSON.stringify(state),
    migratedAt,
    repository,
    ...extra,
  });
}

async function exportBackup(repository, exportedAt = "2026-09-23T13:00:00.000Z") {
  return exportDayforgeBackupV2({ repository, exportedAt });
}

async function physicalSnapshot(database) {
  return {
    metadata: (await database.metadata.toArray()).sort((left, right) => left.key.localeCompare(right.key)),
    documents: (await database.plannerDocuments.toArray()).sort((left, right) => left.id.localeCompare(right.id)),
  };
}

test("exports and decodes a logical v2 backup from one readonly snapshot", async (t) => {
  const { repository } = await createPersistence(t, "export");
  const migration = await migrate(repository, legacyState());
  const backup = await exportBackup(repository);
  const decoded = decodeDayforgeBackupV2(structuredClone(backup));

  assert.equal(decoded.format, "dayforge-backup");
  assert.equal(decoded.formatVersion, 2);
  assert.deepEqual(decoded.exportedFrom, { persistenceGeneration: 2, schemaVersion: 1 });
  assert.equal(decoded.payload.provenance.contentFingerprint, migration.contentFingerprint);
  assert.deepEqual(decoded.payload.provenance.origins[0].importOrigins, ["local-storage-v1"]);
  assert.equal(decoded.payload.legacySources[0].rawFingerprint, migration.rawFingerprint);
  assert.equal(Object.hasOwn(decoded, "metadata"), false);
});

test("round-trips export, restore into an empty logical database, and export", async (t) => {
  const source = await createPersistence(t, "roundtrip-source");
  const target = await createPersistence(t, "roundtrip-target");
  await migrate(source.repository, legacyState());
  const first = await exportBackup(source.repository, "2026-09-23T13:00:00.000Z");

  await restoreDayforgeBackupV2({ backup: first, repository: target.repository });
  const second = await exportBackup(target.repository, "2026-09-24T13:00:00.000Z");

  assert.deepEqual(second.payload, first.payload);
  assert.notEqual(second.exportedAt, first.exportedAt);
  assert.equal(
    (await target.repository.read((transaction) => transaction.getDatabaseMetadata())).activeDocumentId,
    null,
  );
});

test("exports and restores a validated planner with zero legacy sources", async (t) => {
  const source = await createPersistence(t, "zero-source-source");
  const target = await createPersistence(t, "zero-source-target");
  const planner = legacyState();
  const contentFingerprint = sha256(canonicalStringify(encodeNormalizedLegacyPlannerV1(planner)));
  await source.repository.write((transaction) => transaction.putPlannerDocument(
    createLegacyPlannerDocument(contentFingerprint, planner),
  ));

  const backup = await exportBackup(source.repository);
  assert.deepEqual(backup.payload.provenance.origins, []);
  assert.deepEqual(backup.payload.legacySources, []);

  await restoreDayforgeBackupV2({ backup, repository: target.repository });
  assert.deepEqual((await exportBackup(target.repository)).payload, backup.payload);
});

test("preserves equivalent raw sources and sorted provenance", async (t) => {
  const { repository } = await createPersistence(t, "equivalent-sources");
  const state = legacyState();
  const compact = JSON.stringify(state);
  const formatted = JSON.stringify({
    records: state.records,
    routine: state.routine,
    monthlyGoals: state.monthlyGoals,
    version: state.version,
  }, null, 2);
  const first = await migrate(repository, compact);
  const second = await migrate(repository, formatted, "2026-09-24T12:00:00.000Z");
  const backup = await exportBackup(repository);

  assert.equal(first.contentFingerprint, second.contentFingerprint);
  assert.equal(backup.payload.legacySources.length, 2);
  assert.deepEqual(
    backup.payload.provenance.origins[0].sourceRawFingerprints,
    [first.rawFingerprint, second.rawFingerprint].sort(),
  );
});

test("preserves A-B-A history while current converges back to A", async (t) => {
  const { repository } = await createPersistence(t, "a-b-a");
  const rawA = JSON.stringify(legacyState());
  const rawB = JSON.stringify(legacyState({ monthlyGoals: { "2026-09": "Conteúdo B" } }));
  const firstA = await migrate(repository, rawA);
  const migrationB = await migrate(repository, rawB, "2026-09-24T12:00:00.000Z");
  await migrate(repository, rawA, "2026-09-25T12:00:00.000Z");
  const backup = await exportBackup(repository);

  assert.equal(backup.payload.provenance.contentFingerprint, firstA.contentFingerprint);
  assert.deepEqual(
    backup.payload.provenance.origins.map((origin) => origin.contentFingerprint).sort(),
    [firstA.contentFingerprint, migrationB.contentFingerprint].sort(),
  );
  assert.equal(backup.payload.planner.monthlyGoals["2026-09"], "Preservar dados");
});

test("imports v1 through migration and records backup-v1 without touching localStorage", async (t) => {
  const { repository } = await createPersistence(t, "v1-import");
  const raw = JSON.stringify(legacyState(), null, 2);
  const calls = [];
  const previousLocalStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => {
        calls.push(["getItem", key]);
        return "original";
      },
      setItem: (...args) => calls.push(["setItem", ...args]),
      removeItem: (...args) => calls.push(["removeItem", ...args]),
    },
  });
  t.after(() => {
    if (previousLocalStorage === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocalStorage });
  });

  const result = await restoreDayforgeBackup({
    input: raw,
    migratedAt: "2026-09-23T12:00:00.000Z",
    repository,
  });
  const backup = await exportBackup(repository);

  assert.equal(result.formatVersion, 1);
  assert.equal(backup.payload.legacySources[0].raw, raw);
  assert.deepEqual(backup.payload.provenance.origins[0].importOrigins, ["backup-v1"]);
  assert.deepEqual(calls, []);
});

test("merges local-storage-v1 and backup-v1 origins idempotently", async (t) => {
  const { repository } = await createPersistence(t, "origins");
  const raw = JSON.stringify(legacyState());
  await migrate(repository, raw);
  await restoreDayforgeBackup({
    input: raw,
    migratedAt: "2026-09-24T12:00:00.000Z",
    repository,
  });
  await restoreDayforgeBackup({
    input: raw,
    migratedAt: "2026-09-25T12:00:00.000Z",
    repository,
  });

  assert.deepEqual(
    (await exportBackup(repository)).payload.provenance.origins[0].importOrigins,
    ["backup-v1", "local-storage-v1"],
  );
});

test("restore replaces only the approved set and preserves unrelated documents", async (t) => {
  const source = await createPersistence(t, "replacement-source");
  const target = await createPersistence(t, "replacement-target");
  await migrate(source.repository, legacyState());
  await migrate(target.repository, legacyState({ monthlyGoals: { old: "old" } }));
  const unrelated = {
    id: "future/unrelated",
    role: "active",
    format: "dayforge/future",
    formatVersion: 1,
    sourceContentFingerprint: null,
    payload: { keep: true },
  };
  await target.repository.write((transaction) => transaction.putPlannerDocument(unrelated));

  const backup = await exportBackup(source.repository);
  await restoreDayforgeBackupV2({ backup, repository: target.repository });

  assert.deepEqual(
    await target.repository.read((transaction) => transaction.getPlannerDocument(unrelated.id)),
    unrelated,
  );
  assert.deepEqual((await exportBackup(target.repository)).payload, backup.payload);
});

test("rejects tampered fingerprints and broken references before writes", async (t) => {
  const source = await createPersistence(t, "tamper-source");
  const target = await createPersistence(t, "tamper-target");
  await migrate(source.repository, legacyState());
  const backup = await exportBackup(source.repository);

  const rawTampered = structuredClone(backup);
  rawTampered.payload.legacySources[0].raw += " ";
  await assert.rejects(
    restoreDayforgeBackupV2({ backup: rawTampered, repository: target.repository }),
    backupError("invalid_backup_fingerprint"),
  );

  const contentTampered = structuredClone(backup);
  contentTampered.payload.provenance.contentFingerprint = "0".repeat(64);
  await assert.rejects(
    restoreDayforgeBackupV2({ backup: contentTampered, repository: target.repository }),
    backupError("invalid_backup_fingerprint"),
  );

  const brokenReference = structuredClone(backup);
  brokenReference.payload.provenance.origins[0].sourceRawFingerprints[0] = "1".repeat(64);
  await assert.rejects(
    restoreDayforgeBackupV2({ backup: brokenReference, repository: target.repository }),
    backupError("invalid_backup_reference"),
  );

  assert.deepEqual(await target.repository.read((transaction) => transaction.listPlannerDocuments()), []);
});

test("strict codecs reject incompatible versions, missing fields, extras, and invalid JSON", async (t) => {
  const { repository } = await createPersistence(t, "strict-codecs");
  await migrate(repository, legacyState());
  const backup = await exportBackup(repository);

  assert.throws(
    () => decodeDayforgeBackupV2({ ...backup, formatVersion: 3 }),
    backupError("unsupported_backup_version"),
  );
  const missing = structuredClone(backup);
  delete missing.payload.provenance;
  assert.throws(() => decodeDayforgeBackupV2(missing), backupError("invalid_backup_envelope"));
  assert.throws(
    () => decodeDayforgeBackupV2({ ...backup, unexpected: true }),
    backupError("invalid_backup_envelope"),
  );
  const duplicateSource = structuredClone(backup);
  duplicateSource.payload.legacySources.push(structuredClone(duplicateSource.payload.legacySources[0]));
  assert.throws(
    () => decodeDayforgeBackupV2(duplicateSource),
    backupError("invalid_backup_payload"),
  );
  const specialObject = structuredClone(backup);
  specialObject.payload.planner.monthlyGoals = new Map([["month", "goal"]]);
  assert.throws(
    () => decodeDayforgeBackupV2(specialObject),
    backupError("invalid_backup_payload"),
  );
  const cyclic = structuredClone(backup);
  cyclic.payload.planner.records.loop = cyclic.payload.planner;
  assert.throws(
    () => decodeDayforgeBackupV2(cyclic),
    backupError("invalid_backup_payload"),
  );
  await assert.rejects(
    restoreDayforgeBackup({
      input: "{",
      migratedAt: "2026-09-23T12:00:00.000Z",
      repository,
    }),
    backupError("invalid_backup_json"),
  );
});

test("rolls back removals and writes after multiple mutations", async (t) => {
  const source = await createPersistence(t, "rollback-source");
  const target = await createPersistence(t, "rollback-target");
  const state = legacyState();
  await migrate(source.repository, JSON.stringify(state));
  await migrate(source.repository, JSON.stringify({
    records: state.records,
    routine: state.routine,
    monthlyGoals: state.monthlyGoals,
    version: state.version,
  }, null, 2));
  await migrate(target.repository, legacyState({ monthlyGoals: { old: "state" } }));
  const before = await physicalSnapshot(target.database);

  await assert.rejects(
    restoreDayforgeBackupV2({
      backup: await exportBackup(source.repository),
      repository: target.repository,
      afterWriteForTest: () => {
        throw new Error("forced backup rollback");
      },
    }),
    /forced backup rollback/,
  );

  assert.deepEqual(await physicalSnapshot(target.database), before);
});

test("restore is idempotent and remains valid after database reopening", async (t) => {
  const source = await createPersistence(t, "reopen-source");
  const target = await createPersistence(t, "reopen-target");
  await migrate(source.repository, legacyState());
  const backup = await exportBackup(source.repository);
  await restoreDayforgeBackupV2({ backup, repository: target.repository });
  const once = await physicalSnapshot(target.database);
  await restoreDayforgeBackupV2({ backup, repository: target.repository });
  assert.deepEqual(await physicalSnapshot(target.database), once);

  target.repository.close();
  const reopened = new IndexedDbPersistenceRepository(new DayforgeDatabase(target.name));
  assert.deepEqual((await exportBackup(reopened)).payload, backup.payload);
  reopened.close();
});

test("database metadata absent, invalid, or active is rejected with zero logical mutations", async (t) => {
  const source = await createPersistence(t, "metadata-source");
  await migrate(source.repository, legacyState());
  const backup = await exportBackup(source.repository);

  for (const [label, corrupt] of [
    ["missing", async (database) => database.metadata.delete(DATABASE_METADATA_KEY)],
    ["invalid", async (database) => database.metadata.put({
      ...createDatabaseMetadata(),
      schemaVersion: DEXIE_SCHEMA_VERSION + 1,
    })],
    ["active", async (database) => database.metadata.put({
      ...createDatabaseMetadata(),
      activeDocumentId: CURRENT_PLANNER_DOCUMENT_ID,
    })],
  ]) {
    const target = await createPersistence(t, `metadata-${label}`);
    const sentinel = {
      id: "future/sentinel",
      role: "active",
      format: "dayforge/future",
      formatVersion: 1,
      sourceContentFingerprint: null,
      payload: { untouched: true },
    };
    await target.repository.write((transaction) => transaction.putPlannerDocument(sentinel));
    await corrupt(target.database);
    const beforeDocuments = await target.database.plannerDocuments.toArray();

    await assert.rejects(
      restoreDayforgeBackupV2({ backup, repository: target.repository }),
    );
    assert.deepEqual(await target.database.plannerDocuments.toArray(), beforeDocuments);
    assert.equal(
      (await target.database.metadata.where("key").startsWith(LEGACY_V1_MIGRATION_KEY_PREFIX).count()),
      0,
    );
  }
});

test("v1 import rejects active database metadata before creating prepared records", async (t) => {
  const { database, repository } = await createPersistence(t, "v1-active-metadata");
  await database.metadata.put({
    ...createDatabaseMetadata(),
    activeDocumentId: CURRENT_PLANNER_DOCUMENT_ID,
  });

  await assert.rejects(restoreDayforgeBackup({
    input: JSON.stringify(legacyState()),
    migratedAt: "2026-09-23T12:00:00.000Z",
    repository,
  }));
  assert.deepEqual(await database.plannerDocuments.toArray(), []);
  assert.equal(
    await database.metadata.where("key").startsWith(LEGACY_V1_MIGRATION_KEY_PREFIX).count(),
    0,
  );
});

test("legacy migration metadata without importOrigins decodes as local-storage-v1", async (t) => {
  const { database, repository } = await createPersistence(t, "legacy-metadata");
  const migration = await migrate(repository, legacyState());
  const key = `${LEGACY_V1_MIGRATION_KEY_PREFIX}${migration.contentFingerprint}`;
  const metadata = await database.metadata.get(key);
  delete metadata.importOrigins;
  await database.metadata.put(metadata);

  const backup = await exportBackup(repository);
  assert.deepEqual(backup.payload.provenance.origins[0].importOrigins, ["local-storage-v1"]);
});
