# AGENTS.md

# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md

- The visual stage through B.3 is concluded and approved in its delivered photographic form: horizontal navigation, layout, day/night themes, solar tracking, orange sunset, skyline occlusion, water/waterfall/cloud motion, existing visitors and diffuse heading contrast. Preserve this baseline; there is no outstanding visual refinement required to close this stage.
- Earlier ideas for articulated 3D visitors, richer animation or other visual refinements are future planning inputs, not active tasks or acceptance blockers. Await the user's reformulated plan and explicit implementation scope before developing them or extending navigation. Do not automatically resume the old B.3 substage sequence or begin Stage C.
- Keep the rejected full 3D landscape inactive, including old preview URLs, and retain its existing code/assets for recoverability. The approved scene does not claim to include articulated 3D creatures. If a future plan authorizes them, use properly animated models, free assets first and explicit approval for purchases. Stage authorization never permits automatic push, merge or advancement.
- The numbered files in `docs/` are the canonical product and architecture source. `docs/DAYFORGE_MASTER_SPEC.md` is generated from them and must not be edited independently.
- Official appearance modes for the current roadmap are Light, Dark, and Solar. Do not add an explicit System mode without a later approved decision.
- The first local planning engine will use deterministic TypeScript isolated from React UI. Python remains a candidate for justified prototyping, simulation, optimization, or future server-side execution; do not add it to the local production runtime by preference alone.
- Temporal flexibility has exactly `fixed`, `preferred`, and `flexible`. Opportunity is represented by availability windows or contexts, never by an `opportunistic` flexibility value.
- Temporal terminal states are `completed`, `completed_rescheduled`, `not_completed`, and `cancelled`. Corrections require a future explicitly audited operation; no terminal state silently returns to `planned`.
- IndexedDB with Dexie is the approved local v2 persistence direction. Preserve `rotina-369:data:v1` through a validated, idempotent, reversible migration; before that migration, a read failure must never cause defaults to overwrite the original payload.
- Go remains the desired future backend language and starts as a modular monolith only when API, authentication, multi-user, cloud, sync, remote storage, or server-side security creates a concrete need.

## Child DOX Index

- `app/AGENTS.md`: frontend routes, shell, client-state boundary, local persistence, and UI architecture.
- `domain/AGENTS.md`: pure TypeScript domain contracts, temporal invariants, and dependency boundaries.
- `components/appearance/AGENTS.md`: atmospheric castle composition, solar transition, and motion scheduling.
- `public/backgrounds/hogwarts/AGENTS.md`: generated scene assets, provenance, and optimization constraints.
- `public/scenes/AGENTS.md`: retained licensed GLB and texture decoder assets for the inactive 3D experiment.
- `tooling/scene-assets/AGENTS.md`: offline material sanitation and model compression workflow.
- `tooling/docs/AGENTS.md`: deterministic generation and verification of the derived master specification.
- Root-owned files: README.md, LICENSE, banner.jpg, video-thumbnail.jpg, and root-level project documentation, including `SCENE-ASSET-AUDIT.md` (historical 3D asset provenance and preparation record; not an active implementation plan).

## Project overview

Dayforge is a local-first personal planning dashboard. It turns a reusable weekly routine into independent daily records, tracks completed and actual minutes, and summarizes monthly consistency, category time, energy, notes, and goals. Its frontend shell also reserves staged product areas for Formation, Gym, Nutri, and Progress without adding persistence before each domain is implemented. The current source of truth is versioned browser `localStorage`; JSON export/import provides backup and restore.

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

Use Node.js 22.13 or newer. On Windows, call `npm.cmd` to avoid PowerShell execution-policy issues.

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd start
```

Run `npm.cmd run db:generate` only after an intentional change to `db/schema.ts`, then inspect generated SQL and metadata before committing.

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
- Run lint, build, and tests before committing behavior changes.
- Keep the horizontal shell and route map in `components/shell/navigation-config.tsx`; never reintroduce a desktop sidebar.
- Mega-menu/compact-drawer icons draw their SVG strokes progressively on hover and keyboard focus, without flipping or moving the glyph. Desktop navigation draws a bottom accent underline only on hover/focus, using the current theme. Keep labels, link semantics, and layout stable; respect reduced motion.
- Appearance is isolated from planner persistence. Clouds may move continuously, but creatures, birds, and broom riders appear occasionally, with quiet intervals; all ambient motion must be pausable.

## Versionamento e Boas Práticas (Git)

- **Commits Significativos**: Crie commits apenas quando houver uma alteração relevante e concluída.
- **Mensagens Claras**: Use mensagens claras, padronizadas e objetivas para evitar poluir o histórico.
- **Branches Temporárias**: Para cada nova funcionalidade ou correção, crie uma branch temporária a partir da `main` atualizada.
- **Nomenclatura de Branch**: Use nomes curtos, explícitos e seguindo boas práticas (ex: `feature/nova-funcionalidade`, `fix/correcao-bug`).
- **Foco da Branch**: Mantenha na branch apenas o trabalho relacionado ao seu objetivo.
- **Validação Antes da Integração**: Execute e valide os testes antes de iniciar a integração.
- **Aprovação de Commits**: Informe sempre qual commit foi criado para aprovação do usuário.
- **Autorização Explícita**: Nunca faça push ou merge sem a autorização explícita do usuário.
- **Limpeza de Branches**: Após o merge aprovado e validado na `main`, exclua a branch utilizada local e remotamente.
- **Execução por Etapa**: Implemente somente a etapa explicitamente autorizada, apresente os commits e pare antes de iniciar a próxima.
- **Nomes de Branch e Commit**: Nunca use a palavra `codex` em nomes de branches ou mensagens de commit.

