import { parseLocalTime, type ExecutionRecord } from "../../domain/temporal/index.ts";
import { CURRENT_PLANNER_DOCUMENT_ID, LEGACY_V1_MIGRATION_KEY_PREFIX, type LocalPersistenceRepository, type PlannerDocumentRecord } from "../contracts/index.ts";
import { exportDayforgeBackupV2 } from "../backup/export-backup-v2.ts";
import { assertActiveDatabaseMetadata } from "../backup/integrity.ts";
import type { DayforgeBackupV2 } from "../backup/contracts.ts";
import { decodeLegacyPlannerSnapshotV1, normalizeLegacyPlannerSnapshotV1, encodeNormalizedLegacyPlannerV1, type NormalizedLegacyPlannerV1 } from "../legacy/index.ts";
import { canonicalStringify, createLegacyPlannerDocument, LEGACY_V1_SOURCE_ID_PREFIX, PLANNER_DOCUMENT_FORMAT, WebCryptoSha256Hasher, type Sha256Hasher } from "../migration/index.ts";
import { bridgeJson, createBridgeDocument, decodeBridgeExecution, ExecutionBridgeError, EXECUTION_BRIDGE_DOCUMENT_ID, EXECUTION_BRIDGE_FORMAT, reconcileExecutionBridge, type ExecutionBridge } from "./bridge.ts";

function assertSnapshot(current: PlannerDocumentRecord | null, documents: readonly PlannerDocumentRecord[], before: DayforgeBackupV2) {
  if (documents.some((document) => document.id.startsWith("execution/") && document.id !== EXECUTION_BRIDGE_DOCUMENT_ID)) throw new ExecutionBridgeError();
  const bridge = documents.find((document) => document.id === EXECUTION_BRIDGE_DOCUMENT_ID);
  if (!current || current.role !== "active" || current.format !== PLANNER_DOCUMENT_FORMAT || current.formatVersion !== 1
    || current.sourceContentFingerprint !== before.payload.provenance.contentFingerprint
    || canonicalStringify(current.payload) !== canonicalStringify(encodeNormalizedLegacyPlannerV1(before.payload.planner))
    || (bridge?.sourceContentFingerprint ?? null) !== (before.payload.executionBridge?.contentFingerprint ?? null)
    || (bridge && (bridge.role !== "active" || bridge.format !== EXECUTION_BRIDGE_FORMAT || bridge.formatVersion !== 1))
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
  afterWriteForTest?: () => void;
  expectedSnapshot?: DayforgeBackupV2;
}>): Promise<ExecutionBridge> {
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const state = normalizeLegacyPlannerSnapshotV1(decodeLegacyPlannerSnapshotV1(options.state));
  // Export time is only validation metadata; it is not an execution instant.
  const before = options.expectedSnapshot ?? await exportDayforgeBackupV2({ repository: options.repository, exportedAt: "1970-01-01T00:00:00.000Z", active: true, hasher });
  let bridge = reconcileExecutionBridge(state, before.payload.executionBridge?.bridge);
  if (options.execution) {
    const { occurrenceId, record } = options.execution;
    const execution = decodeBridgeExecution(record, occurrenceId);
    const binding = bridge.entries.find((entry) => entry.occurrenceId === occurrenceId);
    if (!binding || !binding.item.completed) throw new ExecutionBridgeError();
    if (binding.execution && canonicalStringify(JSON.parse(JSON.stringify(binding.execution))) !== canonicalStringify(JSON.parse(JSON.stringify(execution)))) {
      throw new ExecutionBridgeError();
    }
    bridge = { ...bridge, entries: bridge.entries.map((entry) => entry.occurrenceId === occurrenceId ? { ...entry, execution } : entry) };
  }
  const prior = before.payload.executionBridge?.bridge;
  if (prior) {
    const previous = new Map(prior.entries.map((entry) => [entry.occurrenceId, entry]));
    if (bridge.entries.some((entry) => entry.item.completed && !entry.execution
      && !previous.get(entry.occurrenceId)?.item.completed)) {
      throw new ExecutionBridgeError();
    }
  }
  const document = await createBridgeDocument(bridge, hasher);
  const payload = encodeNormalizedLegacyPlannerV1(state);
  const fingerprint = await hasher.digestUtf8(canonicalStringify(payload));
  await options.repository.write(async (transaction) => {
    const [metadata, current, documents] = await Promise.all([
      transaction.getDatabaseMetadata(), transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID), transaction.listPlannerDocuments(),
    ]);
    assertActiveDatabaseMetadata(metadata);
    assertSnapshot(current, documents, before);
    if (before.payload.executionBridge?.contentFingerprint === document.sourceContentFingerprint
      && before.payload.provenance.contentFingerprint === fingerprint) return;
    await transaction.putPlannerDocument(document);
    if (metadata.executionBridgeVersion !== 1) await transaction.putDatabaseMetadata({ ...metadata, executionBridgeVersion: 1 });
    if (before.payload.provenance.contentFingerprint !== fingerprint) {
      await transaction.putPlannerDocument(createLegacyPlannerDocument(fingerprint, state));
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
    if (!persisted || canonicalStringify(persisted.payload) !== canonicalStringify(document.payload)
      || persisted.sourceContentFingerprint !== document.sourceContentFingerprint) throw new ExecutionBridgeError();
  });
  return bridge;
}

