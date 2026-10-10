# AGENTS.md — Dayforge

## Contrato e leitura contextual

- A solicitação explícita do usuário prevalece sobre diretrizes de skills e deste arquivo, respeitando as restrições do ambiente.
- Leia este arquivo e os AGENTS.md aplicáveis ao caminho da tarefa. Reutilize o conteúdo já lido na sessão; releia quando mudar ou houver dúvida.
- Os arquivos filhos refinam regras locais; contratos de produto, segurança e autorização continuam válidos.
- Consulte documentação adicional conforme a mudança, sem exigir a leitura do repositório inteiro para ajustes pequenos.
- Conclua a etapa autorizada, incluindo implementação e verificação proporcional. Resolva decisões rotineiras sem novas confirmações; pergunte apenas quando a resposta alterar materialmente o resultado.
- Autonomia não autoriza iniciar outra etapa, alterar o escopo, abrir PR, fazer merge ou deploy. Commit e push seguem a autorização permanente na seção Git.
- Atualize o AGENTS.md mais próximo quando contratos, comandos, responsabilidades ou preferências duráveis mudarem. Atualize pais e índices somente quando afetados; não registre um diário aqui.
- Crie um arquivo filho apenas para uma fronteira durável. Estrutura: Purpose, Ownership, Local Contracts, Work Guidance, Verification e Child DOX Index; não invente verificações inexistentes.
- Quando o usuário autorizar agentes paralelos, delegue frentes independentes com responsabilidade clara. O agente principal integra e verifica o resultado.

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md

- The visual stage through B.3 is concluded and approved in its delivered photographic form: horizontal navigation, layout, day/night themes, solar tracking, orange sunset, skyline occlusion, water/waterfall/cloud motion, existing visitors and diffuse heading contrast. Preserve this baseline; there is no outstanding visual refinement required to close this stage.
- Earlier ideas for articulated 3D visitors, richer animation or other visual refinements are future planning inputs, not active tasks or acceptance blockers. Await the user's reformulated plan and explicit implementation scope before developing them or extending navigation. Do not automatically resume the old B.3 substage sequence or begin Stage C.
- Keep the rejected full 3D landscape inactive, including old preview URLs, and retain its existing code/assets for recoverability. The approved scene does not claim to include articulated 3D creatures. If a future plan authorizes them, use properly animated models, free assets first and explicit approval for purchases. Automatic commit and branch push follow the Git workflow below. Merge and stage advancement require explicit authorization.
- The numbered files in `docs/` are the canonical product and architecture source. `docs/DAYFORGE_MASTER_SPEC.md` is generated from them and must not be edited independently.
- Stage 2C-A establishes logical execution bridge 2, optional explicit planningAudit and local authorityEpoch recovery. Never infer planningAudit on upgrade. Stage 2C-B adds explicit rescheduling of pending canonical occurrences, with confirmed baseline, append-only history, epoch/revision fencing and effective Today projection while retaining the physical legacy anchor. Terminal correction and any later stage require their own authorization.
- Official appearance modes for the current roadmap are Light, Dark, and Solar. Do not add an explicit System mode without a later approved decision.
- The first local planning engine will use deterministic TypeScript isolated from React UI. Python remains a candidate for justified prototyping, simulation, optimization, or future server-side execution; do not add it to the local production runtime by preference alone.
- Temporal flexibility has exactly `fixed`, `preferred`, and `flexible`. Opportunity is represented by availability windows or contexts, never by an `opportunistic` flexibility value.
- Temporal terminal states are `completed`, `completed_rescheduled`, `not_completed`, and `cancelled`. Corrections require a future explicitly audited operation; no terminal state silently returns to `planned`.
- IndexedDB with Dexie is the approved local v2 persistence direction. Preserve `rotina-369:data:v1` through a validated, idempotent, reversible migration; before that migration, a read failure must never cause defaults to overwrite the original payload.
- Stage 1.2 is approved as four separately gated substages: persistence foundation, validated v1-to-v2 migration, v2 backup/restore, then bootstrap and cutover. IndexedDB cannot become authoritative before v2 backup and restore are validated. The initial internal Dexie schema is version 1 with only `metadata` and `plannerDocuments`; do not persist temporal entities without real producers and consumers.
- Stage 1.2D activates IndexedDB for the planner after validated migration and backup. The visible backup UI exports v2 and accepts v2 or compatible v1 imports. The v1 payload remains intact and read-only.
- Migration preserves a typed legacy snapshot instead of inventing missing temporal semantics. Raw SHA-256 identifies byte-specific sources; canonical content SHA-256 controls operational idempotency. Before cutover, v1 remains authoritative and migration failures roll back v2. After cutover there is no dual-write or lossless rollback promise to v1; IndexedDB metadata is authoritative when valid, while `dayforge:persistence:v2` is a fail-safe sentinel that prevents fallback to stale v1 data.
- Go remains the desired future backend language and starts as a modular monolith only when API, authentication, multi-user, cloud, sync, remote storage, or server-side security creates a concrete need.

