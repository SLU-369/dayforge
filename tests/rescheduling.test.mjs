import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { buildPlanningSchedule } from "../app/rescheduling-input.ts";
import { buildCompletionRecord } from "../app/completion-input.ts";
import { persistRescheduling } from "../app/rescheduling-command.ts";
import { persistCompletion } from "../app/completion-command.ts";
import { PlannerWriteQueue } from "../app/planner-write-queue.ts";
import { DayforgeDatabase, IndexedDbPersistenceRepository, bootstrapPlannerV2, readPlannerAuthoritySnapshot, createBridgeDocument,
  rescheduleOccurrencePlanning, occurrenceRevision, saveActivePlannerV2, recordOccurrenceExecution,
  restoreActivePlannerV2, resetPlannerV2 } from "../persistence/index.ts";
import { deriveCompletedStatus as completedStatus } from "../domain/temporal/index.ts";

const compiled = ts.transpileModule(readFileSync(new URL("../app/today-context.ts", import.meta.url), "utf8"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { deriveTodayContext } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const date = "2026-10-10", instant = `${date}T12:00:00.000Z`;
const schedule = (start = `${date}T20:00`, end = `${date}T21:00`, timeZone = "UTC") => buildPlanningSchedule({ start, end, timeZone });
const baseline = schedule(`${date}T06:30`, `${date}T07:30`);
const item = (id = "Treino") => ({ id, title: id, start: "06:30", end: "07:30", category: "saude", notes: "", completed: false });
const initial = () => ({ version: 1, monthlyGoals: {}, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] }, records: {
  [date]: { date, items: [item()], note: "", energy: 3 },
} });
let sequence = 0;
async function setup(t, state = initial()) {
  const name = `rescheduling-${++sequence}`, database = new DayforgeDatabase(name), repository = new IndexedDbPersistenceRepository(database);
  t.after(async () => { repository.close(); await Dexie.delete(name); });
  const raw = JSON.stringify(state), values = new Map([["rotina-369:data:v1", raw]]), writes = [];
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { writes.push(key); values.set(key, value); } };
  await bootstrapPlannerV2({ repository, legacyStorage: storage, markerStorage: storage, defaultState: state, instant });
  return { repository, database, name, storage, raw, writes };
}
const snapshot = (repository) => readPlannerAuthoritySnapshot({ repository, active: true, exportedAt: instant });
const physical = async (database) => ({ docs: await database.plannerDocuments.toArray(), metadata: await database.metadata.toArray() });
function intent(snap, overrides = {}) {
  const binding = snap.backup.payload.executionBridge.bridge.entries[0];
  return { occurrenceId: binding.occurrenceId, expectedAuthorityEpoch: snap.authorityEpoch, expectedRevision: occurrenceRevision(binding),
    expectedHistoryLength: binding.planningAudit?.rescheduleHistory.length ?? 0,
    ...(!binding.planningAudit ? { previousSchedule: baseline } : {}), schedule: schedule(), changedAt: instant, ...overrides };
}
const context = (snap, day = date, now = instant) => deriveTodayContext(snap.backup.payload.planner, new Date(now), "UTC", day, snap.backup.payload.executionBridge.bridge);
const execution = (id = "occ:1", recordedAt = `${date}T22:00:00.000Z`) => buildCompletionRecord(id, { start: `${date}T20:05`, end: `${date}T20:55`, timeZone: "UTC", note: "" }, recordedAt);

