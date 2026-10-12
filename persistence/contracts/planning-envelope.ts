import { decodeLegacyPlannerSnapshotV1, normalizeLegacyPlannerSnapshotV1, encodeNormalizedLegacyPlannerV1, type NormalizedLegacyPlannerV1 } from "../legacy/index.ts";
import { canonicalStringify } from "../migration/canonical-json.ts";
import { PersistenceValidationError } from "./codecs.ts";
import type { JsonObject, PlannerDocumentRecord } from "./records.ts";

export const PLANNING_DOCUMENT_FORMAT = "dayforge/planning-state";
export type PlanningEnvelope = Readonly<{
  version: 2;
  legacy: NormalizedLegacyPlannerV1;
  temporalRegistry: Readonly<{ documentId: "execution/bridge"; version: 3 }>;
}>;
export function planningEnvelope(legacy: NormalizedLegacyPlannerV1): PlanningEnvelope {
  return { version: 2, legacy, temporalRegistry: { documentId: "execution/bridge", version: 3 } };
}
export function decodePlanningEnvelope(input: unknown): PlanningEnvelope {
  const value = input as Partial<PlanningEnvelope> | null;
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 2
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    || Reflect.ownKeys(value).length !== 3 || !["version", "legacy", "temporalRegistry"].every(key => Object.hasOwn(value, key))
    || !value.temporalRegistry || typeof value.temporalRegistry !== "object" || Array.isArray(value.temporalRegistry)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value.temporalRegistry))
    || Reflect.ownKeys(value.temporalRegistry).length !== 2
    || value.temporalRegistry.documentId !== "execution/bridge" || value.temporalRegistry.version !== 3) {
    throw new PersistenceValidationError("invalid_planner_document", "O envelope de planejamento é inválido ou incompatível.");
  }
  const legacy = normalizeLegacyPlannerSnapshotV1(decodeLegacyPlannerSnapshotV1(value.legacy));
  const decoded = planningEnvelope(legacy);
  if (canonicalStringify(JSON.parse(JSON.stringify(decoded))) !== canonicalStringify(JSON.parse(JSON.stringify(input)))) {
    throw new PersistenceValidationError("invalid_planner_document", "O envelope de planejamento precisa ser canônico.");
  }
  return decoded;
}
export function planningJson(envelope: PlanningEnvelope): JsonObject { return JSON.parse(JSON.stringify(envelope)) as JsonObject; }
export function createPlanningDocument(fingerprint: string, legacy: NormalizedLegacyPlannerV1): PlannerDocumentRecord {
  return { id: "planner/current", role: "active", format: PLANNING_DOCUMENT_FORMAT, formatVersion: 2,
    sourceContentFingerprint: fingerprint, payload: planningJson(planningEnvelope(legacy)) };
}
export function legacyPlanner(input: NormalizedLegacyPlannerV1 | PlanningEnvelope): NormalizedLegacyPlannerV1 {
  return input.version === 2 ? decodePlanningEnvelope(input).legacy : normalizeLegacyPlannerSnapshotV1(decodeLegacyPlannerSnapshotV1(input));
}
export function legacyJson(input: NormalizedLegacyPlannerV1 | PlanningEnvelope) { return encodeNormalizedLegacyPlannerV1(legacyPlanner(input)); }
