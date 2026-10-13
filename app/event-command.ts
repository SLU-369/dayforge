import { legacyPlanner } from "../persistence/contracts/planning-envelope.ts";
import type { LocalPersistenceRepository } from "../persistence/contracts/repository.ts";
import { createCanonicalEvent, reconcileCanonicalEvent, type EventCreationIntent } from "../persistence/execution/event-creation.ts";
import { PlanningConflictError } from "../persistence/contracts/dataset-revision.ts";
import { CompletionPersistenceError, type CompletionSnapshot } from "./completion-command.ts";

/** Refresh validated authority on every outcome; structural failures alone block the store. */
export async function persistEventCreation(options: EventCreationIntent & Readonly<{
  repository: LocalPersistenceRepository; publish: (snapshot: CompletionSnapshot, applied: boolean) => void;
  allowNewWrite?: boolean;
}>) {
  let failure: unknown;
  let rejected = false;
  if (options.allowNewWrite !== false) {
    try { await createCanonicalEvent(options); } catch (error) { rejected = true; failure = error; }
  } else { rejected = true; failure = new PlanningConflictError(); }
  let snapshot: CompletionSnapshot;
  let confirmed = false;
  let sameAuthority = false;
  try {
    const proof = await reconcileCanonicalEvent(options);
    const { backup, authorityEpoch, datasetRevision } = proof.snapshot;
    if (backup.formatVersion !== 3) throw new Error();
    confirmed = proof.confirmed; sameAuthority = proof.sameAuthority;
    snapshot = { state: legacyPlanner(backup.payload.planner), executionBridge: backup.payload.executionBridge.bridge, authorityEpoch, datasetRevision };
  } catch { throw new CompletionPersistenceError(true); }
  options.publish(snapshot, confirmed && sameAuthority);
  if (!sameAuthority) throw new Error("Os dados foram substituídos. Feche e revise os dados salvos antes de criar um evento.");
  if (confirmed) return;
  if (rejected) {
    if (failure instanceof Error && ["PlanningConflictError", "OccurrenceConflictError", "ExecutionBridgeError"].includes(failure.name)) throw failure;
    throw new Error("Não foi possível confirmar o evento. Os campos foram preservados; confira os dados e tente novamente.");
  }
  throw new Error("Não foi possível comprovar o evento salvo. Os campos foram preservados; confira os dados e tente novamente.");
}
