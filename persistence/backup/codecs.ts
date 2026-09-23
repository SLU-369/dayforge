import {
  LEGACY_IMPORT_ORIGINS,
  PERSISTENCE_GENERATION,
  type LegacyImportOrigin,
} from "../contracts/index.ts";
import {
  decodeLegacyPlannerSnapshotV1,
  normalizeLegacyPlannerSnapshotV1,
} from "../legacy/index.ts";
import {
  DAYFORGE_BACKUP_FORMAT,
  DAYFORGE_BACKUP_FORMAT_VERSION,
  type DayforgeBackupV2,
  type LegacyMigrationProvenance,
  type LegacyMigrationSourceExport,
  type PlannerProvenance,
} from "./contracts.ts";

export type BackupValidationErrorCode =
  | "invalid_backup_json"
  | "invalid_backup_envelope"
  | "unsupported_backup_version"
  | "invalid_backup_payload"
  | "invalid_backup_fingerprint"
  | "invalid_backup_reference"
  | "conflicting_backup_record"
  | "invalid_backup_integrity"
  | "invalid_backup_database_state";

export class BackupValidationError extends Error {
  readonly code: BackupValidationErrorCode;

  constructor(code: BackupValidationErrorCode, message: string) {
    super(message);
    this.name = "BackupValidationError";
    this.code = code;
  }
}

