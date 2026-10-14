import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { DayforgeDatabase, IndexedDbPersistenceRepository, bootstrapPlannerV2, readPlannerAuthoritySnapshot,
  createCanonicalEvent, exportDayforgeBackup, restoreDayforgeBackupV2, resetPlannerV2, saveActivePlannerV2,
  PlanningConflictError, queryTemporalSnapshot, WebCryptoSha256Hasher, canonicalStringify } from "../persistence/index.ts";
import { createOccurrence, scheduleOccurrenceId, createTimedSchedule, createDateOnlySchedule, createAllDaySchedule } from "../domain/temporal/index.ts";
import { buildEventSchedule } from "../app/event-input.ts";
import { persistEventCreation } from "../app/event-command.ts";
import { PlannerWriteQueue } from "../app/planner-write-queue.ts";
import { readCivilDayWindow, deriveTodayContext } from "../app/today-context.ts";
import { PlannerDraftSession } from "../app/planner-draft-session.ts";
import { decodeExecutionBridge } from "../persistence/execution/bridge.ts";
import { parseUtcInstant, parseLocalDate } from "../domain/temporal/index.ts";

const instant = "2026-10-12T12:00:00.000Z", date = "2026-10-12";
const val = result => { assert.ok(result.ok); return result.value; };
const timed = () => val(createTimedSchedule({ startsAt: "2026-11-02T23:00:00.000Z", durationMinutes: 120, timeZone: "UTC" }));
const initial = () => ({ version: 1, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] },
  records: { [date]: { date, items: [{ id: "fictional", title: "Legado fictício", start: "08:00", end: "09:00", category: "estudo", notes: "", completed: false }], note: "Nota fictícia", energy: 3 } }, monthlyGoals: {} });
let sequence = 0;
async function setup(t) {
  const name = `agenda-events-${++sequence}`, db = new DayforgeDatabase(name), repo = new IndexedDbPersistenceRepository(db), other = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  t.after(async () => { repo.close(); other.close(); await Dexie.delete(name); });
  const state = initial(), raw = JSON.stringify(state), values = new Map([["rotina-369:data:v1", raw]]), writes = [];
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); writes.push(key); } };
  const boot = () => bootstrapPlannerV2({ repository: repo, legacyStorage: storage, markerStorage: storage, defaultState: state, instant });
  await boot();
  return { db, repo, other, state, raw, storage, writes, boot };
}
const read = repository => readPlannerAuthoritySnapshot({ repository, active: true, exportedAt: instant });
const physical = async db => ({ docs: await db.plannerDocuments.toArray(), metadata: await db.metadata.toArray() });
const fence = snapshot => ({ expectedAuthorityEpoch: snapshot.authorityEpoch, expectedDatasetRevision: snapshot.datasetRevision });
async function intent(f, schedule = timed()) {
  const s = await read(f.repo);
  return { ...fence(s), expectedSequence: s.backup.payload.executionBridge.bridge.nextSequence, creationIntentId: randomUUID(),
    title: "Evento fictício", flexibility: "fixed", schedule, createdAt: instant };
}
const canonical = snapshot => snapshot.backup.payload.executionBridge.bridge.entries.filter(entry => entry.kind === "canonical");
async function recoverFixtures(f, schedules) {
  const backup = (await read(f.repo)).backup, bridge = backup.payload.executionBridge.bridge;
  for (const schedule of schedules) {
    const occurrence = val(createOccurrence({ id: val(scheduleOccurrenceId(`occ:${bridge.nextSequence++}`)), source: {
      kind: "standalone", title: "Fixture recuperada", flexibility: "preferred", origin: { kind: "event" } }, schedule, createdAt: instant }));
    bridge.entries.push({ kind: "canonical", occurrence });
  }
  backup.payload.executionBridge.contentFingerprint = createHash("sha256").update(canonicalStringify(JSON.parse(JSON.stringify(bridge)))).digest("hex");
  await restoreDayforgeBackupV2({ repository: f.repo, backup, active: true });
}

