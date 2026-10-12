import { legacyPlanner, createPlanningDocument, planningEnvelope, planningJson, PLANNING_DOCUMENT_FORMAT } from "../contracts/planning-envelope.ts";
import { legacyBindings } from "./bridge.ts";
import { parseLocalTime, type ExecutionRecord } from "../../domain/temporal/index.ts";
import { CURRENT_PLANNER_DOCUMENT_ID, LEGACY_V1_MIGRATION_KEY_PREFIX, assertAuthorityEpoch,
  type LocalPersistenceRepository, type PlannerDocumentRecord } from "../contracts/index.ts";
import { exportDayforgeBackup } from "../backup/export-backup-v2.ts";
import { assertActiveDatabaseMetadata } from "../backup/integrity.ts";
import type { DayforgeBackup } from "../backup/contracts.ts";
import { capturePlanningFence, assertPlanningFence, PlanningConflictError, type PlanningFence } from "../contracts/dataset-revision.ts";
import { readPlannerAuthoritySnapshot } from "../backup/export-backup-v2.ts";
import { decodeLegacyPlannerSnapshotV1, normalizeLegacyPlannerSnapshotV1, encodeNormalizedLegacyPlannerV1, type NormalizedLegacyPlannerV1 } from "../legacy/index.ts";
import { canonicalStringify, createLegacyPlannerDocument, LEGACY_V1_SOURCE_ID_PREFIX, PLANNER_DOCUMENT_FORMAT, WebCryptoSha256Hasher, type Sha256Hasher } from "../migration/index.ts";
import { bridgeJson, createBridgeDocument, decodeBridgeExecution, decodeExecutionBridge, occurrenceRevision, ExecutionBridgeError, EXECUTION_BRIDGE_DOCUMENT_ID, EXECUTION_BRIDGE_FORMAT, reconcileExecutionBridge, upgradeTemporalRegistry, type ExecutionBridge, type PlanningAudit } from "./bridge.ts";

export class OccurrenceConflictError extends Error {
  constructor(message = "O planejamento mudou. Cancele e abra uma nova confirmação.") { super(message); this.name = "OccurrenceConflictError"; }
}

function assertSnapshot(current: PlannerDocumentRecord | null, documents: readonly PlannerDocumentRecord[], before: DayforgeBackup) {
  if (documents.some(document => document.id.startsWith("planner/") && document.id !== CURRENT_PLANNER_DOCUMENT_ID)) throw new ExecutionBridgeError();
  if (documents.some((document) => document.id.startsWith("execution/") && document.id !== EXECUTION_BRIDGE_DOCUMENT_ID)) throw new ExecutionBridgeError();
  const bridge = documents.find((document) => document.id === EXECUTION_BRIDGE_DOCUMENT_ID);
  if (!current || current.role !== "active" || current.format !== (before.formatVersion === 3 ? PLANNING_DOCUMENT_FORMAT : PLANNER_DOCUMENT_FORMAT) || current.formatVersion !== (before.formatVersion === 3 ? 2 : 1)
    || current.sourceContentFingerprint !== (before.formatVersion === 3 ? before.payload.plannerFingerprint : before.payload.provenance.contentFingerprint)
    || canonicalStringify(current.payload) !== canonicalStringify(before.formatVersion === 3 ? planningJson(before.payload.planner) : encodeNormalizedLegacyPlannerV1(before.payload.planner))
    || (bridge?.sourceContentFingerprint ?? null) !== (before.payload.executionBridge?.contentFingerprint ?? null)
    || (bridge && (bridge.role !== "active" || bridge.format !== EXECUTION_BRIDGE_FORMAT || bridge.formatVersion !== before.payload.executionBridge?.bridge.version))
    || (bridge && canonicalStringify(bridge.payload) !== canonicalStringify(bridgeJson(before.payload.executionBridge!.bridge)))) {
    throw new ExecutionBridgeError();
  }
}

