import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import Dexie from "dexie";
import { createHash } from "node:crypto";
import {
  appendRescheduleEvent, validatePlanningHistory, deriveCompletedStatus,
  createOccurrence, rescheduleOccurrence, completeOccurrence,
  createTimedSchedule, createTimedExecutionTiming, createExecutionRecord,
  scheduleOccurrenceId, executionRecordId, rescheduleEventId, createOriginReference,
} from "../domain/temporal/index.ts";
import {
  DayforgeDatabase, IndexedDbPersistenceRepository, bootstrapPlannerV2,
  decodeExecutionBridge, upgradeExecutionBridge, createBridgeDocument,
  exportDayforgeBackupV2, restoreDayforgeBackupV2, restoreActivePlannerV2, resetPlannerV2,
  recordOccurrenceExecution, saveActivePlannerV2, ensureExecutionBridge,
  decodeDatabaseMetadata, authorityEpoch, assertAuthorityEpoch, canonicalStringify,
  savePlannerWithBridge, WebCryptoSha256Hasher,
} from "../persistence/index.ts";

const date = "2026-10-09", instant = `${date}T12:00:00.000Z`;
const value = (result) => { assert.equal(result.ok, true, JSON.stringify(result)); return result.value; };
const scheduled = (time) => value(createTimedSchedule({ startsAt: `${date}T${time}:00.000Z`, durationMinutes: 60, timeZone: "UTC" }));
const baseline = scheduled("06:30"), evening = scheduled("20:00"), later = scheduled("21:00");
const event = (from = baseline, to = evening, sequence = 1, changedAt = instant) => ({
  id: value(rescheduleEventId(`reschedule:occ:1:${sequence}`)), from: structuredClone(from), to: structuredClone(to), changedAt,
});
const history = (events = []) => ({ baselineSchedule: baseline, confirmedAt: instant, rescheduleHistory: events });
const execution = (recordedAt = `${date}T23:00:00.000Z`) => value(createExecutionRecord({
  id: value(executionRecordId("execution:occ:1")), recordedAt,
  timing: value(createTimedExecutionTiming({ start: `${date}T20:05:00.000Z`, end: `${date}T20:55:00.000Z`, timeZone: "UTC" })),
}));
const item = () => ({ id: "fictional-workout", title: "Treino fictício", start: "06:30", end: "07:30", notes: "", category: "saude", completed: false });
const state = () => ({ version: 1, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] },
  records: { [date]: { date, items: [item()], note: "", energy: 3 } }, monthlyGoals: {} });
let sequence = 0;
async function setup(t) {
  const name = `reschedule-foundation-${++sequence}`, database = new DayforgeDatabase(name);
  const repository = new IndexedDbPersistenceRepository(database);
  t.after(async () => { repository.close(); await Dexie.delete(name); });
  const raw = JSON.stringify(state()), writes = [], values = new Map([["rotina-369:data:v1", raw]]);
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { writes.push(key); values.set(key, value); } };
  const boot = () => bootstrapPlannerV2({ repository, legacyStorage: storage, markerStorage: storage, defaultState: state(), instant });
  const result = await boot();
  return { database, repository, raw, writes, storage, boot, result, name };
}
const exported = (repository) => exportDayforgeBackupV2({ repository, exportedAt: instant, active: true });
const physical = async (database) => ({ documents: await database.plannerDocuments.toArray(), metadata: await database.metadata.toArray() });
const epoch = (repository) => repository.read(async (tx) => authorityEpoch(await tx.getDatabaseMetadata()));
const fingerprint = (bridge) => createHash("sha256").update(canonicalStringify(bridge)).digest("hex");
function withAudit(bridge) {
  const copy = structuredClone(bridge);
  copy.entries[0].planningAudit = { baselineItem: structuredClone(copy.entries[0].item), baselineSchedule: structuredClone(baseline),
    confirmedAt: instant, rescheduleHistory: [event()] };
  return copy;
}
async function auditedBackup(repository) {
  const backup = await exported(repository);
  backup.payload.executionBridge.bridge = withAudit(backup.payload.executionBridge.bridge);
  backup.payload.executionBridge.contentFingerprint = fingerprint(backup.payload.executionBridge.bridge);
  return backup;
}
function intercept(repository, afterMutation) {
  return { open: () => repository.open(), close: () => repository.close(), read: (work) => repository.read(work),
    write: (work) => repository.write((tx) => work(new Proxy(tx, { get(target, key) {
      const original = Reflect.get(target, key);
      if (typeof original !== "function") return original;
      return (...args) => {
        if (/^(put|delete)/.test(String(key))) afterMutation(key, args);
        return original.apply(target, args);
      };
    } }))) };
}

