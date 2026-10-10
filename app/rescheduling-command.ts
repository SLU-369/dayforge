import type { LocalPersistenceRepository } from "../persistence/contracts/index.ts";
import { readPlannerAuthoritySnapshot } from "../persistence/backup/export-backup-v2.ts";
import { rescheduleOccurrencePlanning, type ReschedulingIntent } from "../persistence/execution/rescheduling.ts";
import { CompletionPersistenceError, type CompletionSnapshot } from "./completion-command.ts";

/** Refresh after both success and failure. A valid store makes action conflicts recoverable. */
export async function persistRescheduling(options: ReschedulingIntent & Readonly<{
  repository: LocalPersistenceRepository; publish: (snapshot: CompletionSnapshot) => void;
}>) {
  let failure: unknown;
  try { await rescheduleOccurrencePlanning(options); } catch (error) { failure = error; }
  let snapshot: CompletionSnapshot;
  try {
    const { backup, authorityEpoch } = await readPlannerAuthoritySnapshot({ repository: options.repository, exportedAt: "1970-01-01T00:00:00.000Z", active: true });
    if (!backup.payload.executionBridge) throw new Error();
    snapshot = { state: backup.payload.planner, executionBridge: backup.payload.executionBridge.bridge, authorityEpoch };
  } catch { throw new CompletionPersistenceError(true); }
  options.publish(snapshot);
  if (snapshot.authorityEpoch !== options.expectedAuthorityEpoch) throw new Error("Os dados foram substituídos. Cancele e abra uma nova ação.");
  if (failure) {
    if (failure instanceof Error && failure.name === "OccurrenceConflictError") throw failure;
    throw new Error("Não foi possível confirmar o reagendamento; os dados foram preservados. Confira e tente novamente.");
  }
}