/** Validates and hashes before writing; compare-and-swap prevents stale writers from losing audit facts. */
export async function savePlannerWithBridge(options: Readonly<{
  repository: LocalPersistenceRepository;
  state: NormalizedLegacyPlannerV1;
  hasher?: Sha256Hasher;
  execution?: Readonly<{ occurrenceId: string; record: ExecutionRecord }>;
  rescheduling?: Readonly<{ occurrenceId: string; audit: PlanningAudit }>;
  afterWriteForTest?: () => void;
  expectedSnapshot?: DayforgeBackup;
  expectedAuthorityEpoch?: number;
  expectedDatasetRevision?: number;
}>): Promise<ExecutionBridge> {
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const state = normalizeLegacyPlannerSnapshotV1(decodeLegacyPlannerSnapshotV1(options.state));
  const fence = await capturePlanningFence(options.repository, options);
  const expectedAuthorityEpoch = fence.expectedAuthorityEpoch;
  // Export time is only validation metadata; it is not an execution instant.
  const before = options.expectedSnapshot ?? await exportDayforgeBackup({ repository: options.repository, exportedAt: "1970-01-01T00:00:00.000Z", active: true, hasher });
  let bridge = reconcileExecutionBridge(state, before.payload.executionBridge?.bridge, options.execution);
  if (options.rescheduling) {
    const { occurrenceId, audit } = options.rescheduling;
    const prior = legacyBindings(bridge).find((entry) => entry.occurrenceId === occurrenceId);
    if (!prior || prior.execution || prior.item.completed || audit.rescheduleHistory.length !== (prior.planningAudit?.rescheduleHistory.length ?? 0) + 1
      || prior.planningAudit && canonicalStringify(JSON.parse(JSON.stringify({ ...audit, rescheduleHistory: audit.rescheduleHistory.slice(0, -1) })))
        !== canonicalStringify(JSON.parse(JSON.stringify(prior.planningAudit)))) throw new OccurrenceConflictError();
    bridge = decodeExecutionBridge({ ...bridge, entries: bridge.entries.map((entry) => entry.kind !== "canonical" && entry.occurrenceId === occurrenceId ? { ...entry, planningAudit: audit } : entry) }, state);
  }
  if (options.execution) {
    const { occurrenceId, record } = options.execution;
    const execution = decodeBridgeExecution(record, occurrenceId);
    const binding = legacyBindings(bridge).find((entry) => entry.occurrenceId === occurrenceId);
    if (!binding || !binding.item.completed) throw new ExecutionBridgeError();
    if (binding.execution && canonicalStringify(JSON.parse(JSON.stringify(binding.execution))) !== canonicalStringify(JSON.parse(JSON.stringify(execution)))) {
      throw new ExecutionBridgeError();
    }
    bridge = { ...bridge, entries: bridge.entries.map((entry) => entry.kind !== "canonical" && entry.occurrenceId === occurrenceId ? { ...entry, execution } : entry) };
  }
  const prior = before.payload.executionBridge?.bridge;
  if (prior) {
    const previous = new Map(legacyBindings(prior).map((entry) => [entry.occurrenceId, entry]));
    if (legacyBindings(bridge).some((entry) => entry.item.completed && !entry.execution
      && !previous.get(entry.occurrenceId)?.item.completed)) {
      throw new ExecutionBridgeError();
    }
  }
  const document = await createBridgeDocument(bridge, hasher);
  const payload = encodeNormalizedLegacyPlannerV1(state);
  const fingerprint = await hasher.digestUtf8(canonicalStringify(payload));
  const currentFingerprint = before.formatVersion === 3 ? await hasher.digestUtf8(canonicalStringify(planningJson(planningEnvelope(state)))) : fingerprint;
  const currentDocument = before.formatVersion === 3 ? createPlanningDocument(currentFingerprint, state) : createLegacyPlannerDocument(fingerprint, state);
  await options.repository.write(async (transaction) => {
    const [metadata, current, documents] = await Promise.all([
      transaction.getDatabaseMetadata(), transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID), transaction.listPlannerDocuments(),
    ]);
    assertActiveDatabaseMetadata(metadata);
    assertPlanningFence(metadata, fence);
    assertAuthorityEpoch(metadata, expectedAuthorityEpoch);
    assertSnapshot(current, documents, before);
    if (before.payload.executionBridge?.contentFingerprint === document.sourceContentFingerprint
      && before.payload.provenance.contentFingerprint === fingerprint) return;
    await transaction.putPlannerDocument(document);
    if (metadata.executionBridgeVersion !== bridge.version) await transaction.putDatabaseMetadata({ ...metadata, executionBridgeVersion: bridge.version, authorityEpoch: expectedAuthorityEpoch });
    if (before.payload.provenance.contentFingerprint !== fingerprint) {
      await transaction.putPlannerDocument(currentDocument);
      const [documents, metadata] = await Promise.all([transaction.listPlannerDocuments(), transaction.listMetadata()]);
      for (const source of documents) {
        if (source.id.startsWith(LEGACY_V1_SOURCE_ID_PREFIX)) await transaction.deletePlannerDocument(source.id);
      }
      for (const record of metadata) {
        if (record.key.startsWith(LEGACY_V1_MIGRATION_KEY_PREFIX)) await transaction.deleteMetadata(record.key);
      }
    }
    options.afterWriteForTest?.();
    const persisted = await transaction.getPlannerDocument(document.id);
    if (!persisted || persisted.role !== document.role || persisted.format !== document.format || persisted.formatVersion !== document.formatVersion
      || canonicalStringify(persisted.payload) !== canonicalStringify(document.payload)
      || persisted.sourceContentFingerprint !== document.sourceContentFingerprint) throw new ExecutionBridgeError();
    const persistedMetadata = await transaction.getDatabaseMetadata();
    assertAuthorityEpoch(persistedMetadata, expectedAuthorityEpoch);
    if (persistedMetadata.executionBridgeVersion !== bridge.version) throw new ExecutionBridgeError();
    const persistedCurrent = await transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID);
    if (!persistedCurrent || canonicalStringify(persistedCurrent.payload) !== canonicalStringify(currentDocument.payload)
      || persistedCurrent.sourceContentFingerprint !== currentDocument.sourceContentFingerprint) throw new ExecutionBridgeError();
  });
  return bridge;
}

