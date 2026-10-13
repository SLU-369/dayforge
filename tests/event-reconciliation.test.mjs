import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Dexie from "dexie";
import { DayforgeDatabase, IndexedDbPersistenceRepository, bootstrapPlannerV2, readPlannerAuthoritySnapshot,
  createCanonicalEvent, saveActivePlannerV2, recordOccurrenceExecution, resetPlannerV2, restoreDayforgeBackupV2,
  PlanningConflictError } from "../persistence/index.ts";
import { createTimedSchedule } from "../domain/temporal/index.ts";
import { createBridgeDocument } from "../persistence/execution/bridge.ts";
import { persistEventCreation } from "../app/event-command.ts";
import { PlannerDraftSession } from "../app/planner-draft-session.ts";
import { buildCompletionRecord } from "../app/completion-input.ts";

const instant = "2026-10-12T12:00:00.000Z", date = "2026-10-12";
const initial = () => ({ version: 1, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] }, monthlyGoals: {},
  records: { [date]: { date, note: "Original", energy: 3, items: [{ id: "legacy", title: "Legado", start: "08:00", end: "09:00", category: "estudo", completed: false, notes: "" }] } } });
const read = repository => readPlannerAuthoritySnapshot({ repository, active: true, exportedAt: instant });
const fence = s => ({ expectedAuthorityEpoch: s.authorityEpoch, expectedDatasetRevision: s.datasetRevision });
const events = s => s.backup.payload.executionBridge.bridge.entries.filter(e => e.kind === "canonical");
const physical = async db => ({ documents: await db.plannerDocuments.toArray(), metadata: await db.metadata.toArray() });
const ui = s => ({ state: s.backup.payload.planner.legacy, executionBridge: s.backup.payload.executionBridge.bridge, authorityEpoch: s.authorityEpoch, datasetRevision: s.datasetRevision });
async function fixture(t) {
  const name = `event-reconciliation-${randomUUID()}`, db = new DayforgeDatabase(name);
  const repo = new IndexedDbPersistenceRepository(db), other = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  t.after(async () => { repo.close(); other.close(); await Dexie.delete(name); });
  const values = new Map([["rotina-369:data:v1", JSON.stringify(initial())]]);
  const storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
  await bootstrapPlannerV2({ repository: repo, legacyStorage: storage, markerStorage: storage, defaultState: initial(), instant });
  return { repo, other, db, storage };
}
async function intent(repo) {
  const s = await read(repo), schedule = createTimedSchedule({ startsAt: "2026-11-02T23:00:00.000Z", durationMinutes: 120, timeZone: "UTC" });
  assert.ok(schedule.ok);
  return { ...fence(s), creationIntentId: randomUUID(), expectedSequence: s.backup.payload.executionBridge.bridge.nextSequence,
    title: "Dados idênticos", flexibility: "fixed", schedule: schedule.value, createdAt: instant };
}
function barrier() {
  let entered, release;
  return { entered: new Promise(r => entered = r), released: new Promise(r => release = r), enter: () => entered(), release: () => release() };
}
/** Suspend OUTSIDE the transaction: real IndexedDB snapshot/commit semantics remain intact. */
function lostReply(repo, gate, position) {
  let committed = false, reads = 0;
  return { open: () => repo.open(), close: () => repo.close(), write: async fn => { await repo.write(fn); committed = true; throw undefined; },
    read: async fn => {
      const number = committed ? ++reads : 0;
      if (position?.number === number && position.phase === "before") { gate.enter(); await gate.released; }
      const captured = await repo.read(fn);
      if (position?.number === number && position.phase === "after") { gate.enter(); await gate.released; }
      return captured;
    } };
}
async function verifyReopen(f, own, count, revision) {
  const saved = await physical(f.db); f.repo.close();
  const snapshot = await read(f.repo);
  assert.equal(events(snapshot).length, count); assert.equal(snapshot.datasetRevision, revision);
  assert.equal(events(snapshot).filter(e => e.creationIntentId === own.creationIntentId).length, 1);
  assert.deepEqual(await physical(f.db), saved);
  return snapshot;
}
for (const scenario of [
  { id: "C1", lost: false }, { id: "C2", lost: true },
  { id: "C3", lost: true, number: 1, phase: "before", mutation: "event" },
  { id: "C4", lost: true, number: 1, phase: "after", mutation: "event" },
  { id: "C5", lost: true, number: 2, phase: "before", mutation: "event" },
  { id: "C6", lost: true, number: 1, phase: "after", mutation: "autosave" },
  { id: "C7", lost: true, number: 1, phase: "after", mutation: "completion" },
]) test(`${scenario.id}: own committed fact survives ${scenario.mutation ?? (scenario.lost ? "lost response" : "normal confirmation")}`, async t => {
  const f = await fixture(t), own = await intent(f.repo), before = await read(f.repo), gate = barrier(); let published;
  const work = persistEventCreation({ ...own, repository: scenario.lost ? lostReply(f.repo, gate, scenario.number ? scenario : null) : f.repo,
    publish: (s, applied) => { assert.equal(applied, true); published = s; } });
  if (scenario.mutation) {
    await gate.entered;
    if (scenario.mutation === "event") await createCanonicalEvent({ ...await intent(f.other), repository: f.other });
    else if (scenario.mutation === "autosave") {
      const s = await read(f.other), state = structuredClone(s.backup.payload.planner.legacy); state.records[date].note = "Nota concorrente";
      await saveActivePlannerV2({ repository: f.other, state, ...fence(s) });
    } else {
      const s = await read(f.other);
      await recordOccurrenceExecution({ repository: f.other, occurrenceId: "occ:1", ...fence(s),
        execution: buildCompletionRecord("occ:1", { start: `${date}T08:00`, end: `${date}T08:30`, timeZone: "UTC", note: "" }, instant) });
    }
    gate.release();
  }
  await work;
  const after = await verifyReopen(f, own, scenario.mutation === "event" ? 2 : 1, before.datasetRevision + (scenario.mutation ? 2 : 1));
  assert.deepEqual(published, ui(after));
  const saved = await physical(f.db); await createCanonicalEvent({ ...own, repository: f.other }); assert.deepEqual(await physical(f.db), saved);
});

