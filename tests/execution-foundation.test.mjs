import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";
import ts from "typescript";
import { readFileSync } from "node:fs";
import {
  DayforgeDatabase, IndexedDbPersistenceRepository, bootstrapPlannerV2, ensureExecutionBridge,
  exportDayforgeBackupV2, restoreDayforgeBackupV2, restoreActivePlannerV2, recoverPlannerV2,
  saveActivePlannerV2, recordOccurrenceExecution, decodeExecutionBridge,
  EXECUTION_BRIDGE_DOCUMENT_ID, reconcileExecutionBridge, migrateLegacyPlannerV1,
  resetPlannerV2, canonicalStringify, WebCryptoSha256Hasher,
} from "../persistence/index.ts";
import { createDateOnlyExecutionTiming, createTimedExecutionTiming, createAllDayExecutionTiming, createExecutionRecord, executionRecordId } from "../domain/temporal/index.ts";

const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext };
const contextCompiled = ts.transpileModule(readFileSync(new URL("../app/today-context.ts", import.meta.url), "utf8"), { compilerOptions }).outputText;
const { deriveTodayContext } = await import(`data:text/javascript;base64,${Buffer.from(contextCompiled).toString("base64")}`);
const date = "2026-10-06";
const instant = "2026-10-06T12:00:00.000Z";
const routine = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
const item = (id = "same", title = "Fictício", start = "08:00", end = "09:00") => ({ id, title, start, end, notes: "", category: "estudo", completed: false });
const state = (items = [item(), item()]) => ({ version: 1, routine: structuredClone(routine), records: { [date]: { date, items, note: "", energy: 3 } }, monthlyGoals: {} });
let sequence = 0;
function storage(raw = null) {
  const values = new Map(raw === null ? [] : [["rotina-369:data:v1", raw]]);
  const writes = [];
  return { values, writes, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { writes.push(key); values.set(key, value); } };
}
async function setup(t, initial = state()) {
  const name = `execution-foundation-${++sequence}`;
  const database = new DayforgeDatabase(name);
  const repository = new IndexedDbPersistenceRepository(database);
  t.after(async () => { repository.close(); await Dexie.delete(name); });
  const raw = JSON.stringify(initial);
  const legacy = storage(raw);
  const marker = storage();
  const boot = () => bootstrapPlannerV2({ repository, legacyStorage: legacy, markerStorage: marker, defaultState: initial, instant });
  const result = await boot();
  return { name, database, repository, legacy, marker, boot, result, raw };
}
const backup = (repository) => exportDayforgeBackupV2({ repository, exportedAt: instant, active: true });
async function physical(database) {
  return { documents: (await database.plannerDocuments.toArray()).sort((a,b) => a.id.localeCompare(b.id)), metadata: (await database.metadata.toArray()).sort((a,b) => a.key.localeCompare(b.key)) };
}
function value(result) { assert.equal(result.ok, true); return result.value; }
function execution(id, timing = value(createDateOnlyExecutionTiming({ date, timeZone: "UTC" }))) {
  return value(createExecutionRecord({ id: value(executionRecordId(`execution:${id}`)), recordedAt: instant, timing, note: "Registro deliberado de teste" }));
}
async function complete(repository, id, extra = {}) {
  return recordOccurrenceExecution({ repository, occurrenceId: id, execution: execution(id), ...extra });
}
async function refingerprint(data) {
  data.payload.executionBridge.contentFingerprint = await new WebCryptoSha256Hasher().digestUtf8(canonicalStringify(data.payload.executionBridge.bridge));
}