export async function ensureExecutionBridge(repository: LocalPersistenceRepository, hasher?: Sha256Hasher): Promise<ExecutionBridge> {
  return upgradePlanningModel({ repository, hasher, active: true });
}

/** Logical upgrade only. Equivalent concurrent migration is recognized, never rebased. */
export async function upgradePlanningModel(options: Readonly<{ repository: LocalPersistenceRepository; hasher?: Sha256Hasher;
  active?: boolean; afterWriteForTest?: () => void }>): Promise<ExecutionBridge> {
  const { repository } = options;
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const snapshot = await readPlannerAuthoritySnapshot({ repository, exportedAt: "1970-01-01T00:00:00.000Z", active: options.active, hasher });
  const backup = snapshot.backup;
  const fence = { expectedAuthorityEpoch: snapshot.authorityEpoch, expectedDatasetRevision: snapshot.datasetRevision };
  if (backup.formatVersion === 3) {
    await repository.write(async (tx) => {
      assertPlanningFence(await tx.getDatabaseMetadata(), fence);
      assertSnapshot(await tx.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID), await tx.listPlannerDocuments(), backup);
    }); // Also adopts missing local fence metadata without advancing a no-op revision.
    return backup.payload.executionBridge.bridge;
  }
  const legacy = legacyPlanner(backup.payload.planner);
  const registry = upgradeTemporalRegistry(backup.payload.executionBridge?.bridge ?? reconcileExecutionBridge(legacy), legacy);
  const document = await createBridgeDocument(registry, hasher);
  const current = createPlanningDocument(await hasher.digestUtf8(canonicalStringify(planningJson(planningEnvelope(legacy)))), legacy);
  try {
    await repository.write(async tx => {
      const metadata = await tx.getDatabaseMetadata();
      assertPlanningFence(metadata, fence);
      assertSnapshot(await tx.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID), await tx.listPlannerDocuments(), backup);
      await tx.putPlannerDocument(current); await tx.putPlannerDocument(document);
      await tx.putDatabaseMetadata({ ...metadata, authorityEpoch: fence.expectedAuthorityEpoch, executionBridgeVersion: 3,
        writeFenceVersion: 1, datasetRevision: fence.expectedDatasetRevision });
      options.afterWriteForTest?.();
      const persisted = await tx.getPlannerDocument(current.id), bridge = await tx.getPlannerDocument(document.id);
      const adopted = await tx.getDatabaseMetadata();
      if (adopted.executionBridgeVersion !== 3 || adopted.authorityEpoch !== fence.expectedAuthorityEpoch) throw new ExecutionBridgeError();
      if (!persisted || !bridge || canonicalStringify(JSON.parse(JSON.stringify(persisted))) !== canonicalStringify(JSON.parse(JSON.stringify(current)))
        || canonicalStringify(JSON.parse(JSON.stringify(bridge))) !== canonicalStringify(JSON.parse(JSON.stringify(document)))) throw new ExecutionBridgeError();
    });
  } catch (error) {
    if (!(error instanceof PlanningConflictError)) throw error;
    const winner = await readPlannerAuthoritySnapshot({ repository, exportedAt: "1970-01-01T00:00:00.000Z", active: options.active, hasher });
    if (winner.authorityEpoch !== fence.expectedAuthorityEpoch || winner.datasetRevision !== fence.expectedDatasetRevision + 1
      || winner.backup.formatVersion !== 3 || winner.backup.payload.plannerFingerprint !== current.sourceContentFingerprint
      || winner.backup.payload.executionBridge.contentFingerprint !== document.sourceContentFingerprint
      || canonicalStringify(JSON.parse(JSON.stringify(winner.backup.payload.provenance))) !== canonicalStringify(JSON.parse(JSON.stringify(backup.payload.provenance)))
      || canonicalStringify(JSON.parse(JSON.stringify(winner.backup.payload.legacySources))) !== canonicalStringify(JSON.parse(JSON.stringify(backup.payload.legacySources)))) throw error;
    await verifyPlanningReplay(repository, winner, fence.expectedAuthorityEpoch);
    return winner.backup.payload.executionBridge.bridge;
  }
  return registry;
}

