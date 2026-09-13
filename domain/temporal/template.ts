import { failure, success, type DomainResult } from "./errors.ts";
import type { RoutineTemplateId, SourceEntityId } from "./ids.ts";
import {
  parseIanaTimeZone,
  parseLocalDate,
  parseLocalTime,
  parsePositiveInteger,
  parsePositiveMinutes,
  parseUtcInstant,
  type IanaTimeZone,
  type LocalDate,
  type LocalTime,
  type PositiveInteger,
  type PositiveMinutes,
  type UtcInstant,
} from "./time.ts";

export const TEMPORAL_STATUSES = [
  "planned",
  "completed",
  "completed_rescheduled",
  "not_completed",
  "cancelled",
] as const;

export type TemporalStatus = (typeof TEMPORAL_STATUSES)[number];

export const FLEXIBILITIES = ["fixed", "preferred", "flexible"] as const;
export type Flexibility = (typeof FLEXIBILITIES)[number];

export const ORIGIN_KINDS = [
  "routine",
  "task",
  "study",
  "formation",
  "gym",
  "event",
  "other",
] as const;
export type OriginKind = (typeof ORIGIN_KINDS)[number];

export type OriginReference = Readonly<{
  kind: OriginKind;
  referenceId?: SourceEntityId;
  label?: string;
}>;

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type WeeklyRecurrence = Readonly<{
  kind: "weekly";
  weekdays: readonly IsoWeekday[];
  intervalWeeks: PositiveInteger;
  startsOn: LocalDate;
  endsOn?: LocalDate;
}>;

export type TemplateTiming =
  | Readonly<{
      kind: "timed";
      localTime: LocalTime;
      durationMinutes: PositiveMinutes;
    }>
  | Readonly<{
      kind: "date_only";
      estimatedDurationMinutes?: PositiveMinutes;
    }>
  | Readonly<{
      kind: "all_day";
      durationDays: PositiveInteger;
    }>;

export type RoutineTemplate = Readonly<{
  id: RoutineTemplateId;
  title: string;
  recurrence: WeeklyRecurrence;
  timing: TemplateTiming;
  timeZone: IanaTimeZone;
  flexibility: Flexibility;
  origin: OriginReference;
  createdAt: UtcInstant;
  updatedAt: UtcInstant;
}>;

export function createOriginReference(input: Readonly<{
  kind: OriginKind;
  referenceId?: SourceEntityId;
  label?: string;
}>): DomainResult<OriginReference> {
  if (!(ORIGIN_KINDS as readonly string[]).includes(input.kind)) {
    return failure("invalid_origin", "Origin kind is not supported.", "origin.kind");
  }

  const label = input.label?.trim();
  if (input.label !== undefined && !label) {
    return failure("invalid_origin", "Origin label cannot be empty when provided.", "origin.label");
  }

  return success({
    kind: input.kind,
    ...(input.referenceId ? { referenceId: input.referenceId } : {}),
    ...(label ? { label } : {}),
  });
}

export function createWeeklyRecurrence(input: Readonly<{
  weekdays: readonly number[];
  startsOn: string;
  endsOn?: string;
  intervalWeeks?: number;
}>): DomainResult<WeeklyRecurrence> {
  if (input.weekdays.length === 0 || input.weekdays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) {
    return failure("invalid_recurrence", "Weekly recurrence requires at least one valid ISO weekday.", "weekdays");
  }

  if (new Set(input.weekdays).size !== input.weekdays.length) {
    return failure("invalid_recurrence", "Weekly recurrence cannot repeat weekdays.", "weekdays");
  }

  const startsOn = parseLocalDate(input.startsOn);
  if (!startsOn.ok) return startsOn;
  const intervalWeeks = parsePositiveInteger(input.intervalWeeks ?? 1, "intervalWeeks");
  if (!intervalWeeks.ok) return intervalWeeks;

  let endsOn: LocalDate | undefined;
  if (input.endsOn !== undefined) {
    const parsedEnd = parseLocalDate(input.endsOn);
    if (!parsedEnd.ok) return parsedEnd;
    if (parsedEnd.value < startsOn.value) {
      return failure("invalid_recurrence", "Recurrence end cannot precede its start.", "endsOn");
    }
    endsOn = parsedEnd.value;
  }

  return success({
    kind: "weekly",
    weekdays: [...input.weekdays].sort((left, right) => left - right) as IsoWeekday[],
    intervalWeeks: intervalWeeks.value,
    startsOn: startsOn.value,
    ...(endsOn ? { endsOn } : {}),
  });
}

export function createTemplateTiming(input:
  | Readonly<{ kind: "timed"; localTime: string; durationMinutes: number }>
  | Readonly<{ kind: "date_only"; estimatedDurationMinutes?: number }>
  | Readonly<{ kind: "all_day"; durationDays: number }>,
): DomainResult<TemplateTiming> {
  if (input.kind === "timed") {
    const localTime = parseLocalTime(input.localTime);
    if (!localTime.ok) return localTime;
    const durationMinutes = parsePositiveMinutes(input.durationMinutes);
    if (!durationMinutes.ok) return durationMinutes;
    return success({ kind: "timed", localTime: localTime.value, durationMinutes: durationMinutes.value });
  }

  if (input.kind === "all_day") {
    const durationDays = parsePositiveInteger(input.durationDays, "durationDays");
    if (!durationDays.ok) return durationDays;
    return success({ kind: "all_day", durationDays: durationDays.value });
  }

  if (input.estimatedDurationMinutes === undefined) return success({ kind: "date_only" });
  const estimatedDurationMinutes = parsePositiveMinutes(input.estimatedDurationMinutes);
  if (!estimatedDurationMinutes.ok) return estimatedDurationMinutes;
  return success({ kind: "date_only", estimatedDurationMinutes: estimatedDurationMinutes.value });
}

export function createRoutineTemplate(input: Readonly<{
  id: RoutineTemplateId;
  title: string;
  recurrence: WeeklyRecurrence;
  timing: TemplateTiming;
  timeZone: string;
  flexibility: Flexibility;
  origin: OriginReference;
  createdAt: string;
}>): DomainResult<RoutineTemplate> {
  const title = input.title.trim();
  if (!title) return failure("invalid_template", "Template title cannot be empty.", "title");
  if (!(FLEXIBILITIES as readonly string[]).includes(input.flexibility)) {
    return failure("invalid_template", "Template flexibility is not supported.", "flexibility");
  }

  const timeZone = parseIanaTimeZone(input.timeZone);
  if (!timeZone.ok) return timeZone;
  const createdAt = parseUtcInstant(input.createdAt);
  if (!createdAt.ok) return createdAt;

  return success({
    id: input.id,
    title,
    recurrence: { ...input.recurrence, weekdays: [...input.recurrence.weekdays] },
    timing: { ...input.timing },
    timeZone: timeZone.value,
    flexibility: input.flexibility,
    origin: { ...input.origin },
    createdAt: createdAt.value,
    updatedAt: createdAt.value,
  });
}