test("Agenda creates timed with explicit semantics, reload and backup 3 round-trip", async t => {
  const f = await setup(t), before = await read(f.repo), beforeDocs = await physical(f.db);
  const schedule = timed();
  const command = await intent(f, schedule), occurrence = await createCanonicalEvent({ repository: f.repo, ...command }), after = await read(f.repo);
  assert.equal(occurrence.id, "occ:2"); assert.equal(occurrence.status, "planned"); assert.equal(occurrence.execution, null); assert.equal(occurrence.resolution, null);
  assert.deepEqual(occurrence.origin, { kind: "event" }); assert.equal(occurrence.templateId, null); assert.deepEqual(occurrence.rescheduleHistory, []);
  assert.equal(occurrence.createdAt, instant); assert.equal(occurrence.updatedAt, instant); assert.deepEqual(occurrence.originalSchedule, schedule); assert.deepEqual(occurrence.currentSchedule, schedule);
  assert.equal(after.datasetRevision, before.datasetRevision + 1); assert.equal(after.authorityEpoch, before.authorityEpoch); assert.equal(after.backup.payload.executionBridge.bridge.nextSequence, 3);
  assert.deepEqual(after.backup.payload.planner, before.backup.payload.planner); assert.deepEqual(after.backup.payload.provenance, before.backup.payload.provenance); assert.deepEqual(after.backup.payload.legacySources, before.backup.payload.legacySources);
  assert.deepEqual((await physical(f.db)).docs.filter(doc => doc.id !== "execution/bridge"), beforeDocs.docs.filter(doc => doc.id !== "execution/bridge"));
  const backup = await exportDayforgeBackup({ repository: f.repo, active: true, exportedAt: instant }); assert.equal(backup.formatVersion, 3);
  f.repo.close(); await f.boot(); assert.deepEqual(canonical(await read(f.repo)), canonical(after));
  await restoreDayforgeBackupV2({ repository: f.repo, backup, active: true, ...fence(after) }); assert.deepEqual((await read(f.repo)).backup.payload, backup.payload);
  await assert.rejects(createCanonicalEvent({ repository: f.repo, ...command }), PlanningConflictError);
  assert.equal(f.storage.getItem("rotina-369:data:v1"), f.raw); assert.ok(!f.writes.includes("rotina-369:data:v1"));
});

test("exact retry remains read-only after later revision; identical title/time is a distinct new event", async t => {
  const f = await setup(t), first = await intent(f);
  await createCanonicalEvent({ repository: f.repo, ...first });
  const second = await intent(f); await createCanonicalEvent({ repository: f.repo, ...second });
  const before = await physical(f.db); await createCanonicalEvent({ repository: f.repo, ...first }); assert.deepEqual(await physical(f.db), before);
  assert.deepEqual(canonical(await read(f.repo)).map(entry => entry.occurrence.id), ["occ:2", "occ:3"]);
  for (const change of [{ title: "Outra intenção" }, { flexibility: "flexible" }, { createdAt: "2026-10-12T12:00:01.000Z" }, { schedule: { ...first.schedule, durationMinutes: 30 } }]) {
    await assert.rejects(createCanonicalEvent({ repository: f.repo, ...first, ...change })); assert.deepEqual(await physical(f.db), before);
  }
});

test("independent equivalent writers allocate once and replay without increasing revision", async t => {
  const f = await setup(t), command = await intent(f), before = await read(f.repo);
  await Promise.all([createCanonicalEvent({ repository: f.repo, ...command }), createCanonicalEvent({ repository: f.other, ...command })]);
  const after = await read(f.repo); assert.equal(canonical(after).length, 1); assert.equal(after.datasetRevision, before.datasetRevision + 1);
});

test("different concurrent intents cannot reuse one allocator position", async t => {
  const f = await setup(t), command = await intent(f);
  const results = await Promise.allSettled([createCanonicalEvent({ repository: f.repo, ...command }), createCanonicalEvent({ repository: f.other, ...command, title: "Outra intenção fictícia" })]);
  assert.deepEqual(results.map(result => result.status).sort(), ["fulfilled", "rejected"]); assert.equal(canonical(await read(f.repo)).length, 1);
});

