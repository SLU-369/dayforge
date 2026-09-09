# Frontend DOX

## Purpose

- Own the Dayforge App Router experience, horizontal application shell, planner client state, and local-first data boundary.

## Ownership

- `layout.tsx` owns global providers and the shell boundary.
- `planner-context.tsx` owns shared client state and persistence lifecycle.
- `planner-repository.ts` owns browser storage and JSON backup I/O.
- `planner-data.ts` owns the versioned planner domain types, defaults, and reusable date/duration helpers.
- `appearance.ts` owns appearance preferences, the offline capital catalog, solar calculations, and the standalone theme bootstrap; `theme-provider.tsx` owns their browser lifecycle.
- Route folders own only their page composition; shared navigation belongs in `components/shell/navigation-config.tsx`.

## Local Contracts

- Preserve the exact `rotina-369:data:v1` storage contract unless an explicit migration is approved.
- Keep historical daily records independent from later routine edits.
- New mocked domains must not be written into the v1 planner payload.
- `/hoje` is the primary Hoje route; `/` remains a compatible entry point. Product areas use real, directly loadable App Router routes.
- Backup, import, and reset controls belong under `/configuracoes/dados-e-backup`, never in primary navigation.
- Keep backend, D1, Worker, and API changes outside frontend-only stages.

## Work Guidance

- Keep user-facing copy in Brazilian Portuguese and code identifiers in English.
- Extend semantic tokens in `globals.css`; co-locate complex component styling and avoid rebuilding a global CSS monolith.
- Appearance uses `dayforge:appearance:v1`, mirrors the effective theme to `dayforge:theme:v1`, and keeps a disposable solar cache in `dayforge:solar-cache:v1`. None of these fields belong in planner backups or payloads.
- Default to manual mode and preserve the legacy theme. Automatic mode requires an explicitly selected capital; any manual theme choice disables it until the user enables it again.
- `/configuracoes/aparencia` owns theme/city/motion controls, reachable from the profile and compact drawer. Calculate solar times locally, respect the selected city's timezone, and never request geolocation.
- Re-evaluate automatic light each minute and on focus/visibility restoration. Respect reduced motion and keep bootstrap independent from hydration; expired solar cache waits briefly for client calculation, with a 1.5-second fail-open fallback.
- Automatic mode alone tracks the sun's position and orange twilight. Manual changes use a shared 3.6-second visual phase; synchronize theme tokens at its midpoint and cancel obsolete timers on a new choice.
- Use the shared planner context and repository instead of reading or writing local storage from individual pages.
- Every interactive overlay must support keyboard focus, Escape, and reduced motion.
- Do not present demonstrative data as persisted user data.

### Nutri future contract

- Keep `/nutri`, `/nutri/plano`, and `/nutri/calculadoras` ready for a future user-authored food plan without adding persistence during the frontend reconstruction.
- The future daily target covers calories, protein, fiber, and water; the planned meal groups are breakfast, lunch, snack, and dinner.
- Present future calculator results as general estimates, never individualized clinical prescriptions.
- Use these formulas when calculation behavior is explicitly authorized: BMI = weight in kg / height in m²; weight loss calories = current weight × 20; maintenance calories = current weight × 30; hypertrophy calories = current weight × 35; protein = reference weight × 1.8 g; fiber = calories / 1000 × 14 g; water = current weight × 35 ml.
- Keep Progress as a primary area; its future domain selectors include Gym, College, Technical courses, Standalone activities, and Nutri, with Week, Month, and Year periods.

## Verification

- Run `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd test` for behavior changes.
- Verify direct loads for touched routes and compact navigation at 390 px.
- Confirm backup round-trips preserve v1 fields when persistence behavior changes.

## Child DOX Index

- No child AGENTS.md files are needed for the current frontend structure.
