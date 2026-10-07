import {
  CURRENT_PLANNER_DOCUMENT_ID,
  LEGACY_V1_MIGRATION_KEY_PREFIX,
  type LegacyV1MigrationMetadataRecord,
  type LegacyImportOrigin,
  type LocalPersistenceRepository,
  type PersistenceWriteTransaction,
  type PlannerDocumentRecord,
} from "../contracts/index.ts";
import {
  encodeLegacyPlannerSnapshotV1,
  encodeNormalizedLegacyPlannerV1,
  normalizeLegacyPlannerSnapshotV1,
  parseLegacyPlannerSnapshotV1,
} from "../legacy/index.ts";
import { canonicalStringify } from "./canonical-json.ts";
import { WebCryptoSha256Hasher, type Sha256Hasher } from "./sha256.ts";
import { EXECUTION_BRIDGE_DOCUMENT_ID, createBridgeDocument, reconcileExecutionBridge } from "../execution/bridge.ts";

export const LEGACY_V1_SOURCE_ID_PREFIX = "legacy-v1/source/" as const;
export const LEGACY_V1_SOURCE_FORMAT = "dayforge/legacy-v1-source" as const;
export const PLANNER_DOCUMENT_FORMAT = "dayforge/legacy-planner-state" as const;

export type LegacyV1MigrationResult = Readonly<{
  outcome: "migrated" | "reconciled" | "source-recorded" | "already-migrated";
  rawFingerprint: string;
  contentFingerprint: string;
  sourceDocumentId: string;
  documentId: typeof CURRENT_PLANNER_DOCUMENT_ID;
}>;

export class LegacyV1MigrationIntegrityError extends Error {
  readonly code = "migration_integrity_error" as const;

  constructor(message = "A migração v1 existente não corresponde à origem validada.") {
    super(message);
    this.name = "LegacyV1MigrationIntegrityError";
  }
}

function assertCanonicalUtcInstant(value: string) {
  const timestamp = Date.parse(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    || !Number.isFinite(timestamp)
    || new Date(timestamp).toISOString() !== value) {
    throw new TypeError("migratedAt must be a canonical UTC ISO instant.");
  }
}

export function createLegacyV1SourceDocument(
  raw: string,
  rawFingerprint: string,
  contentFingerprint: string,
  snapshot: ReturnType<typeof parseLegacyPlannerSnapshotV1>,
): PlannerDocumentRecord {
  return {
    id: `${LEGACY_V1_SOURCE_ID_PREFIX}${rawFingerprint}`,
    role: "migration-source",
    format: LEGACY_V1_SOURCE_FORMAT,
    formatVersion: 1,
    sourceContentFingerprint: contentFingerprint,
    payload: {
      sourceKey: "rotina-369:data:v1",
      rawFingerprint,
      contentFingerprint,
      raw,
      snapshot: encodeLegacyPlannerSnapshotV1(snapshot),
    },
  };
}

export function createLegacyPlannerDocument(
  contentFingerprint: string,
  snapshot: ReturnType<typeof normalizeLegacyPlannerSnapshotV1>,
): PlannerDocumentRecord {
  return {
    id: CURRENT_PLANNER_DOCUMENT_ID,
    role: "active",
    format: PLANNER_DOCUMENT_FORMAT,
    formatVersion: 1,
    sourceContentFingerprint: contentFingerprint,
    payload: encodeNormalizedLegacyPlannerV1(snapshot),
  };
}

function assertMatchingSource(
  existing: PlannerDocumentRecord,
  expected: PlannerDocumentRecord,
) {
  if (existing.role !== expected.role
    || existing.format !== expected.format
    || existing.formatVersion !== expected.formatVersion
    || existing.sourceContentFingerprint !== expected.sourceContentFingerprint
    || canonicalStringify(existing.payload) !== canonicalStringify(expected.payload)) {
    throw new LegacyV1MigrationIntegrityError();
  }
}

function plannerDocumentsMatch(
  existing: PlannerDocumentRecord,
  expected: PlannerDocumentRecord,
) {
  return existing.role === expected.role
    && existing.format === expected.format
    && existing.formatVersion === expected.formatVersion
    && existing.sourceContentFingerprint === expected.sourceContentFingerprint
    && canonicalStringify(existing.payload) === canonicalStringify(expected.payload);
}

