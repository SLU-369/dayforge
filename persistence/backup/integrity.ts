import {
  CURRENT_PLANNER_DOCUMENT_ID,
  DEXIE_SCHEMA_VERSION,
  LEGACY_V1_MIGRATION_KEY_PREFIX,
  PERSISTENCE_GENERATION,
  type LegacyV1MigrationMetadataRecord,
  type PersistenceReadTransaction,
  type PlannerDocumentRecord,
} from "../contracts/index.ts";
import {
  decodeLegacyPlannerSnapshotV1,
  encodeLegacyPlannerSnapshotV1,
  encodeNormalizedLegacyPlannerV1,
  normalizeLegacyPlannerSnapshotV1,
  parseLegacyPlannerSnapshotV1,
} from "../legacy/index.ts";
import {
  LEGACY_V1_SOURCE_FORMAT,
  LEGACY_V1_SOURCE_ID_PREFIX,
  PLANNER_DOCUMENT_FORMAT,
  canonicalStringify,
  createLegacyPlannerDocument,
  createLegacyV1SourceDocument,
  type Sha256Hasher,
} from "../migration/index.ts";
import type {
  DayforgeBackupV2,
  LegacyMigrationProvenance,
  LegacyMigrationSourceExport,
} from "./contracts.ts";
import { BackupValidationError, decodeDayforgeBackupV2 } from "./codecs.ts";

export type MaterializedBackupState = Readonly<{
  backup: DayforgeBackupV2;
  current: PlannerDocumentRecord;
  sources: readonly PlannerDocumentRecord[];
  migrations: readonly LegacyV1MigrationMetadataRecord[];
}>;

function fingerprintError(message: string): never {
  throw new BackupValidationError("invalid_backup_fingerprint", message);
}

function referenceError(message: string): never {
  throw new BackupValidationError("invalid_backup_reference", message);
}

function conflictError(message: string): never {
  throw new BackupValidationError("conflicting_backup_record", message);
}

export function assertInactiveDatabaseMetadata(metadata: Readonly<{
  persistenceGeneration: number;
  schemaVersion: number;
  activeDocumentId: string | null;
}>) {
  if (metadata.persistenceGeneration !== PERSISTENCE_GENERATION
    || metadata.schemaVersion !== DEXIE_SCHEMA_VERSION
    || metadata.activeDocumentId !== null) {
    throw new BackupValidationError(
      "invalid_backup_database_state",
      "O banco v2 precisa existir, ser compatível e permanecer inativo.",
    );
  }
}

function sameJson(left: Parameters<typeof canonicalStringify>[0], right: Parameters<typeof canonicalStringify>[0]) {
  return canonicalStringify(left) === canonicalStringify(right);
}

