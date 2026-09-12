import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

function primaryNavigation(html) {
  const match = html.match(/<nav[^>]*aria-label="Navegação principal"[^>]*>(.*?)<\/nav>/s);
  assert.ok(match, "a navegação principal deve existir");
  return match[1];
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
  assert.match(html, /Navegação principal/);
  assert.match(html, /Planejamento/);
  assert.match(html, /Formação/);
  assert.match(html, /Academia/);
  assert.match(html, /Nutri/);
  assert.match(html, /Progresso/);
  assert.doesNotMatch(html, /O que importa agora/);
  assert.ok(
    html.indexOf("dayforge:theme:v1") < html.indexOf("<body"),
    "o bootstrap do tema deve executar no head, antes da hidratação",
  );
  assert.doesNotMatch(html, /Barra lateral|Obter StandUp|Nenhum gerente|codex-preview|react-loading-skeleton/i);
  const bootstrap = Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)).find((m) => m[1].includes("dayforge:theme:v1"))?.[1];
  assert.ok(bootstrap, "bootstrap deve existir no HTML de produção");
  const root = { dataset: {}, style: {} };
  vm.runInNewContext(bootstrap, { document: { documentElement: root }, window: { matchMedia: () => ({ matches: false }), setTimeout() {} }, localStorage: { getItem: () => null } });
  assert.equal(root.dataset.theme, "day", "bootstrap compilado deve ser autossuficiente");
});

test("expõe Rotina e Cursos rápidos na taxonomia da navegação", () => {
  const navigation = readFileSync(new URL("../components/shell/navigation-config.tsx", import.meta.url), "utf8");
  assert.match(navigation, /label: "Rotina"/);
  assert.match(navigation, /label: "Cursos rápidos"/);
  assert.doesNotMatch(navigation, /Rotina-base/);
});

test("mantém apenas uma área principal ativa por rota", async () => {
  const routes = ["/hoje", "/planejamento/semana", "/formacao/academico", "/academia", "/nutri/calculadoras", "/progresso"];

  for (const pathname of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const navigation = primaryNavigation(await response.text());
    assert.equal((navigation.match(/data-active="true"/g) ?? []).length, 1, pathname);
  }
});

test("renderiza rotas principais do novo shell", async () => {
  const routes = [
    ["/planejamento/agenda", /Preparando seu painel/],
    ["/planejamento/rotina", /Preparando seu painel/],
    ["/hoje", /Preparando seu painel/],
    ["/formacao/academico", /Faculdade com contexto/],
    ["/formacao/cursos-rapidos", /Aprendizados curtos, com propósito/],
    ["/academia", /Treino como prática/],
    ["/nutri", /Alimentação com direção/],
    ["/nutri/plano", /Seu plano, refeição por refeição/],
    ["/nutri/calculadoras", /estimativas gerais, não como prescrição clínica/],
    ["/progresso", /Uma leitura clara da sua evolução/],
    ["/configuracoes/dados-e-backup", /Dados e backup/],
    ["/configuracoes/aparencia", /A luz acompanha você/],
  ];

  for (const [pathname, expected] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), expected, pathname);
  }
});