for (const [label, start, end, zone, minutes] of [
  ["same day", `${date}T20:00`, `${date}T21:00`, "UTC", 60],
  ["explicit overnight", `${date}T23:00`, "2026-10-11T01:00", "UTC", 120],
  ["month", "2026-10-31T23:30", "2026-11-01T00:30", "UTC", 60],
  ["year", "2026-12-31T23:30", "2027-01-01T01:30", "UTC", 120],
  ["leap", "2028-02-29T23:30", "2028-03-01T00:30", "UTC", 60],
  ["fractional zone", `${date}T20:00`, `${date}T21:30`, "Asia/Kathmandu", 90],
  ["DST elapsed duration", "2026-11-01T00:30", "2026-11-01T02:30", "America/New_York", 180],
]) test(`strict planning input: ${label}`, () => assert.equal(schedule(start, end, zone).durationMinutes, minutes));
for (const [label, start, end, zone] of [
  ["implicit overnight", `${date}T23:00`, `${date}T01:00`, "UTC"],
  ["equal limits", `${date}T20:00`, `${date}T20:00`, "UTC"],
  ["invalid zone", `${date}T20:00`, `${date}T21:00`, "wrong"],
  ["numeric offset is not IANA", `${date}T20:00`, `${date}T21:00`, "+01:30"],
  ["invalid leap", "2027-02-29T20:00", "2027-03-01T21:00", "UTC"],
  ["nonexistent DST", "2026-03-08T02:30", "2026-03-08T04:00", "America/New_York"],
  ["ambiguous DST", "2026-11-01T01:30", "2026-11-01T02:30", "America/New_York"],
]) test(`strict planning rejects ${label}`, () => assert.throws(() => schedule(start, end, zone)));

test("06:30 → 20:00 → real execution preserves identity, physical planner, original, audit, reload and backup", async (t) => {
  const { repository, database, storage, raw, writes } = await setup(t);
  const before = await snapshot(repository), request = intent(before); let published;
  await persistRescheduling({ ...request, repository, publish: (value) => { published = value; } });
  const after = await snapshot(repository), binding = after.backup.payload.executionBridge.bridge.entries[0];
  assert.deepEqual(after.backup.payload.planner, before.backup.payload.planner);
  assert.equal(published.authorityEpoch, before.authorityEpoch);
  assert.equal(binding.occurrenceId, request.occurrenceId); assert.deepEqual(binding.originalItem, item()); assert.equal(binding.execution, null);
  assert.deepEqual(binding.planningAudit.baselineSchedule, baseline); assert.equal(binding.planningAudit.confirmedAt, instant);
  assert.equal(binding.planningAudit.rescheduleHistory.length, 1);
  assert.equal(context(after).proximo.start, "20:00"); assert.equal(context(after).atencao.length, 0);
  await recordOccurrenceExecution({ repository, occurrenceId: request.occurrenceId, execution: execution(), expectedAuthorityEpoch: after.authorityEpoch, expectedRevision: occurrenceRevision(binding) });
  const done = await snapshot(repository), terminal = done.backup.payload.executionBridge.bridge.entries[0];
  assert.equal(completedStatus(terminal.planningAudit.rescheduleHistory), "completed_rescheduled");
  assert.equal(terminal.item.actualMinutes, 50); assert.deepEqual(terminal.planningAudit, binding.planningAudit);
  await restoreActivePlannerV2({ repository, input: JSON.stringify(done.backup), instant });
  assert.deepEqual((await snapshot(repository)).backup.payload, done.backup.payload);
  const persisted = await physical(database);
  await bootstrapPlannerV2({ repository, legacyStorage: storage, markerStorage: storage, defaultState: initial(), instant });
  assert.deepEqual(await physical(database), persisted); assert.equal(storage.getItem("rotina-369:data:v1"), raw); assert.ok(!writes.includes("rotina-369:data:v1"));
});