export async function validateAndMaterializeBackupV2(
  value: DayforgeBackupV2,
  hasher: Sha256Hasher,
): Promise<MaterializedBackupState> {
  const backup = decodeDayforgeBackupV2(value);
  if (backup.exportedFrom.schemaVersion !== DEXIE_SCHEMA_VERSION) {
    throw new BackupValidationError(
      "unsupported_backup_version",
      "O schema de origem deste backup não é compatível com esta aplicação.",
    );
  }

  const plannerPayload = encodeNormalizedLegacyPlannerV1(backup.payload.planner);
  const plannerFingerprint = await hasher.digestUtf8(canonicalStringify(plannerPayload));
  if (plannerFingerprint !== backup.payload.provenance.contentFingerprint) {
    return fingerprintError("O fingerprint do planner não corresponde ao conteúdo exportado.");
  }
  const current = createLegacyPlannerDocument(plannerFingerprint, backup.payload.planner);

  const sourceByRawFingerprint = new Map<string, LegacyMigrationSourceExport>();
  const sources: PlannerDocumentRecord[] = [];
  for (const source of backup.payload.legacySources) {
    if (sourceByRawFingerprint.has(source.rawFingerprint)) {
      return conflictError("O backup contém fingerprints de origem duplicados.");
    }
    const rawFingerprint = await hasher.digestUtf8(source.raw);
    if (rawFingerprint !== source.rawFingerprint) {
      return fingerprintError("Uma origem legada não corresponde ao rawFingerprint informado.");
    }
    let parsedSnapshot: ReturnType<typeof parseLegacyPlannerSnapshotV1>;
    try {
      parsedSnapshot = parseLegacyPlannerSnapshotV1(source.raw);
    } catch {
      throw new BackupValidationError(
        "invalid_backup_integrity",
        "Os bytes de uma origem legada não contêm um snapshot v1 válido.",
      );
    }
    if (!sameJson(
      encodeLegacyPlannerSnapshotV1(parsedSnapshot),
      encodeLegacyPlannerSnapshotV1(source.snapshot),
    )) {
      throw new BackupValidationError(
        "invalid_backup_integrity",
        "O snapshot exportado não corresponde aos bytes da origem legada.",
      );
    }
    const normalized = normalizeLegacyPlannerSnapshotV1(parsedSnapshot);
    const contentFingerprint = await hasher.digestUtf8(
      canonicalStringify(encodeNormalizedLegacyPlannerV1(normalized)),
    );
    if (contentFingerprint !== source.contentFingerprint) {
      return fingerprintError("Uma origem legada não corresponde ao contentFingerprint informado.");
    }
    sourceByRawFingerprint.set(source.rawFingerprint, source);
    sources.push(createLegacyV1SourceDocument(
      source.raw,
      source.rawFingerprint,
      source.contentFingerprint,
      parsedSnapshot,
    ));
  }

  const migrationByContent = new Map<string, LegacyMigrationProvenance>();
  const referencedSources = new Set<string>();
  const migrations: LegacyV1MigrationMetadataRecord[] = [];
  for (const origin of backup.payload.provenance.origins) {
    if (migrationByContent.has(origin.contentFingerprint)) {
      return conflictError("O backup contém migrations duplicadas para o mesmo conteúdo.");
    }
    migrationByContent.set(origin.contentFingerprint, origin);
    for (const rawFingerprint of origin.sourceRawFingerprints) {
      const source = sourceByRawFingerprint.get(rawFingerprint);
      if (source === undefined || source.contentFingerprint !== origin.contentFingerprint) {
        return referenceError("A procedência referencia uma origem ausente ou incompatível.");
      }
      if (referencedSources.has(rawFingerprint)) {
        return conflictError("Uma origem legada foi associada a mais de uma migration.");
      }
      referencedSources.add(rawFingerprint);
    }
    migrations.push({
      key: `${LEGACY_V1_MIGRATION_KEY_PREFIX}${origin.contentFingerprint}`,
      kind: "legacy-v1-migration",
      sourceVersion: origin.sourceVersion,
      contentFingerprint: origin.contentFingerprint,
      sourceRawFingerprints: [...origin.sourceRawFingerprints],
      importOrigins: [...origin.importOrigins],
      status: origin.status,
      migratedAt: origin.migratedAt,
      documentId: CURRENT_PLANNER_DOCUMENT_ID,
    });
  }

  if (sourceByRawFingerprint.size !== referencedSources.size) {
    return referenceError("O backup contém uma origem legada sem migration correspondente.");
  }
  if (migrationByContent.size > 0 && !migrationByContent.has(plannerFingerprint)) {
    return referenceError("O planner atual não possui procedência compatível no backup.");
  }
  if (migrationByContent.size === 0 && sourceByRawFingerprint.size !== 0) {
    return referenceError("Fontes legadas exigem procedência de migration.");
  }

  return {
    backup,
    current,
    sources: sources.sort((left, right) => left.id.localeCompare(right.id)),
    migrations: migrations.sort((left, right) => left.key.localeCompare(right.key)),
  };
}

function decodePersistedSource(document: PlannerDocumentRecord): LegacyMigrationSourceExport {
  const payload = document.payload;
  const fields = ["sourceKey", "rawFingerprint", "contentFingerprint", "raw", "snapshot"];
  const keys = Reflect.ownKeys(payload);
  if (document.id.indexOf(LEGACY_V1_SOURCE_ID_PREFIX) !== 0
    || document.role !== "migration-source"
    || document.format !== LEGACY_V1_SOURCE_FORMAT
    || document.formatVersion !== 1
    || keys.length !== fields.length
    || !keys.every((key) => typeof key === "string" && fields.includes(key))
    || payload.sourceKey !== "rotina-369:data:v1"
    || typeof payload.rawFingerprint !== "string"
    || document.id !== `${LEGACY_V1_SOURCE_ID_PREFIX}${payload.rawFingerprint}`
    || typeof payload.contentFingerprint !== "string"
    || document.sourceContentFingerprint !== payload.contentFingerprint
    || typeof payload.raw !== "string") {
    throw new BackupValidationError(
      "invalid_backup_integrity",
      "Uma origem legada persistida é inválida.",
    );
  }
  return {
    rawFingerprint: payload.rawFingerprint,
    contentFingerprint: payload.contentFingerprint,
    raw: payload.raw,
    snapshot: decodeLegacyPlannerSnapshotV1(payload.snapshot),
  };
}

