import { failure, success, type DomainResult } from "./errors.ts";
import { rescheduleEventId } from "./ids.ts";
import { createTemporalReason, type ExecutionRecord, type RescheduleEvent } from "./occurrence.ts";
import {
  createAllDaySchedule, createDateOnlySchedule, createTimedSchedule,
  occurrenceSchedulesEqual, parseUtcInstant, type OccurrenceSchedule,
} from "./time.ts";

export type PlanningHistory = Readonly<{
  baselineSchedule: OccurrenceSchedule;
  confirmedAt: string;
  rescheduleHistory: readonly RescheduleEvent[];
}>;

/** Validates runtime values too: callers cannot bypass factories with a type assertion. */
function validatedSchedule(schedule: OccurrenceSchedule): DomainResult<OccurrenceSchedule> {
  if (!schedule || typeof schedule !== "object") return failure("invalid_reschedule", "Planning must contain a schedule.");
  switch (schedule.kind) {
    case "timed": return createTimedSchedule(schedule);
    case "date_only": return createDateOnlySchedule(schedule);
    case "all_day": return createAllDaySchedule(schedule);
    default: return failure("invalid_reschedule", "Unsupported planning schedule.");
  }
}

/** One chain contract for full occurrences and the partial legacy identity bridge. */
export function validatePlanningHistory(input: PlanningHistory, execution?: ExecutionRecord | null) {
  const baseline = validatedSchedule(input.baselineSchedule);
  if (!baseline.ok) return baseline;
  const confirmed = parseUtcInstant(input.confirmedAt);
  if (!confirmed.ok) return confirmed;
  if (!Array.isArray(input.rescheduleHistory)) return failure("invalid_reschedule", "Planning history must be an array.");
  let currentSchedule = baseline.value;
  let updatedAt = confirmed.value;
  const ids = new Set<string>();
  const rescheduleHistory: RescheduleEvent[] = [];
  for (const event of input.rescheduleHistory) {
    if (!event || typeof event !== "object" || typeof event.id !== "string") return failure("invalid_reschedule", "Planning history must contain valid events.");
    const id = rescheduleEventId(event.id);
    if (!id.ok) return id;
    if (ids.has(id.value)) return failure("invalid_reschedule", "Reschedule IDs must be unique.", "id");
    ids.add(id.value);
    const from = validatedSchedule(event.from);
    if (!from.ok) return from;
    const to = validatedSchedule(event.to);
    if (!to.ok) return to;
    if (!occurrenceSchedulesEqual(currentSchedule, from.value)) return failure("invalid_reschedule", "Reschedule chain is discontinuous.", "from");
    if (occurrenceSchedulesEqual(from.value, to.value)) return failure("invalid_reschedule", "A reschedule must change the current planning.", "to");
    const changedAt = parseUtcInstant(event.changedAt);
    if (!changedAt.ok) return changedAt;
    if (changedAt.value < updatedAt) return failure("invalid_transition", "Command instant cannot precede the occurrence history.", "changedAt");
    const reason = event.reason === undefined ? success(undefined) : createTemporalReason(event.reason);
    if (!reason.ok) return reason;
    rescheduleHistory.push({ id: id.value, from: from.value, to: to.value, changedAt: changedAt.value,
      ...(reason.value ? { reason: reason.value } : {}) });
    currentSchedule = to.value;
    updatedAt = changedAt.value;
  }
  if (execution) {
    const recordedAt = parseUtcInstant(execution.recordedAt);
    if (!recordedAt.ok) return recordedAt;
    if (recordedAt.value < updatedAt) return failure("invalid_transition", "Execution record cannot precede the occurrence history.", "execution.recordedAt");
  }
  return success({ baselineSchedule: baseline.value, currentSchedule, updatedAt, rescheduleHistory });
}

export function appendRescheduleEvent(input: PlanningHistory, event: RescheduleEvent) {
  return validatePlanningHistory({ ...input, rescheduleHistory: [...input.rescheduleHistory, event] });
}

/** Consumers never choose completed_rescheduled independently of the audited history. */
export function deriveCompletedStatus(history: readonly RescheduleEvent[]): "completed" | "completed_rescheduled" {
  return history.length ? "completed_rescheduled" : "completed";
}
