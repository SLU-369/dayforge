# Frontend DOX

## Purpose

- Own the Dayforge App Router experience, horizontal application shell, planner client state, and local-first data boundary.

## Ownership

- `layout.tsx` owns global providers and the shell boundary.
- `planner-context.tsx` owns shared client state and persistence lifecycle.
- `planner-repository.ts` owns browser storage and JSON backup I/O.
- `planner-data.ts` owns the versioned planner domain types, defaults, and reusable date/duration helpers.
- Route folders own only their page composition; shared navigation belongs in `components/shell/navigation-config.tsx`.

## Local Contracts

- Preserve the exact `rotina-369:data:v1` storage contract unless an explicit migration is approved.
- Keep historical daily records independent from later routine edits.
- New mocked domains must not be written into the v1 planner payload.
- `/` is the canonical Hoje route. Product areas use real, directly loadable App Router routes.
- Backup, import, and reset controls belong under `/configuracoes/dados-e-backup`, never in primary navigation.
- Keep backend, D1, Worker, and API changes outside frontend-only stages.

## Work Guidance

- Keep user-facing copy in Brazilian Portuguese and code identifiers in English.
- Extend semantic tokens in `globals.css`; co-locate complex component styling and avoid rebuilding a global CSS monolith.
- Preserve the day/night bootstrap and both background assets.
- Use the shared planner context and repository instead of reading or writing local storage from individual pages.
- Every interactive overlay must support keyboard focus, Escape, and reduced motion.
- Do not present demonstrative data as persisted user data.

## Verification

- Run `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd test` for behavior changes.
- Verify direct loads for touched routes and compact navigation at 390 px.
- Confirm backup round-trips preserve v1 fields when persistence behavior changes.

## Child DOX Index

- No child AGENTS.md files are needed for the current frontend structure.