test("C5 late: mutation after witness capture cannot revoke fact; next read observes it without replay writes", async t => {
  const f = await fixture(t), own = await intent(f.repo), before = await read(f.repo), gate = barrier(); let published;
  const work = persistEventCreation({ ...own, repository: lostReply(f.repo, gate, { number: 2, phase: "after" }), publish: (s, applied) => { assert.equal(applied, true); published = s; } });
  await gate.entered; await createCanonicalEvent({ ...await intent(f.other), repository: f.other }); gate.release(); await work;
  assert.equal(published.datasetRevision, before.datasetRevision + 1); // B linearizes after the witness.
  const latest = await verifyReopen(f, own, 2, before.datasetRevision + 2), saved = await physical(f.db);
  await persistEventCreation({ ...own, allowNewWrite: false, repository: f.repo, publish: (s, applied) => { assert.equal(applied, true); assert.deepEqual(s, ui(latest)); } });
  assert.deepEqual(await physical(f.db), saved);
});

for (const operation of ["reset", "restore"]) for (const number of [1, 2]) test(`C8: ${operation} after capture ${number} replaces authority, never confirms old receipt`, async t => {
  const f = await fixture(t), own = await intent(f.repo), before = await read(f.repo), gate = barrier();
  const work = persistEventCreation({ ...own, repository: lostReply(f.repo, gate, { number, phase: "after" }), publish: (_s, applied) => assert.equal(applied, false) });
  const rejected = assert.rejects(work, /substituídos/);
  await gate.entered;
  const current = await read(f.other);
  if (operation === "reset") await resetPlannerV2({ repository: f.other, markerStorage: f.storage, defaultState: initial(), instant, ...fence(current) });
  else await restoreDayforgeBackupV2({ repository: f.other, backup: current.backup, active: true, ...fence(current) });
  gate.release(); await rejected;
  const after = await read(f.repo); assert.equal(after.authorityEpoch, before.authorityEpoch + 1); assert.equal(after.datasetRevision, before.datasetRevision + 2);
  const saved = await physical(f.db); await assert.rejects(createCanonicalEvent({ ...own, repository: f.repo }), PlanningConflictError);
  assert.deepEqual(await physical(f.db), saved); f.repo.close(); assert.deepEqual((await read(f.repo)).backup.payload, after.backup.payload);
});

test("C9: identical payload with another receipt cannot claim success or bypass read-only mode", async t => {
  const f = await fixture(t), own = await intent(f.repo), other = { ...own, creationIntentId: randomUUID() };
  await createCanonicalEvent({ ...other, repository: f.other }); const saved = await physical(f.db);
  await assert.rejects(persistEventCreation({ ...own, allowNewWrite: false, repository: f.repo, publish: (_s, applied) => assert.equal(applied, false) }), PlanningConflictError);
  assert.deepEqual(await physical(f.db), saved); f.repo.close(); assert.equal(events(await read(f.repo))[0].creationIntentId, other.creationIntentId);
});

