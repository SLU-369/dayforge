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
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function scheduleIntersects(schedule: OccurrenceSchedule, start: string, end: string) {
  if (schedule.kind === "timed") return schedule.startsAt < end && Date.parse(schedule.startsAt) + schedule.durationMinutes * 60000 > Date.parse(start);
  const from = civilDate(start, schedule.timeZone), through = civilDate(new Date(Date.parse(end) - 1).toISOString(), schedule.timeZone);
  return schedule.kind === "date_only" ? schedule.date >= from && schedule.date <= through
    : schedule.startsOn <= through && schedule.endsBefore > from;
}
/** Pure common query. Unconfirmed legacy candidates never acquire a fabricated schedule. */
export function queryTemporalSnapshot(input: Readonly<{ planner: PlanningEnvelope; registry: ExecutionBridge;
  window: Readonly<{ startsAt: string; endsBefore: string }>; referenceTime: string; displayTimeZone: string }>): readonly TemporalQueryItem[] {
  const planner = decodePlanningEnvelope(input.planner), registry = decodeExecutionBridge(input.registry, planner.legacy);
  if (registry.version !== 3 || !parseUtcInstant(input.window.startsAt).ok || !parseUtcInstant(input.window.endsBefore).ok
    || input.window.startsAt >= input.window.endsBefore || !parseUtcInstant(input.referenceTime).ok || !parseIanaTimeZone(input.displayTimeZone).ok) throw new Error("Consulta temporal inválida.");
  const startDate = civilDate(input.window.startsAt, input.displayTimeZone), endDate = civilDate(new Date(Date.parse(input.window.endsBefore) - 1).toISOString(), input.displayTimeZone);
  const previous = new Date(`${startDate}T12:00:00.000Z`); previous.setUTCDate(previous.getUTCDate() - 1);
  const firstCandidate = previous.toISOString().slice(0, 10);
  const result: TemporalQueryItem[] = [];
  for (const entry of registry.entries) {
    const canonical = entry.kind === "canonical";
    const planning = temporalPlanning(entry);
    if (planning ? !scheduleIntersects(planning, input.window.startsAt, input.window.endsBefore)
      : !canonical && (entry.sourceDate < firstCandidate || entry.sourceDate > endDate)) continue;
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