test("duplicate legacy IDs receive unique persistent identities without changing v1 bytes", async (t) => {
  const { result, repository, legacy, raw, database } = await setup(t);
  const ids = result.executionBridge.entries.map((entry) => entry.occurrenceId);
  assert.equal(new Set(ids).size, 2);
  assert.deepEqual(result.executionBridge.entries.map((entry) => entry.itemIndex), [0, 1]);
  assert.deepEqual(result.executionBridge.entries.map((entry) => entry.originalItem.id), ["same", "same"]);
  assert.equal(legacy.getItem("rotina-369:data:v1"), raw);
  assert.deepEqual(legacy.writes, []);
  assert.equal((await repository.read((tx) => tx.getDatabaseMetadata())).executionBridgeVersion, 1);
  assert.deepEqual(database.tables.map((table) => table.name).sort(), ["metadata", "plannerDocuments"]);
});

test("reload and repeated bootstrap preserve identities and do not mutate existing state", async (t) => {
  const { repository, database, boot, result } = await setup(t);
  const before = await physical(database);
  repository.close();
  assert.deepEqual((await boot()).executionBridge, result.executionBridge);
  assert.deepEqual((await boot()).executionBridge, result.executionBridge);
  assert.deepEqual(await physical(database), before);
});

test("repeated isolated migration followed by bootstrap allocates exactly once", async (t) => {
  const { repository, result, raw, database, boot } = await setup(t);
  await migrateLegacyPlannerV1({ repository, raw, migratedAt: instant, active: true });
  const before = await physical(database);
  await migrateLegacyPlannerV1({ repository, raw, migratedAt: instant, active: true });
  assert.deepEqual(await physical(database), before);
  assert.deepEqual((await boot()).executionBridge, result.executionBridge);
});

test("bridge can be decoded; original planning remains independent of unique-ID edits", async (t) => {
  const { result, repository } = await setup(t, state([item("one"), item("two")]));
  assert.deepEqual(decodeExecutionBridge(result.executionBridge, result.state), result.executionBridge);
  const edited = structuredClone(result.state);
  edited.records[date].items[0].title = "Alterado";
  edited.records[date].items.reverse();
  const changed = await saveActivePlannerV2({ repository, state: edited });
  assert.equal(changed.entries[1].occurrenceId, result.executionBridge.entries[0].occurrenceId);
  assert.equal(changed.entries[1].originalItem.title, "Fictício");
});

test("ambiguous edits to duplicate IDs fail closed without mutations", async (t) => {
  const { result, repository, database } = await setup(t);
  const before = await physical(database);
  const edited = structuredClone(result.state);
  edited.records[date].items[0].title = "Ambíguo";
  await assert.rejects(saveActivePlannerV2({ repository, state: edited }));
  assert.deepEqual(await physical(database), before);
});

test("internal completion persists the domain execution and history in one atomic set", async (t) => {
  const { result, repository, boot, legacy, raw } = await setup(t);
  const id = result.executionBridge.entries[1].occurrenceId;
  await complete(repository, id);
  repository.close();
  const loaded = await boot();
  assert.equal(loaded.state.records[date].items[0].completed, false);
  assert.equal(loaded.state.records[date].items[1].completed, true);
  assert.deepEqual(loaded.executionBridge.entries[1].execution, execution(id));
  assert.deepEqual(loaded.executionBridge.entries[1].originalItem, result.state.records[date].items[1]);
  assert.deepEqual(loaded.state.routine, result.state.routine);
  assert.equal(legacy.getItem("rotina-369:data:v1"), raw);
  assert.deepEqual(legacy.writes, []);
});

test("retry and two independent simultaneous requests persist only one equivalent execution", async (t) => {
  const { result, repository, database, name } = await setup(t);
  const second = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  const id = result.executionBridge.entries[0].occurrenceId;
  await Promise.all([complete(repository, id), complete(second, id)]);
  second.close();
  const once = await physical(database);
  await complete(repository, id);
  assert.deepEqual(await physical(database), once);
  assert.equal((await backup(repository)).payload.executionBridge.bridge.entries.filter((entry) => entry.execution).length, 1);
});