for (const action of ["autosave", "event", "restore", "reset"]) test(`captured creation cannot rebase after ${action} wins during hashing`, async t => {
  const f = await setup(t), command = await intent(f), before = await read(f.repo);
  let signal, release, first = true;
  const entered = new Promise(resolve => signal = resolve), barrier = new Promise(resolve => release = resolve);
  const hasher = { digestUtf8: async text => { if (first) { first = false; signal(); await barrier; } return new WebCryptoSha256Hasher().digestUtf8(text); } };
  const pending = createCanonicalEvent({ repository: f.repo, ...command, hasher }), rejected = assert.rejects(pending);
  await entered;
  if (action === "autosave") await saveActivePlannerV2({ repository: f.other, state: { ...f.state, monthlyGoals: { "2026-10": "Mudança fictícia" } }, ...fence(before) });
  if (action === "event") await createCanonicalEvent({ repository: f.other, ...command, title: "Intenção vencedora" });
  if (action === "restore") await restoreDayforgeBackupV2({ repository: f.other, backup: before.backup, active: true, ...fence(before) });
  if (action === "reset") await resetPlannerV2({ repository: f.other, markerStorage: f.storage, defaultState: f.state, instant, ...fence(before) });
  const winner = await physical(f.db); release(); await rejected; assert.deepEqual(await physical(f.db), winner);
});

for (const point of ["quota", "readback", "hook"]) test(`creation rolls back ${point}, preserves fields and permits explicit retry`, async t => {
  const f = await setup(t), command = await intent(f), before = await physical(f.db);
  const repository = { read: fn => f.repo.read(fn), write: fn => f.repo.write(tx => fn(new Proxy(tx, { get(target, key) {
    if (key === "putPlannerDocument" && point === "quota") return async () => { const error = new Error("Fixture quota"); error.name = "QuotaExceededError"; throw error; };
    if (key === "getPlannerDocument" && point === "readback") return async id => id === "execution/bridge" ? null : target.getPlannerDocument(id);
    return typeof target[key] === "function" ? target[key].bind(target) : target[key];
  } }))) };
  const published = [];
  if (point === "hook") await assert.rejects(createCanonicalEvent({ repository: f.repo, ...command, afterWriteForTest: () => { throw new Error("Fixture rollback"); } }));
  else await assert.rejects(persistEventCreation({ repository, ...command, publish: (...args) => published.push(args) }));
  assert.deepEqual(await physical(f.db), before);
  if (point !== "hook") { assert.equal(published.length, 1); assert.equal(published[0][1], false); }
  await createCanonicalEvent({ repository: f.repo, ...command }); assert.equal(canonical(await read(f.repo)).length, 1);
});

test("legacy and canonical producers share one allocator and preserve each other's facts", async t => {
  const f = await setup(t); await createCanonicalEvent({ repository: f.repo, ...await intent(f) });
  const before = await read(f.repo), state = structuredClone(f.state); state.records[date].items.push({ ...state.records[date].items[0], id: "new-fictional" });
  await saveActivePlannerV2({ repository: f.repo, state, ...fence(before) });
  await createCanonicalEvent({ repository: f.repo, ...await intent(f) });
  const bridge = (await read(f.repo)).backup.payload.executionBridge.bridge;
  assert.deepEqual(bridge.entries.map(entry => entry.kind === "canonical" ? entry.occurrence.id : entry.occurrenceId), ["occ:1", "occ:3", "occ:2", "occ:4"]); assert.equal(bridge.nextSequence, 5);
});

test("an old autosave in hash preparation cannot discard a newly created event", async t => {
  const f = await setup(t), before = await read(f.repo), command = await intent(f);
  let signal, release, first = true;
  const entered = new Promise(resolve => signal = resolve), barrier = new Promise(resolve => release = resolve);
  const hasher = { digestUtf8: async text => { if (first) { first = false; signal(); await barrier; } return new WebCryptoSha256Hasher().digestUtf8(text); } };
  const pending = saveActivePlannerV2({ repository: f.repo, state: { ...f.state, monthlyGoals: { "2026-10": "Rascunho antigo" } }, ...fence(before), hasher });
  const rejected = assert.rejects(pending, PlanningConflictError); await entered;
  await createCanonicalEvent({ repository: f.other, ...command }); const winner = await physical(f.db);
  release(); await rejected; assert.deepEqual(await physical(f.db), winner); assert.equal(canonical(await read(f.repo)).length, 1);
});

