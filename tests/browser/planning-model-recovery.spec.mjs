import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { canonicalStringify } from "../../persistence/migration/canonical-json.ts";
test.use({ timezoneId: "UTC" });
const date="2026-10-12",instant=`${date}T12:00:00.000Z`;
const item={id:"fictional",title:"Atividade fictícia",start:"08:00",end:"09:00",notes:"",category:"estudo",completed:false};
const state={version:1,routine:{seg:[{id:item.id,title:item.title,start:item.start,end:item.end,notes:"",category:"estudo"}],ter:[],qua:[],qui:[],sex:[],sab:[],dom:[]},records:{[date]:{date,items:[item],note:"Nota preservada",energy:3}},monthlyGoals:{"2026-10":"Meta preservada"}};
const hash=x=>createHash("sha256").update(canonicalStringify(x)).digest("hex");
const read=page=>page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open("dayforge-local");r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction(["metadata","plannerDocuments"],"readonly"),m=tx.objectStore("metadata").get("database"),p=tx.objectStore("plannerDocuments").get("planner/current"),b=tx.objectStore("plannerDocuments").get("execution/bridge");tx.oncomplete=()=>{db.close();resolve({metadata:m.result,planner:p.result,bridge:b.result});};tx.onerror=()=>reject(tx.error);};}));
function oldBackup(version=2,audited=false){
 const binding={occurrenceId:"occ:1",sourceDate:date,itemIndex:0,originalItem:structuredClone(item),item:structuredClone(item),execution:null};
 if(audited){const baseline={kind:"timed",startsAt:`${date}T08:00:00.000Z`,durationMinutes:60,timeZone:"UTC"};binding.planningAudit={baselineItem:structuredClone(item),baselineSchedule:baseline,confirmedAt:`${date}T09:00:00.000Z`,rescheduleHistory:[{id:"reschedule:occ:1:1",from:baseline,to:{...baseline,startsAt:`${date}T20:00:00.000Z`},changedAt:`${date}T09:00:00.000Z`}]};}
 const bridge={version,nextSequence:2,entries:[binding]};return {format:"dayforge-backup",formatVersion:2,exportedAt:instant,exportedFrom:{persistenceGeneration:2,schemaVersion:1},payload:{planner:state,provenance:{contentFingerprint:hash(state),origins:[]},legacySources:[],executionBridge:{bridge,contentFingerprint:hash(bridge)}}};
}
async function seed(page,version=2,audited=false,corrupt=false){
 await page.clock.setFixedTime(new Date(instant));await page.goto("/configuracoes/dados-e-backup");await expect(page.getByRole("button",{name:"Exportar arquivo",exact:true})).toBeEnabled();
 const backup=oldBackup(version,audited),saved=await read(page);
 const metadata={...saved.metadata,executionBridgeVersion:version,authorityEpoch:3,datasetRevision:10};
 const planner={id:"planner/current",role:"active",format:"dayforge/legacy-planner-state",formatVersion:1,sourceContentFingerprint:backup.payload.provenance.contentFingerprint,payload:state};
 const bridge={id:"execution/bridge",role:"active",format:"dayforge/execution-bridge",formatVersion:version,sourceContentFingerprint:corrupt?"0".repeat(64):backup.payload.executionBridge.contentFingerprint,payload:backup.payload.executionBridge.bridge};
 await page.evaluate(({metadata,planner,bridge,raw})=>new Promise((resolve,reject)=>{localStorage.setItem("rotina-369:data:v1",raw);localStorage.setItem("dayforge:persistence:v2","active");const r=indexedDB.open("dayforge-local");r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction(["metadata","plannerDocuments"],"readwrite");tx.objectStore("metadata").clear();tx.objectStore("plannerDocuments").clear();tx.objectStore("metadata").put(metadata);tx.objectStore("plannerDocuments").put(planner);tx.objectStore("plannerDocuments").put(bridge);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}),{metadata,planner,bridge,raw:JSON.stringify(state)});
 return backup;
}
async function exportUI(page){await page.goto("/configuracoes/dados-e-backup");await expect(page.getByRole("button",{name:"Exportar arquivo",exact:true})).toBeEnabled();const downloading=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar arquivo",exact:true}).click();return JSON.parse(await readFile(await(await downloading).path(),"utf8"));}
async function importUI(page,backup){await page.goto("/configuracoes/dados-e-backup");await expect(page.getByRole("button",{name:"Selecionar arquivo",exact:true})).toBeEnabled();await page.locator('input[type="file"]').setInputFiles({name:"fictional-backup.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(backup))});await expect(page.getByRole("status")).toContainText("Backup importado com sucesso");await expect(page.locator(".storage-warning")).toHaveCount(0);}
for(const version of [1,2])test(`installed bridge ${version} upgrades once, reopens and exports complete backup 3`,async({page})=>{
 const old=await seed(page,version,version===2);await page.goto("/hoje");await expect(page.getByRole("region",{name:"Resumo",exact:true})).toContainText("1 itens no dia");
 const migrated=await read(page);expect(migrated.metadata.datasetRevision).toBe(11);expect(migrated.metadata.authorityEpoch).toBe(3);expect(migrated.metadata.schemaVersion).toBe(1);expect(migrated.planner.formatVersion).toBe(2);expect(migrated.bridge.formatVersion).toBe(3);
 expect(migrated.planner.payload.legacy).toEqual(state);expect(migrated.bridge.payload.entries[0]).toEqual({...old.payload.executionBridge.bridge.entries[0],kind:"legacy_partial"});
 if(version===2)await expect(page.getByRole("region",{name:"Próximo",exact:true})).toContainText("20:00–21:00");
 await page.reload();await expect(page.locator(".storage-warning")).toHaveCount(0);expect(await read(page)).toEqual(migrated);
 const backup=await exportUI(page);expect(backup.formatVersion).toBe(3);expect(backup.payload.planner.legacy).toEqual(state);expect(backup.payload.executionBridge.bridge).toEqual(migrated.bridge.payload);expect(JSON.stringify(backup)).not.toContain("datasetRevision");expect(JSON.stringify(backup)).not.toContain("authorityEpoch");
 expect(await page.evaluate(()=>localStorage.getItem("rotina-369:data:v1"))).toBe(JSON.stringify(state));
});
test("backup 3 restore and old backup imports replace the full authority while preserving rescheduling",async({page})=>{
 const old=await seed(page,2,true);await page.reload();const backup=await exportUI(page),before=await read(page);await importUI(page,backup);const restored=await read(page);
 expect(restored.metadata.authorityEpoch).toBe(before.metadata.authorityEpoch+1);expect(restored.metadata.datasetRevision).toBe(before.metadata.datasetRevision+1);expect(restored.planner).toEqual(before.planner);expect(restored.bridge).toEqual(before.bridge);
 await importUI(page,old);expect((await read(page)).bridge.payload.entries[0].planningAudit).toEqual(old.payload.executionBridge.bridge.entries[0].planningAudit);
 await importUI(page,state);expect((await read(page)).bridge.payload.entries[0].planningAudit).toBeUndefined();expect((await read(page)).bridge.payload.entries[0].execution).toBeNull();
 await page.goto("/hoje");await expect(page.getByRole("button",{name:"Concluir Atividade fictícia",exact:true})).toBeVisible();
});
test("invalid installed fingerprint fails closed; explicit old backup recovers without v1 fallback",async({page})=>{
 const backup=await seed(page,2,false,true),before=await read(page);await page.reload();await expect(page.locator(".storage-warning")).toBeVisible();expect(await read(page)).toEqual(before);
 await expect(page.getByRole("button",{name:"Exportar arquivo",exact:true})).toBeDisabled();await importUI(page,backup);expect((await read(page)).metadata.authorityEpoch).toBe(4);expect((await read(page)).bridge.formatVersion).toBe(3);
});
test("two pages migrating the same installed dataset converge without duplicated allocation",async({page,context})=>{
 await seed(page);const other=await context.newPage();await other.clock.setFixedTime(new Date(instant));await Promise.all([page.goto("/hoje"),other.goto("/hoje")]);
 for(const current of [page,other]){await expect(current.getByRole("region",{name:"Resumo",exact:true})).toContainText("1 itens no dia");await expect(current.locator(".storage-warning")).toHaveCount(0);}
 const saved=await read(page);expect(saved.metadata.datasetRevision).toBe(11);expect(saved.bridge.payload.nextSequence).toBe(2);expect(await read(other)).toEqual(saved);
});
test("post-upgrade completion and rescheduling preserve original identity and backup 3 audit",async({page})=>{
 await seed(page);await page.goto("/hoje");await page.getByRole("button",{name:"Reagendar Atividade fictícia",exact:true}).click();await page.getByLabel("Confirmo este planejamento anterior",{exact:true}).check();await page.getByLabel("Novo início",{exact:true}).fill(`${date}T20:00`);await page.getByLabel("Novo fim",{exact:true}).fill(`${date}T21:00`);await page.getByRole("button",{name:"Confirmar reagendamento",exact:true}).click();await expect(page.getByRole("dialog")).toHaveCount(0);
 await page.getByRole("button",{name:"Concluir Atividade fictícia",exact:true}).click();await page.getByLabel("Início real",{exact:true}).fill(`${date}T08:10`);await page.getByLabel("Fim real",{exact:true}).fill(`${date}T08:50`);await page.getByRole("button",{name:"Confirmar conclusão",exact:true}).click();await expect(page.getByRole("dialog")).toHaveCount(0);
 const backup=await exportUI(page);expect(backup.payload.executionBridge.bridge.entries[0].occurrenceId).toBe("occ:1");expect(backup.payload.executionBridge.bridge.entries[0].planningAudit.rescheduleHistory).toHaveLength(1);expect(backup.payload.executionBridge.bridge.entries[0].execution.id).toBe("execution:occ:1");await importUI(page,backup);expect((await read(page)).bridge.payload).toEqual(backup.payload.executionBridge.bridge);
});
test("backup compatibility text and unchanged shell remain accessible at desktop and 390px without read mutations",async({page})=>{
 await seed(page);await page.reload();await expect(page.getByRole("button",{name:"Exportar arquivo",exact:true})).toBeEnabled();await expect(page.getByText("Restaure um backup v3, v2 ou um arquivo legado v1 compatível.",{exact:true})).toBeVisible();
 const before=await read(page);await page.getByRole("button",{name:"Exportar arquivo",exact:true}).focus();await expect(page.getByRole("button",{name:"Exportar arquivo",exact:true})).toBeFocused();await page.screenshot({path:"outputs/model-recovery-desktop.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});await expect(page.getByRole("heading",{name:"Dados e backup",exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"outputs/model-recovery-390.png",fullPage:true});expect(await read(page)).toEqual(before);
});
