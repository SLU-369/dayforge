import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";
import { createDefaultState } from "../app/planner-data.ts";
import {
  CURRENT_PLANNER_DOCUMENT_ID,
  DayforgeDatabase,
  IndexedDbPersistenceRepository,
  PERSISTENCE_V2_MARKER_KEY,
  PERSISTENCE_V2_MARKER_VALUE,
  PlannerV2UnavailableError,
  bootstrapPlannerV2,
  exportDayforgeBackupV2,
  recoverPlannerV2,
  resetPlannerV2,
  restoreActivePlannerV2,
  restoreDayforgeBackupV2,
  saveActivePlannerV2,
} from "../persistence/index.ts";

const instant = "2026-09-28T12:00:00.000Z";
let sequence = 0;

function storage(entries = {}) {
  const values = new Map(Object.entries(entries));
  let writes = 0;
  return {
    values,
    get writes() { return writes; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { writes += 1; values.set(key, value); },
  };
}

async function setup(t) {
  const name = `dayforge-cutover-${++sequence}`;
  const database = new DayforgeDatabase(name);
  const repository = new IndexedDbPersistenceRepository(database);
  t.after(async () => {
    repository.close();
    await Dexie.delete(name);
  });
  return { database, repository };
}

async function physical(database) {
  return {
    metadata: (await database.metadata.toArray()).sort((a, b) => a.key.localeCompare(b.key)),
    documents: (await database.plannerDocuments.toArray()).sort((a, b) => a.id.localeCompare(b.id)),
  };
}

function boot(repository, markerStorage, legacyStorage) {
  return bootstrapPlannerV2({
    repository, markerStorage, legacyStorage,
    defaultState: createDefaultState(), instant,
  });
}

test("first run uses current defaults and activates only v2", async (t) => {
  const { repository } = await setup(t);
  const marker = storage();
  const legacy = storage();
  const result = await boot(repository, marker, legacy);
  assert.deepEqual(result.state, createDefaultState());
  assert.equal(marker.getItem(PERSISTENCE_V2_MARKER_KEY), PERSISTENCE_V2_MARKER_VALUE);
  assert.equal(legacy.writes, 0);
  assert.equal((await repository.read((transaction) => transaction.getDatabaseMetadata())).activeDocumentId, CURRENT_PLANNER_DOCUMENT_ID);
  const backup = await exportDayforgeBackupV2({ repository, exportedAt: instant, active: true });
  assert.equal(backup.formatVersion, 2);
  assert.deepEqual(backup.payload.provenance.origins, []);
  assert.deepEqual(backup.payload.legacySources, []);
});

test("migrates exact v1 bytes before activation and stops writing v1", async (t) => {
  const { repository } = await setup(t);
  const marker = storage();
  const raw = JSON.stringify({ ...createDefaultState(), monthlyGoals: { "2026-09": "Original" } });
  const legacy = storage({ "rotina-369:data:v1": raw });
  const initial = await boot(repository, marker, legacy);
  assert.equal(initial.state.monthlyGoals["2026-09"], "Original");
  const before = await exportDayforgeBackupV2({ repository, exportedAt: instant, active: true });
  assert.deepEqual(before.payload.provenance.origins[0].importOrigins, ["local-storage-v1"]);
  assert.equal(before.payload.legacySources[0].raw, raw);

  await saveActivePlannerV2({
    repository,
    state: { ...initial.state, monthlyGoals: { "2026-09": "Alterado" } },
  });
  const after = await exportDayforgeBackupV2({ repository, exportedAt: instant, active: true });
  assert.equal(after.payload.planner.monthlyGoals["2026-09"], "Alterado");
  assert.deepEqual(after.payload.provenance.origins, []);
  assert.deepEqual(after.payload.legacySources, []);
  assert.equal(legacy.getItem("rotina-369:data:v1"), raw);
  assert.equal(legacy.writes, 0);
});

test("valid active metadata wins over missing or invalid marker and stale v1", async (t) => {
  const { repository } = await setup(t);
  const marker = storage();
  await boot(repository, marker, storage());
  await saveActivePlannerV2({
    repository,
    state: { ...createDefaultState(), monthlyGoals: { "2026-09": "Autoridade v2" } },
  });
  marker.values.delete(PERSISTENCE_V2_MARKER_KEY);
  const stale = storage({ "rotina-369:data:v1": "{corrompido" });
  const missing = await boot(repository, marker, stale);
  assert.equal(missing.state.monthlyGoals["2026-09"], "Autoridade v2");
  assert.equal(missing.markerRepaired, true);
  marker.values.set(PERSISTENCE_V2_MARKER_KEY, "invalid");
  const invalid = await boot(repository, marker, stale);
  assert.equal(invalid.state.monthlyGoals["2026-09"], "Autoridade v2");
  assert.equal(marker.getItem(PERSISTENCE_V2_MARKER_KEY), PERSISTENCE_V2_MARKER_VALUE);
  assert.equal(stale.writes, 0);
});

test("marker on inactive database blocks without reading or replacing v1", async (t) => {
  for (const markerValue of [PERSISTENCE_V2_MARKER_VALUE, "invalid"]) {
    const { database, repository } = await setup(t);
    const marker = storage({ [PERSISTENCE_V2_MARKER_KEY]: markerValue });
    const raw = JSON.stringify(createDefaultState());
    const legacy = storage({ "rotina-369:data:v1": raw });
    await assert.rejects(boot(repository, marker, legacy), PlannerV2UnavailableError);
    assert.equal((await repository.open()).activeDocumentId, null);
    assert.equal((await database.plannerDocuments.count()), 0);
    assert.equal(legacy.getItem("rotina-369:data:v1"), raw);
  }
});

test("corrupt active planner blocks without falling back to stale v1", async (t) => {
  const { database, repository } = await setup(t);
  const marker = storage({ [PERSISTENCE_V2_MARKER_KEY]: PERSISTENCE_V2_MARKER_VALUE });
  await resetPlannerV2({ repository, markerStorage: marker, defaultState: createDefaultState(), instant });
  await database.plannerDocuments.delete(CURRENT_PLANNER_DOCUMENT_ID);
  const before = await physical(database);
  const stale = storage({ "rotina-369:data:v1": JSON.stringify(createDefaultState()) });
  await assert.rejects(boot(repository, marker, stale), PlannerV2UnavailableError);
  assert.deepEqual(await physical(database), before);
  assert.equal(stale.writes, 0);
});

test("active database remains authoritative when marker repair is unavailable", async (t) => {
  const { repository } = await setup(t);
  await boot(repository, storage(), storage());
  const marker = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
  };
  const result = await boot(repository, marker, storage({ "rotina-369:data:v1": "stale" }));
  assert.equal(result.markerRepaired, false);
  assert.deepEqual(result.state, createDefaultState());
});

