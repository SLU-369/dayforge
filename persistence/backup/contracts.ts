import type { LegacyImportOrigin } from "../contracts/index.ts";
import type { ExecutionBridgeExport } from "../execution/bridge.ts";
import type { PlanningEnvelope } from "../contracts/planning-envelope.ts";
import type {
  LegacyPlannerSnapshotV1,
  NormalizedLegacyPlannerV1,
} from "../legacy/index.ts";

export const DAYFORGE_BACKUP_FORMAT = "dayforge-backup" as const;
export const DAYFORGE_BACKUP_FORMAT_VERSION = 3 as const;

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
  formatVersion: 2;
  exportedAt: string;
  exportedFrom: Readonly<{
    persistenceGeneration: 2;
    schemaVersion: number;
  }>;
  payload: Readonly<{
    planner: NormalizedLegacyPlannerV1;
    provenance: PlannerProvenance;
    legacySources: readonly LegacyMigrationSourceExport[];
    executionBridge?: ExecutionBridgeExport;
  }>;
}>;
export type DayforgeBackupV3 = Omit<DayforgeBackupV2, "formatVersion" | "payload"> & Readonly<{
  formatVersion: 3;
  payload: Omit<DayforgeBackupV2["payload"], "planner" | "executionBridge"> & Readonly<{
    planner: PlanningEnvelope;
    plannerFingerprint: string;
    executionBridge: ExecutionBridgeExport;
  }>;
}>;
export type DayforgeBackup = DayforgeBackupV2 | DayforgeBackupV3;
