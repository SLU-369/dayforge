import { createOccurrence, scheduleOccurrenceId, type Flexibility, type TimedSchedule } from "../../domain/temporal/index.ts";
import { readPlannerAuthoritySnapshot } from "../backup/export-backup-v2.ts";
import { assertActiveDatabaseMetadata } from "../backup/integrity.ts";
import { assertPlanningFence, PlanningConflictError, type PlanningFence } from "../contracts/dataset-revision.ts";
import type { LocalPersistenceRepository } from "../contracts/repository.ts";
import { canonicalStringify, type Sha256Hasher } from "../migration/index.ts";
import { createBridgeDocument, decodeCanonicalOccurrence, decodeExecutionBridge, decodeSchedule, ExecutionBridgeError, temporalEntryId } from "./bridge.ts";
import { assertPlannerSnapshot, OccurrenceConflictError, verifyPlanningReplay } from "./repository.ts";

export type EventCreationIntent = PlanningFence & Readonly<{
  expectedSequence: number;
  title: string;
  flexibility: Flexibility;
  schedule: TimedSchedule;
  createdAt: string;
}>;
const same = (left: unknown, right: unknown) => canonicalStringify(JSON.parse(JSON.stringify(left))) === canonicalStringify(JSON.parse(JSON.stringify(right)));

/** One captured allocator position identifies the confirmed intent, including unchanged retries. */
export async function createCanonicalEvent(options: EventCreationIntent & Readonly<{
  repository: LocalPersistenceRepository; hasher?: Sha256Hasher; afterWriteForTest?: () => void;
}>) {
  if (!Number.isSafeInteger(options.expectedAuthorityEpoch) || options.expectedAuthorityEpoch < 0
    || !Number.isSafeInteger(options.expectedDatasetRevision) || options.expectedDatasetRevision < 0) throw new PlanningConflictError();
  if (!Number.isSafeInteger(options.expectedSequence) || options.expectedSequence < 1
    || !Number.isSafeInteger(options.expectedSequence + 1)) throw new OccurrenceConflictError("O limite de identidades foi atingido.");
  const id = scheduleOccurrenceId(`occ:${options.expectedSequence}`);
  if (!id.ok) throw new OccurrenceConflictError();
  if (options.schedule.kind !== "timed") throw new OccurrenceConflictError("A criação nesta etapa exige início e fim com horário.");
  // Strict creation codecs, never the historical recovery parser. Reconstruct the complete fact.
  const created = createOccurrence({ id: id.value, source: { kind: "standalone", title: options.title,
    flexibility: options.flexibility, origin: { kind: "event" } }, schedule: decodeSchedule(options.schedule), createdAt: options.createdAt });
  if (!created.ok) throw new OccurrenceConflictError("Confira o título, a flexibilidade e o instante da confirmação.");
  const occurrence = decodeCanonicalOccurrence(created.value);
  const read = () => readPlannerAuthoritySnapshot({ repository: options.repository, active: true,
    exportedAt: "1970-01-01T00:00:00.000Z", hasher: options.hasher });
  const snapshot = await read();
  if (snapshot.authorityEpoch !== options.expectedAuthorityEpoch) throw new PlanningConflictError();
  if (snapshot.backup.formatVersion !== 3) throw new ExecutionBridgeError();
  const backup = snapshot.backup;
  const bridge = backup.payload.executionBridge.bridge;
  const replay = async (current: typeof snapshot) => {
    if (current.authorityEpoch !== options.expectedAuthorityEpoch || current.backup.formatVersion !== 3) return false;
    const saved = current.backup.payload.executionBridge.bridge.entries.find(entry => temporalEntryId(entry) === id.value);
    if (saved?.kind !== "canonical" || !same(saved.occurrence, occurrence)) return false;
    await verifyPlanningReplay(options.repository, current, options.expectedAuthorityEpoch);
    return true;
  };
  if (bridge.entries.some(entry => temporalEntryId(entry) === id.value)) {
    if (await replay(snapshot)) return occurrence;
    throw new OccurrenceConflictError("Esta identidade já pertence a outra intenção. Feche e revise os dados salvos.");
  }
  if (bridge.nextSequence !== options.expectedSequence || snapshot.datasetRevision !== options.expectedDatasetRevision) throw new PlanningConflictError();
  const updated = decodeExecutionBridge({ ...bridge, nextSequence: options.expectedSequence + 1,
    entries: [...bridge.entries, { kind: "canonical", occurrence }] }, backup.payload.planner.legacy);
  const document = await createBridgeDocument(updated, options.hasher);
  try {
    await options.repository.write(async tx => {
      const metadata = await tx.getDatabaseMetadata();
      assertActiveDatabaseMetadata(metadata);
      assertPlanningFence(metadata, options);
      assertPlannerSnapshot(await tx.getPlannerDocument("planner/current"), await tx.listPlannerDocuments(), backup);
      await tx.putPlannerDocument(document);
      options.afterWriteForTest?.();
      const persisted = await tx.getPlannerDocument(document.id);
      if (!persisted || !same(persisted, document)) throw new ExecutionBridgeError();
      decodeExecutionBridge(persisted.payload, backup.payload.planner.legacy);
      assertPlanningFence(await tx.getDatabaseMetadata(), options);
    });
  } catch (error) {
    // Only an exact fact in the original authority can prove a concurrent winner.
    if (!(error instanceof PlanningConflictError) && !(error instanceof ExecutionBridgeError)) throw error;
    if (!await replay(await read())) throw error;
  }
  return occurrence;
}
