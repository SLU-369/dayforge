import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const appearance = ts.transpileModule(readFileSync(new URL("../app/appearance.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText.replace('"suncalc"', JSON.stringify(import.meta.resolve("suncalc")));
const domain = await import(`data:text/javascript;base64,${Buffer.from(appearance).toString("base64")}`);
const component = ts.transpileModule(readFileSync(new URL("../components/appearance/manual-celestial.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;

test("troca de tema não agenda invalidação global no meio do percurso", () => {
  const provider = readFileSync(new URL("../app/theme-provider.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(provider, /setTimeout|THEME_TRANSITION_MS/);
  assert.match(provider, /root\.dataset\.theme = next/);
});

test("animação nativa mantém duração, easing único, reversão e movimento reduzido", () => {
  const calls = [];
  const node = () => ({ style: {}, animate(frames, options) { const call = { frames, options, cancelled: false }; calls.push(call); return { cancel() { call.cancelled = true; } }; } });
  const element = node();
  element.children = [node(), node()];
  const refs = [];
  let cursor = 0;
  let effect;
  const exports = {};
  const jsx = (_, props) => { if (props.ref) props.ref.current = element; return null; };
  vm.runInNewContext(component, {
    exports,
    require(name) {
      if (name === "react") return { useRef(value) { return refs[cursor++] ?? (refs[cursor - 1] = { current: value }); }, useEffect(callback) { effect = callback; } };
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "@/app/appearance") return domain;
      return { default: {} };
    },
    window: { innerWidth: 1000 },
    getComputedStyle: (el) => el.computed ?? el.style,
    DOMMatrixReadOnly: class { constructor(transform) { this.m41 = transform ? Number(transform.match(/translate3d\(([\d.]+)/)[1]) * 10 : 0; } },
  });
  const render = (target, reduced = false) => { cursor = 0; exports.ManualCelestial({ target, ready: true, reduced }); return effect(); };
  render(0);
  assert.equal(calls.length, 0, "hidratação não dispara voo");
  const stop = render(1);
  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(call.frames.length, 61);
    assert.equal(call.options.duration, 3600);
    assert.equal(call.options.easing, "cubic-bezier(.42, 0, .58, 1)");
    assert.ok(call.frames.every((frame) => !("easing" in frame)), "não reinicia easing a cada segmento");
  }
  const middle = domain.celestialFrame(.5);
  element.computed = { transform: `translate3d(${middle.x}vw, ${middle.y}vh, 0)` };
  element.children[0].computed = { opacity: String(middle.sun) };
  element.children[1].computed = { opacity: String(middle.moon) };
  stop();
  assert.ok(calls.every((call) => call.cancelled));
  assert.equal(element.style.transform, element.computed.transform);
  const reverseStop = render(0);
  const reversedX = Number(calls[3].frames[0].transform.match(/translate3d\(([\d.]+)/)[1]);
  assert.ok(Math.abs(reversedX - middle.x) < 1e-10);
  assert.equal(calls[4].frames.at(-1).opacity, .7);
  assert.equal(calls[5].frames.at(-1).opacity, 0);
  reverseStop();
  render(1, true);
  assert.equal(calls.length, 6, "movimento reduzido não cria animações");
  assert.equal(element.children[0].style.opacity, "0");
});
