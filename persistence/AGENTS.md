# Local persistence DOX

## Purpose

- Own browser-local IndexedDB infrastructure, persisted envelopes, validation, and repository boundaries for persistence generation v2.

## Ownership

- `contracts/` owns storage-level records, validation errors, codecs, and repository interfaces.
- `indexeddb/` owns the Dexie database, internal schema versions, and repository implementation.
- Future `migration/`, `backup/`, and `bootstrap/` folders will be introduced only in their separately approved Stage 1.2 substages.

## Local Contracts

- Persistence generation v2 and the internal Dexie schema version are independent version numbers.
- Internal schema version 1 contains only `metadata` and `plannerDocuments`.
- Do not persist temporal templates, occurrences, executions, or availability until a real producer and consumer exist.
- Persist only values accepted by an explicit codec; `unknown` is permitted only at an input boundary.
- Keep `domain/` independent from Dexie, IndexedDB, browser globals, and legacy planner data.
- Stage 1.2A must not read, migrate, replace, or delete `rotina-369:data:v1` and must not change the active planner repository.

## Work Guidance

- Keep transactions explicit and expose them through repository interfaces instead of UI code.
- Treat database metadata as required and validate it whenever the database is opened.
- Use injected database names in tests so each test owns an isolated IndexedDB database.

## Verification

- Run the persistence integration tests with real Dexie and `fake-indexeddb`.
- Verify schema creation, indexes, transactions, rollback, reopening, codec rejection, and schema metadata.
- Run lint, typecheck, build, and the full test suite.

## Child DOX Index

- No child AGENTS.md files are needed for the current persistence structure.