test("multiple appends and return to baseline retain history; exact old replay after completion writes nothing", async (t) => {
  const { repository, database } = await setup(t), first = intent(await snapshot(repository));
  await rescheduleOccurrencePlanning({ ...first, repository });
  const unchanged = await physical(database);
  await assert.rejects(rescheduleOccurrencePlanning({ ...intent(await snapshot(repository)), repository }));
  assert.deepEqual(await physical(database), unchanged);
  const second = intent(await snapshot(repository), { schedule: schedule(`${date}T22:00`, `${date}T23:30`) });
  await rescheduleOccurrencePlanning({ ...second, repository });
  // Returning to the baseline is allowed when that baseline is still future at the decision instant.
  const returned = intent(await snapshot(repository), { schedule: baseline, changedAt: `${date}T05:00:00.000Z` });
  await assert.rejects(rescheduleOccurrencePlanning({ ...returned, repository }));
  const futureBaseline = schedule("2026-10-11T06:30", "2026-10-11T07:30");
  const { repository: other } = await setup(t);
  await rescheduleOccurrencePlanning({ repository: other, ...intent(await snapshot(other), { previousSchedule: futureBaseline }) });
  await rescheduleOccurrencePlanning({ repository: other, ...intent(await snapshot(other), { schedule: futureBaseline }) });
  assert.equal((await snapshot(other)).backup.payload.executionBridge.bridge.entries[0].planningAudit.rescheduleHistory.length, 2);
  await recordOccurrenceExecution({ repository, occurrenceId: "occ:1", execution: execution() });
  const once = await physical(database); await rescheduleOccurrencePlanning({ ...first, repository }); await rescheduleOccurrencePlanning({ ...second, repository });
  assert.deepEqual(await physical(database), once);
  await assert.rejects(rescheduleOccurrencePlanning({ ...first, expectedRevision: "different", repository }));
});

for (const kind of ["no-op", "past", "missing confirmation", "stale revision", "wrong epoch", "invalid input", "historical completion", "duplicate identity"]) {
  test(`canonical command rejects ${kind} without writes`, async (t) => {
    const state = initial(); if (kind === "historical completion") state.records[date].items[0].completed = true;
    if (kind === "duplicate identity") state.records[date].items.push(item());
    const { repository, database } = await setup(t, state), snap = await snapshot(repository);
    const request = intent(snap);
    if (kind === "no-op") request.schedule = baseline;
    if (kind === "past") request.schedule = schedule(`${date}T10:00`, `${date}T12:00`);
    if (kind === "missing confirmation") delete request.previousSchedule;
    if (kind === "stale revision") request.expectedRevision = "wrong";
    if (kind === "wrong epoch") request.expectedAuthorityEpoch++;
    if (kind === "invalid input") request.schedule.durationMinutes = -1;
    const before = await physical(database);
    await assert.rejects(rescheduleOccurrencePlanning({ ...request, repository })); assert.deepEqual(await physical(database), before);
  });
}

test("equivalent inflight intents share one queue operation; conflict rejects; obsolete autosave and export serialize", async (t) => {
  const { repository } = await setup(t), before = await snapshot(repository), request = intent(before), queue = new PlannerWriteQueue();
  const state = structuredClone(before.backup.payload.planner); state.records[date].note = "Independent note";
  const save = queue.autosave(0, () => saveActivePlannerV2({ repository, state }));
  const work = () => persistRescheduling({ ...request, repository, publish() { queue.revision++; } });
  const a = queue.command("occ:1", request, work), b = queue.command("occ:1", request, work); assert.equal(a, b);
  await assert.rejects(queue.command("occ:1", { ...request, changedAt: `${date}T13:00:00.000Z` }, work));
  let staleCalls = 0; const stale = queue.autosave(0, async () => { staleCalls++; });
  const exportAfter = queue.enqueue(() => snapshot(repository));
  await Promise.all([save, a, b, stale]); assert.equal(staleCalls, 0);
  const saved = await exportAfter; assert.equal(saved.backup.payload.planner.records[date].note, "Independent note");
  assert.equal(saved.backup.payload.executionBridge.bridge.entries[0].planningAudit.rescheduleHistory.length, 1);
});

for (const competing of ["equivalent", "conflicting", "completion"]) test(`two real connections: rescheduling versus ${competing}`, async (t) => {
  const { repository, name } = await setup(t), other = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  t.after(() => other.close()); const before = await snapshot(repository), request = intent(before);
  const competingCommand = competing === "completion" ? recordOccurrenceExecution({ repository: other, occurrenceId: "occ:1", execution: execution(), expectedAuthorityEpoch: before.authorityEpoch, expectedRevision: request.expectedRevision })
    : rescheduleOccurrencePlanning({ ...request, repository: other, ...(competing === "conflicting" ? { schedule: schedule(`${date}T22:00`, `${date}T23:00`) } : {}) });
  const results = await Promise.allSettled([rescheduleOccurrencePlanning({ ...request, repository }), competingCommand]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, competing === "equivalent" ? 2 : 1);
  const binding = (await snapshot(repository)).backup.payload.executionBridge.bridge.entries[0];
  assert.ok(!!binding.execution !== !!binding.planningAudit || competing === "equivalent");
});

