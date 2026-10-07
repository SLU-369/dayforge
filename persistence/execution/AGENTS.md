# Execution foundation DOX

## Purpose

- Own the minimal Stage 2B identity and audit bridge around the unchanged legacy planner document.

## Ownership

- `bridge.ts`: logical version 1, strict bindings/execution codecs, allocation and reconciliation.
- `repository.ts`: adoption, canonical execution command and compare-and-swap transactional saves.

## Local Contracts

- Store only `execution/bridge` in existing plannerDocuments. Do not change planner/current shape or infer missing timezone, origin, flexibility or real timing.
- Allocate opaque occurrence IDs once with a persisted monotonic counter; positions only locate validated bindings. Preserve original snapshots and never reuse removed IDs in the same lineage.
- Use the domain ExecutionRecord and execution ID derived from occurrence ID. Equivalent retries return the same audit fact; conflicting execution is rejected. No start or rescheduling operation.
- Legacy completion does not invent canonical execution; the command rejects backfill of historical completed bindings. Stage 2B-A supplies an explicit UI producer through PlannerContext; pending bindings alone can gain their first execution.
- The first timed execution derives compatibility actualMinutes exactly from its real UTC interval in the same write. ExecutionRecord remains authoritative; equivalent retry preserves existing audit facts and old compatibility data without retroactive repair.
- After adoption, saves compare persisted bindings and reject new completed flags without an ExecutionRecord before any write. Historical completed flags remain valid; the internal execution command supplies the audit fact atomically.
- Reject ambiguous duplicate-ID edits and terminal legacy reopening/deletion. Compare snapshots inside writes and hash outside transactions.
- Backup includes the complete bridge and its canonical SHA-256. Restore/import/reset replaces it atomically with the planner; metadata adoption distinguishes an old installation from a missing adopted bridge.

## Work Guidance

- Keep pure domain code independent of this legacy adapter. A binding is not a fabricated full ScheduleOccurrence.
- Inject execution facts and timestamps; never read the ambient clock or use randomness for identity.

## Verification

- Run completion-action, execution-foundation, persistence, Today and temporal suites, full npm test, lint and typecheck.
- Run browser completion action, execution foundation and Today regressions, master check and git diff --check.

## Child DOX Index

- None.
