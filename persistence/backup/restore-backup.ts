import {
  CURRENT_PLANNER_DOCUMENT_ID,
  LEGACY_V1_MIGRATION_KEY_PREFIX,
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
import type { DayforgeBackupV2 } from "./contracts.ts";
import {
  BackupValidationError,
  decodeDayforgeBackupV2,
  isDayforgeBackupV2Envelope,
} from "./codecs.ts";
import {
  assertInactiveDatabaseMetadata,
  assertPersistedMaterializedBackup,
  validateAndMaterializeBackupV2,
} from "./integrity.ts";

export type RestoreBackupResult =
  | Readonly<{ formatVersion: 2; outcome: "restored"; contentFingerprint: string }>
  | Readonly<{ formatVersion: 1; outcome: LegacyV1MigrationResult["outcome"]; migration: LegacyV1MigrationResult }>;

export async function restoreDayforgeBackupV2(options: Readonly<{
  backup: DayforgeBackupV2 | unknown;
  repository: LocalPersistenceRepository;
  hasher?: Sha256Hasher;
  afterWriteForTest?: () => void;
}>): Promise<RestoreBackupResult> {
  const decoded = decodeDayforgeBackupV2(options.backup);
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const materialized = await validateAndMaterializeBackupV2(decoded, hasher);

  await options.repository.write(async (transaction) => {
    const databaseMetadata = await transaction.getDatabaseMetadata();
    assertInactiveDatabaseMetadata(databaseMetadata);
    const [documents, metadata] = await Promise.all([
      transaction.listPlannerDocuments(),
      transaction.listMetadata(),
    ]);

    for (const document of documents) {
      if (document.id === CURRENT_PLANNER_DOCUMENT_ID
        || document.id.indexOf(LEGACY_V1_SOURCE_ID_PREFIX) === 0) {
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
    await transaction.putPlannerDocument(materialized.current);
    for (const migration of materialized.migrations) {
      await transaction.putMetadata(migration);
    }

    options.afterWriteForTest?.();
    await assertPersistedMaterializedBackup(transaction, materialized);
  });

  return {
    formatVersion: 2,
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
}>): Promise<RestoreBackupResult> {
  let parsed: unknown = options.input;
  if (typeof options.input === "string") {
    try {
      parsed = JSON.parse(options.input) as unknown;
    } catch {
      throw new BackupValidationError("invalid_backup_json", "O backup não contém JSON válido.");
    }
  }
  if (isDayforgeBackupV2Envelope(parsed)) {
    return restoreDayforgeBackupV2({
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
