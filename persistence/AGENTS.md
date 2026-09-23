# Local persistence DOX

## Purpose

- Own browser-local IndexedDB infrastructure, persisted envelopes, validation, and repository boundaries for persistence generation v2.

## Ownership

- `contracts/` owns storage-level records, validation errors, codecs, and repository interfaces.
- `indexeddb/` owns the Dexie database, internal schema versions, and repository implementation.
- `legacy/` owns the typed v1 snapshot boundary and its read-only localStorage source.
- `migration/` owns canonicalization, SHA-256 identities, and the transactional v1-to-v2 migration.
- `backup/` owns the logical v2 backup contract, strict codecs, consistent export, atomic restore, and compatible v1 import.
- A future `bootstrap/` folder may be introduced only in the separately approved Stage 1.2D.

## Local Contracts

- Persistence generation v2 and the internal Dexie schema version are independent version numbers.
- Internal schema version 1 contains only `metadata` and `plannerDocuments`.
- Do not persist temporal templates, occurrences, executions, or availability until a real producer and consumer exist.
- Persist only values accepted by an explicit codec; `unknown` is permitted only at an input boundary.
- Keep `domain/` independent from Dexie, IndexedDB, browser globals, and legacy planner data.
- Stages 1.2B and 1.2C must never write, replace, or delete `rotina-369:data:v1` and must not change the active planner repository or visible backup UI.
- Raw SHA-256 identifies `legacy-v1/source/<rawFingerprint>`; canonical content SHA-256 identifies `migration/v1/<contentFingerprint>`.
- Migration metadata records content already validated and provenance; it does not identify the currently prepared content. Every successful migration must converge `planner/current` to the currently observed v1 content without duplicating migration identity.
- Migration metadata remains `validated` and database metadata keeps `activeDocumentId: null` until the separately approved cutover.
- Migration provenance records sorted `local-storage-v1` and `backup-v1` import origins. Metadata written before 1.2C decodes as `local-storage-v1`.
- Backup format version, persistence generation, and Dexie schema version are independent. Backup v2 is a logical contract, never a raw IndexedDB dump.
- Export reads one consistent transaction snapshot and recalculates every raw and canonical content fingerprint before returning.
- Restore requires existing valid, compatible, inactive database metadata; it never creates or repairs that record. It atomically replaces only `planner/current`, `legacy-v1/source/*`, and `migration/v1/*` and preserves all records outside that set.

## Work Guidance

- Keep transactions explicit and expose them through repository interfaces instead of UI code.
- Treat database metadata as required and validate it whenever the database is opened.
- Inject audit instants into migrations; IDs, fingerprints, and transformation must not use time, randomness, or UUIDs.
- Use injected database names in tests so each test owns an isolated IndexedDB database.
- Inject export and migration instants. `exportedAt` is backup metadata and never participates in identity or idempotency.

## Verification

- Run the persistence integration tests with real Dexie and `fake-indexeddb`.
- Verify schema creation, indexes, transactions, rollback, reopening, codec rejection, and schema metadata.
- Verify exact-byte and semantic fingerprints, equivalent-source coexistence, retry idempotency, integrity blocking, read-only v1 handling, and migration rollback.
- Verify logical backup round-trips, provenance, v1 import origin, inactive database guards, exact replacement boundaries, post-write reread, and rollback after multiple mutations.
- Run lint, typecheck, build, and the full test suite.

## Child DOX Index

- No child AGENTS.md files are needed for the current persistence structure.
