import { legacyJson } from "../contracts/planning-envelope.ts";
import { canonicalStringify } from "../migration/canonical-json.ts";
import { BackupValidationError } from "./codecs.ts";
import {
  type LocalPersistenceRepository,
  authorityEpoch,
  datasetRevision,
} from "../contracts/index.ts";
import { WebCryptoSha256Hasher, type Sha256Hasher } from "../migration/index.ts";
import type { DayforgeBackupV2, DayforgeBackup } from "./contracts.ts";
import { decodeDayforgeBackup } from "./codecs.ts";
import { readBackupSnapshot, validateAndMaterializeBackup } from "./integrity.ts";

export async function exportDayforgeBackup(options: Readonly<{
  repository: LocalPersistenceRepository;
  exportedAt: string;
  hasher?: Sha256Hasher;
  active?: boolean;
}>): Promise<DayforgeBackup> {
  return (await readPlannerAuthoritySnapshot(options)).backup;
}

/** The local replacement fence and payload come from one readonly transaction. */
export async function readPlannerAuthoritySnapshot(options: Readonly<{
  repository: LocalPersistenceRepository; exportedAt: string; hasher?: Sha256Hasher; active?: boolean;
}>) {
  const hasher = options.hasher ?? new WebCryptoSha256Hasher();
  const snapshot = await options.repository.read((transaction) => readBackupSnapshot(transaction, options.active));
  return materializePlannerAuthoritySnapshot(snapshot, options.exportedAt, hasher);
}

/** Validate a single captured transaction outside IndexedDB (including all hashes). */
export async function materializePlannerAuthoritySnapshot(snapshot: Awaited<ReturnType<typeof readBackupSnapshot>>,
  exportedAt: string, hasher: Sha256Hasher) {
  const backup = decodeDayforgeBackup({
    format: "dayforge-backup",
    formatVersion: snapshot.formatVersion,
    exportedAt,
    exportedFrom: {
      persistenceGeneration: snapshot.databaseMetadata.persistenceGeneration,
      schemaVersion: snapshot.databaseMetadata.schemaVersion,
    },
    payload: { ...snapshot.payload, provenance: { ...snapshot.payload.provenance,
      contentFingerprint: snapshot.legacyFingerprintNeedsHash ? await hasher.digestUtf8(canonicalStringify(legacyJson(snapshot.payload.planner))) : snapshot.payload.provenance.contentFingerprint } },
  });
  return { backup: (await validateAndMaterializeBackup(backup, hasher)).backup,
    authorityEpoch: authorityEpoch(snapshot.databaseMetadata), datasetRevision: datasetRevision(snapshot.databaseMetadata) };
}

/** Compatibility API refuses upgraded datasets; it never drops new entities. */
export async function exportDayforgeBackupV2(options: Parameters<typeof exportDayforgeBackup>[0]): Promise<DayforgeBackupV2> {
  const backup = await exportDayforgeBackup(options);
  if (backup.formatVersion !== 2) throw new BackupValidationError("unsupported_backup_version", "Este conjunto exige backup 3; downgrade não é permitido.");
  return backup;
}