for (const replacement of ["restore", "import", "reset"]) test(`replacement ${replacement} fences an open dialog, even with reused IDs`, async (t) => {
  const { repository, storage } = await setup(t), old = await snapshot(repository), request = intent(old), queue = new PlannerWriteQueue();
  await queue.enqueue(() => replacement === "reset" ? resetPlannerV2({ repository, markerStorage: storage, defaultState: initial(), instant })
    : restoreActivePlannerV2({ repository, input: replacement === "restore" ? JSON.stringify(old.backup) : JSON.stringify(initial()), instant }));
  let refreshed;
  await assert.rejects(queue.command("occ:1", request, () => persistRescheduling({ repository, ...request, publish(value) { refreshed = value; } })), /substituídos/);
  assert.equal(refreshed.authorityEpoch, old.authorityEpoch + 1); assert.equal(refreshed.executionBridge.entries[0].planningAudit, undefined);
});

test("stale completion rejects after rescheduling, and stale rescheduling rejects after completion", async (t) => {
  const { repository } = await setup(t), before = await snapshot(repository), request = intent(before);
  await rescheduleOccurrencePlanning({ repository, ...request });
  await assert.rejects(persistCompletion({ repository, occurrenceId: "occ:1", execution: execution(), expectedAuthorityEpoch: before.authorityEpoch, expectedRevision: request.expectedRevision, publish() {} }), /planejamento mudou/);
  const fresh = intent(await snapshot(repository), { schedule: schedule(`${date}T22:00`, `${date}T23:00`) });
  await recordOccurrenceExecution({ repository, occurrenceId: "occ:1", execution: execution() });
  await assert.rejects(rescheduleOccurrencePlanning({ repository, ...fresh }));
});

test("rollback and failed UI publication allow exact retry without a second event", async (t) => {
  const { repository, database } = await setup(t), request = intent(await snapshot(repository)), before = await physical(database);
  await assert.rejects(rescheduleOccurrencePlanning({ repository, ...request, afterWriteForTest() { throw new Error("rollback"); } }));
  assert.deepEqual(await physical(database), before);
  await assert.rejects(persistRescheduling({ repository, ...request, publish() { throw new Error("UI publication failed"); } }));
  const once = await physical(database);
  await persistRescheduling({ repository, ...request, publish() {} }); assert.deepEqual(await physical(database), once);
});

for (const corruption of ["fingerprint", "bridge"]) test(`corrupted ${corruption} blocks without writing or publishing defaults`, async (t) => {
  const { repository, database } = await setup(t), request = intent(await snapshot(repository));
  const bridge = await database.plannerDocuments.get("execution/bridge");
  if (corruption === "bridge") bridge.payload.entries[0].occurrenceId = "invalid"; else bridge.sourceContentFingerprint = "a".repeat(64);
  await database.plannerDocuments.put(bridge); const before = await physical(database);
  await assert.rejects(persistRescheduling({ repository, ...request, publish() { assert.fail("unvalidated publication"); } }), (error) => error.blocked === true);
  assert.deepEqual(await physical(database), before);
});

for (const destination of [date, "2026-10-11", "2027-01-02"]) test(`effective planning moves to ${destination} exactly once, including distant origin`, async (t) => {
  const { repository } = await setup(t), request = intent(await snapshot(repository), { schedule: schedule(`${destination}T20:00`, `${destination}T21:00`) });
  await rescheduleOccurrencePlanning({ repository, ...request }); const saved = await snapshot(repository);
  assert.equal(context(saved, destination).proximo.occurrenceId, "occ:1");
  assert.equal(context(saved, destination).resumo.total, 1); assert.equal(context(saved, date).resumo.total, destination === date ? 1 : 0);
  assert.equal(context(saved, destination, `${destination}T20:30:00.000Z`).agora.occurrenceId, "occ:1");
  assert.equal(context(saved, destination, `${destination}T21:00:00.000Z`).atencao.length, 1);
});

