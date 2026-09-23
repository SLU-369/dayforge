import {
  type LocalPersistenceRepository,
} from "../contracts/index.ts";
import { WebCryptoSha256Hasher, type Sha256Hasher } from "../migration/index.ts";
import type { DayforgeBackupV2 } from "./contracts.ts";
import { decodeDayforgeBackupV2 } from "./codecs.ts";
import { readBackupSnapshot, validateAndMaterializeBackupV2 } from "./integrity.ts";

export async function exportDayforgeBackupV2(options: Readonly<{
  repository: LocalPersistenceRepository;
  exportedAt: string;
  hasher?: Sha256Hasher;
}>): Promise<DayforgeBackupV2> {
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const snapshot = await options.repository.read((transaction) => readBackupSnapshot(transaction));
  const backup = decodeDayforgeBackupV2({
    format: "dayforge-backup",
    formatVersion: 2,
    exportedAt: options.exportedAt,
    exportedFrom: {
      persistenceGeneration: snapshot.databaseMetadata.persistenceGeneration,
      schemaVersion: snapshot.databaseMetadata.schemaVersion,
    },
    payload: snapshot.payload,
  });
  return (await validateAndMaterializeBackupV2(backup, hasher)).backup;
}