test("different execution on a terminal binding is rejected", async (t) => {
  const { result, repository, database } = await setup(t);
  const id = result.executionBridge.entries[0].occurrenceId;
  await complete(repository, id);
  const before = await physical(database);
  const altered = { ...execution(id), recordedAt: "2026-10-06T13:00:00.000Z" };
  await assert.rejects(complete(repository, id, { execution: altered }));
  assert.deepEqual(await physical(database), before);
});

for (const [label, timing] of [
  ["timed", value(createTimedExecutionTiming({ start: "2026-10-06T08:00:00.000Z", end: "2026-10-06T09:00:00.000Z", timeZone: "UTC" }))],
  ["all_day", value(createAllDayExecutionTiming({ startsOn: date, endsBefore: "2026-10-07", timeZone: "UTC" }))],
]) test(`domain ${label} execution is validated and round-trips`, async (t) => {
  const { result, repository } = await setup(t);
  const id = result.executionBridge.entries[0].occurrenceId;
  await complete(repository, id, { execution: execution(id, timing) });
  assert.deepEqual((await backup(repository)).payload.executionBridge.bridge.entries[0].execution.timing, timing);
});

for (const [label, mutate] of [
  ["duplicate identity", (bridge) => { bridge.entries[1].occurrenceId = bridge.entries[0].occurrenceId; }],
  ["duplicate binding", (bridge) => { bridge.entries[1].itemIndex = 0; }],
  ["orphan", (bridge) => { bridge.entries[1].sourceDate = "2026-10-07"; }],
  ["invalid identity", (bridge) => { bridge.entries[0].occurrenceId = "occ:0"; }],
  ["missing binding", (bridge) => { bridge.entries.pop(); }],
  ["invalid execution", (bridge) => { bridge.entries[0].item.completed = true; bridge.entries[0].execution = { ...execution(bridge.entries[0].occurrenceId), timing: { kind: "running" } }; }],
]) test(`restore rejects ${label} before mutation`, async (t) => {
  const { repository, database } = await setup(t);
  const data = await backup(repository);
  mutate(data.payload.executionBridge.bridge);
  const before = await physical(database);
  await assert.rejects(restoreDayforgeBackupV2({ repository, backup: data, active: true }));
  assert.deepEqual(await physical(database), before);
});

test("nonexistent occurrence and mismatched execution identity fail without writes", async (t) => {
  const { repository, result, database } = await setup(t);
  const before = await physical(database);
  await assert.rejects(complete(repository, "occ:999"));
  await assert.rejects(complete(repository, result.executionBridge.entries[0].occurrenceId, { execution: execution("occ:999") }));
  assert.deepEqual(await physical(database), before);
});

test("new backup restores complete identity, execution and audit snapshot; restore is idempotent", async (t) => {
  const first = await setup(t);
  await complete(first.repository, first.result.executionBridge.entries[0].occurrenceId);
  const data = await backup(first.repository);
  const second = await setup(t, state([item("other")]));
  await restoreDayforgeBackupV2({ repository: second.repository, backup: data, active: true });
  const once = await physical(second.database);
  await restoreDayforgeBackupV2({ repository: second.repository, backup: data, active: true });
  second.repository.close();
  assert.deepEqual((await second.boot()).executionBridge, data.payload.executionBridge.bridge);
  assert.deepEqual(await physical(second.database), once);
  assert.deepEqual((await backup(second.repository)).payload, data.payload);
  assert.equal(data.formatVersion, 2);
  assert.equal(data.exportedFrom.persistenceGeneration, 2);
  assert.equal(data.exportedFrom.schemaVersion, 1);
});

