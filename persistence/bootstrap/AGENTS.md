# Planner v2 bootstrap DOX

## Purpose

- Own the transition from the preserved v1 payload to active IndexedDB planner persistence.

## Ownership

- `planner-v2.ts` owns marker handling, authority selection, migration activation, active planner writes, v2/v1 import, and explicit reset.

## Local Contracts

- Valid active database metadata and a valid logical planner snapshot are authoritative even when the marker is absent or invalid. Repair the marker when storage permits.
- A present or unreadable marker with no valid active database blocks automatic writes and v1 fallback.
- Before activation, validate prepared content, write the marker, then set `activeDocumentId` in one database transaction. Never write to `rotina-369:data:v1`.
- Keep active writes serial in the UI. When content changes, remove legacy migration provenance tied to the prior snapshot from the prepared set; the original v1 bytes remain untouched.
- Bootstrap adopts the external execution bridge once in v2; metadata `executionBridgeVersion: 1` makes a missing bridge fail closed. Active planner saves reconcile the bridge and compare the prior snapshot inside the same transaction. Explicit restore/import/reset replaces the entire recoverable set.
- Explicit import or reset may recover a compatible inactive database. Active v1 import reuses the idempotent migration and preserves valid origins; never repair inaccessible storage or invalid database metadata silently.

## Work Guidance

- Keep errors shown to users sanitized. Inject storage, repository, audit instant, and optional hasher for tests.

## Verification

- Run `tests/persistence-cutover.test.mjs` with real Dexie and `fake-indexeddb`, plus the backup and migration suites.

## Child DOX Index

- No child AGENTS.md files are needed.
