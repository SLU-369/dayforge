import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import Dexie from "dexie";
import { createHash } from "node:crypto";
import { DayforgeDatabase, IndexedDbPersistenceRepository, bootstrapPlannerV2, readPlannerAuthoritySnapshot,
  exportDayforgeBackup, exportDayforgeBackupV2, restoreDayforgeBackupV2, restoreActivePlannerV2, resetPlannerV2,
  upgradePlanningModel, saveActivePlannerV2, recordOccurrenceExecution, rescheduleOccurrencePlanning,
  occurrenceRevision, PlanningConflictError, canonicalStringify, createBridgeDocument, createLegacyPlannerDocument,
  decodeExecutionBridge, decodePlanningEnvelope, planningEnvelope, queryTemporalSnapshot,
  decodeDayforgeBackup, WebCryptoSha256Hasher } from "../persistence/index.ts";
import { createOccurrence, createTimedSchedule, createDateOnlySchedule, createAllDaySchedule, scheduleOccurrenceId,
  createExecutionRecord, executionRecordId, createTimedExecutionTiming, completeOccurrence, rescheduleOccurrence,
  rescheduleEventId, cancelOccurrence, markOccurrenceNotCompleted } from "../domain/temporal/index.ts";
import { backupV2, legacyOf, bridgeV2, assertUpgradedBackup } from "./planning-model-compat.mjs";
import { deriveTodayContext } from "../app/today-context.ts";
import { createDateOnlyExecutionTiming } from "../domain/temporal/index.ts";
const date = "2026-10-12", instant = `${date}T12:00:00.000Z`;
const val = result => { assert.equal(result.ok, true); return result.value; };
const hash = value => createHash("sha256").update(canonicalStringify(JSON.parse(JSON.stringify(value)))).digest("hex");
const item = { id: "legacy", title: "Atividade fictícia", start: "08:00", end: "09:00", category: "estudo", notes: "", completed: false };
const initial = () => ({ version: 1, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] },
  records: { [date]: { date, items: [{ ...item }], note: "", energy: 3 } }, monthlyGoals: { "2026-10": "Legado" } });
const timed = (start = `${date}T20:00:00.000Z`) => val(createTimedSchedule({ startsAt: start, timeZone: "UTC", durationMinutes: 60 }));
const execution = (id = "occ:1") => val(createExecutionRecord({ id: val(executionRecordId(`execution:${id}`)),
  timing: val(createTimedExecutionTiming({ start: `${date}T08:10:00.000Z`, end: `${date}T08:50:00.000Z`, timeZone: "UTC" })), recordedAt: instant }));
