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

## Work Guidance

- Keep pure domain code independent of this legacy adapter. A binding is not a fabricated full ScheduleOccurrence.
- Inject execution facts and timestamps; never read the ambient clock or use randomness for identity.

## Verification

- Run rescheduling, reschedule-foundation, completion-action, execution-foundation, persistence, Today and temporal suites, full npm test, lint and typecheck.
- Run browser completion action, execution foundation and Today regressions, master check and git diff --check.

## Child DOX Index

- None.
