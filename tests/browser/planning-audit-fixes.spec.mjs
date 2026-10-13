import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createOccurrence, createTimedSchedule, createDateOnlySchedule, createAllDaySchedule, scheduleOccurrenceId } from "../../domain/temporal/index.ts";
import { canonicalStringify, decodeDayforgeBackup, planningEnvelope, reconcileExecutionBridge, upgradeTemporalRegistry } from "../../persistence/index.ts";
test.use({timezoneId:"UTC"});
const date="2026-10-12",instant=`${date}T12:00:00.000Z`,val=r=>{expect(r.ok).toBe(true);return r.value;};
const hash=x=>createHash("sha256").update(canonicalStringify(JSON.parse(JSON.stringify(x)))).digest("hex");
const state=()=>({version:1,routine:{seg:[],ter:[],qua:[],qui:[],sex:[],sab:[],dom:[]},records:{[date]:{date,items:[{id:"legacy",title:"Atividade fictícia",start:"08:00",end:"09:00",category:"estudo",notes:"",completed:false}],note:"Nota preservada",energy:3}},monthlyGoals:{"2026-10":"Meta preservada"}});
function backup(kinds=[]){
 const legacy=state(),planner=planningEnvelope(legacy),registry=upgradeTemporalRegistry(reconcileExecutionBridge(legacy),legacy);
 kinds.forEach((kind,index)=>{
  const schedule=val(kind==="date_only"?createDateOnlySchedule({date,timeZone:"UTC"}):kind==="all_day"?createAllDaySchedule({startsOn:date,endsBefore:"2026-10-14",timeZone:"UTC"}):createTimedSchedule({startsAt:`${date}T20:00:00.000Z`,durationMinutes:60,timeZone:"UTC"}));
  registry.entries.push({kind:"canonical",occurrence:val(createOccurrence({id:val(scheduleOccurrenceId(`occ:${index+2}`)),source:{kind:"standalone",title:`Fictício ${kind}`,flexibility:"preferred",origin:{kind:"event"}},schedule,createdAt:`${date}T07:00:00.000Z`}))});registry.nextSequence++;
 });
 return {format:"dayforge-backup",formatVersion:3,exportedAt:instant,exportedFrom:{persistenceGeneration:2,schemaVersion:1},payload:{planner,plannerFingerprint:hash(planner),provenance:{contentFingerprint:hash(legacy),origins:[]},legacySources:[],executionBridge:{bridge:registry,contentFingerprint:hash(registry)}}};
}
const read=page=>page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open("dayforge-local");r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction(["metadata","plannerDocuments"],"readonly"),m=tx.objectStore("metadata").getAll(),d=tx.objectStore("plannerDocuments").getAll();tx.oncomplete=()=>{db.close();resolve({metadata:m.result,docs:d.result});};tx.onerror=()=>reject(tx.error);};}));
async function importUI(page,data){
 await page.goto("/configuracoes/dados-e-backup");await expect(page.getByRole("button",{name:"Selecionar arquivo",exact:true})).toBeEnabled();
 await page.locator('input[type=file]').setInputFiles({name:"ficticio.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(data))});await expect(page.getByRole("status")).toContainText("Backup importado com sucesso");await expect(page.locator(".storage-warning")).toHaveCount(0);
}
async function exportUI(page){
 await page.goto("/configuracoes/dados-e-backup");await expect(page.getByRole("button",{name:"Exportar arquivo",exact:true})).toBeEnabled();const downloading=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar arquivo",exact:true}).click();return JSON.parse(await readFile(await(await downloading).path(),"utf8"));
}
async function monthly(page){await page.goto("/planejamento/agenda");await page.getByRole("button",{name:"Ver resumo mensal",exact:true}).click();}
for(const [label,kinds] of [["date_only",["date_only"]],["all_day",["all_day"]],["timed",["timed"]],["mixed",["timed","date_only","all_day"]]])
 for(const width of [1440,390])test(`monthly ${label} at ${width}px survives navigation/reload, preserves all facts and valid metrics`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.clock.setFixedTime(new Date(instant));const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const data=backup(kinds);decodeDayforgeBackup(data);await importUI(page,data);const saved=await read(page);
  await monthly(page);const heading=page.getByRole("heading",{name:"Seu ritmo ao longo do mês",exact:true});await expect(heading).toBeVisible();await expect(page.locator(".month-control strong")).toHaveText("Outubro de 2026");
  const omitted=kinds.filter(k=>k!=="timed").length,notice=page.getByRole("note",{name:"Limitação da projeção mensal",exact:true});
  if(omitted){await expect(notice).toContainText(`Ocorrências sem horário preservadas: ${omitted}.`);await expect(notice).toContainText("não participam da projeção horária nem dos indicadores deste mês");}
  else await expect(notice).toHaveCount(0);
  await expect(page.locator(".month-metrics")).toContainText(kinds.includes("timed")?"0min de 2h":"0min de 1h");
  const next=page.getByRole("button",{name:"Próximo mês",exact:true});await next.focus();await expect(next).toBeFocused();await page.keyboard.press("Enter");await expect(page.locator(".month-control strong")).toHaveText("Novembro de 2026");await expect(notice).toHaveCount(0);
  await page.getByRole("button",{name:"Mês anterior",exact:true}).click();await expect(page.locator(".month-control strong")).toHaveText("Outubro de 2026");await page.reload();await page.getByRole("button",{name:"Ver resumo mensal",exact:true}).click();await expect(heading).toBeVisible();if(omitted)await expect(notice).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await read(page)).toEqual(saved);
  if(label==="mixed")await page.screenshot({path:`outputs/3a2-audit-monthly-${width}.png`,fullPage:true});
  expect((await exportUI(page)).payload).toEqual(data.payload);
  await monthly(page);await expect(heading).toBeVisible();await page.locator(".goal-panel textarea").fill("Meta revisada explicitamente");
  await expect.poll(async()=>{const p=(await read(page)).docs.find(d=>d.id==="planner/current");return p.payload.legacy.monthlyGoals["2026-10"];} ).toBe("Meta revisada explicitamente");
  await expect(page.getByRole("status")).toContainText("Alterações salvas.");const changed=await exportUI(page);
  expect(changed.payload.executionBridge).toEqual(data.payload.executionBridge);expect(changed.payload.planner.legacy).toEqual({...data.payload.planner.legacy,monthlyGoals:{"2026-10":"Meta revisada explicitamente"}});expect(errors).toEqual([]);
 });
