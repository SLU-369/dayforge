import {
  createAllDayExecutionTiming, createDateOnlyExecutionTiming, createExecutionRecord,
  createTimedExecutionTiming, executionRecordId, parseLocalDate, scheduleOccurrenceId,
  createTimedSchedule, createDateOnlySchedule, createAllDaySchedule, createTemporalReason,
  parseUtcInstant, rescheduleEventId, validatePlanningHistory,
  type DomainResult, type ExecutionRecord, type ScheduleOccurrenceId, type OccurrenceSchedule,
  type RescheduleEvent, type UtcInstant,
} from "../../domain/temporal/index.ts";
import { decodeLegacyPlannerSnapshotV1, type LegacyDailyItemV1, type NormalizedLegacyPlannerV1 } from "../legacy/index.ts";
import { canonicalStringify, WebCryptoSha256Hasher, type Sha256Hasher } from "../migration/index.ts";
import type { JsonObject, PlannerDocumentRecord, PersistenceReadTransaction } from "../contracts/index.ts";

export const EXECUTION_BRIDGE_DOCUMENT_ID = "execution/bridge";
export const EXECUTION_BRIDGE_FORMAT = "dayforge/execution-bridge";

export type PlanningAudit = Readonly<{
  baselineItem: LegacyDailyItemV1;
  baselineSchedule: OccurrenceSchedule;
  confirmedAt: UtcInstant;
  rescheduleHistory: readonly RescheduleEvent[];
}>;

export type OccurrenceBinding = Readonly<{
  occurrenceId: ScheduleOccurrenceId;
  sourceDate: string;
  itemIndex: number;
  originalItem: LegacyDailyItemV1;
  item: LegacyDailyItemV1;
  execution: ExecutionRecord | null;
  planningAudit?: PlanningAudit;
}>;
export type ExecutionBridge = Readonly<{
  version: 1 | 2;
  nextSequence: number;
  entries: readonly OccurrenceBinding[];
}>;
export type ExecutionBridgeExport = Readonly<{ bridge: ExecutionBridge; contentFingerprint: string }>;

export class ExecutionBridgeError extends Error {
  readonly code = "invalid_execution_bridge";
  constructor() {
    super("O vínculo de execução é inválido, ambíguo ou incompatível com o planner.");
    this.name = "ExecutionBridgeError";
  }
}

function invalid(): never { throw new ExecutionBridgeError(); }
function value<T>(result: DomainResult<T>): T { return result.ok ? result.value : invalid(); }
function object(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) return invalid();
  return input as Record<string, unknown>;
}
function fields(input: Record<string, unknown>, required: string[], optional: string[] = []) {
  if (!required.every((key) => Object.hasOwn(input, key))
    || !Reflect.ownKeys(input).every((key) => typeof key === "string" && [...required, ...optional].includes(key))) invalid();
}
function string(input: unknown): string { return typeof input === "string" ? input : invalid(); }
function number(input: unknown): number { return typeof input === "number" ? input : invalid(); }
export function bridgeJson(bridge: ExecutionBridge): JsonObject {
  // The public input has already crossed the strict bridge codec.
  return JSON.parse(JSON.stringify(bridge)) as JsonObject;
}
function same(left: unknown, right: unknown) {
  return canonicalStringify(JSON.parse(JSON.stringify(left))) === canonicalStringify(JSON.parse(JSON.stringify(right)));
}
function plan(item: LegacyDailyItemV1) {
  const { id, start, end, title, notes, category } = item;
  return { id, start, end, title, notes, category };
}
function dailyItem(input: unknown): LegacyDailyItemV1 {
  // Reuse the strict legacy item codec without extending its payload contract.
  const snapshot = decodeLegacyPlannerSnapshotV1({
    version: 1, routine: { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] },
    records: { day: { date: "day", items: [input], note: "", energy: 3 } },
  });
  return snapshot.records.day.items[0];
}