test("far-future independent event is queryable and readable in Hoje without any legacy daily record", async t => {
  const f = await setup(t); const empty = { version: 1, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] }, records: {}, monthlyGoals: {} };
  await resetPlannerV2({ repository: f.repo, markerStorage: f.storage, defaultState: empty, instant });
  const schedule = val(createTimedSchedule({ startsAt: "2040-02-29T20:00:00.000Z", durationMinutes: 60, timeZone: "UTC" }));
  await createCanonicalEvent({ repository: f.repo, ...await intent(f, schedule) }); const s = await read(f.repo), saved = await physical(f.db);
  assert.deepEqual(s.backup.payload.planner.legacy.records, {});
  const query = queryTemporalSnapshot({ planner: s.backup.payload.planner, registry: s.backup.payload.executionBridge.bridge,
    window: readCivilDayWindow("2040-02-29", "UTC"), referenceTime: instant, displayTimeZone: "UTC" });
  assert.equal(query.length, 1); assert.deepEqual(query[0].capabilities, { complete: false, reschedule: false });
  const today = deriveTodayContext(s.backup.payload.planner.legacy, new Date("2040-02-29T12:00:00.000Z"), "UTC", "2040-02-29", s.backup.payload.executionBridge.bridge);
  assert.equal(today.proximo.title, "Evento fictício"); assert.equal(today.proximo.category, null); assert.equal(today.proximo.actualMinutes, undefined);
  assert.deepEqual(await physical(f.db), saved);
});

test("revision overflow rolls back allocation and event together", async t => {
  const f = await setup(t); const metadata = await f.db.metadata.get("database"); await f.db.metadata.put({ ...metadata, datasetRevision: Number.MAX_SAFE_INTEGER });
  const command = await intent(f), before = await physical(f.db);
  await assert.rejects(createCanonicalEvent({ repository: f.repo, ...command })); assert.deepEqual(await physical(f.db), before);
});

test("reset replaces created events and rejects their old intents despite allocator reuse", async t => {
  const f = await setup(t), command = await intent(f); await createCanonicalEvent({ repository: f.repo, ...command }); const before = await read(f.repo);
  await resetPlannerV2({ repository: f.repo, markerStorage: f.storage, defaultState: f.state, instant, ...fence(before) });
  const replaced = await read(f.repo), saved = await physical(f.db); assert.equal(canonical(replaced).length, 0); assert.equal(replaced.authorityEpoch, before.authorityEpoch + 1);
  await assert.rejects(createCanonicalEvent({ repository: f.repo, ...command }), PlanningConflictError); assert.deepEqual(await physical(f.db), saved);
});

for (const change of [
  { title: " " }, { flexibility: "opportunistic" }, { createdAt: "invalid" }, { expectedSequence: Number.MAX_SAFE_INTEGER },
  { schedule: { ...timed(), timeZone: "+03:00" } }, { schedule: { ...timed(), timeZone: "Invalid/Zone" } },
  { schedule: { ...timed(), durationMinutes: 0 } }, { schedule: { ...timed(), extra: true } },
  { schedule: val(createDateOnlySchedule({ date, timeZone: "UTC" })) },
  { schedule: val(createAllDaySchedule({ startsOn: date, endsBefore: "2026-10-14", timeZone: "UTC" })) },
]) test(`strict creation rejects malformed input ${JSON.stringify(change)}`, async t => {
  const f = await setup(t), before = await physical(f.db), command = await intent(f);
  await assert.rejects(createCanonicalEvent({ repository: f.repo, ...command, ...change })); assert.deepEqual(await physical(f.db), before);
});

