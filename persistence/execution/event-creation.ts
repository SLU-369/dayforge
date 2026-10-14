import { createOccurrence, scheduleOccurrenceId, type Flexibility, type TimedSchedule } from "../../domain/temporal/index.ts";
import { materializePlannerAuthoritySnapshot, readPlannerAuthoritySnapshot } from "../backup/export-backup-v2.ts";
import { assertActiveDatabaseMetadata, readBackupSnapshot } from "../backup/integrity.ts";
import { authorityEpoch } from "../contracts/authority-epoch.ts";
import { assertPlanningFence, PlanningConflictError, type PlanningFence } from "../contracts/dataset-revision.ts";
import type { LocalPersistenceRepository } from "../contracts/repository.ts";
import { canonicalStringify, WebCryptoSha256Hasher, type Sha256Hasher } from "../migration/index.ts";
import { createBridgeDocument, decodeCanonicalOccurrence, decodeCreationIntentId, decodeExecutionBridge, decodeSchedule, ExecutionBridgeError, temporalEntryId } from "./bridge.ts";
import { assertPlannerSnapshot, OccurrenceConflictError } from "./repository.ts";

export type EventCreationIntent = PlanningFence & Readonly<{
  creationIntentId: string;
  expectedSequence: number;
  title: string;
  flexibility: Flexibility;
  schedule: TimedSchedule;
  createdAt: string;
}>;
const same = (left: unknown, right: unknown) => canonicalStringify(JSON.parse(JSON.stringify(left))) === canonicalStringify(JSON.parse(JSON.stringify(right)));

function creationFact(options: EventCreationIntent) {
  decodeCreationIntentId(options.creationIntentId);
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
  return occurrence;
}

/** Read-only receipt confirmation, not permission to mutate the captured base.
 * The witness transaction is the fact's linearization point. Recapture once after
 * initial validation to include intervening writes; never chase revision changes.
 * Hashes stay outside transactions. Replacement during validation is rejected by
 * the final epoch guard. Ordinary later mutations cannot revoke an immutable fact.
 */
export async function reconcileCanonicalEvent(options: EventCreationIntent & Readonly<{
  repository: LocalPersistenceRepository; hasher?: Sha256Hasher;
}>) {
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const exportedAt = "1970-01-01T00:00:00.000Z";
  const candidate = await readPlannerAuthoritySnapshot({ ...options, active: true, exportedAt, hasher });
  const witness = await options.repository.read(tx => readBackupSnapshot(tx, true));
  const snapshot = await materializePlannerAuthoritySnapshot(witness, exportedAt, hasher);
  const confirmed = isEventCreationConfirmed(snapshot, options);
  // Only the epoch is fenced here: this operation does not authorize a write.
  const currentEpoch = await options.repository.read(async tx => {
    const metadata = await tx.getDatabaseMetadata(); assertActiveDatabaseMetadata(metadata);
    return authorityEpoch(metadata);
  });
  // candidate validation is intentional: structural failures must not be hidden
  // by a subsequent read. The witness supplies all facts used for publication.
  const sameAuthority = candidate.authorityEpoch === options.expectedAuthorityEpoch
    && snapshot.authorityEpoch === options.expectedAuthorityEpoch && currentEpoch === options.expectedAuthorityEpoch;
  return { snapshot, confirmed: confirmed && sameAuthority, sameAuthority };
}

/** Confirm only the immutable receipt AND exact fact in the original local authority. */
export function isEventCreationConfirmed(snapshot: Awaited<ReturnType<typeof readPlannerAuthoritySnapshot>>, intent: EventCreationIntent): boolean {
  if (snapshot.authorityEpoch !== intent.expectedAuthorityEpoch || snapshot.backup.formatVersion !== 3) return false;
  try {
    const occurrence = creationFact(intent);
    const saved = snapshot.backup.payload.executionBridge.bridge.entries.find(entry => temporalEntryId(entry) === occurrence.id);
    return saved?.kind === "canonical" && saved.creationIntentId === intent.creationIntentId && same(saved.occurrence, occurrence);
  } catch { return false; }
}

/** Allocator position fences a new write; the persisted opaque receipt proves retry ownership. */
export async function createCanonicalEvent(options: EventCreationIntent & Readonly<{
  repository: LocalPersistenceRepository; hasher?: Sha256Hasher; afterWriteForTest?: () => void;
}>) {
  const occurrence = creationFact(options);
  const id = occurrence.id;
  const read = () => readPlannerAuthoritySnapshot({ repository: options.repository, active: true,
    exportedAt: "1970-01-01T00:00:00.000Z", hasher: options.hasher });
  const snapshot = await read();
  if (snapshot.authorityEpoch !== options.expectedAuthorityEpoch) throw new PlanningConflictError();
  if (snapshot.backup.formatVersion !== 3) throw new ExecutionBridgeError();
  const backup = snapshot.backup;
  const bridge = backup.payload.executionBridge.bridge;
  const replay = async (current: typeof snapshot) => {
    if (!isEventCreationConfirmed(current, options)) return false;
    const proof = await reconcileCanonicalEvent(options);
    if (!proof.sameAuthority) throw new PlanningConflictError();
    return proof.confirmed;
  };
  if (bridge.entries.some(entry => temporalEntryId(entry) === id || entry.kind === "canonical" && entry.creationIntentId === options.creationIntentId)) {
    if (await replay(snapshot)) return occurrence;
    throw new OccurrenceConflictError("Esta identidade já pertence a outra intenção. Feche e revise os dados salvos.");
  }
  if (bridge.nextSequence !== options.expectedSequence || snapshot.datasetRevision !== options.expectedDatasetRevision) throw new PlanningConflictError();
  const updated = decodeExecutionBridge({ ...bridge, nextSequence: options.expectedSequence + 1,
    entries: [...bridge.entries, { kind: "canonical", occurrence, creationIntentId: options.creationIntentId }] }, backup.payload.planner.legacy);
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
