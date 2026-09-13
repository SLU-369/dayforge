import { failure, success, type DomainResult } from "./errors.ts";
import type {
  ExecutionRecordId,
  RescheduleEventId,
  RoutineTemplateId,
  ScheduleOccurrenceId,
} from "./ids.ts";
import {
  copyOccurrenceSchedule,
  createAbsoluteInterval,
  createAllDaySchedule,
  createDateOnlySchedule,
  occurrenceSchedulesEqual,
  parseIanaTimeZone,
  parseUtcInstant,
  type AbsoluteInterval,
  type AllDaySchedule,
  type DateOnlySchedule,
  type IanaTimeZone,
  type OccurrenceSchedule,
  type UtcInstant,
} from "./time.ts";
import type {
  Flexibility,
  OriginReference,
  RoutineTemplate,
} from "./template.ts";
import { FLEXIBILITIES, ORIGIN_KINDS, createOriginReference } from "./template.ts";

export type TemporalReason = Readonly<{
  code: string;
  note?: string;
}>;

export type ExecutionTiming =
  | Readonly<{
      kind: "timed";
      interval: AbsoluteInterval;
      timeZone: IanaTimeZone;
    }>
  | Readonly<{
      kind: "date_only";
      date: DateOnlySchedule["date"];
      timeZone: IanaTimeZone;
      durationMinutes?: DateOnlySchedule["estimatedDurationMinutes"];
    }>
  | Readonly<{
      kind: "all_day";
      startsOn: AllDaySchedule["startsOn"];
      endsBefore: AllDaySchedule["endsBefore"];
      timeZone: IanaTimeZone;
    }>;

export type ExecutionRecord = Readonly<{
  id: ExecutionRecordId;
  timing: ExecutionTiming;
  recordedAt: UtcInstant;
  note?: string;
}>;

export type RescheduleEvent = Readonly<{
  id: RescheduleEventId;
  from: OccurrenceSchedule;
  to: OccurrenceSchedule;
  changedAt: UtcInstant;
  reason?: TemporalReason;
}>;

type OccurrenceBase = Readonly<{
  id: ScheduleOccurrenceId;
  templateId: RoutineTemplateId | null;
  title: string;
  flexibility: Flexibility;
  origin: OriginReference;
  originalSchedule: OccurrenceSchedule;
  currentSchedule: OccurrenceSchedule;
  createdAt: UtcInstant;
  updatedAt: UtcInstant;
}>;

export type PlannedOccurrence = OccurrenceBase & Readonly<{
  status: "planned";
  rescheduleHistory: readonly RescheduleEvent[];
  execution: null;
  resolution: null;
}>;

export type CompletedOccurrence = OccurrenceBase & Readonly<{
  status: "completed";
  rescheduleHistory: readonly [];
  execution: ExecutionRecord;
  resolution: null;
}>;

export type CompletedRescheduledOccurrence = OccurrenceBase & Readonly<{
  status: "completed_rescheduled";
  rescheduleHistory: readonly [RescheduleEvent, ...RescheduleEvent[]];
  execution: ExecutionRecord;
  resolution: null;
}>;

export type NotCompletedOccurrence = OccurrenceBase & Readonly<{
  status: "not_completed";
  rescheduleHistory: readonly RescheduleEvent[];
  execution: null;
  resolution: Readonly<{
    kind: "not_completed";
    resolvedAt: UtcInstant;
    reason?: TemporalReason;
  }>;
}>;

export type CancelledOccurrence = OccurrenceBase & Readonly<{
  status: "cancelled";
  rescheduleHistory: readonly RescheduleEvent[];
  execution: null;
  resolution: Readonly<{
    kind: "cancelled";
    resolvedAt: UtcInstant;
    reason?: TemporalReason;
  }>;
}>;

export type ScheduleOccurrence =
  | PlannedOccurrence
  | CompletedOccurrence
  | CompletedRescheduledOccurrence
  | NotCompletedOccurrence
  | CancelledOccurrence;

type OccurrenceSource =
  | Readonly<{ kind: "template"; template: RoutineTemplate }>
  | Readonly<{
      kind: "standalone";
      title: string;
      flexibility: Flexibility;
      origin: OriginReference;
    }>;

function copyOrigin(origin: OriginReference): OriginReference {
  return { ...origin };
}

function copyReason(reason: TemporalReason | undefined): TemporalReason | undefined {
  return reason ? { ...reason } : undefined;
}

function copyRescheduleEvent(event: RescheduleEvent): RescheduleEvent {
  return {
    ...event,
    from: copyOccurrenceSchedule(event.from),
    to: copyOccurrenceSchedule(event.to),
    ...(event.reason ? { reason: copyReason(event.reason) } : {}),
  };
}

function copyExecution(execution: ExecutionRecord): ExecutionRecord {
  return {
    ...execution,
    timing: execution.timing.kind === "timed"
      ? { ...execution.timing, interval: { ...execution.timing.interval } }
      : { ...execution.timing },
  };
}

