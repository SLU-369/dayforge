import { parseIanaTimeZone, parseUtcInstant, type ExecutionRecord, type OccurrenceSchedule, type RescheduleEvent } from "../../domain/temporal/index.ts";
import { decodePlanningEnvelope, type PlanningEnvelope } from "../contracts/planning-envelope.ts";
import { canRescheduleBinding, decodeExecutionBridge, temporalEntryId, temporalPlanning, type ExecutionBridge } from "./bridge.ts";

export type TemporalQueryItem = Readonly<{
  id: string; nature: "legacy_partial" | "canonical"; title: string;
  provenance: Readonly<{ sourceDate: string; legacyItemId: string }> | Readonly<{ origin: string }>;
  planning: OccurrenceSchedule | null; execution: ExecutionRecord | null; history: readonly RescheduleEvent[];
  windowRelation: "scheduled" | "legacy_candidate";
  capabilities: Readonly<{ complete: boolean; reschedule: boolean }>;
}>;
function civilDate(instant: string, zone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(instant));
  const get = (kind: string) => parts.find(part => part.type === kind)!.value;
  return `${get("year").padStart(4, "0")}-${get("month")}-${get("day")}`;
}
const civilKey = (date: string) => { const [year, month, day] = date.split("-").map(Number); return year * 10000 + month * 100 + day; };
/** Query-only boundaries can extend past the last stored date. Persisted codecs stay strict. */
function queryBoundary(instant: string) {
  const epoch = Date.parse(instant);
  return Number.isFinite(epoch) && new Date(epoch).toISOString() === instant;
}
export function scheduleIntersects(schedule: OccurrenceSchedule, start: string, end: string) {
  if (schedule.kind === "timed") return Date.parse(schedule.startsAt) < Date.parse(end) && Date.parse(schedule.startsAt) + schedule.durationMinutes * 60000 > Date.parse(start);
  const from = civilDate(start, schedule.timeZone), through = civilDate(new Date(Date.parse(end) - 1).toISOString(), schedule.timeZone);
  return schedule.kind === "date_only" ? civilKey(schedule.date) >= civilKey(from) && civilKey(schedule.date) <= civilKey(through)
    : civilKey(schedule.startsOn) <= civilKey(through) && civilKey(schedule.endsBefore) > civilKey(from);
}
/** Pure common query. Unconfirmed legacy candidates never acquire a fabricated schedule. */
export function queryTemporalSnapshot(input: Readonly<{ planner: PlanningEnvelope; registry: ExecutionBridge;
  window: Readonly<{ startsAt: string; endsBefore: string }>; referenceTime: string; displayTimeZone: string }>): readonly TemporalQueryItem[] {
  const planner = decodePlanningEnvelope(input.planner), registry = decodeExecutionBridge(input.registry, planner.legacy);
  if (registry.version !== 3 || !queryBoundary(input.window.startsAt) || !queryBoundary(input.window.endsBefore)
    || Date.parse(input.window.startsAt) >= Date.parse(input.window.endsBefore) || !parseUtcInstant(input.referenceTime).ok || !parseIanaTimeZone(input.displayTimeZone).ok) throw new Error("Consulta temporal inválida.");
  const startDate = civilDate(input.window.startsAt, input.displayTimeZone), endDate = civilDate(new Date(Date.parse(input.window.endsBefore) - 1).toISOString(), input.displayTimeZone);
  const previous = new Date(0), [year, month, day] = startDate.split("-").map(Number);
  previous.setUTCFullYear(year, month - 1, day - 1); previous.setUTCHours(12, 0, 0, 0);
  const firstCandidate = previous.getUTCFullYear() * 10000 + (previous.getUTCMonth() + 1) * 100 + previous.getUTCDate();
  const result: TemporalQueryItem[] = [];
  for (const entry of registry.entries) {
    const canonical = entry.kind === "canonical";
    const planning = temporalPlanning(entry);
    if (planning ? !scheduleIntersects(planning, input.window.startsAt, input.window.endsBefore)
      : !canonical && (civilKey(entry.sourceDate) < firstCandidate || civilKey(entry.sourceDate) > civilKey(endDate))) continue;
    const execution = canonical ? entry.occurrence.execution : entry.execution;
    const pending = canonical ? entry.occurrence.status === "planned" : !entry.item.completed && !execution;
    result.push({ id: temporalEntryId(entry), nature: canonical ? "canonical" : "legacy_partial",
      title: canonical ? entry.occurrence.title : entry.item.title,
      provenance: canonical ? { origin: entry.occurrence.origin.kind } : { sourceDate: entry.sourceDate, legacyItemId: entry.item.id },
      planning, execution, history: canonical ? entry.occurrence.rescheduleHistory : entry.planningAudit?.rescheduleHistory ?? [],
      windowRelation: planning ? "scheduled" : "legacy_candidate",
      // No complete-occurrence producer/command is exposed in this foundation.
      capabilities: { complete: !canonical && pending && !!entry.item.title.trim(), reschedule: !canonical && pending && canRescheduleBinding(entry, registry) } });
  }
  return result.sort((a, b) => {
    const key = (item: TemporalQueryItem) => item.planning?.kind === "timed" ? item.planning.startsAt : item.planning?.kind === "date_only" ? item.planning.date : item.planning?.kind === "all_day" ? item.planning.startsOn : "";
    return key(a).localeCompare(key(b)) || a.id.localeCompare(b.id);
  });
}
