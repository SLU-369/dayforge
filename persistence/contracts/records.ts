export const PERSISTENCE_GENERATION = 2 as const;
export const DEXIE_SCHEMA_VERSION = 1 as const;
export const DATABASE_METADATA_KEY = "database" as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { readonly [key: string]: JsonValue };

export type DatabaseMetadataRecord = Readonly<{
  key: typeof DATABASE_METADATA_KEY;
  kind: "database";
  persistenceGeneration: typeof PERSISTENCE_GENERATION;
  schemaVersion: typeof DEXIE_SCHEMA_VERSION;
  activeDocumentId: string | null;
}>;

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
