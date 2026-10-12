import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
test.use({ timezoneId: "UTC" });
const date="2026-10-11",now=`${date}T12:00:00.000Z`;
const item={id:"ficticio",title:"Atividade fictícia",start:"08:00",end:"09:00",notes:"",category:"estudo"};
const state=()=>({version:1,routine:{seg:[item],ter:[],qua:[],qui:[],sex:[],sab:[],dom:[]},records:{[date]:{date,note:"",energy:3,items:[{...item,completed:false}]}},monthlyGoals:{}});
async function seed(page){await page.clock.setFixedTime(new Date(now));await page.addInitScript((raw)=>{if(!localStorage.getItem("rotina-369:data:v1"))localStorage.setItem("rotina-369:data:v1",raw);},JSON.stringify(state()));}
async function open(page,url="/hoje"){await seed(page);await page.goto(url);await expect(page.locator(".app-loading")).toHaveCount(0);await expect(page.getByRole("link",{name:"Adicionar atividade",exact:true})).toBeVisible();}
const read=(page)=>page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open("dayforge-local");req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction(["metadata","plannerDocuments"],"readonly"),m=tx.objectStore("metadata").get("database"),p=tx.objectStore("plannerDocuments").get("planner/current"),b=tx.objectStore("plannerDocuments").get("execution/bridge");tx.oncomplete=()=>{db.close();resolve({metadata:m.result,planner:p.result.payload,bridge:b.result.payload});};tx.onerror=()=>reject(tx.error);};}));
const notice=(page)=>page.getByRole("alert",{name:"Alterações locais preservadas",exact:true});
async function healthy(page){await expect(page.locator(".storage-warning")).toHaveCount(0);}
async function pauseHash(page){await page.evaluate(()=>{const original=crypto.subtle.digest.bind(crypto.subtle);let first=true;window.auditHashEntered=false;window.auditHashRelease=null;crypto.subtle.digest=async(...args)=>{if(first){first=false;window.auditHashEntered=true;await new Promise((r)=>window.auditHashRelease=r);}return original(...args);};});}
async function pendingGoal(page,value="Meta local B"){await pauseHash(page);await page.locator(".goal-panel textarea").fill(value);await expect.poll(()=>page.evaluate(()=>window.auditHashEntered)).toBe(true);}
async function release(page){await page.evaluate(()=>window.auditHashRelease());}
async function routine(page,title){await page.goto("/planejamento/rotina");await expect(page.getByRole("heading",{name:"O molde da sua semana",exact:true})).toBeVisible();await page.getByRole("button",{name:/Seg/}).click();await page.locator(".routine-list").getByRole("button",{name:"Editar",exact:true}).click();await page.getByLabel("Atividade",{exact:true}).fill(title);await page.getByRole("button",{name:"Salvar atividade",exact:true}).click();await expect.poll(async()=>(await read(page)).planner.routine.seg[0].title).toBe(title);}
async function pages(page,context,bURL="/planejamento/agenda"){await open(page);const other=await context.newPage();await open(other,bURL);return other;}

test("A routine / B monthly goal: stale save conflicts, local draft survives, explicit resolution and reload preserve both",async({page,context})=>{
 const b=await pages(page,context),base=await read(page);await pendingGoal(b);await routine(page,"Rotina vencedora A");await release(b);
 await expect(notice(b)).toContainText("outra sessão");await expect(b.locator(".goal-panel textarea")).toHaveValue("Meta local B");await healthy(b);
 const winner=await read(b);expect(winner.planner.routine.seg[0].title).toBe("Rotina vencedora A");expect(winner.planner.monthlyGoals["2026-10"]).toBeUndefined();expect(winner.metadata.datasetRevision).toBe(base.metadata.datasetRevision+1);
 const download=b.waitForEvent("download");await b.getByRole("button",{name:"Baixar rascunho local",exact:true}).click();const draft=JSON.parse(await readFile(await(await download).path(),"utf8"));expect(draft.format).toBe("dayforge-planning-draft");expect(draft.state.monthlyGoals["2026-10"]).toBe("Meta local B");
 await b.screenshot({path:"outputs/planning-conflict-desktop.png",fullPage:true});
 await b.getByRole("button",{name:"Carregar versão salva",exact:true}).focus();await expect(b.getByRole("button",{name:"Carregar versão salva",exact:true})).toBeFocused();b.once("dialog",(d)=>d.accept());await b.keyboard.press("Enter");await expect(notice(b)).toHaveCount(0);
 await b.locator(".goal-panel textarea").fill(draft.state.monthlyGoals["2026-10"]);await expect.poll(async()=>(await read(b)).planner.monthlyGoals["2026-10"]).toBe("Meta local B");
 await b.reload();await expect(b.locator(".goal-panel textarea")).toHaveValue("Meta local B");expect((await read(b)).planner.routine.seg[0].title).toBe("Rotina vencedora A");await healthy(b);
 expect(await b.evaluate(()=>localStorage.getItem("rotina-369:data:v1"))).toBe(JSON.stringify(state()));
});

test("clean idle tab refreshes from validated storage without presenting a conflict",async({page,context})=>{
 const b=await pages(page,context,"/planejamento/rotina");await b.getByRole("button",{name:/Seg/}).click();await routine(page,"Atualizada A");await expect.poll(async()=>(await read(b)).planner.routine.seg[0].title).toBe("Atualizada A");
 await expect(b.locator(".routine-list")).toContainText("Atualizada A");await expect(notice(b)).toHaveCount(0);await healthy(b);
});