export function decodeBridgeExecution(input: unknown, occurrenceId: string): ExecutionRecord {
  const record = object(input);
  fields(record, ["id", "timing", "recordedAt"], ["note"]);
  if (record.id !== `execution:${occurrenceId}`) invalid();
  const timing = object(record.timing);
  let result;
  if (timing.kind === "timed") {
    fields(timing, ["kind", "interval", "timeZone"]);
    const interval = object(timing.interval);
    fields(interval, ["start", "end"]);
    result = createTimedExecutionTiming({ start: string(interval.start), end: string(interval.end), timeZone: string(timing.timeZone) });
  } else if (timing.kind === "date_only") {
    fields(timing, ["kind", "date", "timeZone"], ["durationMinutes"]);
    result = createDateOnlyExecutionTiming({ date: string(timing.date), timeZone: string(timing.timeZone),
      ...(Object.hasOwn(timing, "durationMinutes") ? { durationMinutes: number(timing.durationMinutes) } : {}) });
  } else if (timing.kind === "all_day") {
    fields(timing, ["kind", "startsOn", "endsBefore", "timeZone"]);
    result = createAllDayExecutionTiming({ startsOn: string(timing.startsOn), endsBefore: string(timing.endsBefore), timeZone: string(timing.timeZone) });
  } else return invalid();
  const decoded = value(createExecutionRecord({ id: value(executionRecordId(string(record.id))), timing: value(result),
    recordedAt: string(record.recordedAt), ...(Object.hasOwn(record, "note") ? { note: string(record.note) } : {}) }));
  // Reject noncanonical spellings instead of silently normalizing audit facts.
  if (canonicalStringify(JSON.parse(JSON.stringify(decoded))) !== canonicalStringify(JSON.parse(JSON.stringify(input)))) invalid();
  return decoded;
}

function decodeSchedule(input: unknown): OccurrenceSchedule {
  const schedule = object(input);
  let result: DomainResult<OccurrenceSchedule>;
  if (schedule.kind === "timed") {
    fields(schedule, ["kind", "startsAt", "timeZone", "durationMinutes"]);
    result = createTimedSchedule({ startsAt: string(schedule.startsAt), timeZone: string(schedule.timeZone), durationMinutes: number(schedule.durationMinutes) });
  } else if (schedule.kind === "date_only") {
    fields(schedule, ["kind", "date", "timeZone"], ["estimatedDurationMinutes"]);
    result = createDateOnlySchedule({ date: string(schedule.date), timeZone: string(schedule.timeZone),
      ...(Object.hasOwn(schedule, "estimatedDurationMinutes") ? { estimatedDurationMinutes: number(schedule.estimatedDurationMinutes) } : {}) });
  } else if (schedule.kind === "all_day") {
    fields(schedule, ["kind", "startsOn", "endsBefore", "timeZone"]);
    result = createAllDaySchedule({ startsOn: string(schedule.startsOn), endsBefore: string(schedule.endsBefore), timeZone: string(schedule.timeZone) });
  } else return invalid();
  const decoded = value(result);
  if (!same(decoded, input)) invalid();
  return decoded;
}