test("read-only query covers midnight, distant future, date-only and exclusive all-day end", async t => {
  const f = await setup(t);
  await createCanonicalEvent({ repository: f.repo, ...await intent(f) });
  await recoverFixtures(f, [val(createDateOnlySchedule({ date: "2026-11-03", timeZone: "UTC" })), val(createAllDaySchedule({ startsOn: "2026-11-02", endsBefore: "2026-11-04", timeZone: "UTC" }))]);
  const before = await physical(f.db), s = await read(f.repo);
  const query = day => queryTemporalSnapshot({ planner: s.backup.payload.planner, registry: s.backup.payload.executionBridge.bridge,
    window: readCivilDayWindow(day, "UTC"), referenceTime: instant, displayTimeZone: "UTC" }).filter(item => item.nature === "canonical");
  assert.equal(query("2026-11-02").length, 2); assert.equal(query("2026-11-03").length, 3); assert.equal(query("2026-11-04").length, 0);
  assert.equal(query("2030-01-01").length, 0); assert.deepEqual(await physical(f.db), before);
});

test("UI factories reject ambiguous/nonexistent times, implicit rollover and offsets", () => {
  const input = { kind: "timed", start: "2026-11-02T23:00", end: "2026-11-03T01:00", timeZone: "UTC" };
  assert.equal(buildEventSchedule(input).durationMinutes, 120);
  for (const change of [{ end: "2026-11-02T01:00" }, { timeZone: "+03:00" },
    { start: "2026-03-08T02:30", end: "2026-03-08T04:00", timeZone: "America/New_York" },
    { start: "2026-11-01T01:30", end: "2026-11-01T03:00", timeZone: "America/New_York" }]) assert.throws(() => buildEventSchedule({ ...input, ...change }));
  assert.equal(Date.parse(readCivilDayWindow("2026-03-08", "America/New_York").endsBefore) - Date.parse(readCivilDayWindow("2026-03-08", "America/New_York").startsAt), 23 * 3600000);
  assert.equal(Date.parse(readCivilDayWindow("2026-11-01", "America/New_York").endsBefore) - Date.parse(readCivilDayWindow("2026-11-01", "America/New_York").startsAt), 25 * 3600000);
});

test("one application queue coalesces equivalent creation and continues after failures", async () => {
  const queue = new PlannerWriteQueue(); let release, runs = 0;
  const barrier = new Promise(resolve => release = resolve), intent = { createdAt: instant };
  const first = queue.command("occ:1", intent, async () => { runs++; await barrier; });
  assert.equal(queue.command("occ:1", intent, async () => runs++), first);
  await assert.rejects(queue.command("occ:1", { createdAt: "other" }, async () => runs++)); release(); await first; assert.equal(runs, 1);
  await assert.rejects(queue.command("occ:2", intent, async () => { throw new Error("Fixture failure"); }));
  await queue.command("occ:2", intent, async () => runs++); assert.equal(runs, 2);
});

test("independent identical intentions at the same allocator and millisecond never share replay ownership", async t => {
  const f = await setup(t), a = await intent(f), b = await intent(f), before = await read(f.repo);
  assert.notEqual(a.creationIntentId, b.creationIntentId);
  const outcomes = await Promise.allSettled([createCanonicalEvent({ ...a, repository: f.repo }), createCanonicalEvent({ ...b, repository: f.other })]);
  assert.deepEqual(outcomes.map(o => o.status).sort(), ["fulfilled", "rejected"]);
  const once = await read(f.repo); assert.equal(canonical(once).length, 1); assert.equal(once.datasetRevision, before.datasetRevision + 1);
  const saved = await physical(f.db), winner = outcomes[0].status === "fulfilled" ? a : b, loser = winner === a ? b : a;
  assert.equal(canonical(once)[0].creationIntentId, winner.creationIntentId);
  await assert.rejects(createCanonicalEvent({ ...loser, repository: f.repo })); assert.deepEqual(await physical(f.db), saved);
  await createCanonicalEvent({ ...await intent(f), repository: f.other });
  f.repo.close(); const reopened = await read(f.repo);
  assert.deepEqual(canonical(reopened).map(e => e.occurrence.id), ["occ:2", "occ:3"]);
  assert.equal(new Set(canonical(reopened).map(e => e.creationIntentId)).size, 2);
  const backup = await exportDayforgeBackup({ repository: f.repo, active: true, exportedAt: instant });
  await restoreDayforgeBackupV2({ repository: f.repo, backup, active: true });
  assert.deepEqual(canonical(await read(f.repo)), canonical(reopened));
});

