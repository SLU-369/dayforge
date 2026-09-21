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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

  if (Array.isArray(value)) return value.every((item) => isJsonValue(item, seen));
  return Object.values(value).every((item) => isJsonValue(item, seen));
}

function isJsonObject(value: unknown): value is JsonObject {
  return isObjectRecord(value) && isJsonValue(value, new WeakSet<object>());
}

export function decodeDatabaseMetadata(value: unknown): DatabaseMetadataRecord {
  if (!isObjectRecord(value)
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

  return value as DatabaseMetadataRecord;
}

export function decodePlannerDocument(value: unknown): PlannerDocumentRecord {
  if (!isObjectRecord(value)
    || !isNonEmptyString(value.id)
    || typeof value.role !== "string"
    || !PLANNER_DOCUMENT_ROLES.includes(value.role as PlannerDocumentRecord["role"])
    || !isNonEmptyString(value.format)
    || !Number.isSafeInteger(value.formatVersion)
    || (value.formatVersion as number) < 1
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

  return value as PlannerDocumentRecord;
}
