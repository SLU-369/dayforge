import {
  DATABASE_METADATA_KEY,
  DEXIE_SCHEMA_VERSION,
  PERSISTENCE_GENERATION,
  PLANNER_DOCUMENT_ROLES,
  type DatabaseMetadataRecord,
  type JsonObject,
  type JsonValue,
  type PlannerDocumentRecord,
} from "./records.ts";

export type PersistenceValidationErrorCode =
  | "invalid_database_metadata"
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