function completeFixture(schedule = timed(), status = "planned", id = "occ:2") {
  let occurrence = val(createOccurrence({ id: val(scheduleOccurrenceId(id)), source: { kind: "standalone", title: "Evento fictício",
    flexibility: "preferred", origin: { kind: "event", label: "Fixture controlada" } }, schedule, createdAt: `${date}T07:00:00.000Z` }));
  if(status === "completed_rescheduled") occurrence = val(rescheduleOccurrence(occurrence, {
    id: val(rescheduleEventId(`reschedule:${id}:1`)), schedule: timed(`${date}T21:00:00.000Z`), changedAt: `${date}T08:00:00.000Z` }));
  if(status.startsWith("completed")) occurrence = val(completeOccurrence(occurrence, execution(id)));
  if(status === "cancelled") occurrence = val(cancelOccurrence(occurrence, { resolvedAt: instant }));
  if(status === "not_completed") occurrence = val(markOccurrenceNotCompleted(occurrence, { resolvedAt: instant }));
  return { kind: "canonical", occurrence };
}
let sequence = 0;
async function setup(t, version = 2) {
  const name = `planning-model-${++sequence}`, db = new DayforgeDatabase(name), repo = new IndexedDbPersistenceRepository(db), other = new IndexedDbPersistenceRepository(new DayforgeDatabase(name));
  t.after(async () => { repo.close(); other.close(); await Dexie.delete(name); });
  const state = initial(), raw = JSON.stringify(state), values = new Map([["rotina-369:data:v1", raw]]), writes = [];
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key,value) => { writes.push(key); values.set(key,value); } };
  const boot = () => bootstrapPlannerV2({ repository: repo, legacyStorage: storage, markerStorage: storage, defaultState: state, instant });
  await boot();
  const backup = backupV2(await exportDayforgeBackup({ repository: repo, exportedAt: instant, active: true }));
  backup.payload.executionBridge.bridge.version = version;
  backup.payload.executionBridge.contentFingerprint = hash(backup.payload.executionBridge.bridge);
  await db.transaction("rw", db.metadata, db.plannerDocuments, async () => {
    await db.plannerDocuments.put(createLegacyPlannerDocument(hash(state), state));
    await db.plannerDocuments.put(await createBridgeDocument(backup.payload.executionBridge.bridge, { digestUtf8: async () => backup.payload.executionBridge.contentFingerprint }));
    const metadata = await db.metadata.get("database");
    await db.metadata.put({ ...metadata, executionBridgeVersion: version, authorityEpoch: 7, datasetRevision: 30 });
  });
  return { name, db, repo, other, state, raw, storage, writes, boot, backup };
}
const read = repo => readPlannerAuthoritySnapshot({ repository: repo, exportedAt: instant, active: true });
const physical = async db => ({ docs: await db.plannerDocuments.toArray(), metadata: await db.metadata.toArray() });
const fence = s => ({ expectedAuthorityEpoch: s.authorityEpoch, expectedDatasetRevision: s.datasetRevision });
async function mixed(t) {
  const f = await setup(t); await upgradePlanningModel({ repository: f.repo, active: true });
  const backup = (await read(f.repo)).backup;
  backup.payload.executionBridge.bridge.entries.push(completeFixture()); backup.payload.executionBridge.bridge.nextSequence = 3;
  backup.payload.executionBridge.contentFingerprint = hash(backup.payload.executionBridge.bridge);
  await restoreDayforgeBackupV2({ repository: f.repo, backup, active: true });
  return f;
}