## Child DOX Index

- `app/AGENTS.md`: frontend routes, shell, client-state boundary, local persistence, and UI architecture.
- `domain/AGENTS.md`: pure TypeScript domain contracts, temporal invariants, and dependency boundaries.
- `persistence/AGENTS.md`: local persistence generation v2, validated storage contracts, Dexie schema, migration, logical backup/restore, bootstrap, and repository boundaries.
- `components/appearance/AGENTS.md`: atmospheric castle composition, solar transition, and motion scheduling.
- `public/backgrounds/hogwarts/AGENTS.md`: generated scene assets, provenance, and optimization constraints.
- `public/scenes/AGENTS.md`: retained licensed GLB and texture decoder assets for the inactive 3D experiment.
- `tooling/scene-assets/AGENTS.md`: offline material sanitation and model compression workflow.
- `tooling/docs/AGENTS.md`: deterministic generation and verification of the derived master specification.
- Root-owned files: README.md, LICENSE, banner.jpg, video-thumbnail.jpg, and root-level project documentation, including `SCENE-ASSET-AUDIT.md` (historical 3D asset provenance and preparation record; not an active implementation plan).

## Project overview

Dayforge is a local-first personal planning dashboard. It turns a reusable weekly routine into independent daily records, tracks completed and actual minutes, and summarizes monthly consistency, category time, energy, notes, and goals. Its frontend shell also reserves staged product areas for Formation, Gym, Nutri, and Progress without adding persistence before each domain is implemented. IndexedDB is the planner source of truth; the v1 `localStorage` payload is preserved read-only. JSON v2 export and v2/v1 import provide backup and restore.

The product UI and user-facing copy are in Brazilian Portuguese.

## Stack

- React 19 and TypeScript with strict type checking.
- Next.js App Router-compatible APIs, built and served through Vinext.
- Tailwind CSS 4 plus project-specific styles in `app/globals.css`.
- Vite 8 for development and production builds.
- Cloudflare Workers runtime and bindings through `worker/index.ts`.
- Drizzle ORM prepared for Cloudflare D1; the production schema is intentionally empty until durable server persistence is required.
- OpenAI/ChatGPT integration is currently limited to the platform authentication-header helper in `app/chatgpt-auth.ts`. The planner does not call the OpenAI API and does not require an OpenAI API key.

## Directory map