export async function readBackupSnapshot(
  transaction: PersistenceReadTransaction,
) {
  const databaseMetadata = await transaction.getDatabaseMetadata();
  assertInactiveDatabaseMetadata(databaseMetadata);
  const [current, documents, metadata] = await Promise.all([
    transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID),
    transaction.listPlannerDocuments(),
    transaction.listMetadata(),
  ]);
  if (current === null
    || current.role !== "active"
    || current.format !== PLANNER_DOCUMENT_FORMAT
    || current.formatVersion !== 1
    || current.sourceContentFingerprint === null) {
    throw new BackupValidationError(
      "invalid_backup_integrity",
      "O planner/current validado não está disponível para exportação.",
    );
  }
  const plannerSnapshot = decodeLegacyPlannerSnapshotV1(current.payload);
  if (!Object.hasOwn(current.payload, "monthlyGoals") || current.payload.monthlyGoals === null) {
    throw new BackupValidationError(
      "invalid_backup_integrity",
      "O planner/current persistido não está normalizado.",
    );
  }
  const planner = normalizeLegacyPlannerSnapshotV1(plannerSnapshot);
  if (!sameJson(current.payload, encodeNormalizedLegacyPlannerV1(planner))) {
    throw new BackupValidationError(
      "invalid_backup_integrity",
      "O payload de planner/current não corresponde ao formato normalizado.",
    );
  }

  const legacySources = documents
    .filter((document) => document.id.indexOf(LEGACY_V1_SOURCE_ID_PREFIX) === 0)
    .map(decodePersistedSource)
    .sort((left, right) => left.rawFingerprint.localeCompare(right.rawFingerprint));
  const origins = metadata
    .filter((record): record is LegacyV1MigrationMetadataRecord => (
      record.kind === "legacy-v1-migration"
    ))
    .map((record): LegacyMigrationProvenance => ({
      kind: record.kind,
      sourceVersion: record.sourceVersion,
      contentFingerprint: record.contentFingerprint,
      sourceRawFingerprints: [...record.sourceRawFingerprints],
      importOrigins: [...record.importOrigins],
      status: record.status,
      migratedAt: record.migratedAt,
    }))
    .sort((left, right) => left.contentFingerprint.localeCompare(right.contentFingerprint));

  const backup = decodeDayforgeBackupV2({
    format: "dayforge-backup",
    formatVersion: 2,
    exportedAt: "1970-01-01T00:00:00.000Z",
    exportedFrom: {
      persistenceGeneration: databaseMetadata.persistenceGeneration,
      schemaVersion: databaseMetadata.schemaVersion,
    },
    payload: {
      planner,
      provenance: {
        contentFingerprint: current.sourceContentFingerprint,
        origins,
      },
      legacySources,
    },
  });
  return {
    databaseMetadata,
    payload: backup.payload,
  };
}

export async function assertPersistedMaterializedBackup(
  transaction: PersistenceReadTransaction,
  materialized: MaterializedBackupState,
) {
  const databaseMetadata = await transaction.getDatabaseMetadata();
  assertInactiveDatabaseMetadata(databaseMetadata);
  const [documents, metadata] = await Promise.all([
    transaction.listPlannerDocuments(),
    transaction.listMetadata(),
  ]);
  const persistedDocuments = documents
    .filter((document) => document.id === CURRENT_PLANNER_DOCUMENT_ID
      || document.id.indexOf(LEGACY_V1_SOURCE_ID_PREFIX) === 0)
    .sort((left, right) => left.id.localeCompare(right.id));
  const expectedDocuments = [...materialized.sources, materialized.current]
    .sort((left, right) => left.id.localeCompare(right.id));
  const persistedMigrations = metadata
    .filter((record): record is LegacyV1MigrationMetadataRecord => (
      record.kind === "legacy-v1-migration"
    ))
    .sort((left, right) => left.key.localeCompare(right.key));
  if (JSON.stringify(persistedDocuments) !== JSON.stringify(expectedDocuments)
    || JSON.stringify(persistedMigrations) !== JSON.stringify(materialized.migrations)) {
    throw new BackupValidationError(
      "invalid_backup_integrity",
      "O estado relido não corresponde integralmente ao backup restaurado.",
    );
  }
}
