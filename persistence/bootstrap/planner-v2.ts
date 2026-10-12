import { legacyPlanner, createPlanningDocument, planningEnvelope, planningJson, PLANNING_DOCUMENT_FORMAT } from "../contracts/planning-envelope.ts";
import { capturePlanningFence, assertPlanningFence, PlanningConflictError } from "../contracts/dataset-revision.ts";
import {
  CURRENT_PLANNER_DOCUMENT_ID,
  LEGACY_V1_MIGRATION_KEY_PREFIX,
  nextAuthorityEpoch,
  type LocalPersistenceRepository,
} from "../contracts/index.ts";
import {
  BackupValidationError,
  exportDayforgeBackup,
  isDayforgeBackupEnvelope,
  restoreDayforgeBackup,
  restorePlanningBackup,
} from "../backup/index.ts";
import {
  LEGACY_PLANNER_STORAGE_KEY,
  encodeNormalizedLegacyPlannerV1,
  normalizeLegacyPlannerSnapshotV1,
  parseLegacyPlannerSnapshotV1,
  type NormalizedLegacyPlannerV1,
} from "../legacy/index.ts";
import {
  LEGACY_V1_SOURCE_ID_PREFIX,
  WebCryptoSha256Hasher,
  canonicalStringify,
  createLegacyPlannerDocument,
  migrateLegacyPlannerV1,
  type Sha256Hasher,
} from "../migration/index.ts";
import { assertActiveDatabaseMetadata, assertInactiveDatabaseMetadata } from "../backup/integrity.ts";
import { ensureExecutionBridge, savePlannerWithBridge } from "../execution/repository.ts";
import { EXECUTION_BRIDGE_DOCUMENT_ID, createBridgeDocument, reconcileExecutionBridge, upgradeTemporalRegistry, type ExecutionBridge } from "../execution/bridge.ts";

export const PERSISTENCE_V2_MARKER_KEY = "dayforge:persistence:v2" as const;
export const PERSISTENCE_V2_MARKER_VALUE = "active" as const;

type MarkerStorage = Pick<Storage, "getItem" | "setItem">;
type LegacyStorage = Pick<Storage, "getItem">;

export type PlannerV2BootResult = Readonly<{
  state: NormalizedLegacyPlannerV1;
  markerRepaired: boolean;
  executionBridge: ExecutionBridge;
}>;

export class PlannerV2UnavailableError extends Error {
  constructor() {
    super("A persistência v2 não está disponível; os dados locais foram preservados.");
    this.name = "PlannerV2UnavailableError";
  }
}

function readMarker(storage: MarkerStorage): string | null {
  try {
    return storage.getItem(PERSISTENCE_V2_MARKER_KEY);
  } catch {
    return "invalid";
  }
}

function repairMarker(storage: MarkerStorage): boolean {
  try {
    storage.setItem(PERSISTENCE_V2_MARKER_KEY, PERSISTENCE_V2_MARKER_VALUE);
    return true;
  } catch {
    return false;
  }
}

async function activeSnapshot(repository: LocalPersistenceRepository, exportedAt: string) {
  return exportDayforgeBackup({ repository, exportedAt, active: true });
}

async function activatePreparedPlanner(
  repository: LocalPersistenceRepository,
  markerStorage: MarkerStorage,
  instant: string,
  hasher?: Sha256Hasher,
) {
  const fence = await capturePlanningFence(repository);
  const validated = await exportDayforgeBackup({ repository, exportedAt: instant, hasher });
  if (!repairMarker(markerStorage)) throw new PlannerV2UnavailableError();
  await repository.write(async (transaction) => {
    const metadata = await transaction.getDatabaseMetadata();
    assertPlanningFence(metadata, fence);
    assertInactiveDatabaseMetadata(metadata);
    const current = await transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID);
    if (current === null || current.role !== "active"
      || current.sourceContentFingerprint !== (validated.formatVersion === 3 ? validated.payload.plannerFingerprint : validated.payload.provenance.contentFingerprint)) {
      throw new PlannerV2UnavailableError();
    }
    await transaction.putDatabaseMetadata({
      ...metadata,
      activeDocumentId: CURRENT_PLANNER_DOCUMENT_ID,
    });
  });
  return legacyPlanner((await activeSnapshot(repository, instant)).payload.planner);
}