for(const oldVersion of [1,2]) test(`installed bridge ${oldVersion} upgrades once; IDs/legacy/revision/epoch remain coherent`, async t => {
  const f = await setup(t,oldVersion), before = await read(f.repo);
  await upgradePlanningModel({ repository:f.repo,active:true }); const after = await read(f.repo);
  assert.equal(after.datasetRevision,31); assert.equal(after.authorityEpoch,7); assertUpgradedBackup(before.backup,after.backup);
  assert.equal((await f.db.plannerDocuments.get("planner/current")).formatVersion,2);
  const persisted = await physical(f.db); f.repo.close(); await f.boot(); await f.boot(); assert.deepEqual(await physical(f.db),persisted);
  assert.equal(f.storage.getItem("rotina-369:data:v1"),f.raw); assert.ok(!f.writes.includes("rotina-369:data:v1"));
});
test("Stage 2 metadata without local revision upgrades deterministically; no inference of audit or timing",async t=>{
  const f=await setup(t,1),metadata=await f.db.metadata.get("database"); delete metadata.datasetRevision;delete metadata.writeFenceVersion;delete metadata.authorityEpoch;await f.db.metadata.put(metadata);
  await f.boot();const s=await read(f.repo);assert.equal(s.datasetRevision,1);assert.equal(s.authorityEpoch,0);
  const b=s.backup.payload.executionBridge.bridge.entries[0];assert.equal(b.kind,"legacy_partial");assert.equal(b.execution,null);assert.equal(b.planningAudit,undefined);
  assert.deepEqual(b.originalItem,item); assert.equal(b.origin,undefined);assert.equal(b.timeZone,undefined);assert.equal(b.createdAt,undefined);
});
test("migration preserves ExecutionRecord, planningAudit and complete append-only rescheduling chain",async t=>{
  const f=await setup(t),s=await read(f.repo),binding=s.backup.payload.executionBridge.bridge.entries[0];
  const intent={repository:f.repo,occurrenceId:"occ:1",...fence(s),expectedRevision:occurrenceRevision(binding),expectedHistoryLength:0,
    previousSchedule:timed(`${date}T08:00:00.000Z`),schedule:timed(),changedAt:`${date}T09:00:00.000Z`};
  await rescheduleOccurrencePlanning(intent);await recordOccurrenceExecution({repository:f.repo,occurrenceId:"occ:1",execution:execution()});
  const before=(await read(f.repo)).backup;await upgradePlanningModel({repository:f.repo,active:true});const after=(await read(f.repo)).backup;
  assert.deepEqual(bridgeV2(after.payload.executionBridge.bridge),bridgeV2(before.payload.executionBridge.bridge));assertUpgradedBackup(before,after);
});
for(const kind of ["timed","date_only","all_day"]) for(const status of ["planned","completed","completed_rescheduled","cancelled","not_completed"]) test(`complete ${kind}/${status} codec and backup round-trip has one authoritative execution/history`,async t=>{
  const f=await mixed(t),s=await read(f.repo),backup=s.backup;
  const schedule=kind==="timed"?timed():kind==="date_only"?val(createDateOnlySchedule({date,timeZone:"America/Sao_Paulo"})):val(createAllDaySchedule({startsOn:date,endsBefore:"2026-10-14",timeZone:"America/Sao_Paulo"}));
  backup.payload.executionBridge.bridge.entries[1]=completeFixture(schedule,status);backup.payload.executionBridge.contentFingerprint=hash(backup.payload.executionBridge.bridge);
  await restoreDayforgeBackupV2({repository:f.repo,backup,active:true});const exported=(await read(f.repo)).backup;assert.deepEqual(exported.payload,backup.payload);
  await assert.rejects(exportDayforgeBackupV2({repository:f.repo,active:true,exportedAt:instant}));
  f.repo.close();await f.boot();assert.deepEqual((await read(f.repo)).backup.payload,backup.payload);
  assert.deepEqual(legacyOf(exported.payload.planner),f.state);
});
test("common query admits partial and full entries without duplicate IDs or inferred legacy schedule",async t=>{
  const f=await mixed(t),s=await read(f.repo),input={planner:s.backup.payload.planner,registry:s.backup.payload.executionBridge.bridge,
    window:{startsAt:`${date}T00:00:00.000Z`,endsBefore:"2026-10-13T00:00:00.000Z"},referenceTime:instant,displayTimeZone:"UTC"};
  const before=await physical(f.db),items=queryTemporalSnapshot(input);assert.deepEqual(queryTemporalSnapshot(input),items);assert.equal(items.length,2);
  assert.equal(items[0].planning,null);assert.equal(items[0].windowRelation,"legacy_candidate");assert.equal(items[1].nature,"canonical");assert.equal(items[1].capabilities.complete,false);
  assert.equal(new Set(items.map(i=>i.id)).size,2);assert.deepEqual(await physical(f.db),before);
  assert.equal(queryTemporalSnapshot({...input,window:{startsAt:"2027-01-01T00:00:00.000Z",endsBefore:"2027-01-02T00:00:00.000Z"}}).length,0);
});
for(const [label,mutate] of [
  ["unknown envelope field",b=>b.payload.planner.secret=true], ["broken registry reference",b=>b.payload.planner.temporalRegistry.documentId="execution/missing"],
  ["future envelope",b=>b.payload.planner.version=9],["future backup",b=>b.formatVersion=9],["future bridge",b=>b.payload.executionBridge.bridge.version=9],
  ["duplicate mixed identity",b=>b.payload.executionBridge.bridge.entries[1].occurrence.id="occ:1"],
  ["reused sequence",b=>b.payload.executionBridge.bridge.nextSequence=2],["missing legacy binding",b=>b.payload.executionBridge.bridge.entries.shift()],
  ["unknown nature",b=>b.payload.executionBridge.bridge.entries[1].kind="invented"],["dangling template",b=>b.payload.executionBridge.bridge.entries[1].occurrence.templateId="template:missing"],
  ["dangling domain reference",b=>b.payload.executionBridge.bridge.entries[1].occurrence.origin.referenceId="entity:missing"],
  ["unknown occurrence field",b=>b.payload.executionBridge.bridge.entries[1].occurrence.extra=true],["invalid status",b=>b.payload.executionBridge.bridge.entries[1].occurrence.status="completed_rescheduled"],
  ["unknown timezone",b=>b.payload.executionBridge.bridge.entries[1].occurrence.currentSchedule.timeZone="Invalid/Zone"],
  ["noncanonical current",b=>b.payload.executionBridge.bridge.entries[1].occurrence.currentSchedule.startsAt=`${date}T22:00:00.000Z`],
  ["envelope hash",b=>b.payload.plannerFingerprint="0".repeat(64)],["bridge hash",b=>b.payload.executionBridge.contentFingerprint="0".repeat(64)],
]) test(`corruption ${label} rejects before mutation including with recomputed semantic hashes`,async t=>{
  const f=await mixed(t),b=structuredClone((await read(f.repo)).backup);mutate(b);
  if(!label.endsWith("hash")){b.payload.plannerFingerprint=hash(b.payload.planner);b.payload.executionBridge.contentFingerprint=hash(b.payload.executionBridge.bridge);}
  const before=await physical(f.db);await assert.rejects(restoreDayforgeBackupV2({repository:f.repo,backup:b,active:true}));assert.deepEqual(await physical(f.db),before);
});
test("autosave preserves complete entities and shares a monotonic allocator with later legacy bindings",async t=>{
  const f=await mixed(t),s=await read(f.repo),state=structuredClone(legacyOf(s.backup.payload.planner)),complete=s.backup.payload.executionBridge.bridge.entries[1];
  state.records[date].items.push({...item,id:"new"});await saveActivePlannerV2({repository:f.repo,state,...fence(s)});
  const registry=(await read(f.repo)).backup.payload.executionBridge.bridge;assert.equal(registry.nextSequence,4);assert.equal(registry.entries[1].occurrenceId,"occ:3");assert.deepEqual(registry.entries[2],complete);
});
test("concurrent equivalent migrations from independent connections apply once",async t=>{
  const f=await setup(t);await Promise.all([upgradePlanningModel({repository:f.repo,active:true}),upgradePlanningModel({repository:f.other,active:true})]);
  assert.equal((await read(f.repo)).datasetRevision,31);const once=await physical(f.db);await upgradePlanningModel({repository:f.other,active:true});assert.deepEqual(await physical(f.db),once);
});
for(const action of ["autosave","completion","rescheduling","restore"]) test(`migration cannot rebase after ${action} wins during hash preparation`,async t=>{
  const f=await setup(t),s=await read(f.repo);let entered,release;const ready=new Promise(r=>entered=r),barrier=new Promise(r=>release=r);let first=true;
  const hasher={digestUtf8:async text=>{if(first){first=false;entered();await barrier;}return new WebCryptoSha256Hasher().digestUtf8(text);}};
  const pending=upgradePlanningModel({repository:f.repo,active:true,hasher});const rejected=assert.rejects(pending,PlanningConflictError);await ready;
  if(action==="autosave"){const state=structuredClone(f.state);state.monthlyGoals.new="winner";await saveActivePlannerV2({repository:f.other,state,...fence(s)});}
  if(action==="completion")await recordOccurrenceExecution({repository:f.other,occurrenceId:"occ:1",execution:execution(),...fence(s)});
  if(action==="rescheduling")await rescheduleOccurrencePlanning({repository:f.other,occurrenceId:"occ:1",...fence(s),expectedRevision:occurrenceRevision(s.backup.payload.executionBridge.bridge.entries[0]),expectedHistoryLength:0,previousSchedule:timed(`${date}T08:00:00.000Z`),schedule:timed(),changedAt:instant});
  if(action==="restore")await restoreDayforgeBackupV2({repository:f.other,backup:s.backup,active:true,...fence(s)});
  const winner=await physical(f.db);release();await rejected;assert.deepEqual(await physical(f.db),winner);
  await upgradePlanningModel({repository:f.repo,active:true});const saved=await read(f.repo);
  if(action==="completion")assert.deepEqual(saved.backup.payload.executionBridge.bridge.entries[0].execution,execution());
  if(action==="rescheduling")assert.equal(saved.backup.payload.executionBridge.bridge.entries[0].planningAudit.rescheduleHistory.length,1);
  if(action==="autosave")assert.equal(legacyOf(saved.backup.payload.planner).monthlyGoals.new,"winner");
});
for(const point of [1,2,3,"readback","quota"]) test(`upgrade rollback at ${point} preserves old installed bytes and allows explicit retry`,async t=>{
  const f=await setup(t),before=await physical(f.db);let writes=0;
  const repository={open:()=>f.repo.open(),close:()=>f.repo.close(),read:fn=>f.repo.read(fn),write:fn=>f.repo.write(tx=>fn(new Proxy(tx,{get(target,key){
    if(key==="putPlannerDocument"||key==="putDatabaseMetadata")return async(...args)=>{if(++writes===point||point==="quota"&&writes===2){const e=new Error("fixture quota");e.name="QuotaExceededError";throw e;}return target[key](...args);};
    return typeof target[key]==="function"?target[key].bind(target):target[key];}})))};
  await assert.rejects(upgradePlanningModel({repository,active:true,afterWriteForTest:point==="readback"?()=>{throw new Error("fixture readback");}:undefined}));
  assert.deepEqual(await physical(f.db),before);await upgradePlanningModel({repository:f.repo,active:true});assert.equal((await read(f.repo)).datasetRevision,31);
});
for(const source of ["v3","v2-bridge2","v2-bridge1","v2-no-bridge","v1","reset"])test(`replacement ${source} removes complete old entities and preserves only destination authority`,async t=>{
  const f=await mixed(t),s=await read(f.repo);const raw=JSON.stringify(initial());
  if(source==="reset")await resetPlannerV2({repository:f.repo,markerStorage:f.storage,defaultState:initial(),instant,...fence(s)});
  else if(source==="v1")await restoreActivePlannerV2({repository:f.repo,input:raw,instant,...fence(s)});
  else {let backup=source==="v3"?structuredClone(s.backup):structuredClone(f.backup);
    if(source==="v3"){backup.payload.executionBridge.bridge.entries.pop();backup.payload.executionBridge.contentFingerprint=hash(backup.payload.executionBridge.bridge);}
    if(source==="v2-bridge1"){backup.payload.executionBridge.bridge.version=1;backup.payload.executionBridge.contentFingerprint=hash(backup.payload.executionBridge.bridge);}
    if(source==="v2-no-bridge")delete backup.payload.executionBridge;
    await restoreDayforgeBackupV2({repository:f.repo,backup,active:true,...fence(s)});}
  const after=await read(f.repo);assert.equal(after.authorityEpoch,s.authorityEpoch+1);assert.equal(after.datasetRevision,s.datasetRevision+1);
  assert.ok(after.backup.payload.executionBridge.bridge.entries.every(e=>e.kind==="legacy_partial"));
  await assert.rejects(saveActivePlannerV2({repository:f.other,state:initial(),...fence(s)}),PlanningConflictError);
  assert.equal(f.storage.getItem("rotina-369:data:v1"),f.raw);
});
for(const namespace of ["planner/unknown","execution/unknown"])test(`unknown authority namespace ${namespace} blocks export/recovery without touching unrelated records`,async t=>{
  const f=await mixed(t),backup=(await read(f.repo)).backup;
  await f.db.plannerDocuments.put({id:namespace,role:"active",format:"unknown",formatVersion:1,sourceContentFingerprint:null,payload:{}});
  const before=await physical(f.db);await assert.rejects(read(f.repo));await assert.rejects(restoreDayforgeBackupV2({repository:f.repo,backup,active:true}));assert.deepEqual(await physical(f.db),before);
});
test("complete codec rejects copied execution/history, broken continuity and unknown nested fields",async t=>{
  const f=await mixed(t),b=(await read(f.repo)).backup;const planner=legacyOf(b.payload.planner),entry=completeFixture(timed(),"completed_rescheduled");
  for(const mutate of [o=>o.execution.id="execution:occ:1",o=>o.rescheduleHistory[0].id="reschedule:occ:1:1",o=>o.rescheduleHistory[0].from=timed(`${date}T19:00:00.000Z`),o=>o.rescheduleHistory[0].reason={code:"user_note",extra:true},o=>o.createdAt="invalid",o=>o.execution.timing.extra=true]){
    const registry=structuredClone(b.payload.executionBridge.bridge);registry.entries[1]=structuredClone(entry);mutate(registry.entries[1].occurrence);assert.throws(()=>decodeExecutionBridge(registry,planner));
  }
  assert.throws(()=>decodePlanningEnvelope({...planningEnvelope(planner),extra:true}));
  assert.throws(()=>decodeDayforgeBackup({...b,authorityEpoch:123}));
});
for (const kind of ["timed", "date_only", "all_day"]) test(`shared query respects ${kind} schedules and half-open window without timing inference`,async t=>{
 const f=await mixed(t),backup=(await read(f.repo)).backup;
 const schedule=kind==="timed"?timed():kind==="date_only"?val(createDateOnlySchedule({date,timeZone:"UTC"})):val(createAllDaySchedule({startsOn:date,endsBefore:"2026-10-14",timeZone:"UTC"}));
 backup.payload.executionBridge.bridge.entries[1]=completeFixture(schedule);
 const input={planner:backup.payload.planner,registry:backup.payload.executionBridge.bridge,referenceTime:instant,displayTimeZone:"UTC",window:{startsAt:`${date}T00:00:00.000Z`,endsBefore:"2026-10-13T00:00:00.000Z"}};
 const result=queryTemporalSnapshot(input).find(e=>e.nature==="canonical");assert.deepEqual(result.planning,schedule);assert.equal(result.execution,null);assert.equal(result.capabilities.complete,false);
 const boundary=kind==="timed"?`${date}T21:00:00.000Z`:kind==="date_only"?"2026-10-13T00:00:00.000Z":"2026-10-14T00:00:00.000Z";
 assert.ok(!queryTemporalSnapshot({...input,window:{startsAt:boundary,endsBefore:"2026-10-15T00:00:00.000Z"}}).some(e=>e.nature==="canonical"));
});
test("Today reads complete timed entities without exposing producer actions or assigning a legacy category",async t=>{
 const f=await mixed(t),s=await read(f.repo),before=await physical(f.db),view=deriveTodayContext(legacyOf(s.backup.payload.planner),new Date(instant),"UTC",date,s.backup.payload.executionBridge.bridge);
 assert.equal(view.items.length,2);const complete=view.items.find(i=>i.id==="occ:2");assert.equal(complete.binding,undefined);assert.equal(complete.reschedulable,false);assert.equal(complete.category,null);assert.equal(complete.sourceIndex,-1);assert.equal(complete.canonicalOccurrence.origin.kind,"event");
 assert.deepEqual(await physical(f.db),before);
 const registry=structuredClone(s.backup.payload.executionBridge.bridge);const planned=registry.entries[1].occurrence;
 const fact=val(createExecutionRecord({id:val(executionRecordId("execution:occ:2")),timing:val(createDateOnlyExecutionTiming({date,timeZone:"UTC"})),recordedAt:instant}));
 registry.entries[1].occurrence=val(completeOccurrence(planned,fact));const completed=deriveTodayContext(f.state,new Date(instant),"UTC",date,registry).items.find(i=>i.id==="occ:2");assert.equal(completed.completed,true);assert.equal(completed.actualMinutes,undefined);
 registry.entries[1]=completeFixture(val(createDateOnlySchedule({date,timeZone:"UTC"})));assert.throws(()=>deriveTodayContext(f.state,new Date(instant),"UTC",date,registry),/sem intervalo horário/);
});
test("complete terminal resolution never becomes a pending attention item",async t=>{
 const f=await mixed(t),s=await read(f.repo);for(const status of ["cancelled","not_completed"]){const registry=structuredClone(s.backup.payload.executionBridge.bridge);registry.entries[1]=completeFixture(timed(`${date}T08:00:00.000Z`),status);
 const view=deriveTodayContext(f.state,new Date(instant),"UTC",date,registry);assert.equal(view.items.find(i=>i.id==="occ:2").terminal,true);assert.ok(!view.atencao.some(i=>i.id==="occ:2"));assert.equal(view.resumo.completed,0);}
});
test("DST timed occurrence preserves real elapsed duration across a repeated hour",async t=>{
 const f=await mixed(t),s=await read(f.repo),registry=structuredClone(s.backup.payload.executionBridge.bridge);
 const schedule=val(createTimedSchedule({startsAt:"2026-11-01T05:30:00.000Z",timeZone:"America/New_York",durationMinutes:120}));registry.entries[1]=completeFixture(schedule);
 const view=deriveTodayContext(f.state,new Date("2026-11-01T06:30:00.000Z"),"America/New_York","2026-11-01",registry),row=view.items.find(i=>i.id==="occ:2");assert.equal(row.start,"01:30");assert.equal(row.end,"02:30");assert.equal(Date.parse(row.endsAt)-Date.parse(row.startsAt),120*60000);assert.equal(row.completed,false);
});
test("adopted registry 3 cannot silently lose the local write fence pair",async t=>{
 const f=await mixed(t),metadata=await f.db.metadata.get("database");delete metadata.writeFenceVersion;delete metadata.datasetRevision;await f.db.metadata.put(metadata);const before=await physical(f.db);await assert.rejects(f.boot());assert.deepEqual(await physical(f.db),before);
});
