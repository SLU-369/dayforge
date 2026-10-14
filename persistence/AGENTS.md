# Local persistence DOX

## Purpose

- Own browser-local IndexedDB infrastructure, persisted envelopes, validation, and repository boundaries for persistence generation v2.

## Ownership

- `contracts/` owns storage-level records, validation errors, codecs, and repository interfaces.
- `indexeddb/` owns the Dexie database, internal schema versions, and repository implementation.
- `legacy/` owns the typed v1 snapshot boundary and its read-only localStorage source.
- `migration/` owns canonicalization, SHA-256 identities, and the transactional v1-to-v2 migration.
- `backup/` owns the logical v2 backup contract, strict codecs, consistent export, atomic restore, and compatible v1 import.
- `bootstrap/` owns the v2 authority decision, marker, cutover, active planner writes, and explicit recovery.
- `execution/` owns persistent occurrence identity bindings, domain ExecutionRecord codecs and canonical atomic execution writes. Stage 2B-A uses that command through PlannerContext, without new tables or backup format changes.

## Local Contracts

- Persistence generation v2 and the internal Dexie schema version are independent version numbers.
- Internal schema version 1 contains only `metadata` and `plannerDocuments`.
- Do not persist temporal templates, occurrences, executions, or availability until a real producer and consumer exist.
- Persist only values accepted by an explicit codec; `unknown` is permitted only at an input boundary.
- Keep `domain/` independent from Dexie, IndexedDB, browser globals, and legacy planner data.
- Stages 1.2B and 1.2C must never write, replace, or delete `rotina-369:data:v1` and must not change the active planner repository or visible backup UI.
- Raw SHA-256 identifies `legacy-v1/source/<rawFingerprint>`; canonical content SHA-256 identifies `migration/v1/<contentFingerprint>`.
- Migration metadata records content already validated and provenance; it does not identify the currently prepared content. Every successful migration must converge `planner/current` to the currently observed v1 content without duplicating migration identity.
- Migration metadata remains `validated`; cutover alone sets database metadata `activeDocumentId` to `planner/current`.
- Migration provenance records sorted `local-storage-v1` and `backup-v1` import origins. Metadata written before 1.2C decodes as `local-storage-v1`.
- Active v1 import opts into the existing idempotent migration; the default migration path still requires inactive metadata.
- Backup format version, persistence generation, and Dexie schema version are independent. Backup v2 is a logical contract, never a raw IndexedDB dump.
- Export reads one consistent transaction snapshot and recalculates every raw and canonical content fingerprint before returning.
- `readPlannerAuthoritySnapshot` returns validated planner/bridge and local authorityEpoch captured together; public backup excludes epoch. Stage 2C-B commands compare captured epoch and occurrence revision, preserving the physical planner anchor and recovery formats.
- Restore requires existing compatible metadata and its appropriate active/inactive guard. The 2B foundation adds `execution/bridge` to the replacement set with `planner/current`, `legacy-v1/source/*`, and `migration/v1/*`; adoption metadata follows that set atomically. Unknown execution namespace records fail closed. Preserve unrelated records.
- Keep backup format 2, persistence generation 2 and Dexie schema 1. Execution bridge logical version 2 is an optional backup extension; accept validated bridge 1 and convert without inferred planningAudit. Backups without a bridge contain no canonical execution/planning facts. Active old restore prepares fresh bindings before writes; inactive old restore adopts at cutover.
- Stage 2C-A owns recovery of optional planningAudit without a rescheduling producer. authorityEpoch is local metadata: absent legacy value means zero, bridge 2 requires it, and explicit restore/import/reset increments atomically. Never export/restore the epoch from logical backup or increment during ordinary bootstrap/saves.

- Stage 3A-1 adds optional paired writeFenceVersion 1/datasetRevision to local metadata. Missing old pair means zero; validated adoption persists it idempotently. readPlannerAuthoritySnapshot captures epoch/revision together. The IndexedDB write boundary advances revision once per net authoritative mutation; no-op and reads remain stable. Both counters are excluded from backup; replacements increment destination epoch/revision. Preserve all logical/physical formats.

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
- Verify first run, authority and marker recovery, read-only v1, active backup/import, blocked states, and partial cutover recovery.
- Run lint, typecheck, build, and the full test suite.

## Child DOX Index

- `bootstrap/AGENTS.md`: cutover ordering, marker fail-safe, active planner writes, and explicit recovery.
- `execution/AGENTS.md`: identity allocation, bindings, terminal execution, recovery and concurrency.

## Stage 3A-2 foundation contract (historical scope)

- Stage 3A-1 is integrated via PR #16. Stage 3A-2 authorizes only the versioned data foundation: planner/current logical envelope 2, execution/bridge discriminated registry 3 and public backup 3. Physical generation 2/schema 1/tables and read-only v1 remain. Earlier stage limits above are historical.
- Preserve partial legacy entries as partial; full canonical entries use domain factories/transitions, one shared monotonic allocator and one authoritative execution/history. No new complete producer/command, template, structured goal or 3B-1 work.
- Validate old hashes before conversion; upgrade atomically with epoch/revision/base CAS and readback. No-op/replay never increment. Registry 3 requires the adopted local fence pair. Restore/import/reset replace planner, registry and legacy provenance/sources together, preserve unrelated records and reject unknown planner/execution namespaces.
- Public export uses 3 for upgraded datasets; explicit v2 export rejects downgrade. Recovery accepts valid 3/2/1 and never imports local authority counters. Use legacyPlanner/legacyBindings adapters deliberately, retain complete entries during legacy saves, and share temporalPlanning/queryTemporalSnapshot for temporal reads. Full references require actual recoverable targets; absent future entities are not invented.
- Today reads complete timed entities without exposing commands or assigning unknown category/actual duration. Date-only/all-day remain queryable/recoverable; hourly consumers reject them explicitly rather than fabricate timing. Keep drafts, forms, transactional fences and one write queue.
- Run planning-model-recovery Node/Edge plus prior persistence/execution/rescheduling/write-fence regressions, full npm test, lint/typecheck, master/diff checks and relevant visual review.

## Stage 3B-1 current contract

- 3A-2 is integrated. The authorized event producer exclusively creates timed commitments and writes only execution/bridge in logical registry 3. Query/recovery also preserve date_only/all_day; their creation is not authorized. Preserve planner 2, backup 3/recovery 3/2/1, generation 2/schema 1/tables, legacy provenance/sources and read-only v1.
- event-creation captures epoch/revision/allocator position, constructs a strict independent planned occurrence and shares the monotonic allocator with legacy reconciliation. Prepare hash outside the transaction; compare active metadata/fence/full base and validate readback. One net mutation advances revision once; exact full-fact replay in the same authority is read-only. No silent rebase or deduplication by title/time.
- Verify mixed allocation, independent connections, obsolete intent, replacements, quota/rollback/readback, reload and backup integrity before publishing. Complete transitions/templates/other producers remain gated.
- D-038 adds only optional creationIntentId to canonical registry entries, in the same authoritative document/fingerprint. Strict UUID v4/uniqueness validation and full-fact/epoch replay preserve old data without invented receipts; backup 3 round-trips absence/presence. New writes require the proof. No structural migration, schema/table/public version change or parallel receipt store; earlier strict binaries reject the unknown extension rather than discard it.