test("old backup replaces existing executions with fresh bindings and preserves legacy completion only", async (t) => {
  const { repository, result, boot, database } = await setup(t);
  const data = await backup(repository);
  delete data.payload.executionBridge;
  await complete(repository, result.executionBridge.entries[0].occurrenceId);
  await restoreDayforgeBackupV2({ repository, backup: data, active: true });
  const restored = await boot();
  assert.equal(restored.executionBridge.entries.filter((entry) => entry.execution).length, 0);
  assert.deepEqual(restored.state, data.payload.planner);
  const once = await physical(database);
  await restoreDayforgeBackupV2({ repository, backup: data, active: true });
  assert.deepEqual(await physical(database), once);
});

test("v1 import and explicit reset replace execution data atomically without v1 writes", async (t) => {
  const { repository, result, raw, marker, legacy } = await setup(t);
  await complete(repository, result.executionBridge.entries[0].occurrenceId);
  await restoreActivePlannerV2({ repository, input: raw, instant });
  assert.equal((await ensureExecutionBridge(repository)).entries.filter((entry) => entry.execution).length, 0);
  await complete(repository, result.executionBridge.entries[0].occurrenceId);
  const reset = await resetPlannerV2({ repository, markerStorage: marker, defaultState: state([]), instant });
  assert.deepEqual(reset.executionBridge.entries, []);
  assert.equal(legacy.getItem("rotina-369:data:v1"), raw);
  assert.deepEqual(legacy.writes, []);
});

test("intermediate completion failure rolls back planner, bridge and provenance", async (t) => {
  const { repository, result, database } = await setup(t);
  const before = await physical(database);
  await assert.rejects(complete(repository, result.executionBridge.entries[0].occurrenceId, { afterWriteForTest() { throw new Error("fault"); } }));
  assert.deepEqual(await physical(database), before);
});

test("intermediate restore failure rolls back old executions and all replacements", async (t) => {
  const first = await setup(t);
  const data = await backup(first.repository);
  const target = await setup(t, state([item("other")]));
  await complete(target.repository, target.result.executionBridge.entries[0].occurrenceId);
  const before = await physical(target.database);
  await assert.rejects(restoreDayforgeBackupV2({ repository: target.repository, backup: data, active: true, afterWriteForTest() { throw new Error("fault"); } }));
  assert.deepEqual(await physical(target.database), before);
});

test("fingerprint corruption and missing adopted bridge block bootstrap without v1 fallback", async (t) => {
  const { repository, database, boot, marker } = await setup(t);
  const doc = await database.plannerDocuments.get(EXECUTION_BRIDGE_DOCUMENT_ID);
  await database.plannerDocuments.put({ ...doc, sourceContentFingerprint: "a".repeat(64) });
  const corrupt = await physical(database);
  await assert.rejects(boot());
  assert.deepEqual(await physical(database), corrupt);
  await database.plannerDocuments.delete(EXECUTION_BRIDGE_DOCUMENT_ID);
  await assert.rejects(boot());
  assert.equal(marker.getItem("dayforge:persistence:v2"), "active");
  assert.equal((await repository.read((tx) => tx.getDatabaseMetadata())).activeDocumentId, "planner/current");
});

test("terminal audit bindings cannot be removed or silently reopened by legacy controls", async (t) => {
  const { repository, result, database } = await setup(t, state([item("one")]));
  await complete(repository, result.executionBridge.entries[0].occurrenceId);
  const before = await physical(database);
  const data = (await backup(repository)).payload.planner;
  const reopened = structuredClone(data);
  reopened.records[date].items[0].completed = false;
  await assert.rejects(saveActivePlannerV2({ repository, state: reopened }));
  const removed = structuredClone(data);
  removed.records[date].items = [];
  await assert.rejects(saveActivePlannerV2({ repository, state: removed }));
  assert.deepEqual(await physical(database), before);
});