- `app/`: App Router pages, layout, planner state/repository, domain types/default data, global styles, and ChatGPT auth helper.
- `domain/`: browser-independent TypeScript domain contracts and pure rules shared by future product areas.
- `persistence/`: active Dexie repository, typed legacy migration, logical v2 backup/restore, and fail-safe bootstrap/cutover.
- `components/shell/`: horizontal navigation, contextual navigation, mega menus, profile menu, and compact drawer.
- `components/pages/`: shared page-level presentation used by staged product areas.
- `components/ui/`: reusable interactive UI primitives.
- `components/appearance/`: decorative castle lighting, moving clouds, and occasional sky visitors.
- `worker/`: Cloudflare Worker entry point, asset/image handling, and Vinext request routing.
- `db/`: Drizzle D1 access helper and production schema.
- `drizzle/`: generated Drizzle migration metadata.
- `examples/d1/`: opt-in D1 example; it is not part of the current planner data path.
- `tooling/`: source for the custom Sites/Vite packaging plugin.
- `.github/workflows/ci.yml`: minimum pull-request and `main` verification for docs, lint, typecheck, build, and tests.
- `build/`, `dist/`, `.next/`, `.wrangler/`: generated output; never commit these directories.
- `.openai/`: non-secret Sites hosting bindings. Never put credentials here.
- `tests/`: Node tests for the server-rendered shell, appearance compatibility, bootstrap, and offline solar calculations.
- `public/`: static icons and other public assets.
- `INICIAR.bat`: Windows double-click launcher for local development.

## Local workflow

Node.js 22.13 ou superior. No PowerShell, use `npm.cmd`; não é necessário relaxar a execution policy para executar npm.

- Instalação a partir do lockfile: `npm.cmd ci` (primeiro uso ou dependências alteradas).
- Desenvolvimento: `npm.cmd run dev -- --port 3000` ou `INICIAR.bat`.
- Lint: `npm.cmd run lint`; tipos: `npm.cmd run typecheck`.
- Build: `npm.cmd run build`; servir build: `npm.cmd start`.
- Suíte: `npm.cmd test` já executa o build. Evite construir novamente antes dela sem necessidade.
- Documentação canônica: `npm.cmd run docs:master:check`.
- `npm.cmd run db:generate` somente após alteração intencional em `db/schema.ts`; revise o SQL e os metadados gerados.

## Verificação proporcional

- Texto e instruções: revise o diff, links/comandos e `git diff --check`. Rode `docs:master:check` quando os documentos numerados ou seu gerador forem afetados.
- Código: rode lint, typecheck e testes que cobrem a mudança. Antes de concluir uma alteração de comportamento, rode a suíte existente (`npm.cmd test`, incluindo build).
- Não crie testes que apenas repitam a implementação de ajustes reversíveis. Não repita verificações aprovadas sem nova alteração, falha ou preocupação concreta.
- Registre erros e limitações reais; não declare verificações que não executou.

## Environment and bindings

No application environment variable is required for the current local-first planner. Do not create or commit a real `.env` file unless a future feature explicitly needs one.

Runtime binding names used by the Cloudflare worker:

- `ASSETS`
- `IMAGES`
- `DB` (optional until D1 persistence is enabled)

Optional non-secret tooling environment names referenced by the Vite configuration:

- `CODEX_SANDBOX`
- `WRANGLER_WRITE_LOGS`
- `WRANGLER_LOG_PATH`
- `MINIFLARE_REGISTRY_PATH`

If a future OpenAI API integration is added, use the environment name `OPENAI_API_KEY`; never place its value in source, examples, fixtures, logs, `.openai/`, or `db/`.

## Code conventions