for (const mode of ["absent", "different", "wrong-fact", "invalid-hash", "duplicate"]) test(`C10: ${mode} receipt fails closed without any mutation`, async t => {
  const f = await fixture(t), own = await intent(f.repo); await createCanonicalEvent({ ...own, repository: f.repo });
  const s = await read(f.repo), bridge = structuredClone(s.backup.payload.executionBridge.bridge), entry = bridge.entries.find(e => e.kind === "canonical");
  if (mode === "absent") delete entry.creationIntentId;
  if (mode === "different") entry.creationIntentId = randomUUID();
  if (mode === "wrong-fact") entry.occurrence.title = "Fato adulterado";
  if (mode === "duplicate") { const copy = structuredClone(entry); copy.occurrence.id = `occ:${bridge.nextSequence++}`; bridge.entries.push(copy); }
  // Privileged corruption fixture; no product command can edit these immutable facts.
  const document = await createBridgeDocument(bridge);
  if (mode === "invalid-hash") document.sourceContentFingerprint = "0".repeat(64);
  await f.repo.write(tx => tx.putPlannerDocument(document)); const saved = await physical(f.db);
  let successes = 0;
  await assert.rejects(persistEventCreation({ ...own, allowNewWrite: false, repository: f.repo, publish: (_s, applied) => successes += Number(applied) }));
  assert.equal(successes, 0); assert.deepEqual(await physical(f.db), saved);
  f.repo.close(); await f.repo.open(); assert.deepEqual(await physical(f.db), saved);
});

test("C11: direct retry after later events reconciles through another concurrent mutation with no write", async t => {
  const f = await fixture(t), own = await intent(f.repo); await createCanonicalEvent({ ...own, repository: f.repo });
  await createCanonicalEvent({ ...await intent(f.other), repository: f.other });
  const gate = barrier(); let reads = 0;
  const repository = { open: () => f.repo.open(), close: () => f.repo.close(), write: () => assert.fail("Replay must not write"),
    read: async fn => { const captured = await f.repo.read(fn); if (++reads === 2) { gate.enter(); await gate.released; } return captured; } };
  const work = createCanonicalEvent({ ...own, repository }); await gate.entered;
  const before = await read(f.other); await createCanonicalEvent({ ...await intent(f.other), repository: f.other }); gate.release(); await work;
  await verifyReopen(f, own, 3, before.datasetRevision + 1);
});

for (const draft of [false, true]) test(`C12: remote-conflicted UI ${draft ? "preserves unrelated draft" : "acknowledges own fact"} in read-only mode`, async t => {
  const f = await fixture(t), own = await intent(f.repo), original = await read(f.repo), session = new PlannerDraftSession(ui(original)); session.beginEditing();
  if (draft) session.edit(s => ({ ...s, records: { ...s.records, [date]: { ...s.records[date], note: "Rascunho não relacionado" } } }));
  await createCanonicalEvent({ ...own, repository: f.other }); await createCanonicalEvent({ ...await intent(f.other), repository: f.other });
  session.observe(ui(await read(f.other))); assert.ok(session.remote);
  const saved = await physical(f.db), repository = { open: () => f.repo.open(), close: () => f.repo.close(), read: fn => f.repo.read(fn), write: () => assert.fail("Conflicted session cannot write") };
  await persistEventCreation({ ...own, allowNewWrite: false, repository, publish: (s, applied) => { assert.equal(applied, true); session.confirmedEvent(s); } });
  assert.deepEqual(await physical(f.db), saved); assert.equal(session.openEditors, 1);
  if (draft) { assert.equal(session.state.records[date].note, "Rascunho não relacionado"); assert.equal(session.dirty, true); assert.ok(session.remote); assert.deepEqual(session.fence, fence(original)); }
  else { assert.equal(session.remote, null); assert.deepEqual(session.persisted, ui(await read(f.repo))); }
  const uncommitted = await intent(f.repo);
  await assert.rejects(persistEventCreation({ ...uncommitted, allowNewWrite: false, repository, publish: (_s, applied) => assert.equal(applied, false) }), PlanningConflictError);
  assert.deepEqual(await physical(f.db), saved);
});

test("confirming an event preserves another open editor and a newer observed authority", async t => {
  const f = await fixture(t), old = ui(await read(f.repo)), session = new PlannerDraftSession(old); session.beginEditing(); session.beginEditing();
  await createCanonicalEvent({ ...await intent(f.repo), repository: f.repo }); const next = ui(await read(f.repo));
  session.confirmedEvent(next); assert.deepEqual(session.persisted, old); assert.deepEqual(session.remote, next); assert.equal(session.openEditors, 2);
  session.endEditing(); session.remote = { ...next, datasetRevision: next.datasetRevision + 1 };
  session.confirmedEvent(next); assert.deepEqual(session.persisted, old); assert.equal(session.remote.datasetRevision, next.datasetRevision + 1);
});