test("Hoje uses persistent identity and recalculates all sections from completion", async (t) => {
  const { repository, result } = await setup(t, state([
    item("ended", "Encerrado", "06:00", "07:00"), item("active", "Ativo", "08:00", "09:00"),
    item("next", "Próximo", "09:00", "10:00"), item("later", "Depois", "10:00", "11:00"),
  ]));
  const at = new Date("2026-10-06T08:30:00.000Z");
  const context = deriveTodayContext(result.state, at, "UTC", date, result.executionBridge);
  assert.equal(context.agora.occurrenceId, result.executionBridge.entries[1].occurrenceId);
  assert.equal(context.agora.id, context.agora.occurrenceId);
  for (const binding of result.executionBridge.entries) await complete(repository, binding.occurrenceId);
  const data = await backup(repository);
  const updated = deriveTodayContext(data.payload.planner, at, "UTC", date, data.payload.executionBridge.bridge);
  assert.equal(updated.agora, null);
  assert.equal(updated.proximo, null);
  assert.deepEqual(updated.depois, []);
  assert.deepEqual(updated.atencao, []);
  assert.deepEqual(updated.resumo, { total: 4, completed: 4, active: 0, future: 0, attention: 0 });
});

test("midnight continuation keeps the same persisted occurrence identity across days", async (t) => {
  const { repository, result } = await setup(t, state([item("night", "Noite", "23:00", "01:00"), item("tail", "Continuação", "01:00", "02:00")]));
  const context = deriveTodayContext(result.state, new Date("2026-10-07T00:30:00.000Z"), "UTC", undefined, result.executionBridge);
  assert.equal(context.agora.occurrenceId, result.executionBridge.entries[0].occurrenceId);
  assert.equal(context.proximo.occurrenceId, result.executionBridge.entries[1].occurrenceId);
  await complete(repository, context.agora.occurrenceId);
  const data = await backup(repository);
  assert.equal(deriveTodayContext(data.payload.planner, new Date("2026-10-07T01:30:00.000Z"), "UTC", undefined, data.payload.executionBridge.bridge).atencao.length, 0);
});

test("new backup rejects a valid-shaped audit record with a tampered fingerprint", async (t) => {
  const { repository, result, database } = await setup(t);
  await complete(repository, result.executionBridge.entries[0].occurrenceId);
  const data = await backup(repository);
  data.payload.executionBridge.bridge.entries[0].execution.note = "Conteúdo corrompido";
  const before = await physical(database);
  await assert.rejects(restoreDayforgeBackupV2({ repository, backup: data, active: true }));
  assert.deepEqual(await physical(database), before);
  await refingerprint(data);
  await restoreDayforgeBackupV2({ repository, backup: data, active: true });
});

test("unmaterialized routine duplicate IDs have distinct virtual keys and no canonical identity", () => {
  const data = state([]);
  delete data.records[date];
  data.routine.ter = [item(), item()];
  const context = deriveTodayContext(data, new Date("2026-10-06T07:30:00.000Z"), "UTC", date);
  assert.notEqual(context.proximo.id, context.depois[0].id);
  assert.equal(context.proximo.occurrenceId, null);
});

test("allocator does not reuse a removed planned identity", () => {
  const first = reconcileExecutionBridge(state([item("first")]));
  const removed = reconcileExecutionBridge(state([]), first);
  const second = reconcileExecutionBridge(state([item("second")]), removed);
  assert.notEqual(second.entries[0].occurrenceId, first.entries[0].occurrenceId);
});

test("a virtual routine projection cannot inherit a removed daily identity during autosave", () => {
  const data = state([item()]);
  const bridge = reconcileExecutionBridge(data);
  delete data.records[date];
  data.routine.ter = [item()];
  const context = deriveTodayContext(data, new Date("2026-10-06T07:30:00.000Z"), "UTC", date, bridge);
  assert.equal(context.proximo.occurrenceId, null);
  assert.notEqual(context.proximo.id, bridge.entries[0].occurrenceId);
});