function assertMatchingMigration(
  metadata: LegacyV1MigrationMetadataRecord,
  contentFingerprint: string,
) {
  if (metadata.contentFingerprint !== contentFingerprint
    || metadata.key !== `${LEGACY_V1_MIGRATION_KEY_PREFIX}${contentFingerprint}`
    || metadata.documentId !== CURRENT_PLANNER_DOCUMENT_ID) {
    throw new LegacyV1MigrationIntegrityError();
  }
}

async function assertPersistedMigration(
  transaction: PersistenceWriteTransaction,
  source: PlannerDocumentRecord,
  current: PlannerDocumentRecord,
  metadataKey: LegacyV1MigrationMetadataRecord["key"],
  rawFingerprint: string,
  contentFingerprint: string,
  origin: LegacyImportOrigin,
  active: boolean,
) {
  const [databaseMetadata, persistedSource, persistedCurrent, persistedMetadata] =
    await Promise.all([
      transaction.getDatabaseMetadata(),
      transaction.getPlannerDocument(source.id),
      transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID),
      transaction.getMetadata(metadataKey),
    ]);
  if (databaseMetadata.activeDocumentId !== (active ? CURRENT_PLANNER_DOCUMENT_ID : null)
    || persistedSource === null
    || persistedCurrent === null
    || persistedMetadata === null
    || persistedMetadata.kind !== "legacy-v1-migration"
    || persistedMetadata.status !== "validated"
    || !persistedMetadata.importOrigins.includes(origin)
    || persistedMetadata.sourceRawFingerprints.filter(
      (fingerprint) => fingerprint === rawFingerprint,
    ).length !== 1) {
    throw new LegacyV1MigrationIntegrityError();
  }
  assertMatchingSource(persistedSource, source);
  if (!plannerDocumentsMatch(persistedCurrent, current)) {
    throw new LegacyV1MigrationIntegrityError();
  }
  assertMatchingMigration(persistedMetadata, contentFingerprint);
}

