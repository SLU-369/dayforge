# Execution foundation DOX

## Purpose

- Own the minimal Stage 2B identity and audit bridge around the unchanged legacy planner document.

## Ownership

- `bridge.ts`: logical version 2, strict bindings/execution/planning-audit codecs, v1 conversion, allocation and reconciliation.
- `repository.ts`: adoption, canonical execution command and compare-and-swap transactional saves.
- `rescheduling.ts`: explicit pending-occurrence planning command, captured revision/epoch and replay of owner-bound append intents.

## Local Contracts

- Store only `execution/bridge` in existing plannerDocuments. Do not change planner/current shape or infer missing timezone, origin, flexibility or real timing.
- Allocate opaque occurrence IDs once with a persisted monotonic counter; positions only locate validated bindings. Preserve original snapshots and never reuse removed IDs in the same lineage.
- Use the domain ExecutionRecord and execution ID derived from occurrence ID. Equivalent retries return the same audit fact; conflicting execution is rejected. No start operation or terminal correction.
- Legacy completion does not invent canonical execution; the command rejects backfill of historical completed bindings. Stage 2B-A supplies an explicit UI producer through PlannerContext; pending bindings alone can gain their first execution.
- The first timed execution derives compatibility actualMinutes exactly from its real UTC interval in the same write. ExecutionRecord remains authoritative; equivalent retry preserves existing audit facts and old compatibility data without retroactive repair.
- After adoption, saves compare persisted bindings and reject new completed flags without an ExecutionRecord before any write. Historical completed flags remain valid; the internal execution command supplies the audit fact atomically.
- Reject ambiguous duplicate-ID edits and terminal legacy reopening/deletion. Compare snapshots inside writes and hash outside transactions.
- Backup includes the complete bridge and its canonical SHA-256. Restore/import/reset replaces it atomically with the planner; metadata adoption distinguishes an old installation from a missing adopted bridge.
- Stage 2C-A accepts optional planningAudit containing baselineItem, baselineSchedule, confirmedAt and append-only domain RescheduleEvents. Validate continuity, canonical schedules, chronology and owner-bound sequential event IDs. Preserve audited anchors through saves; reject planning edits/deletion and minute changes outside canonical execution.
- Stage 2C-B requires expected epoch, occurrenceRevision and append count. First event requires explicit timed baseline confirmation; later events derive from the chain. Preserve physical item/original/identity and never create execution on reschedule. Reject terminal/historical/ambiguous bindings, no-op and destination ending at/before changedAt. Optional free text uses stable TemporalReason code user_note.
- Event identity is occurrence plus append position; replay must match the previous revision and complete confirmed event including changedAt/reason. Coalesce equivalent local inflight requests in the existing planner queue; independent connections use snapshot CAS/epoch in the write transaction. Capture completion revision too, to reject planning changed while its dialog was open.
- Validate v1 including its original hash before deterministic upgrade to v2. Preserve all IDs, counter, snapshots and executions without inferring planningAudit or changing planner/current, marker or v1. Adoption writes bridge/version metadata and epoch zero (or existing epoch) atomically; valid v2 bootstrap stays stable.
- Compare expectedAuthorityEpoch inside command writes in addition to snapshot CAS, including equivalent recovery. Dialogs capture the epoch when opened; do not treat it as backup content or a persistence generation. ReadPlannerAuthoritySnapshot exposes validated planner/bridge/local epoch from one readonly transaction.

- Stage 3A-1 commands also capture datasetRevision; new commands compare the dataset fence inside writes and never rebase automatically. Exact persisted execution/event replay verifies the current validated snapshot and original authority in a readonly transaction, preserving idempotency despite newer revisions. Every net authoritative transaction advances local revision once; replay does not.

## Work Guidance

- Read/recovery codecs explicitly preserve canonical historical offsets (D-036); creation codecs/commands default to named IANA. Exact execution replay may retain an existing offset, never create one. Current revisions omit kind; applied-event replay alone reconstructs a1d379d's revision from persisted facts.

- Keep pure domain code independent of this legacy adapter. A binding is not a fabricated full ScheduleOccurrence.
- Inject execution facts and timestamps; never read the ambient clock or use randomness for identity.

## Verification

- Run rescheduling, reschedule-foundation, completion-action, execution-foundation, persistence, Today and temporal suites, full npm test, lint and typecheck.
- Run browser completion action, execution foundation and Today regressions, master check and git diff --check.

## Child DOX Index

- None.

## Stage 3A-2 current contract

- Stage 3A-1 is integrated via PR #16. Stage 3A-2 authorizes only the versioned data foundation: planner/current logical envelope 2, execution/bridge discriminated registry 3 and public backup 3. Physical generation 2/schema 1/tables and read-only v1 remain. Earlier stage limits above are historical.
- Preserve partial legacy entries as partial; full canonical entries use domain factories/transitions, one shared monotonic allocator and one authoritative execution/history. No new complete producer/command, template, structured goal or 3B-1 work.
- Validate old hashes before conversion; upgrade atomically with epoch/revision/base CAS and readback. No-op/replay never increment. Registry 3 requires the adopted local fence pair. Restore/import/reset replace planner, registry and legacy provenance/sources together, preserve unrelated records and reject unknown planner/execution namespaces.
- Public export uses 3 for upgraded datasets; explicit v2 export rejects downgrade. Recovery accepts valid 3/2/1 and never imports local authority counters. Use legacyPlanner/legacyBindings adapters deliberately, retain complete entries during legacy saves, and share temporalPlanning/queryTemporalSnapshot for temporal reads. Full references require actual recoverable targets; absent future entities are not invented.
- Today reads complete timed entities without exposing commands or assigning unknown category/actual duration. Date-only/all-day remain queryable/recoverable; hourly consumers reject them explicitly rather than fabricate timing. Keep drafts, forms, transactional fences and one write queue.
- Run planning-model-recovery Node/Edge plus prior persistence/execution/rescheduling/write-fence regressions, full npm test, lint/typecheck, master/diff checks and relevant visual review.
