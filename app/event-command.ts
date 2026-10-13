import { legacyPlanner } from "../persistence/contracts/planning-envelope.ts";
import type { LocalPersistenceRepository } from "../persistence/contracts/repository.ts";
import { createCanonicalEvent, type EventCreationIntent } from "../persistence/execution/event-creation.ts";
import { readPlannerAuthoritySnapshot } from "../persistence/backup/export-backup-v2.ts";
import { CompletionPersistenceError, type CompletionSnapshot } from "./completion-command.ts";

/** Refresh validated authority on every outcome; structural failures alone block the store. */
export async function persistEventCreation(options: EventCreationIntent & Readonly<{
  repository: LocalPersistenceRepository; publish: (snapshot: CompletionSnapshot, applied: boolean) => void;
}>) {
  let failure: unknown;
  try { await createCanonicalEvent(options); } catch (error) { failure = error; }
  let snapshot: CompletionSnapshot;
  try {
    const { backup, authorityEpoch, datasetRevision } = await readPlannerAuthoritySnapshot({ repository: options.repository,
      exportedAt: "1970-01-01T00:00:00.000Z", active: true });
    if (backup.formatVersion !== 3) throw new Error();
    snapshot = { state: legacyPlanner(backup.payload.planner), executionBridge: backup.payload.executionBridge.bridge, authorityEpoch, datasetRevision };
  } catch { throw new CompletionPersistenceError(true); }
  const sameAuthority = snapshot.authorityEpoch === options.expectedAuthorityEpoch;
  options.publish(snapshot, !failure && sameAuthority);
  if (!sameAuthority) throw new Error("Os dados foram substituídos. Feche e revise os dados salvos antes de criar um evento.");
  if (failure) {
    if (failure instanceof Error && ["PlanningConflictError", "OccurrenceConflictError", "ExecutionBridgeError"].includes(failure.name)) throw failure;
    throw new Error("Não foi possível confirmar o evento. Os campos foram preservados; confira os dados e tente novamente.");
  }
}
