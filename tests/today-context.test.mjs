import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext };
const dataSource = readFileSync(new URL("../app/planner-data.ts", import.meta.url), "utf8");
const dataCompiled = ts.transpileModule(dataSource, { compilerOptions }).outputText;
const dataUrl = `data:text/javascript;base64,${Buffer.from(dataCompiled).toString("base64")}`;
const contextSource = readFileSync(new URL("../app/today-context.ts", import.meta.url), "utf8")
  .replace('"./planner-data"', JSON.stringify(dataUrl));
const contextCompiled = ts.transpileModule(contextSource, { compilerOptions }).outputText;
const { createDefaultState } = await import(dataUrl);
const { deriveTodayContext } = await import(`data:text/javascript;base64,${Buffer.from(contextCompiled).toString("base64")}`);

const monday = "2026-09-28";
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const emptyRoutine = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
const at = (day, hour, minute = 0) => new Date(2026, 8, day, hour, minute);

function item(id, start, end, completed = false) {
  return { id, start, end, title: id, notes: "", category: "estudo", completed };
}

function stateWith(items, date = monday) {
  return {
    ...createDefaultState(),
    routine: emptyRoutine,
    records: { [date]: { date, items, note: "", energy: 3 } },
  };
}

test("dia vazio retorna cinco blocos factuais vazios", () => {
  const context = deriveTodayContext(stateWith([]), at(28, 8), timeZone);
  assert.equal(context.agora, null);
  assert.equal(context.proximo, null);
  assert.deepEqual(context.depois, []);
  assert.deepEqual(context.atencao, []);
  assert.deepEqual(context.resumo, { total: 0, completed: 0, active: 0, future: 0, attention: 0 });
});

test("item futuro nunca é Agora e Próximo contém apenas o primeiro", () => {
  const context = deriveTodayContext(stateWith([
    item("later", "11:00", "12:00"), item("first", "09:00", "10:00"), item("middle", "10:00", "11:00"),
  ]), at(28, 8), timeZone);
  assert.equal(context.agora, null);
  assert.equal(context.proximo?.title, "first");
  assert.deepEqual(context.depois.map((entry) => entry.title), ["middle", "later"]);
  assert.equal(context.resumo.future, 3);
});

test("intervalo semiaberto inclui o início exato e exclui o fim exato", () => {
  const state = stateWith([item("active", "09:00", "10:00"), item("next", "10:00", "11:00")]);
  assert.equal(deriveTodayContext(state, at(28, 9), timeZone).agora?.title, "active");
  assert.equal(deriveTodayContext(state, at(28, 9, 59), timeZone).agora?.title, "active");
  const atEnd = deriveTodayContext(state, at(28, 10), timeZone);
  assert.equal(atEnd.agora?.title, "next");
  assert.equal(atEnd.proximo, null);
});

test("empates possuem ordenação determinística por fim e id", () => {
  const state = stateWith([
    item("z", "09:00", "11:00"), item("b", "09:00", "10:00"), item("a", "09:00", "10:00"),
  ]);
  const first = deriveTodayContext(state, at(28, 8), timeZone);
  assert.equal(first.proximo?.title, "a");
  assert.deepEqual(first.depois.map((entry) => entry.title), ["b", "z"]);
  assert.deepEqual(deriveTodayContext(state, at(28, 8), timeZone), first);
});

test("outro dia não contamina o contexto; item que cruza meia-noite aparece no dia seguinte", () => {
  const state = stateWith([item("overnight", "23:00", "01:00"), item("morning", "08:00", "09:00")]);
  state.records["2026-09-29"] = {
    date: "2026-09-29", items: [item("tomorrow", "10:00", "11:00")], note: "", energy: 3,
  };
  const mondayContext = deriveTodayContext(state, at(28, 23, 30), timeZone);
  assert.equal(mondayContext.agora?.title, "overnight");
  assert.equal(mondayContext.resumo.total, 2);
  const tuesdayContext = deriveTodayContext(state, at(29, 0, 30), timeZone, "2026-09-29");
  assert.equal(tuesdayContext.agora?.title, "overnight");
  assert.equal(tuesdayContext.proximo?.title, "tomorrow");
  assert.equal(tuesdayContext.resumo.total, 2);
  assert.equal(deriveTodayContext(state, at(29, 1), timeZone, "2026-09-29").agora, null);
});

test("conclusão legada permanece factual e não entra nas filas futuras", () => {
  const context = deriveTodayContext(stateWith([item("done", "09:00", "10:00", true)]), at(28, 8), timeZone);
  assert.equal(context.proximo, null);
  assert.equal(context.resumo.completed, 1);
  assert.equal(context.resumo.total, 1);
});

test("Atenção sinaliza somente intervalo encerrado sem conclusão, sem mudar estado", () => {
  const state = stateWith([
    item("needs-decision", "08:00", "09:00"),
    item("done", "08:00", "09:00", true),
    item("future", "11:00", "12:00"),
  ]);
  const before = structuredClone(state);
  const context = deriveTodayContext(state, at(28, 10), timeZone);
  assert.deepEqual(context.atencao.map((entry) => entry.title), ["needs-decision"]);
  assert.equal(context.resumo.attention, 1);
  assert.equal(context.proximo?.title, "future");
  assert.deepEqual(state, before);
});

test("fuso IANA explícito governa a interpretação do horário legado", () => {
  const state = stateWith([item("local", "09:00", "10:00")]);
  const reference = new Date("2026-09-28T12:30:00.000Z");
  assert.equal(deriveTodayContext(state, reference, "America/Sao_Paulo").agora?.title, "local");
  assert.equal(deriveTodayContext(state, reference, "UTC").agora, null);
});

test("horário inexistente na mudança de fuso falha fechado quando não forma intervalo", () => {
  const state = stateWith([item("gap", "02:30", "03:30")], "2026-03-08");
  assert.throws(() => deriveTodayContext(state, new Date("2026-03-08T07:00:00.000Z"), "America/New_York", "2026-03-08"), /Intervalo legado inválido/);
});

test("leitura rejeita horários inválidos sem tocar em armazenamento", () => {
  const previousLocal = globalThis.localStorage;
  const previousIndexed = globalThis.indexedDB;
  const forbidden = new Proxy({}, { get() { throw new Error("storage access"); } });
  globalThis.localStorage = forbidden;
  globalThis.indexedDB = forbidden;
  try {
    assert.equal(deriveTodayContext(stateWith([item("valid", "09:00", "10:00")]), at(28, 8), timeZone).proximo?.title, "valid");
    assert.throws(() => deriveTodayContext(stateWith([item("invalid", "25:00", "10:00")]), at(28, 8), timeZone), /Horário legado inválido/);
  } finally {
    globalThis.localStorage = previousLocal;
    globalThis.indexedDB = previousIndexed;
  }
});
