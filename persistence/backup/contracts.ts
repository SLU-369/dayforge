import type { LegacyImportOrigin } from "../contracts/index.ts";
import type {
  LegacyPlannerSnapshotV1,
  NormalizedLegacyPlannerV1,
} from "../legacy/index.ts";

export const DAYFORGE_BACKUP_FORMAT = "dayforge-backup" as const;
export const DAYFORGE_BACKUP_FORMAT_VERSION = 2 as const;

export type LegacyMigrationProvenance = Readonly<{
  kind: "legacy-v1-migration";
  sourceVersion: 1;
  contentFingerprint: string;
  sourceRawFingerprints: readonly string[];
  importOrigins: readonly LegacyImportOrigin[];
  status: "validated";
  migratedAt: string;
}>;

export type PlannerProvenance = Readonly<{
  contentFingerprint: string;
  origins: readonly LegacyMigrationProvenance[];
}>;

export type LegacyMigrationSourceExport = Readonly<{
  rawFingerprint: string;
  contentFingerprint: string;
  raw: string;
  snapshot: LegacyPlannerSnapshotV1;
}>;

export type DayforgeBackupV2 = Readonly<{
  format: typeof DAYFORGE_BACKUP_FORMAT;
  formatVersion: typeof DAYFORGE_BACKUP_FORMAT_VERSION;
  exportedAt: string;
  exportedFrom: Readonly<{
    persistenceGeneration: 2;
    schemaVersion: number;
  }>;
  payload: Readonly<{
    planner: NormalizedLegacyPlannerV1;
    provenance: PlannerProvenance;
    legacySources: readonly LegacyMigrationSourceExport[];
  }>;
}>;