export async function ensureExecutionBridge(repository: LocalPersistenceRepository, hasher?: Sha256Hasher): Promise<ExecutionBridge> {
  const backup = await exportDayforgeBackupV2({ repository, exportedAt: "1970-01-01T00:00:00.000Z", active: true, hasher });
  if (backup.payload.executionBridge) return backup.payload.executionBridge.bridge;
  return savePlannerWithBridge({ repository, state: backup.payload.planner, hasher, expectedSnapshot: backup });
}

/** Canonical command. Receives actual timing explicitly; never interprets planned timing as execution. */
export async function recordOccurrenceExecution(options: Readonly<{
  repository: LocalPersistenceRepository;
  occurrenceId: string;
  execution: ExecutionRecord;
  hasher?: Sha256Hasher;
  afterWriteForTest?: () => void;
}>): Promise<ExecutionBridge> {
  const before = await exportDayforgeBackupV2({ repository: options.repository, exportedAt: "1970-01-01T00:00:00.000Z", active: true, hasher: options.hasher });
  const bridge = before.payload.executionBridge?.bridge;
  const binding = bridge?.entries.find((entry) => entry.occurrenceId === options.occurrenceId);
  if (!binding || (binding.item.completed && !binding.execution) || !binding.item.title.trim() || !parseLocalTime(binding.item.start).ok
    || !parseLocalTime(binding.item.end).ok) throw new ExecutionBridgeError();
  const execution = decodeBridgeExecution(options.execution, options.occurrenceId);
  const actualMinutes = !binding.execution && execution.timing.kind === "timed"
    ? (Date.parse(execution.timing.interval.end) - Date.parse(execution.timing.interval.start)) / 60_000
    : binding.item.actualMinutes;
  const state = structuredClone(before.payload.planner);
  // The codec represents a readonly snapshot. Build a replacement instead of mutating it.
  const record = state.records[binding.sourceDate];
  const updated: NormalizedLegacyPlannerV1 = { ...state, records: { ...state.records, [binding.sourceDate]: {
    ...record, items: record.items.map((item, index) => index === binding.itemIndex
      ? { ...item, completed: true, ...(actualMinutes === undefined ? {} : { actualMinutes }) } : item),
  } } };
  try {
    return await savePlannerWithBridge({ ...options, expectedSnapshot: before, state: updated, execution: { occurrenceId: options.occurrenceId, record: options.execution } });
  } catch (error) {
    if (!(error instanceof ExecutionBridgeError)) throw error;
    const latest = await exportDayforgeBackupV2({ repository: options.repository, exportedAt: "1970-01-01T00:00:00.000Z", active: true, hasher: options.hasher });
    const recovered = latest.payload.executionBridge?.bridge;
    const existing = recovered?.entries.find((entry) => entry.occurrenceId === options.occurrenceId)?.execution;
    const expected = decodeBridgeExecution(options.execution, options.occurrenceId);
    if (recovered && existing && canonicalStringify(JSON.parse(JSON.stringify(existing))) === canonicalStringify(JSON.parse(JSON.stringify(expected)))) return recovered;
    throw error;
  }
}
