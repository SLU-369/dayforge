import {
  CURRENT_PLANNER_DOCUMENT_ID,
  LEGACY_V1_MIGRATION_KEY_PREFIX,
  type LegacyV1MigrationMetadataRecord,
  type LocalPersistenceRepository,
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

export const LEGACY_V1_SOURCE_ID_PREFIX = "legacy-v1/source/" as const;
export const LEGACY_V1_SOURCE_FORMAT = "dayforge/legacy-v1-source" as const;
export const PLANNER_DOCUMENT_FORMAT = "dayforge/legacy-planner-state" as const;

export type LegacyV1MigrationResult = Readonly<{
  outcome: "migrated" | "source-recorded" | "already-migrated";
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

function sourceDocument(
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

function activeDocument(
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

export async function migrateLegacyPlannerV1(options: Readonly<{
  raw: string;
  migratedAt: string;
  repository: LocalPersistenceRepository;
  hasher?: Sha256Hasher;
}>): Promise<LegacyV1MigrationResult> {
  assertCanonicalUtcInstant(options.migratedAt);
  const snapshot = parseLegacyPlannerSnapshotV1(options.raw);
  const normalized = normalizeLegacyPlannerSnapshotV1(snapshot);
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const [rawFingerprint, contentFingerprint] = await Promise.all([
    hasher.digestUtf8(options.raw),
    hasher.digestUtf8(canonicalStringify(encodeNormalizedLegacyPlannerV1(normalized))),
  ]);
  const source = sourceDocument(options.raw, rawFingerprint, contentFingerprint, snapshot);
  const current = activeDocument(contentFingerprint, normalized);
  const metadataKey: `${typeof LEGACY_V1_MIGRATION_KEY_PREFIX}${string}` =
    `${LEGACY_V1_MIGRATION_KEY_PREFIX}${contentFingerprint}`;

  return options.repository.write(async (transaction) => {
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
      if (existingCurrent === null
        || existingCurrent.role !== current.role
        || existingCurrent.format !== current.format
        || existingCurrent.formatVersion !== current.formatVersion
        || existingCurrent.sourceContentFingerprint !== contentFingerprint
        || canonicalStringify(existingCurrent.payload) !== canonicalStringify(current.payload)) {
        throw new LegacyV1MigrationIntegrityError();
      }

      const alreadyKnown = existingMetadata.sourceRawFingerprints.includes(rawFingerprint);
      if (!alreadyKnown) {
        await transaction.putMetadata({
          ...existingMetadata,
          sourceRawFingerprints: [...existingMetadata.sourceRawFingerprints, rawFingerprint].sort(),
        });
      }
      const persistedSource = await transaction.getPlannerDocument(source.id);
      if (persistedSource === null) throw new LegacyV1MigrationIntegrityError();
      assertMatchingSource(persistedSource, source);

      return {
        outcome: alreadyKnown ? "already-migrated" : "source-recorded",
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
      status: "validated",
      migratedAt: options.migratedAt,
      documentId: CURRENT_PLANNER_DOCUMENT_ID,
    };
    await transaction.putPlannerDocument(current);
    await transaction.putMetadata(metadata);

    const [persistedSource, persistedCurrent, persistedMetadata] = await Promise.all([
      transaction.getPlannerDocument(source.id),
      transaction.getPlannerDocument(CURRENT_PLANNER_DOCUMENT_ID),
      transaction.getMetadata(metadataKey),
    ]);
    if (persistedSource === null || persistedCurrent === null
      || persistedMetadata === null || persistedMetadata.kind !== "legacy-v1-migration") {
      throw new LegacyV1MigrationIntegrityError();
    }
    assertMatchingSource(persistedSource, source);
    if (canonicalStringify(persistedCurrent.payload) !== canonicalStringify(current.payload)
      || persistedCurrent.sourceContentFingerprint !== contentFingerprint) {
      throw new LegacyV1MigrationIntegrityError();
    }
    assertMatchingMigration(persistedMetadata, contentFingerprint);

    return {
      outcome: "migrated",
      rawFingerprint,
      contentFingerprint,
      sourceDocumentId: source.id,
      documentId: CURRENT_PLANNER_DOCUMENT_ID,
    };
  });
}
