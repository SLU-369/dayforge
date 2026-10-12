import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import Dexie from "dexie";
import { DayforgeDatabase, IndexedDbPersistenceRepository, bootstrapPlannerV2, readPlannerAuthoritySnapshot,
  saveActivePlannerV2, restoreActivePlannerV2, resetPlannerV2, exportDayforgeBackupV2, recordOccurrenceExecution,
  rescheduleOccurrencePlanning, occurrenceRevision, datasetRevision, nextDatasetRevision,
  assertPlanningFence, PlanningConflictError, PersistenceValidationError, createDatabaseMetadata, decodeDatabaseMetadata,
  WebCryptoSha256Hasher } from "../persistence/index.ts";
import { buildCompletionRecord } from "../app/completion-input.ts";
import { buildPlanningSchedule } from "../app/rescheduling-input.ts";
import { PlannerDraftSession } from "../app/planner-draft-session.ts";
const date = "2026-10-11", instant = `${date}T12:00:00.000Z`;
const item = { id: "ficticio", title: "Atividade fictícia", start: "08:00", end: "09:00", category: "estudo", notes: "", completed: false };
const initial = () => ({ version: 1, routine: { seg: [{ ...item, completed: undefined }], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] },
  records: { [date]: { date, items: [{ ...item }], note: "", energy: 3 } }, monthlyGoals: {} });
let sequence = 0;
async function setup(t) {
  const name = `planning-fences-${++sequence}`, db = new DayforgeDatabase(name), repo = new IndexedDbPersistenceRepository(db);
  const other = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  t.after(async () => { repo.close(); other.close(); await Dexie.delete(name); });
  const state = JSON.parse(JSON.stringify(initial())), raw = JSON.stringify(state), values = new Map([["rotina-369:data:v1", raw]]), writes = [];
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key,value) => { writes.push(key); values.set(key,value); } };
  const boot = () => bootstrapPlannerV2({ repository: repo, legacyStorage: storage, markerStorage: storage, defaultState: state, instant });
  await boot(); return { name, db, repo, other, state, raw, storage, writes, boot };
}
const read = (repo) => readPlannerAuthoritySnapshot({ repository: repo, exportedAt: instant, active: true });
const fence = (s) => ({ expectedAuthorityEpoch: s.authorityEpoch, expectedDatasetRevision: s.datasetRevision });
const physical = async (db) => ({ docs: await db.plannerDocuments.toArray(), metadata: await db.metadata.toArray() });
const view = (s) => ({ state: s.backup.payload.planner, executionBridge: s.backup.payload.executionBridge.bridge, authorityEpoch: s.authorityEpoch, datasetRevision: s.datasetRevision });
const edit = (s) => structuredClone(s.backup.payload.planner);
const save = (repo,state,s) => saveActivePlannerV2({ repository: repo, state, ...fence(s) });
function execution(s) { return buildCompletionRecord(s.backup.payload.executionBridge.bridge.entries[0].occurrenceId,
  { start: `${date}T08:10`, end: `${date}T08:50`, timeZone: "UTC", note: "" }, instant); }
function rescheduling(s) { const b = s.backup.payload.executionBridge.bridge.entries[0]; return { occurrenceId: b.occurrenceId, ...fence(s),
  expectedRevision: occurrenceRevision(b), expectedHistoryLength: 0, changedAt: instant,
  previousSchedule: buildPlanningSchedule({ start: `${date}T08:00`, end: `${date}T09:00`, timeZone: "UTC" }),
  schedule: buildPlanningSchedule({ start: `${date}T20:00`, end: `${date}T21:00`, timeZone: "UTC" }) }; }

