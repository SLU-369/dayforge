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

## Child DOX Index

- No child AGENTS.md files are needed for the current repository structure.
- Root-owned files: README.md, LICENSE, banner.jpg, video-thumbnail.jpg, and root-level project documentation.

## Project overview

Dayforge is a local-first personal planning dashboard. It turns a reusable weekly routine into independent daily records, tracks completed and actual minutes, and summarizes monthly consistency, category time, energy, notes, and goals. The current source of truth is versioned browser `localStorage`; JSON export/import provides backup and restore.

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

- `app/`: App Router pages, layout, planner UI, domain types/default data, global styles, and ChatGPT auth helper.
- `worker/`: Cloudflare Worker entry point, asset/image handling, and Vinext request routing.
- `db/`: Drizzle D1 access helper and production schema.
- `drizzle/`: generated Drizzle migration metadata.
- `examples/d1/`: opt-in D1 example; it is not part of the current planner data path.
- `tooling/`: source for the custom Sites/Vite packaging plugin.
- `build/`, `dist/`, `.next/`, `.wrangler/`: generated output; never commit these directories.
- `.openai/`: non-secret Sites hosting bindings. Never put credentials here.
- `tests/`: Node test that validates the server-rendered application shell.
- `public/`: static icons and other public assets.
- `INICIAR.bat`: Windows double-click launcher for local development.

## Local workflow

Use Node.js 22.13 or newer. On Windows, call `npm.cmd` to avoid PowerShell execution-policy issues.

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run lint
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

- Keep TypeScript strict and avoid `any`; define planner/domain types in `app/planner-data.ts`.
- Keep interactive browser state behind a `"use client"` boundary.
- Preserve versioning and backward compatibility for the `rotina-369:data:v1` local-storage payload. Add a migration before changing its shape incompatibly.
- Treat the weekly routine as a template and daily records as immutable historical snapshots; editing the routine must not rewrite past records.
- Keep UI text in Brazilian Portuguese and code identifiers in descriptive English.
- Reuse `CATEGORIES`, date helpers, and duration helpers instead of duplicating domain logic.
- Maintain keyboard focus states, labels, responsive layouts, and reduced-motion support.
- Do not add a backend, D1 persistence, authentication gates, or OpenAI calls speculatively. Add them only for a concrete product requirement.
- Never commit secrets. Before staging, review `git status`, ignored files, and a secret-pattern scan. Keep local data, backups, generated output, and credentials out of Git.
- Run lint, build, and tests before committing behavior changes.
