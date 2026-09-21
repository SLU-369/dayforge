import type { DatabaseMetadataRecord, PlannerDocumentRecord } from "./records.ts";

export interface PersistenceReadTransaction {
  getDatabaseMetadata(): Promise<DatabaseMetadataRecord>;
  getPlannerDocument(id: string): Promise<PlannerDocumentRecord | null>;
  listPlannerDocuments(): Promise<readonly PlannerDocumentRecord[]>;
}

export interface PersistenceWriteTransaction extends PersistenceReadTransaction {
  putDatabaseMetadata(metadata: DatabaseMetadataRecord): Promise<void>;
  putPlannerDocument(document: PlannerDocumentRecord): Promise<void>;
  deletePlannerDocument(id: string): Promise<void>;
}

export interface LocalPersistenceRepository {
  open(): Promise<DatabaseMetadataRecord>;
  close(): void;
  read<T>(operation: (transaction: PersistenceReadTransaction) => Promise<T>): Promise<T>;
  write<T>(operation: (transaction: PersistenceWriteTransaction) => Promise<T>): Promise<T>;
}
