import Dexie, { type EntityTable } from "dexie";
import {
  DATABASE_METADATA_KEY,
  DEXIE_SCHEMA_VERSION,
  createDatabaseMetadata,
  decodeDatabaseMetadata,
  PersistenceValidationError,
  type PersistenceMetadataRecord,
  type PlannerDocumentRecord,
} from "../contracts/index.ts";

export const DAYFORGE_DATABASE_NAME = "dayforge-local";
const DEXIE_NATIVE_VERSION_FACTOR = 10;

export class DayforgeDatabase extends Dexie {
  metadata!: EntityTable<PersistenceMetadataRecord, "key">;
  plannerDocuments!: EntityTable<PlannerDocumentRecord, "id">;

  constructor(name = DAYFORGE_DATABASE_NAME) {
    super(name);

    this.version(DEXIE_SCHEMA_VERSION).stores({
      metadata: "&key",
      plannerDocuments: "&id, role, sourceContentFingerprint",
    });

    this.on("populate", (transaction) =>
      transaction.table<PersistenceMetadataRecord>("metadata").add(createDatabaseMetadata()));
  }
}

export async function openAndValidateDatabase(database: DayforgeDatabase) {
  await database.open();
  try {
    if (database.backendDB().version !== DEXIE_SCHEMA_VERSION * DEXIE_NATIVE_VERSION_FACTOR) {
      throw new PersistenceValidationError(
        "unsupported_schema_version",
        "A versão interna do banco local não é compatível com esta aplicação.",
      );
    }
    const metadata = await database.metadata.get(DATABASE_METADATA_KEY);
    return decodeDatabaseMetadata(metadata);
  } catch (error) {
    database.close();
    throw error;
  }
}
