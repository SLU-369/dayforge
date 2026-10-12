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
- UI autosaves supply their snapshot epoch; stale saves cannot overwrite a replaced set. Read and publish a fresh validated authority snapshot after boot/recovery/reset and on an intact-store fence conflict.
- Bootstrap validates old bridge 1 and its original fingerprint before atomic adoption of logical bridge 2 with executionBridgeVersion 2 and local authorityEpoch. Missing adopted bridge fails closed. Active saves reconcile and compare the prior snapshot and epoch inside the same transaction. Explicit restore/import/reset replaces the entire recoverable set.
- Old absent authorityEpoch means zero and is persisted on adoption; bootstrap and normal saves never increment. Each explicit restore/import/reset increments the destination epoch atomically, including inactive recovery and identical content. Epoch is absent from logical backup. Reject overflow and stale commands; preserve rollback across all metadata and documents.
- Explicit import or reset may recover a compatible inactive database. Active v1 import reuses the idempotent migration and preserves valid origins; never repair inaccessible storage or invalid database metadata silently.

- Stage 3A-1 active autosave requires expectedAuthorityEpoch and expectedDatasetRevision from the editing base. Recovery captures/checks the same fence before preparation and inside writes. Revision is adopted deterministically and incremented at the repository transaction boundary. Normal conflicts preserve local drafts, not a storageBlocked session; invalid stores stay fail-closed.

## Work Guidance

- Keep errors shown to users sanitized. Inject storage, repository, audit instant, and optional hasher for tests.

## Verification

- Run `tests/persistence-cutover.test.mjs` with real Dexie and `fake-indexeddb`, plus the backup and migration suites.

## Child DOX Index

- No child AGENTS.md files are needed.

## Stage 3A-2 current contract

- Stage 3A-1 is integrated via PR #16. Stage 3A-2 authorizes only the versioned data foundation: planner/current logical envelope 2, execution/bridge discriminated registry 3 and public backup 3. Physical generation 2/schema 1/tables and read-only v1 remain. Earlier stage limits above are historical.
- Preserve partial legacy entries as partial; full canonical entries use domain factories/transitions, one shared monotonic allocator and one authoritative execution/history. No new complete producer/command, template, structured goal or 3B-1 work.
- Validate old hashes before conversion; upgrade atomically with epoch/revision/base CAS and readback. No-op/replay never increment. Registry 3 requires the adopted local fence pair. Restore/import/reset replace planner, registry and legacy provenance/sources together, preserve unrelated records and reject unknown planner/execution namespaces.
- Public export uses 3 for upgraded datasets; explicit v2 export rejects downgrade. Recovery accepts valid 3/2/1 and never imports local authority counters. Use legacyPlanner/legacyBindings adapters deliberately, retain complete entries during legacy saves, and share temporalPlanning/queryTemporalSnapshot for temporal reads. Full references require actual recoverable targets; absent future entities are not invented.
- Today reads complete timed entities without exposing commands or assigning unknown category/actual duration. Date-only/all-day remain queryable/recoverable; hourly consumers reject them explicitly rather than fabricate timing. Keep drafts, forms, transactional fences and one write queue.
- Run planning-model-recovery Node/Edge plus prior persistence/execution/rescheduling/write-fence regressions, full npm test, lint/typecheck, master/diff checks and relevant visual review.