- Keep TypeScript strict and avoid `any`; keep legacy v1 planner payload types in `app/planner-data.ts`, new domain contracts in `domain/`, and appearance types in `app/appearance.ts`.
- Keep interactive browser state behind a `"use client"` boundary.
- Preserve versioning and backward compatibility for the `rotina-369:data:v1` local-storage payload. Add a migration before changing its shape incompatibly.
- If the v1 payload cannot be read, preserve its original bytes and block automatic persistence of defaults until explicit recovery through backup import or reset. This guard is active in the current baseline.
- Treat the weekly routine as a template and daily records as immutable historical snapshots; editing the routine must not rewrite past records.
- Keep UI text in Brazilian Portuguese and code identifiers in descriptive English.
- Reuse `CATEGORIES`, date helpers, and duration helpers instead of duplicating domain logic.
- Maintain keyboard focus states, labels, responsive layouts, and reduced-motion support.
- Do not add a backend, D1 persistence, authentication gates, or OpenAI calls speculatively. Add them only for a concrete product requirement.
- Never commit secrets. Before staging, review `git status`, ignored files, and a secret-pattern scan. Keep local data, backups, generated output, and credentials out of Git.
- Validate behavior changes according to the proportional verification section before committing.
- Keep the horizontal shell and route map in `components/shell/navigation-config.tsx`; never reintroduce a desktop sidebar.
- Mega-menu/compact-drawer icons draw their SVG strokes progressively on hover and keyboard focus, without flipping or moving the glyph. Desktop navigation draws a bottom accent underline only on hover/focus, using the current theme. Keep labels, link semantics, and layout stable; respect reduced motion.
- Appearance is isolated from planner persistence. Clouds may move continuously, but creatures, birds, and broom riders appear occasionally, with quiet intervals; all ambient motion must be pausable.

## Git e integração

- Antes de editar, confira branch, `git status --short --branch` e o diff relevante. Preserve alterações existentes; não use reset, stash ou checkout automático para limpar a árvore.
- Nunca implemente ou faça commit na `main`. Para novo trabalho, use branch temporária descritiva da `main` atualizada; para continuidade, preserve a base da tarefa autorizada.
- Se houver alterações na `main`, criar a branch com `git switch -c <tipo>/<objetivo>` preserva o conteúdo. Não atribua alterações anteriores à tarefa atual.
- Use `feat/`, `fix/`, `docs/`, `chore/` ou `refactor/`; nunca use `codex` em branches ou mensagens de commit.
- Faça commits locais coerentes de trabalho concluído e validado, no formato Conventional Commits. Se houver alterações alheias no mesmo arquivo, deixe o diff para revisão em vez de incluí-las.
- Adicione apenas os arquivos/hunks do escopo, nunca `git add -A`. Informe o hash dos commits criados.
- Após concluir e validar o escopo, faça commit e push automaticamente da branch de trabalho, sem nova confirmação. Se autenticação, validação ou divergência impedir publicação, preserve o trabalho e informe o bloqueio; não use force-push nem push direto para main.
- Abra PR somente após autorização explícita do usuário para aquela PR e no momento solicitado. Merge e deploy exigem autorização própria.
- Integração por PR para `main`, com checks aprovados e revisão. Exclua a branch apenas após merge aprovado e confirmado, sem trabalho pendente.
- Termine a etapa solicitada antes de entregar; aguarde autorização para a próxima etapa do produto.

## Segurança e dados

- Aplique os controles pertinentes à superfície alterada. `docs/checklist-seguranca.md`, seção 0, é referência contextual de segurança/design; não exige criar CLAUDE.md, novos scanners, hooks ou pipelines em toda tarefa.
- Preserve autenticação/autorização, validação, parsing seguro, proteção contra injection, encoding e logging apropriados quando aplicáveis. Não force headers HTTP em documentação ou módulos sem HTTP.
- Segredos vêm do ambiente, sem fallback real ou valores em logs. Não crie `.env` real por iniciativa própria; documente nomes com placeholders quando uma funcionalidade precisar deles.
- Dados pessoais, backups, bancos e exports reais ficam fora do Git. Testes, documentação e exemplos usam dados fictícios; logs usam IDs internos.
- Preserve os padrões do `.gitignore`; não bloqueie novos formatos ou reconfigure CI/hooks sem uma necessidade da tarefa. Mantenha arquivos de exemplo sem dados reais explicitamente identificados.
- Antes de commitar, confira o diff e arquivos adicionados para evitar segredos e dados pessoais. Relate achados concretos e corrija os que pertencem ao escopo.
- Não reescreva histórico, rotacione credenciais ou altere infraestrutura sem autorização específica.
