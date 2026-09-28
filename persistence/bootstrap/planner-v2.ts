import {
  CURRENT_PLANNER_DOCUMENT_ID,
  LEGACY_V1_MIGRATION_KEY_PREFIX,
  type LocalPersistenceRepository,
} from "../contracts/index.ts";
import {
  BackupValidationError,
  exportDayforgeBackupV2,
  isDayforgeBackupV2Envelope,
  restoreDayforgeBackup,
  restoreDayforgeBackupV2,
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

export const PERSISTENCE_V2_MARKER_KEY = "dayforge:persistence:v2" as const;
export const PERSISTENCE_V2_MARKER_VALUE = "active" as const;

type MarkerStorage = Pick<Storage, "getItem" | "setItem">;
type LegacyStorage = Pick<Storage, "getItem">;

export type PlannerV2BootResult = Readonly<{
  state: NormalizedLegacyPlannerV1;
  markerRepaired: boolean;
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
  return exportDayforgeBackupV2({ repository, exportedAt, active: true });
}

async function activatePreparedPlanner(
  repository: LocalPersistenceRepository,
  markerStorage: MarkerStorage,
  instant: string,
  hasher?: Sha256Hasher,
) {
  const validated = await exportDayforgeBackupV2({ repository, exportedAt: instant, hasher });
  if (!repairMarker(markerStorage)) throw new PlannerV2UnavailableError();
  await repository.write(async (transaction) => {
    const metadata = await transaction.getDatabaseMetadata();
    assertInactiveDatabaseMetadata(metadata);
    const current = await transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID);
    if (current === null || current.role !== "active"
      || current.sourceContentFingerprint !== validated.payload.provenance.contentFingerprint) {
      throw new PlannerV2UnavailableError();
    }
    await transaction.putDatabaseMetadata({
      ...metadata,
      activeDocumentId: CURRENT_PLANNER_DOCUMENT_ID,
    });
  });
  return (await activeSnapshot(repository, instant)).payload.planner;
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
      const backup = await activeSnapshot(repository, instant);
      const markerRepaired = marker === PERSISTENCE_V2_MARKER_VALUE || repairMarker(markerStorage);
      return { state: backup.payload.planner, markerRepaired };
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
      const hasher = options.hasher ?? new WebCryptoSha256Hasher();
      const snapshot = normalizeLegacyPlannerSnapshotV1(
        parseLegacyPlannerSnapshotV1(JSON.stringify(options.defaultState)),
      );
      const fingerprint = await hasher.digestUtf8(canonicalStringify(encodeNormalizedLegacyPlannerV1(snapshot)));
      await repository.write(async (transaction) => {
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
    return {
      state: await activatePreparedPlanner(repository, markerStorage, instant, options.hasher),
      markerRepaired: true,
    };
  } catch {
    throw new PlannerV2UnavailableError();
  }
}

export async function saveActivePlannerV2(options: Readonly<{
  repository: LocalPersistenceRepository;
  state: NormalizedLegacyPlannerV1;
  hasher?: Sha256Hasher;
}>): Promise<void> {
  const state = normalizeLegacyPlannerSnapshotV1(
    parseLegacyPlannerSnapshotV1(JSON.stringify(options.state)),
  );
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const fingerprint = await hasher.digestUtf8(canonicalStringify(encodeNormalizedLegacyPlannerV1(state)));
  await options.repository.write(async (transaction) => {
    assertActiveDatabaseMetadata(await transaction.getDatabaseMetadata());
    const existing = await transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID);
    if (existing === null || existing.role !== "active") throw new PlannerV2UnavailableError();
    if (existing.sourceContentFingerprint === fingerprint
      && canonicalStringify(existing.payload) === canonicalStringify(encodeNormalizedLegacyPlannerV1(state))) return;
    const [documents, metadata] = await Promise.all([
      transaction.listPlannerDocuments(),
      transaction.listMetadata(),
    ]);
    await transaction.putPlannerDocument(createLegacyPlannerDocument(fingerprint, state));
    // Legacy provenance describes the original snapshot and cannot claim later edits.
    for (const document of documents) {
      if (document.id.startsWith(LEGACY_V1_SOURCE_ID_PREFIX)) {
        await transaction.deletePlannerDocument(document.id);
      }
    }
    for (const record of metadata) {
      if (record.key.startsWith(LEGACY_V1_MIGRATION_KEY_PREFIX)) {
        await transaction.deleteMetadata(record.key);
      }
    }
  });
}

