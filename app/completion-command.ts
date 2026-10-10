import type { ExecutionRecord } from "../domain/temporal/index.ts";
import { readPlannerAuthoritySnapshot } from "../persistence/backup/export-backup-v2.ts";
import { recordOccurrenceExecution } from "../persistence/execution/repository.ts";
import type { ExecutionBridge } from "../persistence/execution/bridge.ts";
import type { LocalPersistenceRepository } from "../persistence/contracts/repository.ts";
import type { NormalizedLegacyPlannerV1 } from "../persistence/legacy/legacy-planner-v1.ts";
import { canonicalStringify } from "../persistence/migration/canonical-json.ts";

export type CompletionSnapshot = Readonly<{ state: NormalizedLegacyPlannerV1; executionBridge: ExecutionBridge; authorityEpoch: number }>;
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
  expectedAuthorityEpoch?: number; expectedRevision?: string;
  publish: (snapshot: CompletionSnapshot) => void;
}): Promise<void> {
  let commandFailed = false;
  let commandError: unknown;
  try { await recordOccurrenceExecution(options); } catch (error) { commandFailed = true; commandError = error; }
  let snapshot: CompletionSnapshot;
  try {
    const { backup, authorityEpoch } = await readPlannerAuthoritySnapshot({ repository: options.repository, exportedAt: "1970-01-01T00:00:00.000Z", active: true });
    if (!backup.payload.executionBridge) throw new Error("Missing execution bridge");
    snapshot = { state: backup.payload.planner, executionBridge: backup.payload.executionBridge.bridge, authorityEpoch };
  } catch { throw new CompletionPersistenceError(true); }
  options.publish(snapshot);
  if (options.expectedAuthorityEpoch !== undefined && snapshot.authorityEpoch !== options.expectedAuthorityEpoch) throw new Error("Os dados foram substituídos. Cancele e abra uma nova ação.");
  if (commandError instanceof Error && commandError.name === "OccurrenceConflictError") throw commandError;
  if (commandFailed) {
    const saved = snapshot.executionBridge.entries.find((entry) => entry.occurrenceId === options.occurrenceId)?.execution;
    if (!saved || canonicalStringify(JSON.parse(JSON.stringify(saved))) !== canonicalStringify(JSON.parse(JSON.stringify(options.execution)))) {
      throw new CompletionPersistenceError(false);
    }
  }
}