export async function bootstrapPlannerV2(options: Readonly<{
  repository: LocalPersistenceRepository;
  legacyStorage: LegacyStorage;
  markerStorage: MarkerStorage;
  defaultState: NormalizedLegacyPlannerV1;
  instant: string;
  hasher?: Sha256Hasher;
}>): Promise<PlannerV2BootResult> {
  const { repository, markerStorage, instant } = options;
  try {
    const marker = readMarker(markerStorage);
    await repository.open();
    const metadata = await repository.read((transaction) => transaction.getDatabaseMetadata());
    if (metadata.activeDocumentId !== null) {
      await ensureExecutionBridge(repository, options.hasher);
      const backup = await activeSnapshot(repository, instant);
      const markerRepaired = marker === PERSISTENCE_V2_MARKER_VALUE || repairMarker(markerStorage);
      const executionBridge = backup.payload.executionBridge!.bridge;
      return { state: legacyPlanner(backup.payload.planner), markerRepaired, executionBridge };
    }
    if (marker !== null) throw new PlannerV2UnavailableError();
    assertInactiveDatabaseMetadata(metadata);

    const raw = options.legacyStorage.getItem(LEGACY_PLANNER_STORAGE_KEY);
    if (raw !== null) {
      await migrateLegacyPlannerV1({
        raw,
        migratedAt: instant,
        repository,
        hasher: options.hasher,
      });
    } else {
      const fence = await capturePlanningFence(repository);
      const hasher = options.hasher ?? new WebCryptoSha256Hasher();
      const snapshot = normalizeLegacyPlannerSnapshotV1(
        parseLegacyPlannerSnapshotV1(JSON.stringify(options.defaultState)),
      );
      const fingerprint = await hasher.digestUtf8(canonicalStringify(encodeNormalizedLegacyPlannerV1(snapshot)));
      await repository.write(async (transaction) => {
        assertPlanningFence(await transaction.getDatabaseMetadata(), fence);
        assertInactiveDatabaseMetadata(await transaction.getDatabaseMetadata());
        const [documents, metadataRecords] = await Promise.all([
          transaction.listPlannerDocuments(),
          transaction.listMetadata(),
        ]);
        if (documents.length !== 0 || metadataRecords.length !== 1) {
          throw new PlannerV2UnavailableError();
        }
        await transaction.putPlannerDocument(createLegacyPlannerDocument(fingerprint, snapshot));
      });
    }
    await activatePreparedPlanner(repository, markerStorage, instant, options.hasher);
    await ensureExecutionBridge(repository, options.hasher);
    const snapshot = await activeSnapshot(repository, instant);
    const state = legacyPlanner(snapshot.payload.planner);
    const executionBridge = snapshot.payload.executionBridge!.bridge;
    return {
      state,
      executionBridge,
      markerRepaired: true,
    };
  } catch (error) {
    if (error instanceof PlanningConflictError) throw error;
    throw new PlannerV2UnavailableError();
  }
}

export async function saveActivePlannerV2(options: Readonly<{
  repository: LocalPersistenceRepository;
  state: NormalizedLegacyPlannerV1;
  hasher?: Sha256Hasher;
  expectedAuthorityEpoch: number;
  expectedDatasetRevision: number;
}>): Promise<ExecutionBridge> {
  if (!Number.isSafeInteger(options.expectedDatasetRevision) || !Number.isSafeInteger(options.expectedAuthorityEpoch)) throw new PlanningConflictError();
  const state = normalizeLegacyPlannerSnapshotV1(
    parseLegacyPlannerSnapshotV1(JSON.stringify(options.state)),
  );
  return savePlannerWithBridge({ ...options, state });
}

export async function restoreActivePlannerV2(options: Readonly<{
  repository: LocalPersistenceRepository;
  input: string;
  instant: string;
  hasher?: Sha256Hasher;
  afterWriteForTest?: () => void;
  expectedAuthorityEpoch?: number;
  expectedDatasetRevision?: number;
}>): Promise<NormalizedLegacyPlannerV1> {
  const fence = await capturePlanningFence(options.repository, options);
  let parsed: unknown;
  try {
    parsed = JSON.parse(options.input) as unknown;
  } catch {
    throw new BackupValidationError("invalid_backup_json", "O backup não contém JSON válido.");
  }
  if (isDayforgeBackupEnvelope(parsed)) {
    await restorePlanningBackup({
      ...fence,
      backup: parsed,
      repository: options.repository,
      hasher: options.hasher,
      active: true,
      afterWriteForTest: options.afterWriteForTest,
    });
  } else {
    await migrateLegacyPlannerV1({
      ...fence,
      raw: options.input,
      migratedAt: options.instant,
      repository: options.repository,
      hasher: options.hasher,
      origin: "backup-v1",
      active: true,
      afterWriteForTest: options.afterWriteForTest,
    });
  }
  return legacyPlanner((await activeSnapshot(options.repository, options.instant)).payload.planner);
}

export async function recoverPlannerV2(options: Readonly<{
  repository: LocalPersistenceRepository;
  markerStorage: MarkerStorage;
  input: string;
  instant: string;
  hasher?: Sha256Hasher;
  expectedAuthorityEpoch?: number;
  expectedDatasetRevision?: number;
}>): Promise<PlannerV2BootResult> {
  await options.repository.open();
  const metadata = await options.repository.read((transaction) => transaction.getDatabaseMetadata());
  if (metadata.activeDocumentId !== null) {
    const state = await restoreActivePlannerV2(options);
    return { state, markerRepaired: repairMarker(options.markerStorage), executionBridge: await ensureExecutionBridge(options.repository, options.hasher) };
  }
  await restoreDayforgeBackup({
    expectedAuthorityEpoch: options.expectedAuthorityEpoch,
    expectedDatasetRevision: options.expectedDatasetRevision,
    input: options.input,
    migratedAt: options.instant,
    repository: options.repository,
    hasher: options.hasher,
  });
  const state = await activatePreparedPlanner(options.repository, options.markerStorage, options.instant, options.hasher);
  return {
    state,
    executionBridge: await ensureExecutionBridge(options.repository, options.hasher),
    markerRepaired: true,
  };
}

