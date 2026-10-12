// Existing regression assertions continue checking the same legacy facts inside the new envelope.
export const legacyOf = (planner) => planner.version === 2 ? planner.legacy : planner;
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { canonicalStringify } from "../persistence/migration/canonical-json.ts";
export const bridgeV2 = bridge => ({ ...structuredClone(bridge), version: 2, entries: bridge.entries.map(entry => {
  assert.notEqual(entry.kind, "canonical", "Old fixtures cannot discard complete occurrences");
  const { kind: _kind, ...legacy } = structuredClone(entry); void _kind; return legacy;
}) });
export const backupV2 = backup => {
  const old = structuredClone(backup); old.formatVersion = 2; old.payload.planner = legacyOf(old.payload.planner); delete old.payload.plannerFingerprint;
  if(old.payload.executionBridge) { old.payload.executionBridge.bridge = bridgeV2(old.payload.executionBridge.bridge);
    old.payload.executionBridge.contentFingerprint = createHash("sha256").update(canonicalStringify(old.payload.executionBridge.bridge)).digest("hex"); }
  return old;
};
export function assertUpgradedBackup(before, after) {
  assert.equal(after.formatVersion, 3); assert.equal(after.payload.planner.version, 2);
  assert.equal(after.payload.planner.temporalRegistry.version, 3);
  assert.equal(after.payload.executionBridge.bridge.version, 3);
  assert.deepEqual(legacyOf(after.payload.planner), legacyOf(before.payload.planner));
  assert.deepEqual(after.payload.provenance, before.payload.provenance);
  assert.deepEqual(after.payload.legacySources, before.payload.legacySources);
  if(before.payload.executionBridge) {
    if(before.formatVersion === 3) assert.deepEqual(after.payload, before.payload);
    else assert.deepEqual(bridgeV2(after.payload.executionBridge.bridge), { ...before.payload.executionBridge.bridge, version: 2 });
  } else assert.ok(after.payload.executionBridge.bridge.entries.every(entry => entry.kind === "legacy_partial" && entry.execution === null && !entry.planningAudit));
}
