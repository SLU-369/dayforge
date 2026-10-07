# Frontend DOX

## Purpose

- Own the Dayforge App Router experience, horizontal application shell, planner client state, and local-first data boundary.

## Ownership

- `layout.tsx` owns global providers and the shell boundary.
- The layout mounts the photographic `AppearanceBackdrop` once across route changes. Old `?scene=3d` URLs must also show this approved background; the castle model is no longer activated.
- `planner-context.tsx` owns shared client state and persistence lifecycle.
- `planner-repository.ts` retains the v1 parsing and guard compatibility helpers plus JSON download; `persistence/` owns active IndexedDB storage and backup.
- `planner-data.ts` owns only the versioned legacy v1 planner payload types, defaults, and its existing date/duration helpers. New product-domain contracts live in root `domain/`.
- `today-context.ts` owns the pure, read-only projection of the active planner document into daily context; `today-context-view.tsx` owns the contextual Hoje presentation. Neither writes derived context.
- `appearance.ts` owns appearance preferences, the offline capital catalog, solar calculations, and the standalone theme bootstrap; `theme-provider.tsx` owns their browser lifecycle.
- Route folders own only their page composition; shared navigation belongs in `components/shell/navigation-config.tsx`.

## Local Contracts

- Preserve the exact `rotina-369:data:v1` storage contract unless an explicit migration is approved.
- Do not turn legacy v1 planner fields into canonical temporal facts without an explicitly approved migration; Stage 2A's legacy wall-clock projection is read-only.
- A failed v1 read preserves the original stored value, blocks automatic writes, and keeps changes in memory with a persistent warning until explicit recovery through backup import or reset.
- The planner uses the active v2 repository. The v1 repository helpers remain for compatibility tests and may not write the preserved v1 payload in the active UI.
- After cutover, valid active IndexedDB metadata is authoritative and `dayforge:persistence:v2` is a fail-safe sentinel. Never fall back silently to the preserved but stale v1 payload when the marker is active or invalid.
- Keep historical daily records independent from later routine edits.
- The Stage 2A Hoje projection interprets legacy wall-clock times in the device IANA timezone at the UI boundary; the timezone is an explicit read-model argument and is never written as a legacy fact. End time at or before start rolls to the next civil day. A following entry with an exactly matching start/end boundary in the original list continues on that next day; unrelated entries retain their source date. Timed intervals remain half-open.
- An unselected Hoje date follows the current device date across midnight; a user-selected date remains fixed until the user returns to today.
- Hoje shows contextual sections first and retains the existing full-day legacy controls behind `Ver dia completo`; Stage 2A adds no new execution or rescheduling mutations.
- Atenção flags a legacy item only when its projected interval ended and it has no completion record; this is a neutral request for user review, not an inferred failure or terminal temporal status.
- The 2B foundation supplies a validated persistent identity bridge for daily records; Today consumes it in memory while preserving 2A ordering and interval rules. Virtual routine items remain noncanonical projections. No new completion UI or rescheduling is authorized in this foundation. Existing legacy controls cannot reopen or remove a binding carrying a canonical execution.
- New mocked domains must not be written into the v1 planner payload.
- `/hoje` is the primary Hoje route; `/` remains a compatible entry point. Product areas use real, directly loadable App Router routes.
- Backup, import, and reset controls belong under `/configuracoes/dados-e-backup`, never in primary navigation.
- Keep backend, D1, Worker, and API changes outside frontend-only stages.
- The delivered shell and visual stage are approved and closed. Stage 2A authorizes only the read-only contextual Hoje view; execution and rescheduling remain gated, and reserved product routes do not authorize unrelated work.

## Work Guidance

- Keep user-facing copy in Brazilian Portuguese and code identifiers in English.
- Extend semantic tokens in `globals.css`; co-locate complex component styling and avoid rebuilding a global CSS monolith.
- Appearance uses `dayforge:appearance:v1`, mirrors the effective theme to `dayforge:theme:v1`, and keeps a disposable solar cache in `dayforge:solar-cache:v1`. None of these fields belong in planner backups or payloads.
- Default to manual mode and preserve the legacy theme. Automatic mode requires an explicitly selected capital; any manual theme choice disables it until the user enables it again.
- User-facing appearance modes are Light, Dark, and Solar. Do not expose System as a fourth mode in the current roadmap.
- `/configuracoes/aparencia` owns theme/city/motion controls, reachable from the profile and compact drawer. Calculate solar times locally, respect the selected city's timezone, and never request geolocation.
- Re-evaluate automatic light each minute and on focus/visibility restoration. Respect reduced motion and keep bootstrap independent from hydration; expired solar cache waits briefly for client calculation, with a 1.5-second fail-open fallback.
- Automatic mode alone tracks the sun's position and orange twilight. Solar calculations must not dim the disc based on the castle's position; the appearance layer clips sun/moon against a skyline matte in both manual and automatic modes. Manual changes use a 3.6-second visual transition; apply global theme tokens at its start, never via a midpoint timer that invalidates styles during celestial motion.
- Appearance headings stay aligned with the cards and readable over the photograph in both themes. User preference: diffuse, borderless background shading and clear typography; no separate white heading card or rectangular panel.
- Use the shared planner context and repository instead of reading or writing local storage from individual pages.
- Keep the session warning persistent when bootstrap or writes fail; queue planner writes in order and block later automatic writes after a failure. The backup page exports v2, imports v2 or compatible v1, and resets active v2 data only after confirmation.
- Every interactive overlay must support keyboard focus, Escape, and reduced motion.
- Do not present demonstrative data as persisted user data.

### Nutri future contract

- Keep `/nutri`, `/nutri/plano`, and `/nutri/calculadoras` ready for a future user-authored food plan without adding persistence during the frontend reconstruction.
- The future daily target covers calories, protein, fiber, and water; the planned meal groups are breakfast, lunch, snack, and dinner.
- Present future calculator results as general estimates, never individualized clinical prescriptions.
- Treat the documented nutrition formulas as historical candidates until a dedicated review explicitly approves formulas and language. Only then may the authorized calculation behavior be implemented.
- Keep Progress as a primary area. Its principal domain selectors are Formation, Gym, Nutri, Sleep, and Exploration; College, Courses, and Reading are internal Formation filters. Analytics must derive from real execution facts, with Week, Month, and Year periods.

## Verification

- Run `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd test` for behavior changes.
- Verify direct loads for touched routes and compact navigation at 390 px.
- Confirm backup round-trips preserve v1 fields when persistence behavior changes.
- Run the planner persistence regression test whenever the v1 read/write guard changes.
- Run the cutover integration suite when bootstrap, marker, active backup, or planner autosave changes.

## Child DOX Index

- No child AGENTS.md files are needed for the current frontend structure.