test("shared history validates empty/first/multiple events, derives planning and preserves every input", () => {
  const input = history(), before = structuredClone(input);
  assert.deepEqual(value(validatePlanningHistory(input)).currentSchedule, baseline);
  const first = value(appendRescheduleEvent(input, event()));
  const second = value(appendRescheduleEvent({ ...input, rescheduleHistory: first.rescheduleHistory }, event(evening, later, 2)));
  assert.deepEqual(second.currentSchedule, later); assert.equal(second.rescheduleHistory.length, 2);
  const returned = value(appendRescheduleEvent({ ...input, rescheduleHistory: second.rescheduleHistory }, event(later, baseline, 3)));
  assert.deepEqual(returned.currentSchedule, baseline); assert.equal(returned.rescheduleHistory.length, 3);
  assert.deepEqual(input, before); assert.equal(deriveCompletedStatus([]), "completed");
  assert.equal(deriveCompletedStatus(returned.rescheduleHistory), "completed_rescheduled");
  returned.rescheduleHistory[0].from.durationMinutes = 5;
  assert.equal(baseline.durationMinutes, 60);
});

for (const [label, events] of [
  ["no-op", [event(baseline, baseline)]],
  ["discontinuity", [event(evening, later)]],
  ["duplicate IDs", [event(), event(evening, later)]],
  ["event before confirmation", [event(baseline, evening, 1, `${date}T11:59:00.000Z`)]],
  ["event before previous event", [event(), event(evening, later, 2, `${date}T11:00:00.000Z`)]],
  ["invalid schedule", [event(baseline, { ...evening, durationMinutes: 0 })]],
  ["invalid ID", [{ ...event(), id: "bad id" }]],
]) test(`shared history rejects ${label}`, () => assert.equal(validatePlanningHistory(history(events)).ok, false));

test("execution chronologically after rescheduling validates and a full occurrence uses the same derivation", () => {
  assert.equal(validatePlanningHistory(history([event()]), execution()).ok, true);
  assert.equal(validatePlanningHistory(history([event()]), execution(`${date}T11:00:00.000Z`)).ok, false);
  const occurrence = value(createOccurrence({ id: value(scheduleOccurrenceId("occ:1")), createdAt: instant, schedule: baseline,
    source: { kind: "standalone", title: "Treino fictício", flexibility: "preferred", origin: value(createOriginReference({ kind: "gym" })) } }));
  const changed = value(rescheduleOccurrence(occurrence, { id: event().id, schedule: evening, changedAt: instant }));
  assert.equal(value(completeOccurrence(changed, execution())).status, "completed_rescheduled");
  assert.equal(value(completeOccurrence(occurrence, execution())).status, "completed");
});

test("strict v1/v2 codecs and deterministic upgrade preserve identities, counters, snapshots and executions", async (t) => {
  const { repository, result } = await setup(t);
  await recordOccurrenceExecution({ repository, occurrenceId: "occ:1", execution: execution() });
  const current = (await exported(repository)).payload.executionBridge.bridge;
  const old = { ...current, version: 1 }, before = structuredClone(old);
  assert.deepEqual(decodeExecutionBridge(old, (await exported(repository)).payload.planner), old);
  const converted = upgradeExecutionBridge(old, (await exported(repository)).payload.planner);
  assert.deepEqual(converted, { ...old, version: 2 }); assert.deepEqual(old, before);
  assert.deepEqual(upgradeExecutionBridge(converted, (await exported(repository)).payload.planner), converted);
  assert.ok(converted.entries.every((entry) => !Object.hasOwn(entry, "planningAudit")));
  assert.equal(converted.nextSequence, result.executionBridge.nextSequence);
});