for(const action of ["completion","rescheduling"])test(`${action} wins against a delayed old autosave without losing B's draft`,async({page,context})=>{
 const b=await pages(page,context);await pendingGoal(b);await page.getByRole("button",{name:action==="completion"?"Concluir Atividade fictícia":"Reagendar Atividade fictícia",exact:true}).click();
 if(action==="completion"){
  await page.getByLabel("Início real",{exact:true}).fill(`${date}T08:10`);await page.getByLabel("Fim real",{exact:true}).fill(`${date}T08:50`);await page.getByRole("button",{name:"Confirmar conclusão",exact:true}).click();
 }else{
  await page.getByLabel("Confirmo este planejamento anterior",{exact:true}).check();await page.getByLabel("Novo início",{exact:true}).fill(`${date}T20:00`);await page.getByLabel("Novo fim",{exact:true}).fill(`${date}T21:00`);await page.getByRole("button",{name:"Confirmar reagendamento",exact:true}).click();
 }
 await expect(page.getByRole("dialog")).toHaveCount(0);await release(b);await expect(notice(b)).toBeVisible();await expect(b.locator(".goal-panel textarea")).toHaveValue("Meta local B");
 const saved=await read(b);if(action==="completion"){expect(saved.bridge.entries[0].execution).not.toBeNull();expect(saved.planner.records[date].items[0].actualMinutes).toBe(40);}else expect(saved.bridge.entries[0].planningAudit.rescheduleHistory).toHaveLength(1);
 expect(saved.planner.monthlyGoals["2026-10"]).toBeUndefined();await healthy(page);await healthy(b);
});

test("open completion retains fields when a different tab changes the dataset",async({page,context})=>{
 const b=await pages(page,context);await page.getByRole("button",{name:"Concluir Atividade fictícia",exact:true}).click();await page.getByLabel("Início real",{exact:true}).fill(`${date}T08:10`);await page.getByLabel("Fim real",{exact:true}).fill(`${date}T08:50`);
 await b.locator(".goal-panel textarea").fill("Meta A");await expect.poll(async()=>(await read(b)).planner.monthlyGoals["2026-10"]).toBe("Meta A");
 await page.getByRole("button",{name:"Confirmar conclusão",exact:true}).click();await expect(page.getByRole("dialog").getByRole("alert")).toContainText("outra sessão");await expect(page.getByLabel("Início real",{exact:true})).toHaveValue(`${date}T08:10`);expect((await read(page)).bridge.entries[0].execution).toBeNull();await healthy(page);
});

test("restore while another tab has an open legacy editor preserves its inputs and rejects the old authority",async({page,context})=>{
 const b=await pages(page,context,"/planejamento/rotina");await b.getByRole("button",{name:/Seg/}).click();await b.locator(".routine-list").getByRole("button",{name:"Editar",exact:true}).click();await b.getByLabel("Atividade",{exact:true}).fill("Rascunho aberto B");
 await page.goto("/configuracoes/dados-e-backup");await expect(page.getByRole("button",{name:"Selecionar arquivo",exact:true})).toBeEnabled();const imported=state();imported.monthlyGoals["2026-10"]="Importada A";
 await page.locator('input[type="file"]').setInputFiles({name:"fictional-v1.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(imported))});await expect(page.getByRole("status")).toContainText("Backup importado com sucesso");
 await expect(notice(b)).toBeVisible();await expect(b.getByLabel("Atividade",{exact:true})).toHaveValue("Rascunho aberto B");await expect(b.getByRole("button",{name:"Carregar versão salva",exact:true})).toBeDisabled();
 await b.getByRole("button",{name:"Salvar atividade",exact:true}).click();await expect(b.locator(".routine-list")).toContainText("Rascunho aberto B");expect((await read(b)).planner.routine.seg[0].title).toBe("Atividade fictícia");expect((await read(b)).metadata.authorityEpoch).toBe(1);await healthy(b);
});

test("conflict is accessible at 390px with preserved draft and no horizontal overflow",async({page,context})=>{
 const b=await pages(page,context);await b.setViewportSize({width:390,height:844});await pendingGoal(b);await routine(page,"Compacta A");await release(b);await expect(notice(b)).toBeVisible();await expect(b.locator(".goal-panel textarea")).toHaveValue("Meta local B");
 await b.getByRole("button",{name:"Baixar rascunho local",exact:true}).focus();await expect(b.getByRole("button",{name:"Baixar rascunho local",exact:true})).toBeFocused();expect(await b.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await b.screenshot({path:"outputs/planning-conflict-390.png",fullPage:true});await healthy(b);
});

test("explicit valid restore recovers an invalid logical snapshot using destination metadata", async ({page}) => {
 await open(page);await page.goto("/configuracoes/dados-e-backup");
 const download=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar arquivo",exact:true}).click();
 const backup=await readFile(await(await download).path(),"utf8");
 await page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open("dayforge-local");req.onsuccess=()=>{const db=req.result,tx=db.transaction("plannerDocuments","readwrite"),store=tx.objectStore("plannerDocuments"),r=store.get("execution/bridge");
  r.onsuccess=()=>store.put({...r.result,sourceContentFingerprint:"0".repeat(64)});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};req.onerror=()=>reject(req.error);}));
 await page.reload();await expect(page.locator(".storage-warning")).toBeVisible();
 await page.locator('input[type="file"]').setInputFiles({name:"fictional-recovery.json",mimeType:"application/json",buffer:Buffer.from(backup)});
 await expect(page.getByRole("status")).toContainText("Backup importado com sucesso");await healthy(page);
 expect((await read(page)).bridge.entries[0].occurrenceId).toBe("occ:1");expect((await read(page)).metadata.authorityEpoch).toBe(1);
});
