export const PERSISTENCE_GENERATION = 2 as const;
export const DEXIE_SCHEMA_VERSION = 1 as const;
export const DATABASE_METADATA_KEY = "database" as const;
export const LEGACY_V1_MIGRATION_KEY_PREFIX = "migration/v1/" as const;
export const CURRENT_PLANNER_DOCUMENT_ID = "planner/current" as const;
export const LEGACY_IMPORT_ORIGINS = ["backup-v1", "local-storage-v1"] as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { readonly [key: string]: JsonValue };
export type LegacyImportOrigin = (typeof LEGACY_IMPORT_ORIGINS)[number];

export type DatabaseMetadataRecord = Readonly<{
  key: typeof DATABASE_METADATA_KEY;
  kind: "database";
  persistenceGeneration: typeof PERSISTENCE_GENERATION;
  schemaVersion: typeof DEXIE_SCHEMA_VERSION;
  activeDocumentId: string | null;
}>;

export type LegacyV1MigrationMetadataRecord = Readonly<{
  key: `${typeof LEGACY_V1_MIGRATION_KEY_PREFIX}${string}`;
  kind: "legacy-v1-migration";
  sourceVersion: 1;
  contentFingerprint: string;
  sourceRawFingerprints: readonly string[];
  importOrigins: readonly LegacyImportOrigin[];
  status: "validated";
  migratedAt: string;
  documentId: typeof CURRENT_PLANNER_DOCUMENT_ID;
}>;

export type PersistenceMetadataRecord =
  | DatabaseMetadataRecord
  | LegacyV1MigrationMetadataRecord;

export const PLANNER_DOCUMENT_ROLES = ["active", "migration-source"] as const;
export type PlannerDocumentRole = (typeof PLANNER_DOCUMENT_ROLES)[number];

export type PlannerDocumentRecord = Readonly<{
  id: string;
  role: PlannerDocumentRole;
  format: string;
  formatVersion: number;
  sourceContentFingerprint: string | null;
  payload: JsonObject;
}>;

export function createDatabaseMetadata(): DatabaseMetadataRecord {
  return {
    key: DATABASE_METADATA_KEY,
    kind: "database",
    persistenceGeneration: PERSISTENCE_GENERATION,
    schemaVersion: DEXIE_SCHEMA_VERSION,
    activeDocumentId: null,
  };
}