test("existing v1 installation adopts v2 atomically, epoch zero, without changing planner, marker or audit facts", async (t) => {
  const f = await setup(t);
  await recordOccurrenceExecution({ repository: f.repository, occurrenceId: "occ:1", execution: execution() });
  const backup = await exported(f.repository), old = { ...backup.payload.executionBridge.bridge, version: 1 };
  await f.database.plannerDocuments.put(await createBridgeDocument(old));
  const meta = await f.database.metadata.get("database"); delete meta.authorityEpoch; meta.executionBridgeVersion = 1;
  await f.database.metadata.put(meta);
  const beforePlanner = await f.database.plannerDocuments.get("planner/current"), markerWrites = f.writes.length;
  f.repository.close();
  const result = await f.boot();
  assert.deepEqual(result.executionBridge, { ...old, version: 2 }); assert.equal(await epoch(f.repository), 0);
  assert.deepEqual(await f.database.plannerDocuments.get("planner/current"), beforePlanner);
  assert.equal(f.writes.length, markerWrites); assert.equal(f.storage.getItem("rotina-369:data:v1"), f.raw);
  const once = await physical(f.database); f.repository.close(); await f.boot();
  assert.deepEqual(await physical(f.database), once);
});

test("new backup round-trips audited planning intact and allows a later canonical execution without losing history", async (t) => {
  const f = await setup(t), backup = await auditedBackup(f.repository);
  await restoreDayforgeBackupV2({ repository: f.repository, backup, active: true });
  assert.deepEqual((await exported(f.repository)).payload, backup.payload);
  const before = await epoch(f.repository);
  await recordOccurrenceExecution({ repository: f.repository, occurrenceId: "occ:1", execution: execution() });
  const after = await exported(f.repository);
  assert.deepEqual(after.payload.executionBridge.bridge.entries[0].planningAudit, backup.payload.executionBridge.bridge.entries[0].planningAudit);
  assert.equal(deriveCompletedStatus(after.payload.executionBridge.bridge.entries[0].planningAudit.rescheduleHistory), "completed_rescheduled");
  assert.equal(await epoch(f.repository), before); f.repository.close();
  assert.deepEqual((await f.boot()).executionBridge, after.payload.executionBridge.bridge);
  assert.equal(after.formatVersion, 2); assert.deepEqual(after.exportedFrom, { persistenceGeneration: 2, schemaVersion: 1 });
  assert.ok(!JSON.stringify(after).includes("authorityEpoch"));
});

test("v1 bridge fingerprint is validated before conversion; old and absent bridges recover without inferred planning", async (t) => {
  const f = await setup(t); await recordOccurrenceExecution({ repository: f.repository, occurrenceId: "occ:1", execution: execution() });
  const backup = await exported(f.repository); backup.payload.executionBridge.bridge.version = 1;
  backup.payload.executionBridge.contentFingerprint = fingerprint(backup.payload.executionBridge.bridge);
  await restoreDayforgeBackupV2({ repository: f.repository, backup, active: true });
  const converted = await exported(f.repository);
  assert.deepEqual(converted.payload.executionBridge.bridge, { ...backup.payload.executionBridge.bridge, version: 2 });
  assert.notEqual(converted.payload.executionBridge.contentFingerprint, backup.payload.executionBridge.contentFingerprint);
  const before = await physical(f.database); backup.payload.executionBridge.contentFingerprint = "0".repeat(64);
  await assert.rejects(restoreDayforgeBackupV2({ repository: f.repository, backup, active: true }));
  assert.deepEqual(await physical(f.database), before);
  delete backup.payload.executionBridge;
  await restoreDayforgeBackupV2({ repository: f.repository, backup, active: true });
  assert.ok((await ensureExecutionBridge(f.repository)).entries.every((entry) => entry.execution === null && !entry.planningAudit));
});