for(const [zone,valid] of [["+03:00",false],["-03:00",false],["America/Sao_Paulo",true],["UTC",true],["Invalid/Zone",false]])test(`Edge new execution and planning enforce named IANA: ${zone}`,async({page})=>{
 await page.clock.setFixedTime(new Date(instant));await importUI(page,backup());await page.goto("/hoje");await page.getByRole("button",{name:"Concluir Atividade fictícia",exact:true}).click();
 await page.getByLabel("Início real",{exact:true}).fill(`${date}T08:10`);await page.getByLabel("Fim real",{exact:true}).fill(`${date}T08:50`);await page.getByLabel("Fuso IANA da execução",{exact:true}).fill(zone);const before=await read(page);
 await page.getByRole("button",{name:"Confirmar conclusão",exact:true}).click();
 if(valid){await expect(page.getByRole("dialog")).toHaveCount(0);const entry=(await read(page)).docs.find(d=>d.id==="execution/bridge").payload.entries[0];expect(entry.execution.timing.timeZone).toBe(zone);expect(entry.item.completed).toBe(true);}
 else {await expect(page.getByRole("dialog").getByRole("alert")).toContainText("fuso IANA");expect(await read(page)).toEqual(before);await page.getByRole("button",{name:"Cancelar",exact:true}).click();
  await page.getByRole("button",{name:"Reagendar Atividade fictícia",exact:true}).click();await page.getByLabel("Confirmo este planejamento anterior",{exact:true}).check();await page.getByLabel("Novo início",{exact:true}).fill("2026-10-13T20:00");await page.getByLabel("Novo fim",{exact:true}).fill("2026-10-13T21:00");await page.getByLabel("Novo fuso IANA",{exact:true}).fill(zone);await page.getByRole("button",{name:"Confirmar reagendamento",exact:true}).click();await expect(page.getByRole("dialog").getByRole("alert")).toContainText("IANA");expect(await read(page)).toEqual(before);}
});
for(const version of [2,3])for(const zone of ["+03:00","-03:00"])test(`Edge backup ${version} historical ${zone} is disclosed and round-trips without geographic invention`,async({page})=>{
 await page.clock.setFixedTime(new Date(instant));const data=backup(["timed"]);
 if(version===2){data.formatVersion=2;data.payload.planner=data.payload.planner.legacy;delete data.payload.plannerFingerprint;
  data.payload.executionBridge.bridge={version:2,nextSequence:2,entries:data.payload.executionBridge.bridge.entries.filter(e=>e.kind==="legacy_partial").map(e=>{const {kind,...entry}=e;void kind;return entry;})};
  const b=data.payload.executionBridge.bridge.entries[0];b.item.completed=true;data.payload.planner.records[date].items[0].completed=true;
  b.execution={id:"execution:occ:1",timing:{kind:"timed",interval:{start:`${date}T08:10:00.000Z`,end:`${date}T08:50:00.000Z`},timeZone:zone},recordedAt:instant};data.payload.provenance.contentFingerprint=hash(data.payload.planner);
 }else {const o=data.payload.executionBridge.bridge.entries[1].occurrence;o.originalSchedule.timeZone=zone;o.currentSchedule.timeZone=zone;}
 data.payload.executionBridge.contentFingerprint=hash(data.payload.executionBridge.bridge);decodeDayforgeBackup(data);
 await importUI(page,data);const notice=page.getByRole("note",{name:"Compatibilidade de fusos históricos",exact:true});await expect(notice).toContainText("valores originais foram preservados, sem inferir uma localização");const saved=await read(page);
 await monthly(page);await expect(page.getByRole("heading",{name:"Seu ritmo ao longo do mês",exact:true})).toBeVisible();await expect(notice).toBeVisible();await page.reload();await page.getByRole("button",{name:"Ver resumo mensal",exact:true}).click();await expect(notice).toBeVisible();expect(await read(page)).toEqual(saved);
 const exported=await exportUI(page);if(version===3)expect(exported.payload).toEqual(data.payload);
 else {expect(exported.payload.planner.legacy).toEqual(data.payload.planner);const {kind,...entry}=exported.payload.executionBridge.bridge.entries[0];expect(kind).toBe("legacy_partial");expect(entry).toEqual(data.payload.executionBridge.bridge.entries[0]);}
 await page.setViewportSize({width:390,height:844});await expect(notice).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
