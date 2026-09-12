import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext };
const dataSource = readFileSync(new URL("../app/planner-data.ts", import.meta.url), "utf8");
const dataCompiled = ts.transpileModule(dataSource, { compilerOptions }).outputText;
const dataUrl = `data:text/javascript;base64,${Buffer.from(dataCompiled).toString("base64")}`;
const repositorySource = readFileSync(new URL("../app/planner-repository.ts", import.meta.url), "utf8")
  .replace('"./planner-data"', JSON.stringify(dataUrl));
const repositoryCompiled = ts.transpileModule(repositorySource, { compilerOptions }).outputText;
const { createDefaultState } = await import(dataUrl);
const {
  PLANNER_STORAGE_KEY,
  parsePlannerBackup,
  readPlannerState,
  replacePlannerState,
  writePlannerState,
} = await import(`data:text/javascript;base64,${Buffer.from(repositoryCompiled).toString("base64")}`);

function storageWith(value) {
  const values = new Map(value === null ? [] : [[PLANNER_STORAGE_KEY, value]]);
  let writes = 0;
  return {
    values,
    get writes() { return writes; },
    api: {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, next) { writes += 1; values.set(key, next); },
    },
  };
}

function fileWith(value) {
  return { text: async () => value };
}

function serializedDefault(overrides = {}) {
  return JSON.stringify({ ...createDefaultState(), ...overrides });
}

test("payload v1 ilegível permanece intacto e bloqueia autosave de defaults", () => {
  for (const raw of ["", "{conteudo-corrompido"]) {
    const storage = storageWith(raw);
    const previous = globalThis.localStorage;
    globalThis.localStorage = storage.api;
    try {
      const result = readPlannerState();
      assert.equal(result.storageStatus, "blocked");
      assert.equal(result.state.version, 1);
      assert.equal(writePlannerState(result.state, result.storageStatus), false);
      assert.equal(storage.writes, 0);
      assert.equal(storage.values.get(PLANNER_STORAGE_KEY), raw);
    } finally {
      globalThis.localStorage = previous;
    }
  }
});

test("recuperação explícita pode substituir o payload bloqueado", () => {
  const storage = storageWith("{conteudo-corrompido");
  const previous = globalThis.localStorage;
  globalThis.localStorage = storage.api;
  try {
    const result = readPlannerState();
    replacePlannerState(result.state);
    assert.equal(storage.writes, 1);
    assert.equal(JSON.parse(storage.values.get(PLANNER_STORAGE_KEY)).version, 1);
  } finally {
    globalThis.localStorage = previous;
  }
});

test("payloads estruturalmente inválidos permanecem intactos e bloqueados", () => {
  const invalidPayloads = [
    { version: 1, routine: [], records: [] },
    { ...createDefaultState(), routine: { seg: [] } },
    { ...createDefaultState(), routine: { ...createDefaultState().routine, seg: [{ id: "item", start: "08:00", end: "09:00", title: 42, notes: "", category: "estudo" }] } },
    { ...createDefaultState(), records: [] },
    { ...createDefaultState(), records: { "2026-09-12": { date: "2026-09-12", items: [], note: "", energy: "alta" } } },
    { ...createDefaultState(), records: { "2026-09-12": { date: "2026-09-12", items: [{ id: "item", start: "08:00", end: "09:00", title: "Estudo", notes: "", category: "estudo", completed: "sim" }], note: "", energy: 3 } } },
    { ...createDefaultState(), monthlyGoals: { "2026-09": 12 } },
  ];

  for (const payload of invalidPayloads) {
    const raw = JSON.stringify(payload);
    const storage = storageWith(raw);
    const previous = globalThis.localStorage;
    globalThis.localStorage = storage.api;
    try {
      const result = readPlannerState();
      assert.equal(result.storageStatus, "blocked");
      assert.equal(writePlannerState(result.state, result.storageStatus), false);
      assert.equal(storage.writes, 0);
      assert.equal(storage.values.get(PLANNER_STORAGE_KEY), raw);
    } finally {
      globalThis.localStorage = previous;
    }
  }
});

test("payload v1 completo e variantes históricas de monthlyGoals continuam válidos", () => {
  const payloads = [
    serializedDefault(),
    serializedDefault({ monthlyGoals: undefined }),
    serializedDefault({ monthlyGoals: null }),
  ];

  for (const raw of payloads) {
    const storage = storageWith(raw);
    const previous = globalThis.localStorage;
    globalThis.localStorage = storage.api;
    try {
      const result = readPlannerState();
      assert.equal(result.storageStatus, "ready");
      assert.deepEqual(result.state.monthlyGoals, {});
      assert.equal(storage.writes, 0);
      assert.equal(storage.values.get(PLANNER_STORAGE_KEY), raw);
    } finally {
      globalThis.localStorage = previous;
    }
  }
});

test("chave ausente inicializa defaults sem tratar ausência como corrupção", () => {
  const storage = storageWith(null);
  const previous = globalThis.localStorage;
  globalThis.localStorage = storage.api;
  try {
    const result = readPlannerState();
    assert.equal(result.storageStatus, "ready");
    assert.deepEqual(result.state, createDefaultState());
    assert.equal(storage.writes, 0);
  } finally {
    globalThis.localStorage = previous;
  }
});

test("backup estruturalmente inválido é rejeitado sem substituir payload protegido", async () => {
  const raw = JSON.stringify({ version: 1, routine: [], records: [] });
  const storage = storageWith(raw);
  const previous = globalThis.localStorage;
  globalThis.localStorage = storage.api;
  try {
    assert.equal(readPlannerState().storageStatus, "blocked");
    await assert.rejects(parsePlannerBackup(fileWith(raw)), /Formato de backup inválido/);
    assert.equal(storage.writes, 0);
    assert.equal(storage.values.get(PLANNER_STORAGE_KEY), raw);
  } finally {
    globalThis.localStorage = previous;
  }
});

test("backup válido recupera payload protegido e permite retomar persistência", async () => {
  const corruptRaw = JSON.stringify({ version: 1, routine: [], records: [] });
  const storage = storageWith(corruptRaw);
  const previous = globalThis.localStorage;
  globalThis.localStorage = storage.api;
  try {
    assert.equal(readPlannerState().storageStatus, "blocked");
    const recovered = await parsePlannerBackup(fileWith(serializedDefault()));
    replacePlannerState(recovered);
    const updated = { ...recovered, monthlyGoals: { "2026-09": "Retomada confirmada" } };
    assert.equal(writePlannerState(updated, "ready"), true);
    assert.equal(storage.writes, 2);
    assert.deepEqual(JSON.parse(storage.values.get(PLANNER_STORAGE_KEY)), updated);
  } finally {
    globalThis.localStorage = previous;
  }
});

test("reload lógico mantém payload estruturalmente inválido protegido", () => {
  const raw = JSON.stringify({ version: 1, routine: [], records: [] });
  const storage = storageWith(raw);
  const previous = globalThis.localStorage;
  globalThis.localStorage = storage.api;
  try {
    assert.equal(readPlannerState().storageStatus, "blocked");
    assert.equal(readPlannerState().storageStatus, "blocked");
    assert.equal(storage.writes, 0);
    assert.equal(storage.values.get(PLANNER_STORAGE_KEY), raw);
  } finally {
    globalThis.localStorage = previous;
  }
});