const corruptions = [
  ["duplicate occurrence", (b) => b.entries.push(structuredClone(b.entries[0]))],
  ["orphan", (b) => b.entries[0].sourceDate = "2026-10-08"],
  ["incomplete audit", (b) => delete b.entries[0].planningAudit.confirmedAt],
  ["null audit", (b) => b.entries[0].planningAudit = null],
  ["discontinuous chain", (b) => b.entries[0].planningAudit.rescheduleHistory[0].from = evening],
  ["no-op", (b) => b.entries[0].planningAudit.rescheduleHistory[0].to = baseline],
  ["duplicate event", (b) => b.entries[0].planningAudit.rescheduleHistory.push(event())],
  ["event copied from another occurrence", (b) => b.entries[0].planningAudit.rescheduleHistory[0].id = "reschedule:occ:2:1"],
  ["invalid chronology", (b) => b.entries[0].planningAudit.rescheduleHistory[0].changedAt = `${date}T11:00:00.000Z`],
  ["invalid schedule", (b) => b.entries[0].planningAudit.baselineSchedule.durationMinutes = -1],
  ["noncanonical timezone", (b) => b.entries[0].planningAudit.rescheduleHistory[0].to.timeZone = "Etc/UTC"],
  ["unknown schedule field", (b) => b.entries[0].planningAudit.baselineSchedule.secret = true],
  ["invalid baseline reference", (b) => b.entries[0].planningAudit.baselineItem.id = "other"],
  ["historical baseline completion", (b) => b.entries[0].planningAudit.baselineItem.completed = true],
  ["future version", (b) => b.version = 3],
];
for (const [label, corrupt] of corruptions) test(`restore rejects ${label} even with a recomputed hash, before mutation`, async (t) => {
  const f = await setup(t), backup = await auditedBackup(f.repository), before = await physical(f.database);
  corrupt(backup.payload.executionBridge.bridge); backup.payload.executionBridge.contentFingerprint = fingerprint(backup.payload.executionBridge.bridge);
  await assert.rejects(restoreDayforgeBackupV2({ repository: f.repository, backup, active: true }));
  assert.deepEqual(await physical(f.database), before);
});

test("codec rejects execution predating history and v1 carrying planningAudit", async (t) => {
  const f = await setup(t), bridge = withAudit(f.result.executionBridge), planner = structuredClone(f.result.state);
  bridge.entries[0].execution = execution(`${date}T11:00:00.000Z`); bridge.entries[0].item.completed = true; planner.records[date].items[0].completed = true;
  assert.throws(() => decodeExecutionBridge(bridge, planner));
  const old = withAudit(f.result.executionBridge); old.version = 1;
  assert.throws(() => decodeExecutionBridge(old, f.result.state));
});

test("epoch is stable on bootstrap/autosave/completion, advances on each explicit replacement, and rejects stale commands", async (t) => {
  const f = await setup(t); assert.equal(await epoch(f.repository), 0);
  await f.boot(); await saveActivePlannerV2({ repository: f.repository, state: f.result.state });
  await recordOccurrenceExecution({ repository: f.repository, occurrenceId: "occ:1", execution: execution() });
  assert.equal(await epoch(f.repository), 0);
  const backup = await exported(f.repository);
  for (let i = 1; i <= 2; i++) {
    await restoreDayforgeBackupV2({ repository: f.repository, backup, active: true });
    assert.equal(await epoch(f.repository), i);
  }
  await restoreActivePlannerV2({ repository: f.repository, input: f.raw, instant }); assert.equal(await epoch(f.repository), 3);
  await resetPlannerV2({ repository: f.repository, markerStorage: f.storage, defaultState: state(), instant }); assert.equal(await epoch(f.repository), 4);
  const before = await physical(f.database);
  await assert.rejects(f.repository.write(async (tx) => {
    assertAuthorityEpoch(await tx.getDatabaseMetadata(), 3);
    await tx.deletePlannerDocument("execution/bridge");
  }));
  await assert.rejects(recordOccurrenceExecution({ repository: f.repository, occurrenceId: "occ:1", execution: execution(), expectedAuthorityEpoch: 3 }));
  assert.deepEqual(await physical(f.database), before);
  assert.equal(f.storage.getItem("rotina-369:data:v1"), f.raw); assert.ok(!f.writes.includes("rotina-369:data:v1"));
});

