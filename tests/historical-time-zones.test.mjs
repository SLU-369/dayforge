import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import Dexie from "dexie";
import { createHash } from "node:crypto";
import { parseIanaTimeZone, createTimedSchedule, createDateOnlySchedule, createAllDaySchedule,
 createTimedExecutionTiming, createDateOnlyExecutionTiming, createAllDayExecutionTiming,
 createOccurrence, createExecutionRecord, scheduleOccurrenceId, executionRecordId, completeOccurrence } from "../domain/temporal/index.ts";
import { DayforgeDatabase, IndexedDbPersistenceRepository, bootstrapPlannerV2, exportDayforgeBackup, restoreDayforgeBackupV2,
 canonicalStringify, decodeCanonicalOccurrence, decodeBridgeExecution, decodeSchedule, historicalOffsetOccurrenceIds,
 recordOccurrenceExecution, rescheduleOccurrencePlanning, occurrenceRevision, readPlannerAuthoritySnapshot,
 createLegacyPlannerDocument, createBridgeDocument, upgradePlanningModel } from "../persistence/index.ts";
import { backupV2 } from "./planning-model-compat.mjs";
const date="2026-10-12",instant=`${date}T12:00:00.000Z`,val=r=>{assert.equal(r.ok,true);return r.value;};
const hash=x=>createHash("sha256").update(canonicalStringify(JSON.parse(JSON.stringify(x)))).digest("hex");
const timed=zone=>({startsAt:`${date}T08:00:00.000Z`,durationMinutes:60,timeZone:zone});
const execution=zone=>({start:`${date}T08:10:00.000Z`,end:`${date}T08:50:00.000Z`,timeZone:zone});
for(const [zone,valid] of [["+03:00",false],["-03:00",false],["America/Sao_Paulo",true],["UTC",true],["Invalid/Zone",false]])
 test(`new facts require named IANA: ${zone}`,()=>{
  const results=[parseIanaTimeZone(zone),createTimedSchedule(timed(zone)),createDateOnlySchedule({date,timeZone:zone}),
   createAllDaySchedule({startsOn:date,endsBefore:"2026-10-14",timeZone:zone}),createTimedExecutionTiming(execution(zone)),
   createDateOnlyExecutionTiming({date,timeZone:zone}),createAllDayExecutionTiming({startsOn:date,endsBefore:"2026-10-14",timeZone:zone})];
  for(const result of results){assert.equal(result.ok,valid);if(!valid)assert.equal(result.error.code,"invalid_time_zone");}
 });