function validateNote(note: string | undefined, field: string): DomainResult<string | undefined> {
  if (note === undefined) return success(undefined);
  const normalized = note.trim();
  if (!normalized) return failure("invalid_execution", "Optional text cannot be empty when provided.", field);
  return success(normalized);
}

function ensurePlanned(occurrence: ScheduleOccurrence): DomainResult<PlannedOccurrence> {
  if (occurrence.status !== "planned") {
    return failure(
      "invalid_transition",
      `Temporal state ${occurrence.status} is terminal.`,
      "status",
    );
  }
  return success(occurrence);
}

function validateCommandInstant(value: string, current: UtcInstant, field: string): DomainResult<UtcInstant> {
  const instant = parseUtcInstant(value);
  if (!instant.ok) return instant;
  if (instant.value < current) {
    return failure("invalid_transition", "Command instant cannot precede the occurrence history.", field);
  }
  return instant;
}

export function createTemporalReason(input: Readonly<{
  code: string;
  note?: string;
}>): DomainResult<TemporalReason> {
  const code = input.code.trim();
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(code)) {
    return failure("invalid_reason", "Reason code must be a stable lower_snake_case identifier.", "reason.code");
  }
  const note = input.note?.trim();
  if (input.note !== undefined && !note) {
    return failure("invalid_reason", "Reason note cannot be empty when provided.", "reason.note");
  }
  return success({ code, ...(note ? { note } : {}) });
}

export function createTimedExecutionTiming(input: Readonly<{
  start: string;
  end: string;
  timeZone: string;
}>): DomainResult<ExecutionTiming> {
  const interval = createAbsoluteInterval({ start: input.start, end: input.end });
  if (!interval.ok) return interval;
  const timeZone = parseIanaTimeZone(input.timeZone);
  if (!timeZone.ok) return timeZone;
  return success({ kind: "timed", interval: interval.value, timeZone: timeZone.value });
}

export function createDateOnlyExecutionTiming(input: Readonly<{
  date: string;
  timeZone: string;
  durationMinutes?: number;
}>): DomainResult<ExecutionTiming> {
  const schedule = createDateOnlySchedule({
    date: input.date,
    timeZone: input.timeZone,
    ...(input.durationMinutes === undefined ? {} : { estimatedDurationMinutes: input.durationMinutes }),
  });
  if (!schedule.ok) return schedule;
  return success({
    kind: "date_only",
    date: schedule.value.date,
    timeZone: schedule.value.timeZone,
    ...(schedule.value.estimatedDurationMinutes === undefined
      ? {}
      : { durationMinutes: schedule.value.estimatedDurationMinutes }),
  });
}

export function createAllDayExecutionTiming(input: Readonly<{
  startsOn: string;
  endsBefore: string;
  timeZone: string;
}>): DomainResult<ExecutionTiming> {
  const schedule = createAllDaySchedule(input);
  if (!schedule.ok) return schedule;
  return success({ ...schedule.value });
}

export function createExecutionRecord(input: Readonly<{
  id: ExecutionRecordId;
  timing: ExecutionTiming;
  recordedAt: string;
  note?: string;
}>): DomainResult<ExecutionRecord> {
  const recordedAt = parseUtcInstant(input.recordedAt);
  if (!recordedAt.ok) return recordedAt;
  const note = validateNote(input.note, "execution.note");
  if (!note.ok) return note;
  return success({
    id: input.id,
    timing: input.timing.kind === "timed"
      ? { ...input.timing, interval: { ...input.timing.interval } }
      : { ...input.timing },
    recordedAt: recordedAt.value,
    ...(note.value ? { note: note.value } : {}),
  });
}

export function createOccurrence(input: Readonly<{
  id: ScheduleOccurrenceId;
  source: OccurrenceSource;
  schedule: OccurrenceSchedule;
  createdAt: string;
}>): DomainResult<PlannedOccurrence> {
  const createdAt = parseUtcInstant(input.createdAt);
  if (!createdAt.ok) return createdAt;

  const title = input.source.kind === "template"
    ? input.source.template.title
    : input.source.title.trim();
  if (!title) return failure("invalid_occurrence", "Occurrence title cannot be empty.", "title");

  const templateId = input.source.kind === "template" ? input.source.template.id : null;
  const flexibility = input.source.kind === "template"
    ? input.source.template.flexibility
    : input.source.flexibility;
  const origin = input.source.kind === "template"
    ? input.source.template.origin
    : input.source.origin;
  if (!(FLEXIBILITIES as readonly string[]).includes(flexibility)) {
    return failure("invalid_occurrence", "Occurrence flexibility is not supported.", "flexibility");
  }
  if (!(ORIGIN_KINDS as readonly string[]).includes(origin.kind)) {
    return failure("invalid_occurrence", "Occurrence origin is not supported.", "origin.kind");
  }
  const validatedOrigin = createOriginReference(origin);
  if (!validatedOrigin.ok) return validatedOrigin;

  return success({
    id: input.id,
    templateId,
    title,
    flexibility,
    origin: copyOrigin(validatedOrigin.value),
    status: "planned",
    originalSchedule: copyOccurrenceSchedule(input.schedule),
    currentSchedule: copyOccurrenceSchedule(input.schedule),
    rescheduleHistory: [],
    execution: null,
    resolution: null,
    createdAt: createdAt.value,
    updatedAt: createdAt.value,
  });
}

