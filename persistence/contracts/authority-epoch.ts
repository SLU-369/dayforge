import { decodeDatabaseMetadata, PersistenceValidationError } from "./codecs.ts";
import type { DatabaseMetadataRecord } from "./records.ts";

/** Old metadata has epoch zero. Adoption persists zero without changing authority. */
export function authorityEpoch(metadata: DatabaseMetadataRecord): number {
  return decodeDatabaseMetadata(metadata).authorityEpoch ?? 0;
}

/** Local replacement fence, deliberately absent from the logical backup. */
export function nextAuthorityEpoch(metadata: DatabaseMetadataRecord): number {
  const next = authorityEpoch(metadata) + 1;
  if (!Number.isSafeInteger(next)) throw new PersistenceValidationError("invalid_database_metadata", "O limite de substituições do armazenamento foi atingido.");
  return next;
}

/** Future commands must compare inside the same transaction that writes their facts. */
export function assertAuthorityEpoch(metadata: DatabaseMetadataRecord, expected: number): void {
  if (!Number.isSafeInteger(expected) || expected < 0 || authorityEpoch(metadata) !== expected) {
    throw new PersistenceValidationError("invalid_database_metadata", "O conjunto de dados foi substituído. Atualize a operação antes de tentar novamente.");
  }
}