for (const [label, metadata] of [
  ["negative epoch", { authorityEpoch: -1 }], ["fractional epoch", { authorityEpoch: 1.5 }],
  ["unsafe epoch", { authorityEpoch: Number.MAX_SAFE_INTEGER + 1 }],
  ["unknown bridge", { executionBridgeVersion: 3 }],
]) test(`metadata rejects ${label}`, () => assert.throws(() => decodeDatabaseMetadata({
  key: "database", kind: "database", schemaVersion: 1, persistenceGeneration: 2, activeDocumentId: null, ...metadata,
})));

test("v2 adoption metadata cannot lose its epoch; legacy metadata deterministically starts at zero", () => {
  const old = { key: "database", kind: "database", schemaVersion: 1, persistenceGeneration: 2, activeDocumentId: "planner/current", executionBridgeVersion: 1 };
  assert.equal(authorityEpoch(decodeDatabaseMetadata(old)), 0);
  assert.throws(() => decodeDatabaseMetadata({ ...old, executionBridgeVersion: 2 }));
});

for (const kind of ["restore", "import", "reset", "upgrade"]) test(`${kind} rolls back every critical mutation including epoch and bridge`, async (t) => {
  const f = await setup(t), backup = await auditedBackup(f.repository);
  if (kind === "upgrade") {
    await f.database.plannerDocuments.put(await createBridgeDocument({ ...f.result.executionBridge, version: 1 }));
    const meta = await f.database.metadata.get("database"); delete meta.authorityEpoch; meta.executionBridgeVersion = 1;
    await f.database.metadata.put(meta);
  }
  const run = (repository) => kind === "restore" ? restoreDayforgeBackupV2({ repository, backup, active: true })
    : kind === "import" ? restoreActivePlannerV2({ repository, input: f.raw, instant })
    : kind === "reset" ? resetPlannerV2({ repository, markerStorage: f.storage, defaultState: state(), instant })
    : ensureExecutionBridge(repository);
  const before = await physical(f.database);
  // Discover the actual write sequence, then restore the exact seed for fault injection.
  let count = 0;
  const counter = intercept(f.repository, () => count++);
  await run(counter); assert.ok(count > 0);
  await f.database.transaction("rw", f.database.metadata, f.database.plannerDocuments, async () => {
    await f.database.metadata.clear(); await f.database.plannerDocuments.clear();
    await f.database.metadata.bulkPut(before.metadata); await f.database.plannerDocuments.bulkPut(before.documents);
  });
  assert.deepEqual(await physical(f.database), before);
  for (let failAt = 1; failAt <= count; failAt++) {
    let mutation = 0;
    await assert.rejects(run(intercept(f.repository, () => { if (++mutation === failAt) throw new Error(`fault at ${failAt}`); })));
    assert.deepEqual(await physical(f.database), before, `${kind}, mutation ${failAt}`);
  }
  const afterWriteForTest = () => { throw new Error("failure after all writes"); };
  await assert.rejects(kind === "restore" ? restoreDayforgeBackupV2({ repository: f.repository, backup, active: true, afterWriteForTest })
    : kind === "import" ? restoreActivePlannerV2({ repository: f.repository, input: f.raw, instant, afterWriteForTest })
    : kind === "reset" ? resetPlannerV2({ repository: f.repository, markerStorage: f.storage, defaultState: state(), instant, afterWriteForTest })
    : savePlannerWithBridge({ repository: f.repository, state: f.result.state, afterWriteForTest }));
  assert.deepEqual(await physical(f.database), before);
});

