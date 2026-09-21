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
  createDatabaseMetadata,
  decodeDatabaseMetadata,
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

function validationError(code) {
  return (error) => error instanceof PersistenceValidationError && error.code === code;
}

async function seedMetadata(name, metadata) {
  const database = new DayforgeDatabase(name);
  await database.open();
  await database.metadata.put(metadata);
  database.close();
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

test("read and write perform a validated open when the consumer does not call open", async (t) => {
  const readName = databaseName("implicit-read-open");
  const writeName = databaseName("implicit-write-open");
  t.after(() => Promise.all([Dexie.delete(readName), Dexie.delete(writeName)]));

  const reader = new IndexedDbPersistenceRepository(new DayforgeDatabase(readName));
  const metadata = await reader.read((transaction) => transaction.getDatabaseMetadata());
  assert.equal(metadata.schemaVersion, DEXIE_SCHEMA_VERSION);
  reader.close();

  const writer = new IndexedDbPersistenceRepository(new DayforgeDatabase(writeName));
  await writer.write((transaction) => transaction.putPlannerDocument(activeDocument()));
  assert.deepEqual(
    await writer.read((transaction) => transaction.getPlannerDocument("planner/current")),
    activeDocument(),
  );
  writer.close();
});

test("open is idempotent while validation is pending or complete", async (t) => {
  const name = databaseName("idempotent-open");
  t.after(() => Dexie.delete(name));
  const repository = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));

  const [first, second] = await Promise.all([repository.open(), repository.open()]);

  assert.deepEqual(first, second);
  assert.equal(first.schemaVersion, DEXIE_SCHEMA_VERSION);
  repository.close();
});

test("replaces an existing document without creating a duplicate", async (t) => {
  const name = databaseName("replace");
  t.after(() => Dexie.delete(name));
  const repository = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));

  await repository.write((transaction) => transaction.putPlannerDocument(activeDocument()));
  const replacement = activeDocument({ payload: { version: 2, routine: { seg: [] } } });
  await repository.write((transaction) => transaction.putPlannerDocument(replacement));

  assert.deepEqual(
    await repository.read((transaction) => transaction.getPlannerDocument("planner/current")),
    replacement,
  );
  assert.equal((await repository.read((transaction) => transaction.listPlannerDocuments())).length, 1);
  repository.close();
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

test("rolls back metadata and planner documents from the same failed transaction", async (t) => {
  const name = databaseName("two-table-rollback");
  t.after(() => Dexie.delete(name));
  const repository = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));

  await assert.rejects(
    repository.write(async (transaction) => {
      await transaction.putDatabaseMetadata({
        ...createDatabaseMetadata(),
        activeDocumentId: "planner/current",
      });
      await transaction.putPlannerDocument(activeDocument());
      throw new Error("forced two-table rollback");
    }),
    /forced two-table rollback/,
  );

  const result = await repository.read(async (transaction) => ({
    metadata: await transaction.getDatabaseMetadata(),
    document: await transaction.getPlannerDocument("planner/current"),
  }));
  assert.equal(result.metadata.activeDocumentId, null);
  assert.equal(result.document, null);
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

test("accepts only real JSON values in planner document payloads", () => {
  const nullPrototype = Object.create(null);
  nullPrototype.value = "supported";
  const document = decodePlannerDocument(activeDocument({
    payload: {
      nullValue: null,
      booleanValue: true,
      stringValue: "value",
      numberValue: 42.5,
      arrayValue: [null, false, "item", 3, { nested: "value" }],
      objectValue: { nested: [1, 2, 3] },
      nullPrototype,
    },
  }));

  assert.equal(document.payload.nullValue, null);
  assert.deepEqual(document.payload.arrayValue, [null, false, "item", 3, { nested: "value" }]);
  assert.equal(document.payload.nullPrototype.value, "supported");
});

test("rejects structured-clone objects that are not JSON objects", () => {
  class CustomPayload {
    value = "custom";
  }

  for (const value of [new Date(), new Map(), new Set(), new CustomPayload()]) {
    assert.throws(
      () => decodePlannerDocument(activeDocument({ payload: { value } })),
      validationError("invalid_planner_document"),
    );
  }
});

test("rejects cyclic objects and arrays without overflowing", () => {
  const cyclicObject = {};
  cyclicObject.self = cyclicObject;
  const cyclicArray = [];
  cyclicArray.push(cyclicArray);

  for (const value of [cyclicObject, cyclicArray]) {
    assert.throws(
      () => decodePlannerDocument(activeDocument({ payload: { value } })),
      validationError("invalid_planner_document"),
    );
  }
});

test("rejects unknown envelope fields instead of preserving them", () => {
  const withSymbol = activeDocument();
  withSymbol[Symbol("unknown")] = "value";
  assert.throws(
    () => decodePlannerDocument({ ...activeDocument(), unknown: "value" }),
    validationError("invalid_planner_document"),
  );
  assert.throws(
    () => decodePlannerDocument({ ...activeDocument(), unknown: new Date() }),
    validationError("invalid_planner_document"),
  );
  assert.throws(
    () => decodeDatabaseMetadata({ ...createDatabaseMetadata(), unknown: "value" }),
    validationError("invalid_database_metadata"),
  );
  assert.throws(
    () => decodePlannerDocument(withSymbol),
    validationError("invalid_planner_document"),
  );
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

test("missing database metadata blocks read and write on every attempt", async (t) => {
  const name = databaseName("metadata");
  t.after(() => Dexie.delete(name));
  const database = new DayforgeDatabase(name);
  const repository = new IndexedDbPersistenceRepository(database);
  await repository.open();
  await database.metadata.delete(DATABASE_METADATA_KEY);
  repository.close();

  const reopened = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  await assert.rejects(
    reopened.read((transaction) => transaction.listPlannerDocuments()),
    validationError("invalid_database_metadata"),
  );
  await assert.rejects(
    reopened.write((transaction) => transaction.putPlannerDocument(activeDocument())),
    validationError("invalid_database_metadata"),
  );
  reopened.close();
});

test("invalid metadata fields block read and write without implicit recovery", async (t) => {
  const invalidMetadata = [
    { ...createDatabaseMetadata(), kind: "invalid" },
    { ...createDatabaseMetadata(), activeDocumentId: 42 },
    { ...createDatabaseMetadata(), persistenceGeneration: PERSISTENCE_GENERATION + 1 },
    { ...createDatabaseMetadata(), schemaVersion: DEXIE_SCHEMA_VERSION + 1 },
  ];

  for (const [index, metadata] of invalidMetadata.entries()) {
    const name = databaseName(`invalid-metadata-${index}`);
    t.after(() => Dexie.delete(name));
    await seedMetadata(name, metadata);
    const repository = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));

    await assert.rejects(
      repository.read((transaction) => transaction.listPlannerDocuments()),
      validationError("invalid_database_metadata"),
    );
    await assert.rejects(
      repository.write((transaction) => transaction.putPlannerDocument(activeDocument())),
      validationError("invalid_database_metadata"),
    );
    repository.close();
  }
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
    repository.read((transaction) => transaction.listPlannerDocuments()),
    validationError("unsupported_schema_version"),
  );
  await assert.rejects(
    repository.write((transaction) => transaction.putPlannerDocument(activeDocument())),
    validationError("unsupported_schema_version"),
  );
  repository.close();
});