export function rescheduleOccurrence(
  occurrence: ScheduleOccurrence,
  command: Readonly<{
    id: RescheduleEventId;
    schedule: OccurrenceSchedule;
    changedAt: string;
    reason?: TemporalReason;
  }>,
): DomainResult<PlannedOccurrence> {
  const planned = ensurePlanned(occurrence);
  if (!planned.ok) return planned;
  if (occurrenceSchedulesEqual(planned.value.currentSchedule, command.schedule)) {
    return failure("invalid_reschedule", "A reschedule must change the current planning.", "schedule");
  }
  const changedAt = validateCommandInstant(command.changedAt, planned.value.updatedAt, "changedAt");
  if (!changedAt.ok) return changedAt;

  const event: RescheduleEvent = {
    id: command.id,
    from: copyOccurrenceSchedule(planned.value.currentSchedule),
    to: copyOccurrenceSchedule(command.schedule),
    changedAt: changedAt.value,
    ...(command.reason ? { reason: copyReason(command.reason) } : {}),
  };

  return success({
    ...planned.value,
    origin: copyOrigin(planned.value.origin),
    originalSchedule: copyOccurrenceSchedule(planned.value.originalSchedule),
    currentSchedule: copyOccurrenceSchedule(command.schedule),
    rescheduleHistory: [...planned.value.rescheduleHistory.map(copyRescheduleEvent), event],
    updatedAt: changedAt.value,
  });
}

export function completeOccurrence(
  occurrence: ScheduleOccurrence,
  execution: ExecutionRecord,
): DomainResult<CompletedOccurrence | CompletedRescheduledOccurrence> {
  const planned = ensurePlanned(occurrence);
  if (!planned.ok) return planned;
  if (execution.recordedAt < planned.value.updatedAt) {
    return failure("invalid_transition", "Execution record cannot precede the occurrence history.", "execution.recordedAt");
  }

  const base = {
    ...planned.value,
    origin: copyOrigin(planned.value.origin),
    originalSchedule: copyOccurrenceSchedule(planned.value.originalSchedule),
    currentSchedule: copyOccurrenceSchedule(planned.value.currentSchedule),
    execution: copyExecution(execution),
    resolution: null,
    updatedAt: execution.recordedAt,
  };

  if (planned.value.rescheduleHistory.length === 0) {
    return success({ ...base, status: "completed", rescheduleHistory: [] });
  }

  const [first, ...remaining] = planned.value.rescheduleHistory.map(copyRescheduleEvent);
  return success({
    ...base,
    status: "completed_rescheduled",
    rescheduleHistory: [first, ...remaining],
  });
}

function resolveWithoutExecution(
  occurrence: ScheduleOccurrence,
  kind: "not_completed" | "cancelled",
  resolvedAtValue: string,
  reason?: TemporalReason,
): DomainResult<NotCompletedOccurrence | CancelledOccurrence> {
  const planned = ensurePlanned(occurrence);
  if (!planned.ok) return planned;
  const resolvedAt = validateCommandInstant(resolvedAtValue, planned.value.updatedAt, "resolvedAt");
  if (!resolvedAt.ok) return resolvedAt;

  const resolution = {
    kind,
    resolvedAt: resolvedAt.value,
    ...(reason ? { reason: copyReason(reason) } : {}),
  };
  const base = {
    ...planned.value,
    origin: copyOrigin(planned.value.origin),
    originalSchedule: copyOccurrenceSchedule(planned.value.originalSchedule),
    currentSchedule: copyOccurrenceSchedule(planned.value.currentSchedule),
    execution: null,
    rescheduleHistory: planned.value.rescheduleHistory.map(copyRescheduleEvent),
    updatedAt: resolvedAt.value,
  };

  if (kind === "not_completed") {
    return success({ ...base, status: "not_completed", resolution: { ...resolution, kind } });
  }
  return success({ ...base, status: "cancelled", resolution: { ...resolution, kind } });
}

export function markOccurrenceNotCompleted(
  occurrence: ScheduleOccurrence,
  command: Readonly<{ resolvedAt: string; reason?: TemporalReason }>,
): DomainResult<NotCompletedOccurrence> {
  const result = resolveWithoutExecution(occurrence, "not_completed", command.resolvedAt, command.reason);
  if (!result.ok) return result;
  return success(result.value as NotCompletedOccurrence);
}

export function cancelOccurrence(
  occurrence: ScheduleOccurrence,
  command: Readonly<{ resolvedAt: string; reason?: TemporalReason }>,
): DomainResult<CancelledOccurrence> {
  const result = resolveWithoutExecution(occurrence, "cancelled", command.resolvedAt, command.reason);
  if (!result.ok) return result;
  return success(result.value as CancelledOccurrence);
}