test("invalid v1 and marker write failure leave v1 intact and v2 inactive", async (t) => {
  const first = await setup(t);
  const invalid = storage({ "rotina-369:data:v1": "{broken" });
  const marker = storage();
  await assert.rejects(boot(first.repository, marker, invalid), PlannerV2UnavailableError);
  assert.equal((await first.repository.open()).activeDocumentId, null);
  assert.equal((await first.database.plannerDocuments.count()), 0);
  assert.equal(marker.writes, 0);
  assert.equal(invalid.getItem("rotina-369:data:v1"), "{broken");

  const second = await setup(t);
  const blockedMarker = {
    getItem: () => null,
    setItem: () => { throw new Error("quota"); },
  };
  const raw = JSON.stringify(createDefaultState());
  const source = storage({ "rotina-369:data:v1": raw });
  await assert.rejects(boot(second.repository, blockedMarker, source), PlannerV2UnavailableError);
  assert.equal((await second.repository.open()).activeDocumentId, null);
  assert.equal(source.getItem("rotina-369:data:v1"), raw);
});

test("invalid active write and invalid backup cause zero mutations", async (t) => {
  const { database, repository } = await setup(t);
  const marker = storage();
  await boot(repository, marker, storage());
  const before = await physical(database);
  await assert.rejects(saveActivePlannerV2({
    repository,
    state: { ...createDefaultState(), routine: { seg: [] } },
  }));
  await assert.rejects(recoverPlannerV2({
    repository, markerStorage: marker, input: '{"format":"dayforge-backup","formatVersion":2}', instant,
  }));
  await assert.rejects(recoverPlannerV2({
    repository, markerStorage: marker, input: '{"version":1,"routine":[]}', instant,
  }));
  assert.deepEqual(await physical(database), before);
});

test("first run refuses unexplained prepared documents instead of replacing them", async (t) => {
  const { database, repository } = await setup(t);
  await repository.open();
  await database.plannerDocuments.put({
    id: "unknown/prepared", role: "active", format: "dayforge/test", formatVersion: 1,
    sourceContentFingerprint: null, payload: {},
  });
  const before = await physical(database);
  const marker = storage();
  await assert.rejects(boot(repository, marker, storage()), PlannerV2UnavailableError);
  assert.deepEqual(await physical(database), before);
  assert.equal(marker.writes, 0);
});

test("active v2 restore round-trips and rolls back on intermediate failure", async (t) => {
  const { database, repository } = await setup(t);
  const marker = storage();
  await boot(repository, marker, storage());
  const backup = await exportDayforgeBackupV2({ repository, exportedAt: instant, active: true });
  await saveActivePlannerV2({
    repository,
    state: { ...createDefaultState(), monthlyGoals: { "2026-09": "Depois" } },
  });
  const beforeFailure = await physical(database);
  await assert.rejects(restoreDayforgeBackupV2({
    repository, backup, active: true,
    afterWriteForTest: () => { throw new Error("interrupted"); },
  }));
  assert.deepEqual(await physical(database), beforeFailure);
  const restored = await recoverPlannerV2({
    repository, markerStorage: marker, input: JSON.stringify(backup), instant,
  });
  assert.deepEqual(restored.state, createDefaultState());
  assert.deepEqual((await exportDayforgeBackupV2({ repository, exportedAt: instant, active: true })).payload.planner, backup.payload.planner);
});