export async function migrateLegacyPlannerV1(options: Readonly<{
  raw: string;
  migratedAt: string;
  repository: LocalPersistenceRepository;
  hasher?: Sha256Hasher;
  origin?: LegacyImportOrigin;
  active?: boolean;
  afterWriteForTest?: () => void;
}>): Promise<LegacyV1MigrationResult> {
  assertCanonicalUtcInstant(options.migratedAt);
  const snapshot = parseLegacyPlannerSnapshotV1(options.raw);
  const normalized = normalizeLegacyPlannerSnapshotV1(snapshot);
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const origin = options.origin ?? "local-storage-v1";
  const [rawFingerprint, contentFingerprint] = await Promise.all([
    hasher.digestUtf8(options.raw),
    hasher.digestUtf8(canonicalStringify(encodeNormalizedLegacyPlannerV1(normalized))),
  ]);
  const source = createLegacyV1SourceDocument(
    options.raw,
    rawFingerprint,
    contentFingerprint,
    snapshot,
  );
  const current = createLegacyPlannerDocument(contentFingerprint, normalized);
  const executionDocument = options.active && origin === "backup-v1"
    ? await createBridgeDocument(reconcileExecutionBridge(normalized), hasher) : null;
  const metadataKey: `${typeof LEGACY_V1_MIGRATION_KEY_PREFIX}${string}` =
    `${LEGACY_V1_MIGRATION_KEY_PREFIX}${contentFingerprint}`;

  return options.repository.write(async (transaction) => {
    const existingDocuments = await transaction.listPlannerDocuments();
    if (existingDocuments.some((document) => document.id.startsWith("execution/") && document.id !== EXECUTION_BRIDGE_DOCUMENT_ID)) {
      throw new LegacyV1MigrationIntegrityError();
    }
    if (origin !== "backup-v1" && existingDocuments.some((document) => document.id === EXECUTION_BRIDGE_DOCUMENT_ID)
      && !existingDocuments.some((document) => document.id === CURRENT_PLANNER_DOCUMENT_ID && plannerDocumentsMatch(document, current))) {
      throw new LegacyV1MigrationIntegrityError();
    }
    // Explicit v1 import replaces the recoverable set; it never invents executions.
    if (origin === "backup-v1") {
      await transaction.deletePlannerDocument(EXECUTION_BRIDGE_DOCUMENT_ID);
      const metadata = { ...await transaction.getDatabaseMetadata() };
      delete metadata.executionBridgeVersion;
      await transaction.putDatabaseMetadata(executionDocument ? { ...metadata, executionBridgeVersion: 1 } : metadata);
      if (executionDocument) await transaction.putPlannerDocument(executionDocument);
    }
    if ((await transaction.getDatabaseMetadata()).activeDocumentId
      !== (options.active ? CURRENT_PLANNER_DOCUMENT_ID : null)) {
      throw new LegacyV1MigrationIntegrityError(
        "A autoridade do banco v2 não corresponde ao modo de importação v1.",
      );
    }
    const existingSource = await transaction.getPlannerDocument(source.id);
    if (existingSource === null) {
      await transaction.putPlannerDocument(source);
    } else {
      assertMatchingSource(existingSource, source);
    }

    const existingMetadata = await transaction.getMetadata(metadataKey);
    if (existingMetadata !== null) {
      if (existingMetadata.kind !== "legacy-v1-migration") {
        throw new LegacyV1MigrationIntegrityError();
      }
      assertMatchingMigration(existingMetadata, contentFingerprint);

      const existingCurrent = await transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID);
      const currentNeedsReconciliation = existingCurrent === null
        || !plannerDocumentsMatch(existingCurrent, current);

      const alreadyKnown = existingMetadata.sourceRawFingerprints.includes(rawFingerprint);
      const originAlreadyKnown = existingMetadata.importOrigins.includes(origin);
      if (currentNeedsReconciliation) {
        await transaction.putPlannerDocument(current);
      }
      if (!alreadyKnown) {
        await transaction.putMetadata({
          ...existingMetadata,
          sourceRawFingerprints: [...existingMetadata.sourceRawFingerprints, rawFingerprint].sort(),
        });
      }
      if (!originAlreadyKnown) {
        const latestMetadata = await transaction.getMetadata(metadataKey);
        if (latestMetadata === null || latestMetadata.kind !== "legacy-v1-migration") {
          throw new LegacyV1MigrationIntegrityError();
        }
        await transaction.putMetadata({
          ...latestMetadata,
          importOrigins: [...latestMetadata.importOrigins, origin].sort(),
        });
      }
      options.afterWriteForTest?.();
      await assertPersistedMigration(
        transaction,
        source,
        current,
        metadataKey,
        rawFingerprint,
        contentFingerprint,
        origin,
        options.active === true,
      );

      return {
        outcome: currentNeedsReconciliation
          ? "reconciled"
          : alreadyKnown ? "already-migrated" : "source-recorded",
        rawFingerprint,
        contentFingerprint,
        sourceDocumentId: source.id,
        documentId: CURRENT_PLANNER_DOCUMENT_ID,
      };
    }

    const metadata: LegacyV1MigrationMetadataRecord = {
      key: metadataKey,
      kind: "legacy-v1-migration",
      sourceVersion: 1,
      contentFingerprint,
      sourceRawFingerprints: [rawFingerprint],
      importOrigins: [origin],
      status: "validated",
      migratedAt: options.migratedAt,
      documentId: CURRENT_PLANNER_DOCUMENT_ID,
    };
    await transaction.putPlannerDocument(current);
    await transaction.putMetadata(metadata);
    options.afterWriteForTest?.();
    await assertPersistedMigration(
      transaction,
      source,
      current,
      metadataKey,
      rawFingerprint,
      contentFingerprint,
      origin,
      options.active === true,
    );

    return {
      outcome: "migrated",
      rawFingerprint,
      contentFingerprint,
      sourceDocumentId: source.id,
      documentId: CURRENT_PLANNER_DOCUMENT_ID,
    };
  });
}