test("initial revision is deterministic; validation separates invalid metadata from editing conflicts", () => {
  const m = createDatabaseMetadata(); assert.equal(datasetRevision(m), 0); assert.equal(nextDatasetRevision(m), 1);
  assertPlanningFence(m, { expectedAuthorityEpoch: 0, expectedDatasetRevision: 0 });
  for (const f of [{ expectedAuthorityEpoch: 1, expectedDatasetRevision: 0 }, { expectedAuthorityEpoch: 0, expectedDatasetRevision: 1 }]) {
    assert.throws(() => assertPlanningFence(m,f), (e) => e instanceof PlanningConflictError && !(e instanceof PersistenceValidationError));
  }
  for (const extra of [{ datasetRevision: 0 }, { writeFenceVersion: 1 }, { writeFenceVersion: 2, datasetRevision: 0 },
    { writeFenceVersion: 1, datasetRevision: -1 }, { writeFenceVersion: 1, datasetRevision: 1.5 }]) assert.throws(() => decodeDatabaseMetadata({ ...m, ...extra }), PersistenceValidationError);
});
test("old metadata adoption starts at zero and is idempotent without modifying logical facts", async (t) => {
  const f = await setup(t), s = await read(f.repo); const m = await f.db.metadata.get("database"); delete m.datasetRevision; delete m.writeFenceVersion;
  await f.db.metadata.put(m); await f.boot(); const a = await read(f.repo);
  assert.equal(a.datasetRevision,0); assert.deepEqual(a.backup.payload,s.backup.payload);
  const once = await physical(f.db); await f.boot(); await read(f.repo); assert.deepEqual(await physical(f.db),once);
});
for (const kind of ["routine","note","energy","monthlyGoal","newItem","itemEdit"]) test(`one atomic increment for ${kind}; unchanged saves and reads stay stable`, async (t) => {
  const f = await setup(t), s = await read(f.repo), state = edit(s);
  if (kind === "routine") state.routine.seg[0].title = "Rotina A";
  if (kind === "note") state.records[date].note = "Nota A";
  if (kind === "energy") state.records[date].energy = 4;
  if (kind === "monthlyGoal") state.monthlyGoals["2026-10"] = "Meta A";
  if (kind === "newItem") state.records[date].items.push({ ...item,id:"novo" });
  if (kind === "itemEdit") state.records[date].items[0].title = "Editado";
  await save(f.repo,state,s); const changed = await read(f.repo); assert.equal(changed.datasetRevision,s.datasetRevision+1);
  assert.equal(changed.authorityEpoch,s.authorityEpoch); await save(f.repo,state,changed);
  assert.equal((await read(f.other)).datasetRevision,changed.datasetRevision); assert.equal(f.storage.getItem("rotina-369:data:v1"),f.raw);
  assert.ok(!f.writes.includes("rotina-369:data:v1"));
});
test("mandatory A routine / B monthly goal conflict preserves winner and draft; explicit resolution preserves both", async (t) => {
  const f = await setup(t), a = await read(f.repo), b = await read(f.other), sa = edit(a), sb = edit(b);
  sa.routine.seg[0].title = "Rotina vencedora"; sb.monthlyGoals["2026-10"] = "Meta local B";
  const session = new PlannerDraftSession(view(b)); session.edit(sb);
  await save(f.repo,sa,a); const before = await physical(f.db);
  await assert.rejects(save(f.other,sb,b), PlanningConflictError); assert.deepEqual(await physical(f.db),before);
  const latest = await read(f.other); session.observe(view(latest)); assert.equal(session.state.monthlyGoals["2026-10"],"Meta local B");
  assert.equal(latest.backup.payload.planner.routine.seg[0].title,"Rotina vencedora"); assert.equal(latest.backup.payload.planner.monthlyGoals["2026-10"],undefined);
  const savedDraft = session.state.monthlyGoals["2026-10"]; session.load(view(latest)); session.edit((state) => ({ ...state, monthlyGoals: { "2026-10":savedDraft } }));
  await save(f.other,session.state,latest); const done = await read(f.repo);
  assert.equal(done.backup.payload.planner.routine.seg[0].title,"Rotina vencedora"); assert.equal(done.backup.payload.planner.monthlyGoals["2026-10"],"Meta local B");
});
test("two concurrent independent writers have one winner and a recoverable loser", async (t) => {
  const f = await setup(t), s = await read(f.repo), a = edit(s), b = edit(s); a.monthlyGoals.a="A"; b.monthlyGoals.b="B";
  const results=await Promise.allSettled([save(f.repo,a,s),save(f.other,b,s)]);
  assert.equal(results.filter((r)=>r.status==="fulfilled").length,1);
  assert.ok(results.find((r)=>r.status==="rejected").reason instanceof PlanningConflictError);
  assert.equal((await read(f.repo)).datasetRevision,s.datasetRevision+1);
});
test("a change after hash preparation is caught inside the write transaction", async (t) => {
  const f=await setup(t),s=await read(f.repo),a=edit(s),b=edit(s); a.monthlyGoals.a="A"; b.monthlyGoals.b="B";
  let release,entered; const gate=new Promise((r)=>release=r), ready=new Promise((r)=>entered=r); const real=new WebCryptoSha256Hasher(); let first=true;
  const hasher={ digestUtf8:async (value)=>{ if(first){first=false;entered();await gate;} return real.digestUtf8(value); } };
  const pending=saveActivePlannerV2({ repository:f.other,state:b,...fence(s),hasher }); await ready;
  await save(f.repo,a,s); const winner=await physical(f.db); release(); await assert.rejects(pending,PlanningConflictError);
  assert.deepEqual(await physical(f.db),winner);
});
test("broad autosave without an editing fence is rejected", async (t)=>{ const f=await setup(t); await assert.rejects(saveActivePlannerV2({repository:f.repo,state:f.state}),PlanningConflictError); });
for(const kind of ["rollback","quota"]) test(`${kind} rolls back documents, fingerprints, adoption and revision`, async(t)=>{
 const f=await setup(t),s=await read(f.repo),state=edit(s);state.monthlyGoals.a="A"; const before=await physical(f.db);
 const failing={open:()=>f.repo.open(),close:()=>f.repo.close(),read:(work)=>f.repo.read(work),write:(work)=>f.repo.write((tx)=>work(new Proxy(tx,{get(target,key){
   if(key==="putPlannerDocument") return async(doc)=>{await target.putPlannerDocument(doc);if(doc.id==="planner/current")throw kind==="quota"?new DOMException("fictitious quota","QuotaExceededError"):new Error("fictitious interruption");};
   const member=Reflect.get(target,key);return typeof member==="function"?member.bind(target):member;
 }})))};
 await assert.rejects(save(failing,state,s));assert.deepEqual(await physical(f.db),before); await save(f.repo,state,s);
});
test("invalid adopted metadata blocks reads; revision overflow rolls back writes",async(t)=>{
 const f=await setup(t),s=await read(f.repo),m=await f.db.metadata.get("database");
 await f.db.metadata.put({...m,datasetRevision:-1});await assert.rejects(read(f.repo),PersistenceValidationError);
 await f.db.metadata.put({...m,datasetRevision:Number.MAX_SAFE_INTEGER});const state=edit(s);state.monthlyGoals.a="A";const before=await physical(f.db);
 await assert.rejects(saveActivePlannerV2({repository:f.repo,state,expectedAuthorityEpoch:s.authorityEpoch,expectedDatasetRevision:Number.MAX_SAFE_INTEGER}),PersistenceValidationError);
 assert.deepEqual(await physical(f.db),before);
});
for(const kind of ["restore","import","reset"]) test(`${kind} advances destination revision and epoch; old fence cannot be reused`,async(t)=>{
 const f=await setup(t),s=await read(f.repo);
 const replace=()=>kind==="reset"?resetPlannerV2({repository:f.repo,markerStorage:f.storage,defaultState:f.state,instant}):restoreActivePlannerV2({repository:f.repo,input:kind==="restore"?JSON.stringify(s.backup):f.raw,instant});
 await replace();const a=await read(f.repo);assert.equal(a.authorityEpoch,s.authorityEpoch+1);assert.equal(a.datasetRevision,s.datasetRevision+1);
 await assert.rejects(save(f.other,edit(s),s),PlanningConflictError); const stable=await physical(f.db);await f.boot();assert.deepEqual(await physical(f.db),stable);
 f.repo.close();const reopened=await read(f.repo);assert.equal(reopened.datasetRevision,a.datasetRevision);
 assert.equal(Object.hasOwn(reopened.backup,"datasetRevision"),false);assert.equal(JSON.stringify(reopened.backup).includes('"datasetRevision":'),false);
 assert.equal(JSON.stringify(reopened.backup).includes('"authorityEpoch":'),false);assert.equal(reopened.backup.formatVersion,2);
});
for(const kind of ["completion","rescheduling"]) test(`${kind} advances once and exact replay survives an unrelated newer revision`,async(t)=>{
 const f=await setup(t),s=await read(f.repo),b=s.backup.payload.executionBridge.bridge.entries[0],intent=rescheduling(s),record=execution(s);
 const command=()=>kind==="completion"?recordOccurrenceExecution({repository:f.repo,occurrenceId:b.occurrenceId,execution:record,...fence(s),expectedRevision:occurrenceRevision(b)}):rescheduleOccurrencePlanning({repository:f.repo,...intent});
 await command();const a=await read(f.repo);assert.equal(a.datasetRevision,s.datasetRevision+1);
 const state=edit(a);state.records[date].note="Outro escritor";await save(f.other,state,a);const before=await physical(f.db);
 await command();assert.deepEqual(await physical(f.db),before);const done=await read(f.repo);assert.equal(done.backup.payload.executionBridge.bridge.entries[0].occurrenceId,b.occurrenceId);
});
for(const kind of ["completion","rescheduling"]) test(`new ${kind} cannot rebase onto an unrelated changed dataset`,async(t)=>{
 const f=await setup(t),s=await read(f.repo),state=edit(s);state.monthlyGoals.a="A";await save(f.other,state,s);const before=await physical(f.db);
 const b=s.backup.payload.executionBridge.bridge.entries[0];await assert.rejects(kind==="completion"?recordOccurrenceExecution({repository:f.repo,occurrenceId:b.occurrenceId,execution:execution(s),...fence(s)}):rescheduleOccurrencePlanning({repository:f.repo,...rescheduling(s)}),PlanningConflictError);
 assert.deepEqual(await physical(f.db),before);
});
test("open form is retained on remote replacement; a clean idle session refreshes",async(t)=>{
 const f=await setup(t),s=await read(f.repo),state=edit(s);state.monthlyGoals.a="A";await save(f.other,state,s);const latest=await read(f.repo);
 const idle=new PlannerDraftSession(view(s));idle.observe(view(latest));assert.equal(idle.state.monthlyGoals.a,"A");assert.equal(idle.remote,null);
 const form=new PlannerDraftSession(view(s));form.beginEditing();form.observe(view(latest));assert.equal(form.state.monthlyGoals.a,undefined);assert.ok(form.remote);form.endEditing();assert.ok(form.remote);
});
test("a draft changed during its own save remains pending on the new validated base",async(t)=>{
 const f=await setup(t),s=await read(f.repo),a=edit(s),b=edit(s);a.monthlyGoals.a="A";b.monthlyGoals.a="A";b.monthlyGoals.b="B";
 const session=new PlannerDraftSession(view(s));session.edit(a);await save(f.repo,a,s);session.edit(b);
 assert.equal(session.saved(a,fence(s),view(await read(f.repo))),true);assert.equal(session.dirty,true);assert.equal(session.state.monthlyGoals.b,"B");
 await saveActivePlannerV2({repository:f.repo,state:session.state,...session.fence});assert.equal((await read(f.repo)).backup.payload.planner.monthlyGoals.b,"B");
});
test("export sees a complete consistent snapshot while another write is prepared",async(t)=>{
 const f=await setup(t),s=await read(f.repo),state=edit(s);state.monthlyGoals.a="A";const data=await exportDayforgeBackupV2({repository:f.other,exportedAt:instant,active:true});
 await save(f.repo,state,s);assert.deepEqual(data.payload,s.backup.payload);assert.equal(data.exportedFrom.schemaVersion,1);
});

for (const kind of ["restore", "import", "reset"]) test(`${kind} cannot replace a dataset changed while its hash was prepared`, async (t) => {
 const f=await setup(t),s=await read(f.repo);let release,entered,first=true;
 const gate=new Promise((r)=>release=r),ready=new Promise((r)=>entered=r),real=new WebCryptoSha256Hasher();
 const hasher={digestUtf8:async(value)=>{if(first){first=false;entered();await gate;}return real.digestUtf8(value);}};
 const pending=kind==="reset"?resetPlannerV2({repository:f.other,markerStorage:f.storage,defaultState:f.state,instant,...fence(s),hasher})
  :restoreActivePlannerV2({repository:f.other,input:kind==="restore"?JSON.stringify(s.backup):f.raw,instant,...fence(s),hasher});
 await ready;const state=edit(s);state.monthlyGoals.winner="Preservada";await save(f.repo,state,s);const before=await physical(f.db);release();
 await assert.rejects(pending,PlanningConflictError);assert.deepEqual(await physical(f.db),before);
});
