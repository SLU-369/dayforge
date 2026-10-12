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
  datasetRevision, nextDatasetRevision, PersistenceValidationError,
} from "../contracts/index.ts";
import { canonicalStringify } from "../migration/canonical-json.ts";
import { DayforgeDatabase, openAndValidateDatabase } from "./dayforge-database.ts";

class IndexedDbTransaction implements PersistenceWriteTransaction {
  private originalDocuments = new Map<string, PlannerDocumentRecord | null>();
  private originalMigrations = new Map<string, PersistenceMetadataRecord | null>();
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

  async listMetadata() {
    return Promise.all((await this.metadata.toArray()).map(decodePersistenceMetadata));
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
    if (metadata.kind === "legacy-v1-migration" && !this.originalMigrations.has(metadata.key)) this.originalMigrations.set(metadata.key, await this.getMetadata(metadata.key));
    await this.metadata.put(decodePersistenceMetadata(metadata));
  }

  async deleteMetadata(key: PersistenceMetadataRecord["key"]) {
    if (key.startsWith("migration/v1/") && !this.originalMigrations.has(key)) this.originalMigrations.set(key, await this.getMetadata(key));
    await this.metadata.delete(key);
  }

  async putPlannerDocument(document: PlannerDocumentRecord) {
    await this.trackDocument(document.id);
    await this.plannerDocuments.put(decodePlannerDocument(document));
  }

  async deletePlannerDocument(id: string) {
    await this.trackDocument(id);
    await this.plannerDocuments.delete(id);
  }

  private async trackDocument(id: string) {
    if ((id === "planner/current" || id === "execution/bridge" || id.startsWith("legacy-v1/source/")) && !this.originalDocuments.has(id)) {
      this.originalDocuments.set(id, await this.getPlannerDocument(id));
    }
  }

  /** One revision for the net authoritative mutation, in this same Dexie transaction. */
  async commitRevision(before: DatabaseMetadataRecord) {
    const current = await this.getDatabaseMetadata();
    if (datasetRevision(current) !== datasetRevision(before)) throw new PersistenceValidationError("invalid_database_metadata", "A revisão local não pode ser alterada pelo conteúdo da operação.");
    const facts = (value: DatabaseMetadataRecord) => ({ activeDocumentId: value.activeDocumentId,
      executionBridgeVersion: value.executionBridgeVersion ?? null, authorityEpoch: value.authorityEpoch ?? 0 });
    let changed = canonicalStringify(facts(before)) !== canonicalStringify(facts(current));
    for (const [id, original] of this.originalDocuments) if (canonicalStringify(original) !== canonicalStringify(await this.getPlannerDocument(id))) changed = true;
    for (const [key, original] of this.originalMigrations) {
      const persisted = await this.getMetadata(key as PersistenceMetadataRecord["key"]);
      if (canonicalStringify(JSON.parse(JSON.stringify(original))) !== canonicalStringify(JSON.parse(JSON.stringify(persisted)))) changed = true;
    }
    const revision = changed ? nextDatasetRevision(before) : datasetRevision(before);
    if (changed || current.writeFenceVersion === undefined) {
      await this.putDatabaseMetadata({ ...current, writeFenceVersion: 1, datasetRevision: revision });
      if ((await this.getDatabaseMetadata()).datasetRevision !== revision) throw new PersistenceValidationError("invalid_database_metadata", "A revisão persistida não corresponde à escrita.");
    }
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
      async () => {
        const transaction = new IndexedDbTransaction(this.database.metadata, this.database.plannerDocuments);
        const before = await transaction.getDatabaseMetadata();
        const result = await operation(transaction);
        await transaction.commitRevision(before);
        return result;
      },
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
