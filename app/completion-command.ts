import type { ExecutionRecord } from "../domain/temporal/index.ts";
import { exportDayforgeBackupV2 } from "../persistence/backup/export-backup-v2.ts";
import { recordOccurrenceExecution } from "../persistence/execution/repository.ts";
import type { ExecutionBridge } from "../persistence/execution/bridge.ts";
import type { LocalPersistenceRepository } from "../persistence/contracts/repository.ts";
import type { NormalizedLegacyPlannerV1 } from "../persistence/legacy/legacy-planner-v1.ts";
import { canonicalStringify } from "../persistence/migration/canonical-json.ts";

export type CompletionSnapshot = Readonly<{ state: NormalizedLegacyPlannerV1; executionBridge: ExecutionBridge }>;
export class CompletionPersistenceError extends Error {
  readonly blocked: boolean;
  constructor(blocked: boolean) {
    super(blocked ? "O armazenamento não pôde ser validado. Os dados locais foram preservados."
      : "Não foi possível confirmar a conclusão. Os dados anteriores foram preservados; tente novamente.");
    this.blocked = blocked;
  }
}

/** Refresh from one validated persisted snapshot, including after an isolated command failure. */
export async function persistCompletion(options: {
  repository: LocalPersistenceRepository; occurrenceId: string; execution: ExecutionRecord;
  publish: (snapshot: CompletionSnapshot) => void;
}): Promise<void> {
  let commandFailed = false;
  try { await recordOccurrenceExecution(options); } catch { commandFailed = true; }
  let snapshot: CompletionSnapshot;
  try {
    const backup = await exportDayforgeBackupV2({ repository: options.repository, exportedAt: "1970-01-01T00:00:00.000Z", active: true });
    if (!backup.payload.executionBridge) throw new Error("Missing execution bridge");
    snapshot = { state: backup.payload.planner, executionBridge: backup.payload.executionBridge.bridge };
  } catch { throw new CompletionPersistenceError(true); }
  options.publish(snapshot);
  if (commandFailed) {
    const saved = snapshot.executionBridge.entries.find((entry) => entry.occurrenceId === options.occurrenceId)?.execution;
    if (!saved || canonicalStringify(JSON.parse(JSON.stringify(saved))) !== canonicalStringify(JSON.parse(JSON.stringify(options.execution)))) {
      throw new CompletionPersistenceError(false);
    }
  }
}