test("distant historical origin, explicit midnight, stable ties and virtual coexistence are projected by identity", async (t) => {
  const state = initial(); state.routine.dom = [{ ...item(), completed: undefined }]; delete state.routine.dom[0].completed;
  state.records[date].items.push(item("Other"));
  const { repository } = await setup(t, state), before = await snapshot(repository);
  await rescheduleOccurrencePlanning({ repository, ...intent(before, { schedule: schedule("2026-12-06T23:00", "2026-12-07T01:00") }) });
  const saved = await snapshot(repository), sunday = context(saved, "2026-12-06"), monday = context(saved, "2026-12-07", "2026-12-07T00:30:00.000Z");
  assert.equal(sunday.resumo.total, 2); assert.equal(sunday.depois[0].occurrenceId, "occ:1");
  assert.equal(monday.agora.occurrenceId, "occ:1"); assert.equal(monday.resumo.total, 1);
  assert.deepEqual(context(saved, "2026-12-06"), sunday);
});

for (const mutation of ["clock", "minutes", "toggle", "delete item", "delete record", "identity"]) test(`legacy guard blocks ${mutation} of audited occurrence`, async (t) => {
  const { repository, database } = await setup(t); await rescheduleOccurrencePlanning({ repository, ...intent(await snapshot(repository)) });
  const state = structuredClone((await snapshot(repository)).backup.payload.planner), row = state.records[date];
  if (mutation === "clock") row.items[0].start = "05:30";
  if (mutation === "minutes") row.items[0].actualMinutes = 40;
  if (mutation === "toggle") row.items[0].completed = true;
  if (mutation === "delete item") row.items = [];
  if (mutation === "delete record") delete state.records[date];
  if (mutation === "identity") row.items[0].id = "new";
  const before = await physical(database); await assert.rejects(saveActivePlannerV2({ repository, state })); assert.deepEqual(await physical(database), before);
});

test("unrelated notes/energy, other-item edits and unequivocal reorder retain audited identity and planning", async (t) => {
  const state = initial(); state.records[date].items.push(item("Other")); const { repository } = await setup(t, state);
  await rescheduleOccurrencePlanning({ repository, ...intent(await snapshot(repository)) });
  const before = await snapshot(repository), edited = structuredClone(before.backup.payload.planner);
  edited.records[date].note = "Allowed"; edited.records[date].energy = 5; edited.records[date].items[1].title = "Edited other"; edited.records[date].items.reverse();
  await saveActivePlannerV2({ repository, state: edited }); const bridge = (await snapshot(repository)).backup.payload.executionBridge.bridge;
  const audited = bridge.entries.find((entry) => entry.occurrenceId === "occ:1"); assert.equal(audited.itemIndex, 1);
  assert.deepEqual(audited.planningAudit, before.backup.payload.executionBridge.bridge.entries[0].planningAudit);
});

test("an old independent autosave retains new planning facts; it cannot undo completion", async (t) => {
  const { repository, name } = await setup(t), other = new IndexedDbPersistenceRepository(new DayforgeDatabase(name)); t.after(() => other.close());
  const stale = await snapshot(other); await rescheduleOccurrencePlanning({ repository, ...intent(stale) });
  const edited = structuredClone(stale.backup.payload.planner); edited.records[date].note = "Other tab note";
  await saveActivePlannerV2({ repository: other, state: edited, expectedAuthorityEpoch: stale.authorityEpoch });
  const saved = await snapshot(repository); assert.equal(context(saved).proximo.start, "20:00");
  await recordOccurrenceExecution({ repository, occurrenceId: "occ:1", execution: execution() });
  await assert.rejects(saveActivePlannerV2({ repository: other, state: edited, expectedAuthorityEpoch: stale.authorityEpoch }));
  assert.equal((await snapshot(repository)).backup.payload.executionBridge.bridge.entries[0].execution.id, "execution:occ:1");
});