function decodePlanningAudit(input: unknown, occurrenceId: string, item: LegacyDailyItemV1, execution: ExecutionRecord | null): PlanningAudit {
  const audit = object(input);
  fields(audit, ["baselineItem", "baselineSchedule", "confirmedAt", "rescheduleHistory"]);
  const baselineItem = dailyItem(audit.baselineItem);
  // The unchanged legacy item remains the physical anchor, never the effective schedule.
  if (baselineItem.completed || !same(plan(baselineItem), plan(item)) || (item.completed && !execution)) invalid();
  const baselineSchedule = decodeSchedule(audit.baselineSchedule);
  const confirmedAt = value(parseUtcInstant(string(audit.confirmedAt)));
  if (!Array.isArray(audit.rescheduleHistory)) invalid();
  const rescheduleHistory = audit.rescheduleHistory.map((raw, index): RescheduleEvent => {
    const event = object(raw);
    fields(event, ["id", "from", "to", "changedAt"], ["reason"]);
    // Identity includes the owning occurrence and append position; copying a chain is invalid.
    if (event.id !== `reschedule:${occurrenceId}:${index + 1}`) invalid();
    let reason;
    if (Object.hasOwn(event, "reason")) {
      const input = object(event.reason);
      fields(input, ["code"], ["note"]);
      reason = value(createTemporalReason({ code: string(input.code), ...(Object.hasOwn(input, "note") ? { note: string(input.note) } : {}) }));
      if (!same(reason, input)) invalid();
    }
    return { id: value(rescheduleEventId(string(event.id))), from: decodeSchedule(event.from), to: decodeSchedule(event.to),
      changedAt: value(parseUtcInstant(string(event.changedAt))), ...(reason ? { reason } : {}) };
  });
  value(validatePlanningHistory({ baselineSchedule, confirmedAt, rescheduleHistory }, execution));
  return { baselineItem, baselineSchedule, confirmedAt, rescheduleHistory };
}

export function decodeExecutionBridge(input: unknown, planner: NormalizedLegacyPlannerV1): ExecutionBridge {
  const bridge = object(input);
  fields(bridge, ["version", "nextSequence", "entries"]);
  if ((bridge.version !== 1 && bridge.version !== 2) || !Number.isSafeInteger(bridge.nextSequence) || number(bridge.nextSequence) < 1 || !Array.isArray(bridge.entries)) invalid();
  const ids = new Set<string>();
  const bindings = new Set<string>();
  let previous = "";
  const entries = bridge.entries.map((raw): OccurrenceBinding => {
    const entry = object(raw);
    fields(entry, ["occurrenceId", "sourceDate", "itemIndex", "originalItem", "item", "execution"], bridge.version === 2 ? ["planningAudit"] : []);
    const id = string(entry.occurrenceId);
    const match = /^occ:([1-9]\d*)$/.exec(id);
    if (!match || !Number.isSafeInteger(Number(match[1])) || Number(match[1]) >= number(bridge.nextSequence) || ids.has(id)) invalid();
    ids.add(id);
    const sourceDate = value(parseLocalDate(string(entry.sourceDate)));
    const index = number(entry.itemIndex);
    if (!Number.isSafeInteger(index) || index < 0) invalid();
    const binding = `${sourceDate}:${String(index).padStart(16, "0")}`;
    if (binding <= previous || bindings.has(binding)) invalid();
    previous = binding;
    bindings.add(binding);
    const item = dailyItem(entry.item);
    const originalItem = dailyItem(entry.originalItem);
    if (originalItem.id !== item.id) invalid();
    const record = planner.records[sourceDate];
    if (!record || record.date !== sourceDate || !same(record.items[index], item)) invalid();
    const execution = entry.execution === null ? null : decodeBridgeExecution(entry.execution, id);
    if (execution && !item.completed) invalid();
    const planningAudit = Object.hasOwn(entry, "planningAudit") ? decodePlanningAudit(entry.planningAudit, id, item, execution) : undefined;
    return { occurrenceId: value(scheduleOccurrenceId(id)), sourceDate, itemIndex: index, originalItem, item, execution,
      ...(planningAudit ? { planningAudit } : {}) };
  });
  const count = Object.values(planner.records).reduce((total, record) => total + record.items.length, 0);
  if (entries.length !== count) invalid();
  return { version: bridge.version, nextSequence: number(bridge.nextSequence), entries };
}

/** Validate the original version first; no confirmation, timezone or history is inferred. */
export function upgradeExecutionBridge(input: unknown, planner: NormalizedLegacyPlannerV1): ExecutionBridge {
  const bridge = decodeExecutionBridge(input, planner);
  return { ...bridge, version: 2 };
}