/** Idempotent facts may outlive the request revision, but never its authority. */
export async function verifyPlanningReplay(repository: LocalPersistenceRepository, snapshot: Awaited<ReturnType<typeof readPlannerAuthoritySnapshot>>, epoch: number) {
  await repository.read(async (tx) => {
    assertPlanningFence(await tx.getDatabaseMetadata(), { expectedAuthorityEpoch: epoch, expectedDatasetRevision: snapshot.datasetRevision });
    assertSnapshot(await tx.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID), await tx.listPlannerDocuments(), snapshot.backup);
  });
}

/** Canonical command. Receives actual timing explicitly; never interprets planned timing as execution. */
export async function recordOccurrenceExecution(options: Readonly<{
  repository: LocalPersistenceRepository;
  occurrenceId: string;
  execution: ExecutionRecord;
  hasher?: Sha256Hasher;
  afterWriteForTest?: () => void;
  expectedAuthorityEpoch?: number;
  expectedRevision?: string;
  expectedDatasetRevision?: number;
}>): Promise<ExecutionBridge> {
  const snapshot = await readPlannerAuthoritySnapshot({ repository: options.repository, exportedAt: "1970-01-01T00:00:00.000Z", active: true, hasher: options.hasher });
  const fence: PlanningFence = { expectedAuthorityEpoch: options.expectedAuthorityEpoch ?? snapshot.authorityEpoch,
    expectedDatasetRevision: options.expectedDatasetRevision ?? snapshot.datasetRevision };
  const expectedAuthorityEpoch = fence.expectedAuthorityEpoch;
  const before = snapshot.backup;
  const bridge = before.payload.executionBridge?.bridge;
  const binding = legacyBindings(bridge).find((entry) => entry.occurrenceId === options.occurrenceId);
  if (!binding || (binding.item.completed && !binding.execution) || !binding.item.title.trim() || !parseLocalTime(binding.item.start).ok
    || !parseLocalTime(binding.item.end).ok) throw new ExecutionBridgeError();
  const execution = decodeBridgeExecution(options.execution, options.occurrenceId);
  if (binding.execution && canonicalStringify(JSON.parse(JSON.stringify(binding.execution))) === canonicalStringify(JSON.parse(JSON.stringify(execution)))) {
    await verifyPlanningReplay(options.repository, snapshot, expectedAuthorityEpoch);
    return bridge!;
  }
  if (options.expectedRevision !== undefined && occurrenceRevision(binding) !== options.expectedRevision
    && (!binding.execution || canonicalStringify(JSON.parse(JSON.stringify(binding.execution))) !== canonicalStringify(JSON.parse(JSON.stringify(execution))))) throw new OccurrenceConflictError();
  const actualMinutes = !binding.execution && execution.timing.kind === "timed"
    ? (Date.parse(execution.timing.interval.end) - Date.parse(execution.timing.interval.start)) / 60_000
    : binding.item.actualMinutes;
  const state = structuredClone(legacyPlanner(before.payload.planner));
  // The codec represents a readonly snapshot. Build a replacement instead of mutating it.
  const record = state.records[binding.sourceDate];
  const updated: NormalizedLegacyPlannerV1 = { ...state, records: { ...state.records, [binding.sourceDate]: {
    ...record, items: record.items.map((item, index) => index === binding.itemIndex
      ? { ...item, completed: true, ...(actualMinutes === undefined ? {} : { actualMinutes }) } : item),
  } } };
  try {
    return await savePlannerWithBridge({ ...options, ...fence, expectedSnapshot: before, state: updated, execution: { occurrenceId: options.occurrenceId, record: options.execution } });
  } catch (error) {
    if (!(error instanceof ExecutionBridgeError) && !(error instanceof PlanningConflictError)) throw error;
    await options.repository.read(async (transaction) => assertAuthorityEpoch(await transaction.getDatabaseMetadata(), expectedAuthorityEpoch));
    const latest = await readPlannerAuthoritySnapshot({ repository: options.repository, exportedAt: "1970-01-01T00:00:00.000Z", active: true, hasher: options.hasher });
    const recovered = latest.backup.payload.executionBridge?.bridge;
    const existing = legacyBindings(recovered).find((entry) => entry.occurrenceId === options.occurrenceId)?.execution;
    const expected = decodeBridgeExecution(options.execution, options.occurrenceId);
    if (recovered && existing && canonicalStringify(JSON.parse(JSON.stringify(existing))) === canonicalStringify(JSON.parse(JSON.stringify(expected)))) {
      await verifyPlanningReplay(options.repository, latest, expectedAuthorityEpoch);
      return recovered;
    }
    throw error;
  }
}
