import { decodeDatabaseMetadata, PersistenceValidationError } from "./codecs.ts";
import { authorityEpoch } from "./authority-epoch.ts";
import type { DatabaseMetadataRecord } from "./records.ts";
import type { LocalPersistenceRepository } from "./repository.ts";

export type PlanningFence = Readonly<{ expectedAuthorityEpoch: number; expectedDatasetRevision: number }>;
export class PlanningConflictError extends Error {
  readonly code = "planning_conflict";
  constructor() {
    super("O planejamento mudou em outra sessão. Suas alterações locais foram preservadas; revise o conflito antes de salvar.");
    this.name = "PlanningConflictError";
  }
}
export function datasetRevision(metadata: DatabaseMetadataRecord): number {
  return decodeDatabaseMetadata(metadata).datasetRevision ?? 0;
}
export function nextDatasetRevision(metadata: DatabaseMetadataRecord): number {
  const next = datasetRevision(metadata) + 1;
  if (!Number.isSafeInteger(next)) throw new PersistenceValidationError("invalid_database_metadata", "O limite de revisões do armazenamento foi atingido.");
  return next;
}
export function assertPlanningFence(metadata: DatabaseMetadataRecord, fence: PlanningFence) {
  const revision = datasetRevision(metadata), epoch = authorityEpoch(metadata);
  if (!Number.isSafeInteger(fence.expectedDatasetRevision) || fence.expectedDatasetRevision < 0
    || !Number.isSafeInteger(fence.expectedAuthorityEpoch) || fence.expectedAuthorityEpoch < 0
    || epoch !== fence.expectedAuthorityEpoch || revision !== fence.expectedDatasetRevision) throw new PlanningConflictError();
}
/** Capture before preparation. Never refresh the caller's editing base automatically. */
export async function capturePlanningFence(repository: LocalPersistenceRepository, expected: Partial<PlanningFence> = {}): Promise<PlanningFence> {
  return repository.read(async (tx) => {
    const metadata = await tx.getDatabaseMetadata();
    const fence = { expectedAuthorityEpoch: expected.expectedAuthorityEpoch ?? authorityEpoch(metadata),
      expectedDatasetRevision: expected.expectedDatasetRevision ?? datasetRevision(metadata) };
    assertPlanningFence(metadata, fence);
    return fence;
  });
}
