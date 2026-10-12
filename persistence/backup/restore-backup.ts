import { legacyPlanner, createPlanningDocument, planningEnvelope, planningJson } from "../contracts/planning-envelope.ts";
import { canonicalStringify } from "../migration/canonical-json.ts";
import { capturePlanningFence, assertPlanningFence } from "../contracts/dataset-revision.ts";
import {
  CURRENT_PLANNER_DOCUMENT_ID,
  LEGACY_V1_MIGRATION_KEY_PREFIX,
  nextAuthorityEpoch,
  type LocalPersistenceRepository,
} from "../contracts/index.ts";
import {
  decodeLegacyPlannerSnapshotV1,
  encodeLegacyPlannerSnapshotV1,
} from "../legacy/index.ts";
import {
  LEGACY_V1_SOURCE_ID_PREFIX,
  WebCryptoSha256Hasher,
  migrateLegacyPlannerV1,
  type LegacyV1MigrationResult,
  type Sha256Hasher,
} from "../migration/index.ts";
import type { DayforgeBackup } from "./contracts.ts";
import { EXECUTION_BRIDGE_DOCUMENT_ID, createBridgeDocument, reconcileExecutionBridge, decodeBridgeDocument, upgradeTemporalRegistry } from "../execution/bridge.ts";
import {
  BackupValidationError,
  decodeDayforgeBackup,
  isDayforgeBackupEnvelope,
} from "./codecs.ts";
import {
  assertInactiveDatabaseMetadata,
  assertActiveDatabaseMetadata,
  assertPersistedMaterializedBackup,
  validateAndMaterializeBackup,
} from "./integrity.ts";

export type RestoreBackupResult =
  | Readonly<{ formatVersion: 2 | 3; outcome: "restored"; contentFingerprint: string }>
  | Readonly<{ formatVersion: 1; outcome: LegacyV1MigrationResult["outcome"]; migration: LegacyV1MigrationResult }>;