export async function resetPlannerV2(options: Readonly<{
  repository: LocalPersistenceRepository;
  markerStorage: MarkerStorage;
  defaultState: NormalizedLegacyPlannerV1;
  instant: string;
  hasher?: Sha256Hasher;
  afterWriteForTest?: () => void;
  expectedAuthorityEpoch?: number;
  expectedDatasetRevision?: number;
}>): Promise<PlannerV2BootResult> {
  const fence = await capturePlanningFence(options.repository, options);
  const state = normalizeLegacyPlannerSnapshotV1(
    parseLegacyPlannerSnapshotV1(JSON.stringify(options.defaultState)),
  );
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const fingerprint = await hasher.digestUtf8(canonicalStringify(planningJson(planningEnvelope(state))));
  const executionDocument = await createBridgeDocument(upgradeTemporalRegistry(reconcileExecutionBridge(state), state), hasher);
  await options.repository.open();
  const metadata = await options.repository.read((transaction) => transaction.getDatabaseMetadata());
  await options.repository.write(async (transaction) => {
    const currentMetadata = await transaction.getDatabaseMetadata();
    assertPlanningFence(currentMetadata, fence);
    if (currentMetadata.activeDocumentId === null) assertInactiveDatabaseMetadata(currentMetadata);
    else assertActiveDatabaseMetadata(currentMetadata);
    const [documents, records] = await Promise.all([
      transaction.listPlannerDocuments(),
      transaction.listMetadata(),
    ]);
    if (documents.some(document => document.id.startsWith("planner/") && document.id !== CURRENT_PLANNER_DOCUMENT_ID)) throw new PlannerV2UnavailableError();
    if (documents.some((document) => document.id.startsWith("execution/") && document.id !== EXECUTION_BRIDGE_DOCUMENT_ID)) {
      throw new PlannerV2UnavailableError();
    }
    for (const document of documents) {
      if (document.id === CURRENT_PLANNER_DOCUMENT_ID
        || document.id === EXECUTION_BRIDGE_DOCUMENT_ID
        || document.id.startsWith(LEGACY_V1_SOURCE_ID_PREFIX)) {
        await transaction.deletePlannerDocument(document.id);
      }
    }
    for (const record of records) {
      if (record.key.startsWith(LEGACY_V1_MIGRATION_KEY_PREFIX)) {
        await transaction.deleteMetadata(record.key);
      }
    }
    await transaction.putPlannerDocument(createPlanningDocument(fingerprint, state));
    await transaction.putPlannerDocument(executionDocument);
    const authorityEpoch = nextAuthorityEpoch(currentMetadata);
    await transaction.putDatabaseMetadata({ ...currentMetadata, executionBridgeVersion: 3, authorityEpoch, writeFenceVersion: 1, datasetRevision: fence.expectedDatasetRevision });
    options.afterWriteForTest?.();
    const persisted = await transaction.getPlannerDocument(EXECUTION_BRIDGE_DOCUMENT_ID);
    const current = await transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID);
    const persistedMetadata = await transaction.getDatabaseMetadata();
    if (!persisted || persisted.role !== executionDocument.role || persisted.format !== executionDocument.format || persisted.formatVersion !== executionDocument.formatVersion
      || canonicalStringify(persisted.payload) !== canonicalStringify(executionDocument.payload)
      || persisted.sourceContentFingerprint !== executionDocument.sourceContentFingerprint
      || !current || canonicalStringify(current.payload) !== canonicalStringify(planningJson(planningEnvelope(state)))
      || current.sourceContentFingerprint !== fingerprint || current.role !== "active" || current.format !== PLANNING_DOCUMENT_FORMAT || current.formatVersion !== 2
      || persistedMetadata.authorityEpoch !== authorityEpoch || persistedMetadata.executionBridgeVersion !== 3) throw new PlannerV2UnavailableError();
  });
  if (metadata.activeDocumentId === null) {
    const activeState = await activatePreparedPlanner(options.repository, options.markerStorage, options.instant, hasher);
    return {
      state: activeState,
      executionBridge: await ensureExecutionBridge(options.repository, hasher),
      markerRepaired: true,
    };
  }
  const markerRepaired = repairMarker(options.markerStorage);
  return {
    state: legacyPlanner((await activeSnapshot(options.repository, options.instant)).payload.planner),
    executionBridge: await ensureExecutionBridge(options.repository, hasher),
    markerRepaired,
  };
}
