import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { actualInstant, buildCompletionRecord } from "../app/completion-input.ts";
import { PlannerWriteQueue } from "../app/planner-write-queue.ts";
import { persistCompletion, CompletionPersistenceError } from "../app/completion-command.ts";
import { DayforgeDatabase, IndexedDbPersistenceRepository, bootstrapPlannerV2, exportDayforgeBackupV2,
  restoreActivePlannerV2, saveActivePlannerV2, recordOccurrenceExecution } from "../persistence/index.ts";

const compiled = ts.transpileModule(readFileSync(new URL("../app/today-context.ts", import.meta.url), "utf8"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { deriveTodayContext } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const date = "2026-10-06";
const instant = "2026-10-06T08:30:00.000Z";
const routine = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
const item = (id, start, end, completed = false) => ({ id, title: id, start, end, completed, category: "estudo", notes: "" });
const state = () => ({ version: 1, routine: structuredClone(routine), monthlyGoals: {}, records: {
  [date]: { date, note: "", energy: 3, items: [item("Review", "07:00", "08:00"), item("Now", "08:00", "09:00"), item("Next", "09:00", "10:00"), item("Later", "10:00", "11:00")] },
} });
const input = { start: `${date}T08:02`, end: `${date}T08:27`, timeZone: "UTC", note: " Fato real " };
const execution = (id, values = input) => buildCompletionRecord(id, values, instant);
const exported = (repository) => exportDayforgeBackupV2({ repository, exportedAt: instant, active: true });
let sequence = 0;
async function setup(t, initial = state()) {
  const name = `completion-action-${++sequence}`;
  const database = new DayforgeDatabase(name);
  const repository = new IndexedDbPersistenceRepository(database);
  t.after(async () => { repository.close(); await Dexie.delete(name); });
  const raw = JSON.stringify(initial), writes = [];
  const values = new Map([["rotina-369:data:v1", raw]]);
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { writes.push(key); values.set(key, value); } };
  const boot = () => bootstrapPlannerV2({ repository, legacyStorage: storage, markerStorage: storage, defaultState: initial, instant });
  const result = await boot();
  return { repository, database, name, result, raw, writes, storage, boot };
}
const physical = async (database) => ({ docs: await database.plannerDocuments.toArray(), metadata: await database.metadata.toArray() });
const failingWrites = (repository) => ({ open: () => repository.open(), close: () => repository.close(), read: (work) => repository.read(work),
  write: (work) => repository.write(async (tx) => { await work(tx); throw new Error("Simulated failure after writes"); }) });

test("explicit actual timing creates the canonical ID, UTC interval, timezone, note and injected recordedAt", () => {
  const record = execution("occ:2", { ...input, timeZone: "America/Sao_Paulo" });
  assert.equal(record.id, "execution:occ:2");
  assert.equal(record.recordedAt, instant);
  assert.equal(record.timing.timeZone, "America/Sao_Paulo");
  assert.deepEqual(record.timing.interval, { start: `${date}T11:02:00.000Z`, end: `${date}T11:27:00.000Z` });
  assert.equal(record.note, "Fato real");
});
test("wall time conversion handles fractional offsets and explicit UTC without planned timing", () => {
  assert.equal(actualInstant(`${date}T08:02`, "Asia/Kathmandu"), `${date}T02:17:00.000Z`);
  assert.equal(actualInstant(`${date}T08:02`, "UTC"), `${date}T08:02:00.000Z`);
});
test("actualMinutes uses real elapsed UTC time across DST and replaces legacy estimates only on the first canonical completion", async (t) => {
  const initial = state(); initial.records[date].items[0].actualMinutes = 999;
  const { repository, result, database } = await setup(t, initial); const id = result.executionBridge.entries[0].occurrenceId;
  const record = execution(id, { ...input, start: "2026-11-01T00:30", end: "2026-11-01T02:30", timeZone: "America/New_York" });
  await recordOccurrenceExecution({ repository, occurrenceId: id, execution: record });
  const backup = await exported(repository);
  assert.equal(backup.payload.planner.records[date].items[0].actualMinutes, 180);
  assert.equal(backup.payload.executionBridge.bridge.entries[0].originalItem.actualMinutes, 999);
  const once = await physical(database); await recordOccurrenceExecution({ repository, occurrenceId: id, execution: record });
  assert.deepEqual(await physical(database), once);
});
for (const [label, values, recordedAt = instant, id = "occ:1"] of [
  ["invalid date", { ...input, start: "2026-02-30T08:00" }],
  ["invalid time", { ...input, start: `${date}T25:00` }],
  ["invalid timezone", { ...input, timeZone: "Mars/Olympus" }],
  ["inverted interval", { ...input, end: `${date}T08:00` }],
  ["empty interval", { ...input, end: input.start }],
  ["missing start", { ...input, start: "" }],
  ["invalid recordedAt", input, "not an instant"],
  ["virtual identity", input, instant, "routine:1"],
  ["ambiguous DST", { ...input, start: "2026-11-01T01:30", end: "2026-11-01T03:00", timeZone: "America/New_York" }],
  ["nonexistent DST", { ...input, start: "2026-03-08T02:30", end: "2026-03-08T04:00", timeZone: "America/New_York" }],
]) test(`${label} cannot construct a completion fact`, () => assert.throws(() => buildCompletionRecord(id, values, recordedAt)));

test("completion publishes coherent persisted state/bridge, exact actualMinutes and audit history; reload preserves them and v1/template", async (t) => {
  const fixture = await setup(t); const { repository, result, boot } = fixture;
  const binding = result.executionBridge.entries[1], record = execution(binding.occurrenceId);
  let snapshot;
  await persistCompletion({ repository, occurrenceId: binding.occurrenceId, execution: record, publish: (value) => { snapshot = value; } });
  assert.equal(snapshot.state.records[date].items[1].completed, true);
  assert.equal(snapshot.state.records[date].items[1].actualMinutes, 25);
  assert.deepEqual(snapshot.executionBridge.entries[1].execution, record);
  assert.deepEqual(snapshot.executionBridge.entries[1].originalItem, binding.originalItem);
  assert.deepEqual(snapshot.state.routine, result.state.routine);
  repository.close(); const reloaded = await boot();
  assert.deepEqual(reloaded.state, snapshot.state); assert.deepEqual(reloaded.executionBridge, snapshot.executionBridge);
  assert.equal(fixture.storage.getItem("rotina-369:data:v1"), fixture.raw);
  assert.equal(fixture.writes.includes("rotina-369:data:v1"), false);
});

test("Agora, Próximo, Depois, Atenção and Resumo recalculate deterministically from every canonical completion", async (t) => {
  const { repository, result } = await setup(t);
  let snapshot = { state: result.state, executionBridge: result.executionBridge };
  const project = () => deriveTodayContext(snapshot.state, new Date(instant), "UTC", date, snapshot.executionBridge);
  assert.equal(project().agora.title, "Now"); assert.equal(project().proximo.title, "Next");
  assert.equal(project().depois[0].title, "Later"); assert.equal(project().atencao[0].title, "Review");
  for (const index of [1, 2, 3, 0]) {
    const id = result.executionBridge.entries[index].occurrenceId;
    await persistCompletion({ repository, occurrenceId: id, execution: execution(id), publish: (value) => { snapshot = value; } });
    const context = project(); assert.deepEqual(project(), context);
    assert.equal(context.resumo.completed, [1, 2, 3, 0].indexOf(index) + 1);
    if (index === 1) { assert.equal(context.agora, null); assert.equal(context.proximo.title, "Next"); }
    if (index === 2) { assert.equal(context.proximo.title, "Later"); assert.equal(context.depois.length, 0); }
    if (index === 3) { assert.equal(context.proximo, null); assert.equal(context.resumo.future, 0); }
    if (index === 0) assert.equal(context.atencao.length, 0);
  }
});

test("equivalent concurrent requests coalesce in the queue; later retry preserves exact physical records", async (t) => {
  const { repository, result, database } = await setup(t); const id = result.executionBridge.entries[0].occurrenceId;
  const queue = new PlannerWriteQueue(); let calls = 0;
  const work = async () => { calls++; await persistCompletion({ repository, occurrenceId: id, execution: execution(id), publish() {} }); };
  const first = queue.complete(id, execution(id), work), second = queue.complete(id, execution(id), work);
  assert.equal(first, second); assert.deepEqual(queue.completingIds, [id]);
  await Promise.all([first, second]); assert.equal(calls, 1); assert.deepEqual(queue.completingIds, []);
  const once = await physical(database); await queue.complete(id, execution(id), work);
  assert.deepEqual(await physical(database), once);
});
test("conflicting concurrent request is isolated, while equivalent independent connections persist one fact", async (t) => {
  const { repository, result, name } = await setup(t); const id = result.executionBridge.entries[0].occurrenceId;
  const queue = new PlannerWriteQueue(); let release; const barrier = new Promise((resolve) => { release = resolve; });
  const pending = queue.complete(id, execution(id), async () => { await barrier; });
  await assert.rejects(queue.complete(id, { ...execution(id), recordedAt: `${date}T09:00:00.000Z` }, async () => {}));
  assert.deepEqual(queue.completingIds, [id]); release(); await pending;
  const other = new IndexedDbPersistenceRepository(new DayforgeDatabase(name)); t.after(() => other.close());
  await Promise.all([repository, other].map((connection) => persistCompletion({ repository: connection, occurrenceId: id, execution: execution(id), publish() {} })));
  assert.equal((await exported(repository)).payload.executionBridge.bridge.entries.filter((entry) => entry.execution).length, 1);
});
test("pending autosave completes first; obsolete React snapshot queued after command cannot reopen completion", async (t) => {
  const { repository, result } = await setup(t); const id = result.executionBridge.entries[0].occurrenceId;
  const queue = new PlannerWriteQueue(); const edited = structuredClone(result.state); edited.records[date].note = "Saved before completion";
  let release; const barrier = new Promise((resolve) => { release = resolve; }); let obsoleteWrites = 0, snapshot;
  const autosave = queue.autosave(0, async () => { await barrier; await saveActivePlannerV2({ repository, state: edited }); });
  const command = queue.complete(id, execution(id), () => persistCompletion({ repository, occurrenceId: id, execution: execution(id), publish(value) { snapshot = value; queue.revision++; } }));
  const stale = queue.autosave(0, async () => { obsoleteWrites++; await saveActivePlannerV2({ repository, state: edited }); });
  release(); await Promise.all([autosave, command, stale]);
  assert.equal(obsoleteWrites, 0); assert.equal(snapshot.state.records[date].note, "Saved before completion");
  assert.equal(snapshot.state.records[date].items[0].completed, true);
  await queue.autosave(queue.revision, () => saveActivePlannerV2({ repository, state: snapshot.state }));
  assert.deepEqual((await exported(repository)).payload.executionBridge.bridge, snapshot.executionBridge);
});

for (const kind of ["missing occurrence", "invalid timing", "invalid recordedAt", "historical completion", "conflicting terminal"]) {
  test(`${kind} rejects the action without writes or structural blocking`, async (t) => {
    const initial = state(); if (kind === "historical completion") initial.records[date].items[0].completed = true;
    const { repository, result, database } = await setup(t, initial);
    const id = kind === "missing occurrence" ? "occ:999" : result.executionBridge.entries[0].occurrenceId;
    let record = execution(id);
    if (kind === "conflicting terminal") { await recordOccurrenceExecution({ repository, occurrenceId: id, execution: record }); record = { ...record, recordedAt: `${date}T09:00:00.000Z` }; }
    if (kind === "invalid timing") record = { ...record, timing: { ...record.timing, interval: { start: instant, end: instant } } };
    if (kind === "invalid recordedAt") record = { ...record, recordedAt: "invalid" };
    const before = await physical(database); let published;
    await assert.rejects(persistCompletion({ repository, occurrenceId: id, execution: record, publish: (snapshot) => { published = snapshot; } }),
      (error) => error instanceof CompletionPersistenceError && error.blocked === false);
    assert.deepEqual(await physical(database), before);
    assert.deepEqual(published.state, (await exported(repository)).payload.planner);
  });
}
test("intermediate persistence failure rolls back all structures, publishes previous snapshot and permits equivalent retry", async (t) => {
  const { repository, result, database } = await setup(t); const id = result.executionBridge.entries[0].occurrenceId;
  const before = await physical(database); let snapshot;
  await assert.rejects(persistCompletion({ repository: failingWrites(repository), occurrenceId: id, execution: execution(id), publish: (value) => { snapshot = value; } }),
    (error) => error instanceof CompletionPersistenceError && !error.blocked);
  assert.deepEqual(await physical(database), before); assert.equal(snapshot.state.records[date].items[0].completed, false);
  await persistCompletion({ repository, occurrenceId: id, execution: execution(id), publish() {} });
  assert.equal((await exported(repository)).payload.executionBridge.bridge.entries[0].execution.id, `execution:${id}`);
});
test("missing adopted bridge fails closed without publishing unvalidated defaults or falling back to v1", async (t) => {
  const { repository, result, database, boot, raw, storage, writes } = await setup(t);
  await database.plannerDocuments.delete("execution/bridge"); const before = await physical(database);
  await assert.rejects(persistCompletion({ repository, occurrenceId: result.executionBridge.entries[0].occurrenceId,
    execution: execution("occ:1"), publish() { assert.fail("unvalidated snapshot"); } }), (error) => error.blocked === true);
  await assert.rejects(boot()); assert.deepEqual(await physical(database), before);
  assert.equal(storage.getItem("rotina-369:data:v1"), raw); assert.equal(writes.includes("rotina-369:data:v1"), false);
});
test("UI-produced fact survives logical backup/restore/reload unchanged, with all version numbers preserved", async (t) => {
  const { repository, result } = await setup(t); const id = result.executionBridge.entries[0].occurrenceId;
  await persistCompletion({ repository, occurrenceId: id, execution: execution(id), publish() {} });
  const backup = await exported(repository); const target = await setup(t);
  await restoreActivePlannerV2({ repository: target.repository, input: JSON.stringify(backup), instant }); target.repository.close();
  const restored = await target.boot();
  assert.deepEqual(restored.executionBridge, backup.payload.executionBridge.bridge);
  assert.deepEqual(restored.state, backup.payload.planner);
  assert.equal(backup.formatVersion, 2); assert.equal(backup.exportedFrom.persistenceGeneration, 2);
  assert.equal((await target.repository.open()).schemaVersion, 1);
});
test("overnight real execution and day rollover retain the original occurrence identity and source date", async (t) => {
  const initial = state(); initial.records[date].items = [item("Night", "23:30", "01:00"), item("Following", "01:00", "02:00")];
  const { repository, result } = await setup(t, initial); const id = result.executionBridge.entries[0].occurrenceId;
  const record = execution(id, { ...input, start: `${date}T23:50`, end: "2026-10-07T00:20" }); let snapshot;
  await persistCompletion({ repository, occurrenceId: id, execution: record, publish: (value) => { snapshot = value; } });
  assert.equal(snapshot.state.records[date].items[0].actualMinutes, 30);
  const context = deriveTodayContext(snapshot.state, new Date("2026-10-07T00:30:00.000Z"), "UTC", "2026-10-07", snapshot.executionBridge);
  assert.equal(context.agora, null); assert.equal(context.proximo.title, "Following"); assert.equal(context.atencao.length, 0);
  assert.equal(snapshot.executionBridge.entries[0].sourceDate, date); assert.deepEqual(snapshot.executionBridge.entries[0].execution, record);
});
