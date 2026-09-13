import { success, type DomainResult } from "./errors.ts";
import type {
  AvailabilityWindowId,
  RoutineTemplateId,
  ScheduleAnchorId,
  ScheduleOccurrenceId,
  UnavailableWindowId,
} from "./ids.ts";
import {
  parseIanaTimeZone,
  parseLocalTime,
  parsePositiveMinutes,
  type AbsoluteInterval,
  type AllDaySchedule,
  type IanaTimeZone,
  type LocalTime,
  type PositiveMinutes,
} from "./time.ts";
import type { OriginReference, WeeklyRecurrence } from "./template.ts";

export type AbsoluteWindow = Readonly<{
  kind: "absolute";
  interval: AbsoluteInterval;
}>;

export type RecurringWindow = Readonly<{
  kind: "recurring";
  recurrence: WeeklyRecurrence;
  localTime: LocalTime;
  durationMinutes: PositiveMinutes;
  timeZone: IanaTimeZone;
}>;

export type ScheduleWindow = AbsoluteWindow | AllDaySchedule | RecurringWindow;

export type AvailabilityWindow = Readonly<{
  id: AvailabilityWindowId;
  kind: "available";
  window: ScheduleWindow;
  origin: OriginReference;
}>;

export type UnavailableWindow = Readonly<{
  id: UnavailableWindowId;
  kind: "unavailable";
  window: ScheduleWindow;
  origin: OriginReference;
}>;

export type OccupiedInterval = Readonly<{
  kind: "occupied";
  occurrenceId: ScheduleOccurrenceId;
  interval: AbsoluteInterval;
}>;

export type ScheduleAnchor = Readonly<{
  id: ScheduleAnchorId;
  kind: "anchor";
  window: ScheduleWindow;
  origin: OriginReference;
  templateId?: RoutineTemplateId;
}>;

function copyOrigin(origin: OriginReference): OriginReference {
  return { ...origin };
}

export function createAbsoluteWindow(interval: AbsoluteInterval): AbsoluteWindow {
  return { kind: "absolute", interval: { ...interval } };
}

export function createRecurringWindow(input: Readonly<{
  recurrence: WeeklyRecurrence;
  localTime: string;
  durationMinutes: number;
  timeZone: string;
}>): DomainResult<RecurringWindow> {
  const localTime = parseLocalTime(input.localTime);
  if (!localTime.ok) return localTime;
  const durationMinutes = parsePositiveMinutes(input.durationMinutes);
  if (!durationMinutes.ok) return durationMinutes;
  const timeZone = parseIanaTimeZone(input.timeZone);
  if (!timeZone.ok) return timeZone;
  return success({
    kind: "recurring",
    recurrence: { ...input.recurrence, weekdays: [...input.recurrence.weekdays] },
    localTime: localTime.value,
    durationMinutes: durationMinutes.value,
    timeZone: timeZone.value,
  });
}

export function createAvailabilityWindow(input: Readonly<{
  id: AvailabilityWindowId;
  window: ScheduleWindow;
  origin: OriginReference;
}>): AvailabilityWindow {
  return { id: input.id, kind: "available", window: copyWindow(input.window), origin: copyOrigin(input.origin) };
}

export function createUnavailableWindow(input: Readonly<{
  id: UnavailableWindowId;
  window: ScheduleWindow;
  origin: OriginReference;
}>): UnavailableWindow {
  return { id: input.id, kind: "unavailable", window: copyWindow(input.window), origin: copyOrigin(input.origin) };
}

export function createOccupiedInterval(input: Readonly<{
  occurrenceId: ScheduleOccurrenceId;
  interval: AbsoluteInterval;
}>): OccupiedInterval {
  return { kind: "occupied", occurrenceId: input.occurrenceId, interval: { ...input.interval } };
}

export function createScheduleAnchor(input: Readonly<{
  id: ScheduleAnchorId;
  window: ScheduleWindow;
  origin: OriginReference;
  templateId?: RoutineTemplateId;
}>): ScheduleAnchor {
  return {
    id: input.id,
    kind: "anchor",
    window: copyWindow(input.window),
    origin: copyOrigin(input.origin),
    ...(input.templateId ? { templateId: input.templateId } : {}),
  };
}

export function absoluteIntervalsOverlap(left: AbsoluteInterval, right: AbsoluteInterval) {
  return left.start < right.end && right.start < left.end;
}

export function allDayRangesOverlap(left: AllDaySchedule, right: AllDaySchedule) {
  return left.startsOn < right.endsBefore && right.startsOn < left.endsBefore;
}

function copyWindow(window: ScheduleWindow): ScheduleWindow {
  if (window.kind === "absolute") return { ...window, interval: { ...window.interval } };
  if (window.kind === "recurring") {
    return { ...window, recurrence: { ...window.recurrence, weekdays: [...window.recurrence.weekdays] } };
  }
  return { ...window };
}