test("replacement during hashing rejects rescheduling before any mutation; second append rollback preserves the first", async (t) => {
  const { repository, database } = await setup(t), before = await snapshot(repository), request = intent(before);
  let switched = false;
  const hasher = { async digestUtf8(text) {
    if (!switched) { switched = true; await restoreActivePlannerV2({ repository, input: JSON.stringify(before.backup), instant }); }
    return (await import("node:crypto")).createHash("sha256").update(text).digest("hex");
  } };
  await assert.rejects(rescheduleOccurrencePlanning({ repository, ...request, hasher }));
  assert.equal((await snapshot(repository)).backup.payload.executionBridge.bridge.entries[0].planningAudit, undefined);
  await rescheduleOccurrencePlanning({ repository, ...intent(await snapshot(repository)) });
  const once = await physical(database), second = intent(await snapshot(repository), { schedule: schedule(`${date}T22:00`, `${date}T23:00`) });
  await assert.rejects(rescheduleOccurrencePlanning({ repository, ...second, afterWriteForTest() { throw new Error("second rollback"); } }));
  assert.deepEqual(await physical(database), once);
});

test("two tied audited intervals order deterministically and no effective occurrence is duplicated", async (t) => {
  const state = initial(); state.records[date].items.push(item("Other")); const { repository } = await setup(t, state);
  const before = await snapshot(repository); await rescheduleOccurrencePlanning({ repository, ...intent(before) });
  const snap = await snapshot(repository), second = snap.backup.payload.executionBridge.bridge.entries[1];
  await rescheduleOccurrencePlanning({ repository, ...intent(snap), occurrenceId: second.occurrenceId, expectedRevision: occurrenceRevision(second), expectedHistoryLength: 0, previousSchedule: baseline });
  const view = context(await snapshot(repository)); assert.deepEqual([view.proximo.title, ...view.depois.map((entry) => entry.title)], ["Other", "Treino"]);
  assert.equal(new Set(view.items.map((entry) => entry.occurrenceId)).size, 2);
});

test("explicit recovered baseline with an empty chain supports first append and exact replay without reconfirming it", async (t) => {
  const { repository, database } = await setup(t); const snap = await snapshot(repository), bridge = snap.backup.payload.executionBridge.bridge;
  bridge.entries[0].planningAudit = { baselineItem: structuredClone(bridge.entries[0].item), baselineSchedule: baseline, confirmedAt: instant, rescheduleHistory: [] };
  await database.plannerDocuments.put(await createBridgeDocument(bridge));
  const request = intent(await snapshot(repository)); assert.equal(request.previousSchedule, undefined);
  await rescheduleOccurrencePlanning({ repository, ...request }); const once = await physical(database);
  await rescheduleOccurrencePlanning({ repository, ...request }); assert.deepEqual(await physical(database), once);
});

test("a recovered pre-2C-B minute estimate different from baseline remains intact and cannot break event replay", async (t) => {
  const { repository, database } = await setup(t); await rescheduleOccurrencePlanning({ repository, ...intent(await snapshot(repository)) });
  const snap = await snapshot(repository), bridge = snap.backup.payload.executionBridge.bridge;
  bridge.entries[0].planningAudit.baselineItem.actualMinutes = 999;
  await database.plannerDocuments.put(await createBridgeDocument(bridge));
  const request = intent(await snapshot(repository), { schedule: schedule(`${date}T22:00`, `${date}T23:00`) });
  await rescheduleOccurrencePlanning({ repository, ...request }); await recordOccurrenceExecution({ repository, occurrenceId: "occ:1", execution: execution() });
  const once = await physical(database); await rescheduleOccurrencePlanning({ repository, ...request }); assert.deepEqual(await physical(database), once);
});

test("an invalid decision instant is an action error with intact storage, never a structural block", async (t) => {
  const { repository, database } = await setup(t), request = intent(await snapshot(repository), { changedAt: "invalid" }), before = await physical(database);
  let published;
  await assert.rejects(persistRescheduling({ repository, ...request, publish(value) { published = value; } }), (error) => !error.blocked);
  assert.ok(published); assert.deepEqual(await physical(database), before);
});
