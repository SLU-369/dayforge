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
const {
  PLANNER_STORAGE_KEY,
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