export async function restoreActivePlannerV2(options: Readonly<{
  repository: LocalPersistenceRepository;
  input: string;
  instant: string;
  hasher?: Sha256Hasher;
  afterWriteForTest?: () => void;
}>): Promise<NormalizedLegacyPlannerV1> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(options.input) as unknown;
  } catch {
    throw new BackupValidationError("invalid_backup_json", "O backup não contém JSON válido.");
  }
  if (isDayforgeBackupV2Envelope(parsed)) {
    await restoreDayforgeBackupV2({
      backup: parsed,
      repository: options.repository,
      hasher: options.hasher,
      active: true,
      afterWriteForTest: options.afterWriteForTest,
    });
  } else {
    await migrateLegacyPlannerV1({
      raw: options.input,
      migratedAt: options.instant,
      repository: options.repository,
      hasher: options.hasher,
      origin: "backup-v1",
      active: true,
      afterWriteForTest: options.afterWriteForTest,
    });
  }
  return (await activeSnapshot(options.repository, options.instant)).payload.planner;
}

export async function recoverPlannerV2(options: Readonly<{
  repository: LocalPersistenceRepository;
  markerStorage: MarkerStorage;
  input: string;
  instant: string;
  hasher?: Sha256Hasher;
}>): Promise<PlannerV2BootResult> {
  await options.repository.open();
  const metadata = await options.repository.read((transaction) => transaction.getDatabaseMetadata());
  if (metadata.activeDocumentId !== null) {
    const state = await restoreActivePlannerV2(options);
    return { state, markerRepaired: repairMarker(options.markerStorage) };
  }
  await restoreDayforgeBackup({
    input: options.input,
    migratedAt: options.instant,
    repository: options.repository,
    hasher: options.hasher,
  });
  return {
    state: await activatePreparedPlanner(
      options.repository, options.markerStorage, options.instant, options.hasher,
    ),
    markerRepaired: true,
  };
}

export async function resetPlannerV2(options: Readonly<{
  repository: LocalPersistenceRepository;
  markerStorage: MarkerStorage;
  defaultState: NormalizedLegacyPlannerV1;
  instant: string;
  hasher?: Sha256Hasher;
}>): Promise<PlannerV2BootResult> {
  const state = normalizeLegacyPlannerSnapshotV1(
    parseLegacyPlannerSnapshotV1(JSON.stringify(options.defaultState)),
  );
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const fingerprint = await hasher.digestUtf8(canonicalStringify(encodeNormalizedLegacyPlannerV1(state)));
  await options.repository.open();
  const metadata = await options.repository.read((transaction) => transaction.getDatabaseMetadata());
  await options.repository.write(async (transaction) => {
    const currentMetadata = await transaction.getDatabaseMetadata();
    if (currentMetadata.activeDocumentId === null) assertInactiveDatabaseMetadata(currentMetadata);
    else assertActiveDatabaseMetadata(currentMetadata);
    const [documents, records] = await Promise.all([
      transaction.listPlannerDocuments(),
      transaction.listMetadata(),
    ]);
    for (const document of documents) {
      if (document.id === CURRENT_PLANNER_DOCUMENT_ID
        || document.id.startsWith(LEGACY_V1_SOURCE_ID_PREFIX)) {
        await transaction.deletePlannerDocument(document.id);
      }
    }
    for (const record of records) {
      if (record.key.startsWith(LEGACY_V1_MIGRATION_KEY_PREFIX)) {
        await transaction.deleteMetadata(record.key);
      }
    }
    await transaction.putPlannerDocument(createLegacyPlannerDocument(fingerprint, state));
  });
  if (metadata.activeDocumentId === null) {
    return {
      state: await activatePreparedPlanner(options.repository, options.markerStorage, options.instant, hasher),
      markerRepaired: true,
    };
  }
  const markerRepaired = repairMarker(options.markerStorage);
  return {
    state: (await activeSnapshot(options.repository, options.instant)).payload.planner,
    markerRepaired,
  };
}