test("legacy completed flags remain factual without invented canonical executions", async (t) => {
  const initial = state([{ ...item("old"), completed: true, actualMinutes: 42 }]);
  const { result, repository } = await setup(t, initial);
  assert.equal(result.executionBridge.entries[0].execution, null);
  assert.deepEqual(result.executionBridge.entries[0].originalItem, initial.records[date].items[0]);
  assert.equal((await backup(repository)).payload.executionBridge.bridge.entries[0].execution, null);
});

test("invalid legacy planning cannot receive a canonical execution", async (t) => {
  const { repository, result, database } = await setup(t, state([item("bad", "Fictício", "25:00", "26:00")]));
  const before = await physical(database);
  await assert.rejects(complete(repository, result.executionBridge.entries[0].occurrenceId));
  assert.deepEqual(await physical(database), before);
});

test("stale autosave cannot overwrite a concurrent canonical completion", async (t) => {
  const { result, repository, database } = await setup(t, state([item("one")]));
  let release, reached;
  const gate = new Promise((resolve) => { release = resolve; });
  const ready = new Promise((resolve) => { reached = resolve; });
  const real = new WebCryptoSha256Hasher();
  const edited = structuredClone(result.state);
  edited.records[date].items[0].title = "Edição concorrente";
  const hasher = { async digestUtf8(text) {
    if (text.includes("Edição concorrente")) { reached(); await gate; }
    return real.digestUtf8(text);
  } };
  const pending = saveActivePlannerV2({ repository, state: edited, hasher });
  await ready;
  await complete(repository, result.executionBridge.entries[0].occurrenceId);
  const completed = await physical(database);
  release();
  await assert.rejects(pending);
  assert.deepEqual(await physical(database), completed);
});

test("old backup with malformed daily binding fails before replacing active facts", async (t) => {
  const { repository, database } = await setup(t);
  const data = await backup(repository);
  delete data.payload.executionBridge;
  data.payload.planner.records[date].date = "2026-10-07";
  data.payload.provenance.origins = [];
  data.payload.legacySources = [];
  data.payload.provenance.contentFingerprint = await new WebCryptoSha256Hasher().digestUtf8(canonicalStringify(data.payload.planner));
  const before = await physical(database);
  await assert.rejects(restoreDayforgeBackupV2({ repository, backup: data, active: true }));
  assert.deepEqual(await physical(database), before);
});

test("execution cannot be copied to another valid occurrence binding", async (t) => {
  const { repository, result, database } = await setup(t);
  await complete(repository, result.executionBridge.entries[0].occurrenceId);
  const data = await backup(repository);
  const entries = data.payload.executionBridge.bridge.entries;
  entries[1].execution = structuredClone(entries[0].execution);
  const before = await physical(database);
  await assert.rejects(restoreDayforgeBackupV2({ repository, backup: data, active: true }));
  assert.deepEqual(await physical(database), before);
});

test("unknown execution documents are not silently omitted from recovery", async (t) => {
  const { repository, database, marker } = await setup(t);
  await database.plannerDocuments.put({ id: "execution/unknown", role: "active", format: "unknown", formatVersion: 1, sourceContentFingerprint: null, payload: {} });
  const before = await physical(database);
  await assert.rejects(backup(repository));
  await assert.rejects(resetPlannerV2({ repository, markerStorage: marker, defaultState: state([]), instant }));
  assert.deepEqual(await physical(database), before);
});

test("inactive old backup remains recoverable through explicit cutover", async (t) => {
  const first = await setup(t);
  const data = await backup(first.repository);
  delete data.payload.executionBridge;
  const name = `execution-old-restore-${++sequence}`;
  const repository = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  t.after(async () => { repository.close(); await Dexie.delete(name); });
  await repository.open();
  await restoreDayforgeBackupV2({ repository, backup: data });
  const result = await recoverPlannerV2({ repository, markerStorage: storage(), input: JSON.stringify(data), instant });
  assert.equal(result.executionBridge.entries.length, 2);
  assert.equal(result.executionBridge.entries.filter((entry) => entry.execution).length, 0);
});