test("creation receipt cannot be forged, reused for a new allocation or attached retroactively", async t => {
  const f = await setup(t), original = await intent(f); await createCanonicalEvent({ ...original, repository: f.repo });
  const before = await physical(f.db);
  for (const change of [{ creationIntentId: randomUUID() }, { creationIntentId: undefined }, { creationIntentId: "invalid" }, { title: "Divergência" }, { createdAt: "2026-10-12T13:00:00.000Z" }]) {
    await assert.rejects(createCanonicalEvent({ ...original, ...change, repository: f.other })); assert.deepEqual(await physical(f.db), before);
  }
  await assert.rejects(createCanonicalEvent({ ...await intent(f), creationIntentId: original.creationIntentId, repository: f.repo }));
  assert.deepEqual(await physical(f.db), before);
  const historical = (await read(f.repo)).backup, bridge = historical.payload.executionBridge.bridge;
  delete bridge.entries.find(e => e.kind === "canonical").creationIntentId;
  historical.payload.executionBridge.contentFingerprint = createHash("sha256").update(canonicalStringify(bridge)).digest("hex");
  await restoreDayforgeBackupV2({ repository: f.repo, backup: historical, active: true });
  const legacy = await read(f.repo), saved = await physical(f.db);
  assert.equal(Object.hasOwn(canonical(legacy)[0], "creationIntentId"), false);
  await assert.rejects(createCanonicalEvent({ ...original, ...fence(legacy), repository: f.other }));
  assert.deepEqual(await physical(f.db), saved);
  const exported = await exportDayforgeBackup({ repository: f.repo, active: true, exportedAt: instant });
  assert.equal(Object.hasOwn(exported.payload.executionBridge.bridge.entries.find(e => e.kind === "canonical"), "creationIntentId"), false);
});

test("strict registry rejects malformed and duplicate receipts without weakening historical codecs", async t => {
  const f = await setup(t); await createCanonicalEvent({ ...await intent(f), repository: f.repo }); await createCanonicalEvent({ ...await intent(f), repository: f.repo });
  const backup = (await read(f.repo)).backup;
  for (const change of ["duplicate", "invalid", "extra", "null"]) {
    const bridge = structuredClone(backup.payload.executionBridge.bridge), complete = bridge.entries.filter(e => e.kind === "canonical");
    if (change === "duplicate") complete[1].creationIntentId = complete[0].creationIntentId;
    if (change === "invalid") complete[0].creationIntentId = "00000000-0000-0000-0000-000000000000";
    if (change === "extra") complete[0].technicalExtra = true;
    if (change === "null") complete[0].creationIntentId = null;
    assert.throws(() => decodeExecutionBridge(bridge, backup.payload.planner.legacy));
  }
});

const repositoryProxy = (repo, overrides) => ({ open: () => repo.open(), close: () => repo.close(), read: fn => repo.read(fn), write: fn => repo.write(fn), ...overrides });
for (const rejection of [undefined, null, false, 0, ""]) test(`falsy rejection ${JSON.stringify(rejection)} preserves the form session and allows unchanged retry`, async t => {
  const f = await setup(t), command = await intent(f), before = await physical(f.db), snapshot = await read(f.repo);
  const session = new PlannerDraftSession({ state: f.state, executionBridge: snapshot.backup.payload.executionBridge.bridge, authorityEpoch: snapshot.authorityEpoch, datasetRevision: snapshot.datasetRevision }); session.beginEditing();
  const publish = (next, applied) => { assert.equal(applied, false); session.observe(next); };
  await assert.rejects(persistEventCreation({ ...command, repository: repositoryProxy(f.repo, { write: async () => { throw rejection; } }), publish }), /Não foi possível confirmar/);
  assert.equal(session.remote, null); assert.equal(session.openEditors, 1); assert.deepEqual(await physical(f.db), before);
  f.repo.close(); assert.equal(canonical(await read(f.repo)).length, 0);
  await persistEventCreation({ ...command, repository: f.repo, publish: (next, applied) => { assert.equal(applied, true); session.load(next); } });
  assert.equal(canonical(await read(f.repo))[0].creationIntentId, command.creationIntentId); assert.equal(session.remote, null);
});