test("active v1 import records backup origin and explicit reset keeps legacy bytes", async (t) => {
  const { repository } = await setup(t);
  const marker = storage();
  const original = JSON.stringify(createDefaultState());
  const legacy = storage({ "rotina-369:data:v1": original });
  await boot(repository, marker, legacy);
  const imported = JSON.stringify({ ...createDefaultState(), monthlyGoals: { "2026-09": "Importado" } });
  const restored = await recoverPlannerV2({ repository, markerStorage: marker, input: imported, instant });
  assert.equal(restored.state.monthlyGoals["2026-09"], "Importado");
  const backup = await exportDayforgeBackupV2({ repository, exportedAt: instant, active: true });
  assert.equal(backup.payload.provenance.origins.length, 2);
  assert.ok(backup.payload.provenance.origins.some(
    (origin) => origin.importOrigins.includes("backup-v1"),
  ));
  await resetPlannerV2({ repository, markerStorage: marker, defaultState: createDefaultState(), instant });
  assert.deepEqual((await exportDayforgeBackupV2({ repository, exportedAt: instant, active: true })).payload.provenance.origins, []);
  assert.equal(legacy.getItem("rotina-369:data:v1"), original);
});

test("active v1 import is idempotent and preserves equivalent source provenance", async (t) => {
  const { database, repository } = await setup(t);
  const marker = storage();
  const original = JSON.stringify(createDefaultState());
  await boot(repository, marker, storage({ "rotina-369:data:v1": original }));
  const imported = { ...createDefaultState(), monthlyGoals: { "2026-09": "Importado" } };
  const raw = JSON.stringify(imported);
  await restoreActivePlannerV2({ repository, input: raw, instant });
  const first = await physical(database);
  await restoreActivePlannerV2({
    repository, input: raw, instant: "2026-09-29T12:00:00.000Z",
  });
  assert.deepEqual(await physical(database), first);

  const formatted = JSON.stringify(imported, null, 2);
  await restoreActivePlannerV2({ repository, input: formatted, instant });
  const backup = await exportDayforgeBackupV2({ repository, exportedAt: instant, active: true });
  assert.equal(backup.payload.provenance.origins.length, 2);
  const importedOrigin = backup.payload.provenance.origins.find(
    (origin) => origin.importOrigins.includes("backup-v1"),
  );
  assert.equal(importedOrigin.sourceRawFingerprints.length, 2);
  assert.equal(importedOrigin.migratedAt, instant);
});

test("active v1 import rolls back all prepared replacements on failure", async (t) => {
  const { database, repository } = await setup(t);
  await boot(repository, storage(), storage());
  const before = await physical(database);
  const imported = JSON.stringify({ ...createDefaultState(), monthlyGoals: { "2026-09": "Novo" } });
  await assert.rejects(restoreActivePlannerV2({
    repository, input: imported, instant,
    afterWriteForTest: () => { throw new Error("interrupted"); },
  }));
  assert.deepEqual(await physical(database), before);
});

test("explicit import recovers interrupted cutover without using stale v1", async (t) => {
  const donor = await setup(t);
  await boot(donor.repository, storage(), storage());
  const backup = await exportDayforgeBackupV2({ repository: donor.repository, exportedAt: instant, active: true });

  const { repository } = await setup(t);
  const marker = storage({ [PERSISTENCE_V2_MARKER_KEY]: PERSISTENCE_V2_MARKER_VALUE });
  const stale = storage({ "rotina-369:data:v1": "{corrompido" });
  await assert.rejects(boot(repository, marker, stale), PlannerV2UnavailableError);
  const restored = await recoverPlannerV2({
    repository, markerStorage: marker, input: JSON.stringify(backup), instant,
  });
  assert.deepEqual(restored.state, createDefaultState());
  assert.equal((await repository.read((transaction) => transaction.getDatabaseMetadata())).activeDocumentId, CURRENT_PLANNER_DOCUMENT_ID);
  assert.equal(stale.getItem("rotina-369:data:v1"), "{corrompido");
});

test("explicit reset recovers inactive marker state and preserves corrupt v1 bytes", async (t) => {
  const { repository } = await setup(t);
  const marker = storage({ [PERSISTENCE_V2_MARKER_KEY]: PERSISTENCE_V2_MARKER_VALUE });
  const stale = storage({ "rotina-369:data:v1": "{corrompido" });
  await assert.rejects(boot(repository, marker, stale), PlannerV2UnavailableError);
  const restored = await resetPlannerV2({
    repository, markerStorage: marker, defaultState: createDefaultState(), instant,
  });
  assert.deepEqual(restored.state, createDefaultState());
  assert.equal(restored.markerRepaired, true);
  assert.equal(stale.getItem("rotina-369:data:v1"), "{corrompido");
  assert.equal((await repository.read((transaction) => transaction.getDatabaseMetadata())).activeDocumentId, CURRENT_PLANNER_DOCUMENT_ID);
});