for(const zone of ["+03:00","-03:00"])test(`raw occurrence/execution and strict codecs cannot bypass named-zone creation: ${zone}`,()=>{
 const schedule={kind:"timed",...timed(zone)},timing={kind:"timed",interval:{start:execution(zone).start,end:execution(zone).end},timeZone:zone};
 assert.equal(createOccurrence({id:val(scheduleOccurrenceId("occ:1")),source:{kind:"standalone",title:"Fictício",flexibility:"fixed",origin:{kind:"event"}},schedule,createdAt:instant}).ok,false);
 const fact={id:val(executionRecordId("execution:occ:1")),timing,recordedAt:instant};
 assert.equal(createExecutionRecord(fact).ok,false);assert.throws(()=>decodeSchedule(schedule));assert.throws(()=>decodeBridgeExecution(fact,"occ:1"));
});
let seq=0;
async function setup(t){
 const name=`historical-zone-${++seq}`,db=new DayforgeDatabase(name),repo=new IndexedDbPersistenceRepository(db);
 t.after(async()=>{repo.close();await Dexie.delete(name);});
 const state={version:1,routine:{seg:[],ter:[],qua:[],qui:[],sex:[],sab:[],dom:[]},records:{[date]:{date,items:[{id:"legacy",title:"Fictício",start:"08:00",end:"09:00",category:"estudo",notes:"",completed:false}],note:"",energy:3}},monthlyGoals:{}};
 const storage={getItem:()=>null,setItem:()=>{}};
 await bootstrapPlannerV2({repository:repo,legacyStorage:storage,markerStorage:storage,defaultState:state,instant});return {db,repo,state};
}
const read=repo=>readPlannerAuthoritySnapshot({repository:repo,active:true,exportedAt:instant});
const physical=async db=>({docs:await db.plannerDocuments.toArray(),metadata:await db.metadata.toArray()});
const offsetFacts=(input,zone)=>{const x=structuredClone(input);const visit=o=>{if(!o||typeof o!=="object")return;for(const k of Object.keys(o)){if(k==="timeZone")o[k]=zone;else visit(o[k]);}};visit(x);return x;};
for(const version of [1,2])for(const zone of ["+03:00","-03:00"])test(`installed bridge ${version} and backup 2 retain historical ${zone} facts through upgrade/recovery`,async t=>{
 const f=await setup(t),backup=backupV2((await read(f.repo)).backup),bridge=backup.payload.executionBridge.bridge;
 const b=bridge.entries[0];b.item.completed=true;backup.payload.planner.records[date].items[0].completed=true;
 b.execution={id:"execution:occ:1",timing:{kind:"timed",interval:{start:`${date}T08:10:00.000Z`,end:`${date}T08:50:00.000Z`},timeZone:zone},recordedAt:instant};
 bridge.version=version;
 if(version===2){const baseline={kind:"timed",...timed(zone)};b.planningAudit={baselineItem:{...b.originalItem},baselineSchedule:baseline,confirmedAt:`${date}T09:00:00.000Z`,
  rescheduleHistory:[{id:"reschedule:occ:1:1",from:baseline,to:{...baseline,startsAt:"2026-10-13T20:00:00.000Z"},changedAt:`${date}T09:00:00.000Z`}]};}
 backup.payload.provenance.contentFingerprint=hash(backup.payload.planner);backup.payload.executionBridge.contentFingerprint=hash(bridge);
 await f.db.plannerDocuments.put(createLegacyPlannerDocument(hash(backup.payload.planner),backup.payload.planner));await f.db.plannerDocuments.put(await createBridgeDocument(bridge));
 await f.db.metadata.put({...await f.db.metadata.get("database"),executionBridgeVersion:version});
 await upgradePlanningModel({repository:f.repo,active:true});const upgraded=(await read(f.repo)).backup;
 const {kind,...same}=upgraded.payload.executionBridge.bridge.entries[0];assert.equal(kind,"legacy_partial");assert.deepEqual(same,b);
 await restoreDayforgeBackupV2({repository:f.repo,backup,active:true});assert.deepEqual((await read(f.repo)).backup.payload,upgraded.payload);
 const once=await physical(f.db);await recordOccurrenceExecution({repository:f.repo,occurrenceId:"occ:1",execution:b.execution});assert.deepEqual(await physical(f.db),once);
 f.repo.close();await f.repo.open();assert.deepEqual((await read(f.repo)).backup.payload,upgraded.payload);assert.deepEqual(historicalOffsetOccurrenceIds(upgraded.payload.executionBridge.bridge),["occ:1"]);
});
for(const zone of ["+03:00","-03:00"])test(`backup 3 full historical ${zone} is recoverable unchanged, while strict creation rejects it`,async t=>{
 const f=await setup(t),backup=(await read(f.repo)).backup;
 let occurrence=val(createOccurrence({id:val(scheduleOccurrenceId("occ:2")),source:{kind:"standalone",title:"Fictício histórico",flexibility:"fixed",origin:{kind:"event"}},schedule:val(createTimedSchedule(timed("UTC"))),createdAt:`${date}T07:00:00.000Z`}));
 occurrence=val(completeOccurrence(occurrence,val(createExecutionRecord({id:val(executionRecordId("execution:occ:2")),timing:val(createTimedExecutionTiming(execution("UTC"))),recordedAt:instant}))));
 const stored=offsetFacts(occurrence,zone);assert.throws(()=>decodeCanonicalOccurrence(stored));
 backup.payload.executionBridge.bridge.entries.push({kind:"canonical",occurrence:stored});backup.payload.executionBridge.bridge.nextSequence=3;backup.payload.executionBridge.contentFingerprint=hash(backup.payload.executionBridge.bridge);
 await restoreDayforgeBackupV2({repository:f.repo,backup,active:true});assert.deepEqual((await exportDayforgeBackup({repository:f.repo,active:true,exportedAt:instant})).payload,backup.payload);
 f.repo.close();await f.repo.open();assert.deepEqual((await read(f.repo)).backup.payload,backup.payload);
 assert.deepEqual(historicalOffsetOccurrenceIds(backup.payload.executionBridge.bridge),["occ:2"]);
 const bad=structuredClone(backup);bad.payload.executionBridge.bridge.entries[1].occurrence.originalSchedule.timeZone="+99:00";bad.payload.executionBridge.contentFingerprint=hash(bad.payload.executionBridge.bridge);
 const once=await physical(f.db);await assert.rejects(restoreDayforgeBackupV2({repository:f.repo,backup:bad,active:true}));assert.deepEqual(await physical(f.db),once);
});
test("historical offset baseline allows a named new reschedule, but not a new offset target/execution",async t=>{
 const f=await setup(t),backup=(await read(f.repo)).backup,b=backup.payload.executionBridge.bridge.entries[0];
 b.planningAudit={baselineItem:{...b.item},baselineSchedule:{kind:"timed",...timed("-03:00")},confirmedAt:instant,rescheduleHistory:[]};backup.payload.executionBridge.contentFingerprint=hash(backup.payload.executionBridge.bridge);
 await restoreDayforgeBackupV2({repository:f.repo,backup,active:true});let s=await read(f.repo);const intent={repository:f.repo,occurrenceId:"occ:1",expectedAuthorityEpoch:s.authorityEpoch,expectedDatasetRevision:s.datasetRevision,expectedRevision:occurrenceRevision(b),expectedHistoryLength:0,
  schedule:val(createTimedSchedule({startsAt:"2026-10-13T20:00:00.000Z",durationMinutes:60,timeZone:"America/Sao_Paulo"})),changedAt:instant};
 const once=await physical(f.db);await assert.rejects(rescheduleOccurrencePlanning({...intent,schedule:{...intent.schedule,timeZone:"+03:00"}}));
 await assert.rejects(recordOccurrenceExecution({repository:f.repo,occurrenceId:"occ:1",execution:{id:"execution:occ:1",timing:{kind:"date_only",date,timeZone:"-03:00"},recordedAt:instant}}));assert.deepEqual(await physical(f.db),once);
 await rescheduleOccurrencePlanning(intent);s=await read(f.repo);const after=s.backup.payload.executionBridge.bridge.entries[0];assert.equal(after.planningAudit.baselineSchedule.timeZone,"-03:00");assert.equal(after.planningAudit.rescheduleHistory[0].to.timeZone,"America/Sao_Paulo");
});
