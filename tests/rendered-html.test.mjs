import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renderiza o painel Dayforge", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Dayforge<\/title>/i);
  assert.match(html, /Preparando seu painel/);
  assert.match(html, /<html[^>]*data-theme="night"[^>]*>/i);
  assert.match(html, /dayforge:theme:v1/);
  assert.match(html, /theme-backdrop-day/);
  assert.match(html, /theme-backdrop-night/);
  assert.ok(
    html.indexOf("dayforge:theme:v1") < html.indexOf("<body"),
    "o bootstrap do tema deve executar no head, antes da hidratação",
  );
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