export async function restorePlanningBackup(options: Readonly<{
  backup: DayforgeBackup | unknown;
  repository: LocalPersistenceRepository;
  hasher?: Sha256Hasher;
  afterWriteForTest?: () => void;
  expectedAuthorityEpoch?: number;
  expectedDatasetRevision?: number;
  active?: boolean;
}>): Promise<RestoreBackupResult> {
  const fence = await capturePlanningFence(options.repository, options);
  const decoded = decodeDayforgeBackup(options.backup);
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const materialized = await validateAndMaterializeBackup(decoded, hasher);
  // Active old backups have no audit facts: prepare fresh bindings before any mutation.
  const legacy = legacyPlanner(decoded.payload.planner);
  const registry = upgradeTemporalRegistry(materialized.executionDocument ? decodeBridgeDocument(materialized.executionDocument, legacy) : reconcileExecutionBridge(legacy), legacy);
  const executionDocument = await createBridgeDocument(registry, hasher);
  const current = createPlanningDocument(await hasher.digestUtf8(canonicalStringify(planningJson(planningEnvelope(legacy)))), legacy);
  const prepared = { ...materialized, current, executionDocument };

  await options.repository.write(async (transaction) => {
    const databaseMetadata = await transaction.getDatabaseMetadata();
    assertPlanningFence(databaseMetadata, fence);
    if (options.active) assertActiveDatabaseMetadata(databaseMetadata);
    else assertInactiveDatabaseMetadata(databaseMetadata);
    const [documents, metadata] = await Promise.all([
      transaction.listPlannerDocuments(),
      transaction.listMetadata(),
    ]);
    if (documents.some(document => document.id.startsWith("planner/") && document.id !== CURRENT_PLANNER_DOCUMENT_ID
      || document.id.startsWith("execution/") && document.id !== EXECUTION_BRIDGE_DOCUMENT_ID)) {
      throw new BackupValidationError("invalid_backup_integrity", "Namespace autoritativo desconhecido.");
    }

    for (const document of documents) {
      if (document.id.startsWith("planner/") && document.id !== CURRENT_PLANNER_DOCUMENT_ID) throw new BackupValidationError("invalid_backup_integrity", "Documento de planejamento desconhecido.");
      if (document.id === CURRENT_PLANNER_DOCUMENT_ID
        || document.id.startsWith("execution/")) {
        if (document.id.startsWith("execution/") && document.id !== EXECUTION_BRIDGE_DOCUMENT_ID) {
          throw new BackupValidationError("invalid_backup_integrity", "Documento de execução desconhecido.");
        }
        await transaction.deletePlannerDocument(document.id);
      } else if (document.id.indexOf(LEGACY_V1_SOURCE_ID_PREFIX) === 0) {
        await transaction.deletePlannerDocument(document.id);
      }
    }
    for (const record of metadata) {
      if (record.key.indexOf(LEGACY_V1_MIGRATION_KEY_PREFIX) === 0) {
        await transaction.deleteMetadata(record.key);
      }
    }
    for (const source of materialized.sources) {
      await transaction.putPlannerDocument(source);
    }
    await transaction.putPlannerDocument(current);
    if (executionDocument) await transaction.putPlannerDocument(executionDocument);
    const baseMetadata = { ...databaseMetadata };
    delete baseMetadata.executionBridgeVersion;
    const authorityEpoch = nextAuthorityEpoch(databaseMetadata);
    await transaction.putDatabaseMetadata(executionDocument
      ? { ...baseMetadata, authorityEpoch, executionBridgeVersion: 3, writeFenceVersion: 1, datasetRevision: fence.expectedDatasetRevision } : { ...baseMetadata, authorityEpoch });
    for (const migration of materialized.migrations) {
      await transaction.putMetadata(migration);
    }

    options.afterWriteForTest?.();
    await assertPersistedMaterializedBackup(transaction, prepared, options.active);
    if ((await transaction.getDatabaseMetadata()).authorityEpoch !== authorityEpoch) {
      throw new BackupValidationError("invalid_backup_integrity", "A autoridade restaurada não corresponde à substituição.");
    }
  });

  return {
    formatVersion: decoded.formatVersion,
    outcome: "restored",
    contentFingerprint: materialized.backup.payload.provenance.contentFingerprint,
  };
}

export async function restoreDayforgeBackup(options: Readonly<{
  input: string | unknown;
  migratedAt: string;
  repository: LocalPersistenceRepository;
  hasher?: Sha256Hasher;
  afterWriteForTest?: () => void;
  expectedAuthorityEpoch?: number;
  expectedDatasetRevision?: number;
}>): Promise<RestoreBackupResult> {
  const fence = await capturePlanningFence(options.repository, options);
  let parsed: unknown = options.input;
  if (typeof options.input === "string") {
    try {
      parsed = JSON.parse(options.input) as unknown;
    } catch {
      throw new BackupValidationError("invalid_backup_json", "O backup não contém JSON válido.");
    }
  }
  if (isDayforgeBackupEnvelope(parsed)) {
    return restorePlanningBackup({
      ...fence,
      backup: parsed,
      repository: options.repository,
      hasher: options.hasher,
      afterWriteForTest: options.afterWriteForTest,
    });
  }

  const raw = typeof options.input === "string"
    ? options.input
    : JSON.stringify(encodeLegacyPlannerSnapshotV1(decodeLegacyPlannerSnapshotV1(parsed)));
  const migration = await migrateLegacyPlannerV1({
    ...fence,
    raw,
    migratedAt: options.migratedAt,
    repository: options.repository,
    hasher: options.hasher,
    origin: "backup-v1",
  });
  return {
    formatVersion: 1,
    outcome: migration.outcome,
    migration,
  };
}

/** Historical generation-v2 API retained; public backup versions are independent. */
export const restoreDayforgeBackupV2 = restorePlanningBackup;
