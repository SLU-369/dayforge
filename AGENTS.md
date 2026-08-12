# AGENTS.md

## Project overview

Rotina 369 is a local-first personal planning dashboard. It turns a reusable weekly routine into independent daily records, tracks completed and actual minutes, and summarizes monthly consistency, category time, energy, notes, and goals. The current source of truth is versioned browser `localStorage`; JSON export/import provides backup and restore.

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
