import {
  DATABASE_METADATA_KEY,
  decodeDatabaseMetadata,
  decodePersistenceMetadata,
  decodePlannerDocument,
  type DatabaseMetadataRecord,
  type LocalPersistenceRepository,
  type PersistenceMetadataRecord,
  type PersistenceReadTransaction,
  type PersistenceWriteTransaction,
  type PlannerDocumentRecord,
} from "../contracts/index.ts";
import { DayforgeDatabase, openAndValidateDatabase } from "./dayforge-database.ts";

class IndexedDbTransaction implements PersistenceWriteTransaction {
  private readonly metadata: DayforgeDatabase["metadata"];
  private readonly plannerDocuments: DayforgeDatabase["plannerDocuments"];

  constructor(
    metadata: DayforgeDatabase["metadata"],
    plannerDocuments: DayforgeDatabase["plannerDocuments"],
  ) {
    this.metadata = metadata;
    this.plannerDocuments = plannerDocuments;
  }

  async getDatabaseMetadata() {
    return decodeDatabaseMetadata(await this.metadata.get(DATABASE_METADATA_KEY));
  }

  async getMetadata(key: PersistenceMetadataRecord["key"]) {
    const metadata = await this.metadata.get(key);
    return metadata === undefined ? null : decodePersistenceMetadata(metadata);
  }

  async getPlannerDocument(id: string) {
    const document = await this.plannerDocuments.get(id);
    return document === undefined ? null : decodePlannerDocument(document);
  }

  async listPlannerDocuments() {
    return Promise.all((await this.plannerDocuments.toArray()).map(decodePlannerDocument));
  }

  async putDatabaseMetadata(metadata: DatabaseMetadataRecord) {
    await this.metadata.put(decodeDatabaseMetadata(metadata));
  }

  async putMetadata(metadata: PersistenceMetadataRecord) {
    await this.metadata.put(decodePersistenceMetadata(metadata));
  }

  async putPlannerDocument(document: PlannerDocumentRecord) {
    await this.plannerDocuments.put(decodePlannerDocument(document));
  }

  async deletePlannerDocument(id: string) {
    await this.plannerDocuments.delete(id);
  }
}

export class IndexedDbPersistenceRepository implements LocalPersistenceRepository {
  private readonly database: DayforgeDatabase;
  private validatedOpen: Promise<DatabaseMetadataRecord> | null = null;

  constructor(database: DayforgeDatabase = new DayforgeDatabase()) {
    this.database = database;
  }

  open() {
    return this.ensureValidatedOpen();
  }

  close() {
    this.database.close();
    this.validatedOpen = null;
  }

  async read<T>(operation: (transaction: PersistenceReadTransaction) => Promise<T>) {
    await this.ensureValidatedOpen();
    return this.database.transaction(
      "r",
      this.database.metadata,
      this.database.plannerDocuments,
      () => operation(new IndexedDbTransaction(this.database.metadata, this.database.plannerDocuments)),
    );
  }

  async write<T>(operation: (transaction: PersistenceWriteTransaction) => Promise<T>) {
    await this.ensureValidatedOpen();
    return this.database.transaction(
      "rw",
      this.database.metadata,
      this.database.plannerDocuments,
      () => operation(new IndexedDbTransaction(this.database.metadata, this.database.plannerDocuments)),
    );
  }

  private ensureValidatedOpen() {
    if (this.validatedOpen !== null) return this.validatedOpen;

    const attempt = openAndValidateDatabase(this.database).catch((error: unknown) => {
      if (this.validatedOpen === attempt) this.validatedOpen = null;
      throw error;
    });
    this.validatedOpen = attempt;
    return attempt;
  }
}