/** Allocates once in persisted v2; array positions locate bindings, never identify occurrences. */
export function reconcileExecutionBridge(planner: NormalizedLegacyPlannerV1, prior?: ExecutionBridge,
  completion?: Readonly<{ occurrenceId: string; record: ExecutionRecord }>): ExecutionBridge {
  let nextSequence = prior?.nextSequence ?? 1;
  const entries: OccurrenceBinding[] = [];
  const retained = new Set<string>();
  for (const [sourceDate, record] of Object.entries(planner.records).sort(([left], [right]) => left.localeCompare(right))) {
    if (record.date !== sourceDate || !parseLocalDate(sourceDate).ok) invalid();
    const previous = prior?.entries.filter((entry) => entry.sourceDate === sourceDate) ?? [];
    const unchangedPlan = same(previous.map((entry) => plan(entry.item)), record.items.map(plan));
    const duplicateIds = new Set(record.items.map((item) => item.id)).size !== record.items.length
      || new Set(previous.map((entry) => entry.item.id)).size !== previous.length;
    // Without an explicit binding-aware editor there is no safe interpretation of duplicate-ID edits.
    if (previous.length && duplicateIds && !unchangedPlan) invalid();
    record.items.forEach((item, itemIndex) => {
      const old = unchangedPlan ? previous[itemIndex] : previous.find((entry) => entry.item.id === item.id);
      if (old?.execution && (!same(plan(old.item), plan(item)) || !item.completed
        || old.item.actualMinutes !== item.actualMinutes)) invalid();
      if (old?.planningAudit && !same(plan(old.item), plan(item))) invalid();
      const occurrenceId = old?.occurrenceId ?? value(scheduleOccurrenceId(`occ:${nextSequence++}`));
      const supplied = completion?.occurrenceId === occurrenceId ? decodeBridgeExecution(completion.record, occurrenceId) : undefined;
      if (old?.execution && supplied && !same(old.execution, supplied)) invalid();
      if (!Number.isSafeInteger(nextSequence)) invalid();
      retained.add(occurrenceId);
      entries.push({ occurrenceId, sourceDate, itemIndex, originalItem: old?.originalItem ?? { ...item }, item: { ...item }, execution: supplied ?? old?.execution ?? null,
        ...(old?.planningAudit ? { planningAudit: old.planningAudit } : {}) });
    });
  }
  if (prior?.entries.some((entry) => (entry.execution || entry.planningAudit) && !retained.has(entry.occurrenceId))) invalid();
  return decodeExecutionBridge({ version: 2, nextSequence, entries }, planner);
}

export async function createBridgeDocument(bridge: ExecutionBridge, hasher: Sha256Hasher = new WebCryptoSha256Hasher()): Promise<PlannerDocumentRecord> {
  const payload = bridgeJson(bridge);
  return { id: EXECUTION_BRIDGE_DOCUMENT_ID, role: "active", format: EXECUTION_BRIDGE_FORMAT,
    formatVersion: bridge.version, sourceContentFingerprint: await hasher.digestUtf8(canonicalStringify(payload)), payload };
}

export function decodeBridgeDocument(document: PlannerDocumentRecord, planner: NormalizedLegacyPlannerV1): ExecutionBridge {
  if (document.id !== EXECUTION_BRIDGE_DOCUMENT_ID || document.role !== "active" || document.format !== EXECUTION_BRIDGE_FORMAT
    || (document.formatVersion !== 1 && document.formatVersion !== 2) || document.payload.version !== document.formatVersion
    || !/^[a-f0-9]{64}$/.test(document.sourceContentFingerprint ?? "")) invalid();
  return decodeExecutionBridge(document.payload, planner);
}

export async function readBridgeDocument(transaction: PersistenceReadTransaction) {
  const documents = await transaction.listPlannerDocuments();
  // Reserve the namespace so unknown records cannot silently escape recovery.
  if (documents.some((document) => document.id.startsWith("execution/") && document.id !== EXECUTION_BRIDGE_DOCUMENT_ID)) invalid();
  return documents.find((document) => document.id === EXECUTION_BRIDGE_DOCUMENT_ID) ?? null;
}
