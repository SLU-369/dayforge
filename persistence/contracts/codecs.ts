import {
  DATABASE_METADATA_KEY,
  CURRENT_PLANNER_DOCUMENT_ID,
  DEXIE_SCHEMA_VERSION,
  LEGACY_V1_MIGRATION_KEY_PREFIX,
  LEGACY_IMPORT_ORIGINS,
  PERSISTENCE_GENERATION,
  PLANNER_DOCUMENT_ROLES,
  type DatabaseMetadataRecord,
  type JsonObject,
  type JsonValue,
  type LegacyImportOrigin,
  type LegacyV1MigrationMetadataRecord,
  type PersistenceMetadataRecord,
  type PlannerDocumentRecord,
} from "./records.ts";

export type PersistenceValidationErrorCode =
  | "invalid_database_metadata"
  | "invalid_migration_metadata"
  | "invalid_persistence_metadata"
  | "invalid_planner_document"
  | "unsupported_schema_version";

export class PersistenceValidationError extends Error {
  readonly code: PersistenceValidationErrorCode;

  constructor(code: PersistenceValidationErrorCode, message: string) {
    super(message);
    this.name = "PersistenceValidationError";
    this.code = code;
  }
}

const DATABASE_METADATA_FIELDS = [
  "key",
  "kind",
  "persistenceGeneration",
  "schemaVersion",
  "activeDocumentId",
] as const;

const PLANNER_DOCUMENT_FIELDS = [
  "id",
  "role",
  "format",
  "formatVersion",
  "sourceContentFingerprint",
  "payload",
] as const;

const LEGACY_V1_MIGRATION_FIELDS = [
  "key",
  "kind",
  "sourceVersion",
  "contentFingerprint",
  "sourceRawFingerprints",
  "importOrigins",
  "status",
  "migratedAt",
  "documentId",
] as const;

const LEGACY_V1_MIGRATION_LEGACY_FIELDS = LEGACY_V1_MIGRATION_FIELDS.filter(
  (field) => field !== "importOrigins",
);

function isPlainObjectRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactFields(value: Record<string, unknown>, fields: readonly string[]) {
  const keys = Reflect.ownKeys(value);
  return keys.length === fields.length
    && keys.every((key) => typeof key === "string" && fields.includes(key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSha256Fingerprint(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isLegacyImportOrigin(value: unknown): value is LegacyImportOrigin {
  return LEGACY_IMPORT_ORIGINS.some((origin) => origin === value);
}

function decodeImportOrigins(value: unknown): LegacyImportOrigin[] | null {
  if (!Array.isArray(value)
    || value.length === 0
    || !value.every(isLegacyImportOrigin)
    || !value.every((origin, index) => index === 0 || value[index - 1] < origin)) {
    return null;
  }
  return [...value];
}

function isCanonicalUtcInstant(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function isJsonValue(value: unknown, seen: WeakSet<object>): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  const valid = Array.isArray(value)
    ? value.every((item) => isJsonValue(item, seen))
    : isPlainObjectRecord(value) && Object.values(value).every((item) => isJsonValue(item, seen));

  seen.delete(value);
  return valid;
}

function isJsonObject(value: unknown): value is JsonObject {
  return isPlainObjectRecord(value) && isJsonValue(value, new WeakSet<object>());
}

function isPlannerDocumentRole(value: unknown): value is PlannerDocumentRecord["role"] {
  return PLANNER_DOCUMENT_ROLES.some((role) => role === value);
}

export function decodeDatabaseMetadata(value: unknown): DatabaseMetadataRecord {
  if (!isPlainObjectRecord(value)
    || !hasExactFields(value, DATABASE_METADATA_FIELDS)
    || value.key !== DATABASE_METADATA_KEY
    || value.kind !== "database"
    || value.persistenceGeneration !== PERSISTENCE_GENERATION
    || value.schemaVersion !== DEXIE_SCHEMA_VERSION
    || !(value.activeDocumentId === null || isNonEmptyString(value.activeDocumentId))) {
    throw new PersistenceValidationError(
      "invalid_database_metadata",
      "Metadados da persistência local são inválidos ou incompatíveis.",
    );
  }

  return {
    key: value.key,
    kind: value.kind,
    persistenceGeneration: value.persistenceGeneration,
    schemaVersion: value.schemaVersion,
    activeDocumentId: value.activeDocumentId,
  };
}

export function decodeLegacyV1MigrationMetadata(
  value: unknown,
): LegacyV1MigrationMetadataRecord {
  const rawFingerprints = isPlainObjectRecord(value)
    ? value.sourceRawFingerprints
    : undefined;
  const validRawFingerprints = Array.isArray(rawFingerprints)
    && rawFingerprints.length > 0
    && rawFingerprints.every(isSha256Fingerprint)
    && rawFingerprints.every((fingerprint, index) => (
      index === 0 || rawFingerprints[index - 1] < fingerprint
    ));
  const rawImportOrigins = isPlainObjectRecord(value) && Object.hasOwn(value, "importOrigins")
    ? value.importOrigins
    : ["local-storage-v1"];
  const importOrigins = decodeImportOrigins(rawImportOrigins);

  if (!isPlainObjectRecord(value)
    || !(hasExactFields(value, LEGACY_V1_MIGRATION_FIELDS)
      || hasExactFields(value, LEGACY_V1_MIGRATION_LEGACY_FIELDS))
    || value.kind !== "legacy-v1-migration"
    || value.sourceVersion !== 1
    || !isSha256Fingerprint(value.contentFingerprint)
    || value.key !== `${LEGACY_V1_MIGRATION_KEY_PREFIX}${value.contentFingerprint}`
    || !validRawFingerprints
    || importOrigins === null
    || value.status !== "validated"
    || !isCanonicalUtcInstant(value.migratedAt)
    || value.documentId !== CURRENT_PLANNER_DOCUMENT_ID) {
    throw new PersistenceValidationError(
      "invalid_migration_metadata",
      "Metadados da migração do planner legado são inválidos.",
    );
  }

  return {
    key: `${LEGACY_V1_MIGRATION_KEY_PREFIX}${value.contentFingerprint}`,
    kind: value.kind,
    sourceVersion: value.sourceVersion,
    contentFingerprint: value.contentFingerprint,
    sourceRawFingerprints: [...rawFingerprints],
    importOrigins,
    status: value.status,
    migratedAt: value.migratedAt,
    documentId: value.documentId,
  };
}

export function decodePersistenceMetadata(value: unknown): PersistenceMetadataRecord {
  if (isPlainObjectRecord(value) && value.kind === "database") {
    return decodeDatabaseMetadata(value);
  }
  if (isPlainObjectRecord(value) && value.kind === "legacy-v1-migration") {
    return decodeLegacyV1MigrationMetadata(value);
  }
  throw new PersistenceValidationError(
    "invalid_persistence_metadata",
    "Registro de metadados da persistência local é inválido.",
  );
}

export function decodePlannerDocument(value: unknown): PlannerDocumentRecord {
  if (!isPlainObjectRecord(value)
    || !hasExactFields(value, PLANNER_DOCUMENT_FIELDS)
    || !isNonEmptyString(value.id)
    || !isPlannerDocumentRole(value.role)
    || !isNonEmptyString(value.format)
    || typeof value.formatVersion !== "number"
    || !Number.isSafeInteger(value.formatVersion)
    || value.formatVersion < 1
    || !(value.sourceContentFingerprint === null || isNonEmptyString(value.sourceContentFingerprint))
    || !isJsonObject(value.payload)) {
    throw new PersistenceValidationError(
      "invalid_planner_document",
      "Documento persistido do planner é inválido.",
    );
  }

  if (value.role === "migration-source" && !isNonEmptyString(value.sourceContentFingerprint)) {
    throw new PersistenceValidationError(
      "invalid_planner_document",
      "Documento de origem precisa identificar o conteúdo migrado.",
    );
  }

  return {
    id: value.id,
    role: value.role,
    format: value.format,
    formatVersion: value.formatVersion,
    sourceContentFingerprint: value.sourceContentFingerprint,
    payload: value.payload,
  };
}