test("replacement while an execution is preparing rejects the old epoch even with identical IDs and payload", async (t) => {
  const f = await setup(t), backup = await exported(f.repository), realHasher = new WebCryptoSha256Hasher();
  let announce, resume;
  const preparing = new Promise((resolve) => announce = resolve), resumed = new Promise((resolve) => resume = resolve);
  let first = true;
  const command = recordOccurrenceExecution({ repository: f.repository, occurrenceId: "occ:1", execution: execution(), hasher: {
    async digestUtf8(input) { if (first) { first = false; announce(); await resumed; } return realHasher.digestUtf8(input); },
  } });
  await preparing; await restoreDayforgeBackupV2({ repository: f.repository, backup, active: true });
  const before = await physical(f.database); resume(); await assert.rejects(command);
  assert.deepEqual(await physical(f.database), before);
});

test("epoch overflow blocks every replacement without mutating the recoverable set", async (t) => {
  const f = await setup(t), backup = await exported(f.repository), meta = await f.database.metadata.get("database");
  await f.database.metadata.put({ ...meta, authorityEpoch: Number.MAX_SAFE_INTEGER });
  const before = await physical(f.database);
  for (const operation of [
    () => restoreDayforgeBackupV2({ repository: f.repository, backup, active: true }),
    () => restoreActivePlannerV2({ repository: f.repository, input: f.raw, instant }),
    () => resetPlannerV2({ repository: f.repository, markerStorage: f.storage, defaultState: state(), instant }),
  ]) { await assert.rejects(operation()); assert.deepEqual(await physical(f.database), before); }
});

for (const kind of ["import", "reset"]) for (const target of ["metadata", "bridge"])
  test(`${kind} readback rejects a silently altered ${target} and rolls back`, async (t) => {
    const f = await setup(t), before = await physical(f.database);
    const repository = { open: () => f.repository.open(), close: () => f.repository.close(), read: (work) => f.repository.read(work),
      write: (work) => f.repository.write((tx) => work(new Proxy(tx, { get(original, key) {
        const method = Reflect.get(original, key);
        if (typeof method !== "function") return method;
        return (...args) => {
          if (target === "metadata" && key === "putDatabaseMetadata") args[0] = { ...args[0], authorityEpoch: 0 };
          if (target === "bridge" && key === "putPlannerDocument" && args[0].id === "execution/bridge") args[0] = { ...args[0], sourceContentFingerprint: "0".repeat(64) };
          return method.apply(original, args);
        };
      } }))) };
    await assert.rejects(kind === "import" ? restoreActivePlannerV2({ repository, input: f.raw, instant })
      : resetPlannerV2({ repository, markerStorage: f.storage, defaultState: state(), instant }));
    assert.deepEqual(await physical(f.database), before);
  });

test("audited bindings cannot be erased or edited by autosave and history survives unrelated saves", async (t) => {
  const f = await setup(t), backup = await auditedBackup(f.repository);
  await restoreDayforgeBackupV2({ repository: f.repository, backup, active: true });
  const before = await physical(f.database), edited = structuredClone(backup.payload.planner);
  edited.records[date].items[0].start = "07:00";
  await assert.rejects(saveActivePlannerV2({ repository: f.repository, state: edited }));
  edited.records[date].items = [];
  await assert.rejects(saveActivePlannerV2({ repository: f.repository, state: edited }));
  assert.deepEqual(await physical(f.database), before);
  const safe = structuredClone(backup.payload.planner); safe.records[date].note = "Nota fictícia";
  await saveActivePlannerV2({ repository: f.repository, state: safe });
  assert.deepEqual((await exported(f.repository)).payload.executionBridge.bridge.entries[0].planningAudit, backup.payload.executionBridge.bridge.entries[0].planningAudit);
});
