import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";
import {
  DATABASE_METADATA_KEY,
  DEXIE_SCHEMA_VERSION,
  PERSISTENCE_GENERATION,
  DayforgeDatabase,
  IndexedDbPersistenceRepository,
  PersistenceValidationError,
  decodePlannerDocument,
} from "../persistence/index.ts";

let databaseSequence = 0;

function databaseName(label) {
  databaseSequence += 1;
  return `dayforge-test-${label}-${databaseSequence}`;
}

function activeDocument(overrides = {}) {
  return {
    id: "planner/current",
    role: "active",
    format: "test-planner",
    formatVersion: 1,
    sourceContentFingerprint: null,
    payload: { version: 1, routine: {} },
    ...overrides,
  };
}

test("creates only the approved schema and required database metadata", async (t) => {
  const name = databaseName("schema");
  t.after(() => Dexie.delete(name));
  const database = new DayforgeDatabase(name);
  const repository = new IndexedDbPersistenceRepository(database);

  const metadata = await repository.open();

  assert.equal(database.verno, DEXIE_SCHEMA_VERSION);
  assert.deepEqual(database.tables.map((table) => table.name).sort(), ["metadata", "plannerDocuments"]);
  assert.equal(metadata.key, DATABASE_METADATA_KEY);
  assert.equal(metadata.persistenceGeneration, PERSISTENCE_GENERATION);
  assert.equal(metadata.schemaVersion, DEXIE_SCHEMA_VERSION);
  assert.equal(metadata.activeDocumentId, null);
  assert.deepEqual(
    database.plannerDocuments.schema.indexes.map((index) => index.name).sort(),
    ["role", "sourceContentFingerprint"],
  );

  repository.close();
});

test("persists validated planner documents across database reopening", async (t) => {
  const name = databaseName("reopen");
  t.after(() => Dexie.delete(name));
  const first = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  await first.open();
  await first.write((transaction) => transaction.putPlannerDocument(activeDocument()));
  first.close();

  const reopened = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  await reopened.open();
  const document = await reopened.read((transaction) => transaction.getPlannerDocument("planner/current"));

  assert.deepEqual(document, activeDocument());
  reopened.close();
});

test("rolls back every write when a repository transaction fails", async (t) => {
  const name = databaseName("rollback");
  t.after(() => Dexie.delete(name));
  const repository = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  await repository.open();

  await assert.rejects(
    repository.write(async (transaction) => {
      await transaction.putPlannerDocument(activeDocument());
      throw new Error("forced rollback");
    }),
    /forced rollback/,
  );

  assert.equal(
    await repository.read((transaction) => transaction.getPlannerDocument("planner/current")),
    null,
  );
  repository.close();
});

test("rejects invalid records before they reach IndexedDB", async (t) => {
  const name = databaseName("validation");
  t.after(() => Dexie.delete(name));
  const repository = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  await repository.open();

  await assert.rejects(
    repository.write((transaction) => transaction.putPlannerDocument({
      ...activeDocument(),
      payload: { invalidNumber: Number.NaN },
    })),
    (error) => error instanceof PersistenceValidationError
      && error.code === "invalid_planner_document",
  );
  assert.equal((await repository.read((transaction) => transaction.listPlannerDocuments())).length, 0);
  repository.close();
});

test("requires a content fingerprint for migration-source documents", () => {
  assert.throws(
    () => decodePlannerDocument(activeDocument({
      id: "legacy-v1/source/raw",
      role: "migration-source",
    })),
    (error) => error instanceof PersistenceValidationError
      && error.code === "invalid_planner_document",
  );
});

test("rejects missing or incompatible database metadata on reopen", async (t) => {
  const name = databaseName("metadata");
  t.after(() => Dexie.delete(name));
  const database = new DayforgeDatabase(name);
  const repository = new IndexedDbPersistenceRepository(database);
  await repository.open();
  await database.metadata.delete(DATABASE_METADATA_KEY);
  repository.close();

  const reopened = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  await assert.rejects(
    reopened.open(),
    (error) => error instanceof PersistenceValidationError
      && error.code === "invalid_database_metadata",
  );
  reopened.close();
});

test("refuses a database created with a newer internal schema", async (t) => {
  const name = databaseName("future-schema");
  t.after(() => Dexie.delete(name));
  const futureDatabase = new Dexie(name);
  futureDatabase.version(DEXIE_SCHEMA_VERSION + 1).stores({
    metadata: "&key",
    plannerDocuments: "&id, role, sourceContentFingerprint",
  });
  await futureDatabase.open();
  futureDatabase.close();

  const repository = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  await assert.rejects(
    repository.open(),
    (error) => error instanceof PersistenceValidationError
      && error.code === "unsupported_schema_version",
  );
  repository.close();
});