const ENVELOPE_FIELDS = ["format", "formatVersion", "exportedAt", "exportedFrom", "payload"];
const EXPORTED_FROM_FIELDS = ["persistenceGeneration", "schemaVersion"];
const PAYLOAD_FIELDS = ["planner", "provenance", "legacySources"];
const PROVENANCE_FIELDS = ["contentFingerprint", "origins"];
const ORIGIN_FIELDS = [
  "kind",
  "sourceVersion",
  "contentFingerprint",
  "sourceRawFingerprints",
  "importOrigins",
  "status",
  "migratedAt",
];
const SOURCE_FIELDS = ["rawFingerprint", "contentFingerprint", "raw", "snapshot"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactFields(value: Record<string, unknown>, fields: readonly string[]) {
  const keys = Reflect.ownKeys(value);
  return keys.length === fields.length
    && keys.every((key) => typeof key === "string" && fields.includes(key));
}

export function isSha256Fingerprint(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function isCanonicalUtcInstant(value: unknown): value is string {
  if (typeof value !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return false;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function isLegacyImportOrigin(value: unknown): value is LegacyImportOrigin {
  return LEGACY_IMPORT_ORIGINS.some((origin) => origin === value);
}

function isStrictlySorted(values: readonly string[]) {
  return values.every((value, index) => index === 0 || values[index - 1] < value);
}

function invalidPayload(message = "O conteúdo do backup v2 é inválido."): never {
  throw new BackupValidationError("invalid_backup_payload", message);
}

function decodePlannerSnapshot(value: unknown, message: string) {
  try {
    return decodeLegacyPlannerSnapshotV1(value);
  } catch {
    return invalidPayload(message);
  }
}

function decodeOrigin(value: unknown): LegacyMigrationProvenance {
  if (!isPlainObject(value)
    || !hasExactFields(value, ORIGIN_FIELDS)
    || value.kind !== "legacy-v1-migration"
    || value.sourceVersion !== 1
    || !isSha256Fingerprint(value.contentFingerprint)
    || !Array.isArray(value.sourceRawFingerprints)
    || value.sourceRawFingerprints.length === 0
    || !value.sourceRawFingerprints.every(isSha256Fingerprint)
    || !isStrictlySorted(value.sourceRawFingerprints)
    || !Array.isArray(value.importOrigins)
    || value.importOrigins.length === 0
    || !value.importOrigins.every(isLegacyImportOrigin)
    || !isStrictlySorted(value.importOrigins)
    || value.status !== "validated"
    || !isCanonicalUtcInstant(value.migratedAt)) {
    return invalidPayload("A procedência do backup v2 é inválida.");
  }

  return {
    kind: value.kind,
    sourceVersion: value.sourceVersion,
    contentFingerprint: value.contentFingerprint,
    sourceRawFingerprints: [...value.sourceRawFingerprints],
    importOrigins: [...value.importOrigins],
    status: value.status,
    migratedAt: value.migratedAt,
  };
}

function decodeProvenance(value: unknown): PlannerProvenance {
  if (!isPlainObject(value)
    || !hasExactFields(value, PROVENANCE_FIELDS)
    || !isSha256Fingerprint(value.contentFingerprint)
    || !Array.isArray(value.origins)) {
    return invalidPayload("A procedência do planner é inválida.");
  }
  const origins = value.origins.map(decodeOrigin);
  if (!origins.every((origin, index) => (
    index === 0 || origins[index - 1].contentFingerprint < origin.contentFingerprint
  ))) {
    return invalidPayload("As migrations do backup v2 precisam ser únicas e ordenadas.");
  }
  return {
    contentFingerprint: value.contentFingerprint,
    origins,
  };
}

function decodeSource(value: unknown): LegacyMigrationSourceExport {
  if (!isPlainObject(value)
    || !hasExactFields(value, SOURCE_FIELDS)
    || !isSha256Fingerprint(value.rawFingerprint)
    || !isSha256Fingerprint(value.contentFingerprint)
    || typeof value.raw !== "string") {
    return invalidPayload("Uma origem legada do backup v2 é inválida.");
  }
  return {
    rawFingerprint: value.rawFingerprint,
    contentFingerprint: value.contentFingerprint,
    raw: value.raw,
    snapshot: decodePlannerSnapshot(value.snapshot, "O snapshot de uma origem legada é inválido."),
  };
}

export function isDayforgeBackupV2Envelope(
  value: unknown,
): value is Record<string, unknown> & { format: typeof DAYFORGE_BACKUP_FORMAT } {
  return isPlainObject(value) && value.format === DAYFORGE_BACKUP_FORMAT;
}

export function decodeDayforgeBackupV2(value: unknown): DayforgeBackupV2 {
  if (isDayforgeBackupV2Envelope(value)
    && value.formatVersion !== DAYFORGE_BACKUP_FORMAT_VERSION) {
    throw new BackupValidationError(
      "unsupported_backup_version",
      "A versão deste backup não é compatível com esta aplicação.",
    );
  }
  if (!isPlainObject(value)
    || !hasExactFields(value, ENVELOPE_FIELDS)
    || value.format !== DAYFORGE_BACKUP_FORMAT
    || value.formatVersion !== DAYFORGE_BACKUP_FORMAT_VERSION
    || !isCanonicalUtcInstant(value.exportedAt)
    || !isPlainObject(value.exportedFrom)
    || !hasExactFields(value.exportedFrom, EXPORTED_FROM_FIELDS)
    || value.exportedFrom.persistenceGeneration !== PERSISTENCE_GENERATION
    || typeof value.exportedFrom.schemaVersion !== "number"
    || !Number.isSafeInteger(value.exportedFrom.schemaVersion)
    || value.exportedFrom.schemaVersion < 1
    || !isPlainObject(value.payload)
    || !hasExactFields(value.payload, PAYLOAD_FIELDS)
    || !isPlainObject(value.payload.planner)
    || !Array.isArray(value.payload.legacySources)) {
    throw new BackupValidationError(
      "invalid_backup_envelope",
      "O envelope do backup v2 é inválido.",
    );
  }

  const payload = value.payload;
  if (!isPlainObject(payload)
    || !isPlainObject(payload.planner)
    || !Array.isArray(payload.legacySources)) {
    throw new BackupValidationError("invalid_backup_envelope", "O payload do backup v2 é inválido.");
  }
  const plannerInput = payload.planner;
  const planner = normalizeLegacyPlannerSnapshotV1(decodePlannerSnapshot(
    plannerInput,
    "O planner do backup v2 é inválido.",
  ));
  if (!Object.hasOwn(plannerInput, "monthlyGoals") || plannerInput.monthlyGoals === null) {
    return invalidPayload("O planner do backup v2 precisa estar normalizado.");
  }
  const legacySources = payload.legacySources.map(decodeSource);
  if (!legacySources.every((source, index) => (
    index === 0 || legacySources[index - 1].rawFingerprint < source.rawFingerprint
  ))) {
    return invalidPayload("As origens legadas precisam ser únicas e ordenadas.");
  }

  return {
    format: value.format,
    formatVersion: value.formatVersion,
    exportedAt: value.exportedAt,
    exportedFrom: {
      persistenceGeneration: value.exportedFrom.persistenceGeneration,
      schemaVersion: value.exportedFrom.schemaVersion,
    },
    payload: {
      planner,
      provenance: decodeProvenance(payload.provenance),
      legacySources,
    },
  };
}

export function parseDayforgeBackupV2(raw: string): DayforgeBackupV2 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new BackupValidationError("invalid_backup_json", "O backup não contém JSON válido.");
  }
  return decodeDayforgeBackupV2(parsed);
}