for (const rejection of [new Error("Resposta perdida após commit"), undefined, false]) test(`real commit followed by lost response ${String(rejection)} is reconciled by its receipt`, async t => {
  const f = await setup(t), command = await intent(f), before = await read(f.repo);
  const session = new PlannerDraftSession({ state: f.state, executionBridge: before.backup.payload.executionBridge.bridge, authorityEpoch: before.authorityEpoch, datasetRevision: before.datasetRevision }); session.beginEditing();
  await persistEventCreation({ ...command, repository: repositoryProxy(f.repo, { write: async fn => { await f.repo.write(fn); throw rejection; } }),
    publish: (next, applied) => { assert.equal(applied, true); session.load(next); } });
  const once = await read(f.repo); assert.equal(canonical(once).length, 1); assert.equal(once.datasetRevision, before.datasetRevision + 1); assert.equal(session.remote, null);
  const saved = await physical(f.db);
  await persistEventCreation({ ...command, repository: f.other, publish: (_next, applied) => assert.equal(applied, true) });
  assert.deepEqual(await physical(f.db), saved);
  f.repo.close(); assert.equal(canonical(await read(f.repo))[0].creationIntentId, command.creationIntentId);
});

test("reconciliation never claims another intent's event and preserves an open editor", async t => {
  const f = await setup(t), own = await intent(f), other = await intent(f), before = await read(f.repo);
  const session = new PlannerDraftSession({ state: f.state, executionBridge: before.backup.payload.executionBridge.bridge, authorityEpoch: before.authorityEpoch, datasetRevision: before.datasetRevision }); session.beginEditing();
  await createCanonicalEvent({ ...other, repository: f.other }); const saved = await physical(f.db);
  await assert.rejects(persistEventCreation({ ...own, repository: f.repo, publish: (next, applied) => { assert.equal(applied, false); session.observe(next); } }));
  assert.ok(session.remote); assert.equal(session.openEditors, 1); assert.deepEqual(await physical(f.db), saved);
});

test("a resolved response without the authoritative receipt cannot announce success", async t => {
  const f = await setup(t), command = await intent(f), before = await physical(f.db);
  await assert.rejects(persistEventCreation({ ...command, repository: repositoryProxy(f.repo, { write: async () => undefined }), publish: (_snapshot, applied) => assert.equal(applied, false) }), /Não foi possível comprovar/);
  assert.deepEqual(await physical(f.db), before);
});

test("upper calendar read boundaries preserve December 9999 and strict persisted instants", async t => {
  const f = await setup(t), schedule = val(createTimedSchedule({ startsAt: "9999-12-31T23:30:00.000Z", durationMinutes: 90, timeZone: "UTC" }));
  await createCanonicalEvent({ ...await intent(f, schedule), repository: f.repo });
  await recoverFixtures(f, [val(createDateOnlySchedule({ date: "9999-12-31", timeZone: "UTC" })), val(createAllDaySchedule({ startsOn: "9999-12-30", endsBefore: "9999-12-31", timeZone: "UTC" }))]);
  const s = await read(f.repo), saved = await physical(f.db);
  const query = (date, zone = "UTC") => queryTemporalSnapshot({ planner: s.backup.payload.planner, registry: s.backup.payload.executionBridge.bridge, window: readCivilDayWindow(date, zone), referenceTime: instant, displayTimeZone: zone }).filter(e => e.nature === "canonical");
  assert.equal(query("9999-11-30").length, 0); assert.equal(query("9999-12-30").length, 1); assert.equal(query("9999-12-31").length, 2);
  assert.equal(readCivilDayWindow("9999-12-31", "UTC").endsBefore, "+010000-01-01T00:00:00.000Z");
  assert.equal(query("9999-12-31", "America/New_York").filter(e => e.planning.kind === "timed").length, 1);
  assert.equal(parseUtcInstant("+010000-01-01T00:00:00.000Z").ok, false); assert.equal(parseLocalDate("10000-01-01").ok, false);
  assert.throws(() => readCivilDayWindow("10000-01-01", "UTC")); assert.deepEqual(await physical(f.db), saved);
});
