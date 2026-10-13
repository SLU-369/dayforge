import { legacyPlanner } from "../persistence/contracts/planning-envelope.ts";
import type { LocalPersistenceRepository } from "../persistence/contracts/repository.ts";
import { createCanonicalEvent, isEventCreationConfirmed, type EventCreationIntent } from "../persistence/execution/event-creation.ts";
import { verifyPlanningReplay } from "../persistence/execution/repository.ts";
import { PlanningConflictError } from "../persistence/contracts/dataset-revision.ts";
import { readPlannerAuthoritySnapshot } from "../persistence/backup/export-backup-v2.ts";
import { CompletionPersistenceError, type CompletionSnapshot } from "./completion-command.ts";

/** Refresh validated authority on every outcome; structural failures alone block the store. */
export async function persistEventCreation(options: EventCreationIntent & Readonly<{
  repository: LocalPersistenceRepository; publish: (snapshot: CompletionSnapshot, applied: boolean) => void;
}>) {
  let failure: unknown;
  let rejected = false;
  try { await createCanonicalEvent(options); } catch (error) { rejected = true; failure = error; }
  let snapshot: CompletionSnapshot;
  let confirmed = false;
  try {
    const { backup, authorityEpoch, datasetRevision } = await readPlannerAuthoritySnapshot({ repository: options.repository,
      exportedAt: "1970-01-01T00:00:00.000Z", active: true });
    if (backup.formatVersion !== 3) throw new Error();
    confirmed = isEventCreationConfirmed({ backup, authorityEpoch, datasetRevision }, options);
    if (confirmed) {
      try { await verifyPlanningReplay(options.repository, { backup, authorityEpoch, datasetRevision }, options.expectedAuthorityEpoch); }
      catch (error) {
        if (!(error instanceof PlanningConflictError)) throw error;
        confirmed = false; rejected = true; failure = error;
      }
    }
    snapshot = { state: legacyPlanner(backup.payload.planner), executionBridge: backup.payload.executionBridge.bridge, authorityEpoch, datasetRevision };
  } catch { throw new CompletionPersistenceError(true); }
  const sameAuthority = snapshot.authorityEpoch === options.expectedAuthorityEpoch;
  options.publish(snapshot, confirmed && sameAuthority);
  if (!sameAuthority) throw new Error("Os dados foram substituídos. Feche e revise os dados salvos antes de criar um evento.");
  if (confirmed) return;
  if (rejected) {
    if (failure instanceof Error && ["PlanningConflictError", "OccurrenceConflictError", "ExecutionBridgeError"].includes(failure.name)) throw failure;
    throw new Error("Não foi possível confirmar o evento. Os campos foram preservados; confira os dados e tente novamente.");
  }
  throw new Error("Não foi possível comprovar o evento salvo. Os campos foram preservados; confira os dados e tente novamente.");
}
