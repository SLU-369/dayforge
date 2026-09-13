import { failure, success, type DomainResult } from "./errors.ts";

declare const localDateBrand: unique symbol;
declare const localTimeBrand: unique symbol;
declare const utcInstantBrand: unique symbol;
declare const timeZoneBrand: unique symbol;
declare const positiveMinutesBrand: unique symbol;
declare const positiveIntegerBrand: unique symbol;

export type LocalDate = string & { readonly [localDateBrand]: true };
export type LocalTime = string & { readonly [localTimeBrand]: true };
export type UtcInstant = string & { readonly [utcInstantBrand]: true };
export type IanaTimeZone = string & { readonly [timeZoneBrand]: true };
export type PositiveMinutes = number & { readonly [positiveMinutesBrand]: true };
export type PositiveInteger = number & { readonly [positiveIntegerBrand]: true };

export type TimedSchedule = Readonly<{
  kind: "timed";
  startsAt: UtcInstant;
  timeZone: IanaTimeZone;
  durationMinutes: PositiveMinutes;
}>;

export type DateOnlySchedule = Readonly<{
  kind: "date_only";
  date: LocalDate;
  timeZone: IanaTimeZone;
  estimatedDurationMinutes?: PositiveMinutes;
}>;

export type AllDaySchedule = Readonly<{
  kind: "all_day";
  startsOn: LocalDate;
  endsBefore: LocalDate;
  timeZone: IanaTimeZone;
}>;

export type OccurrenceSchedule = TimedSchedule | DateOnlySchedule | AllDaySchedule;

export type AbsoluteInterval = Readonly<{
  start: UtcInstant;
  end: UtcInstant;
}>;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number) {
  const values = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return values[month - 1] ?? 0;
}

export function parseLocalDate(value: string): DomainResult<LocalDate> {
  const match = DATE_PATTERN.exec(value);
  if (!match) return failure("invalid_date", "Date must use the canonical YYYY-MM-DD format.", "date");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return failure("invalid_date", "Date must be a valid Gregorian calendar date.", "date");
  }

  return success(value as LocalDate);
}

export function parseLocalTime(value: string): DomainResult<LocalTime> {
  if (!TIME_PATTERN.test(value)) {
    return failure("invalid_time", "Time must use the canonical 24-hour HH:mm format.", "time");
  }
  return success(value as LocalTime);
}

export function parseUtcInstant(value: string): DomainResult<UtcInstant> {
  if (!INSTANT_PATTERN.test(value)) {
    return failure("invalid_instant", "Instant must be canonical UTC ISO 8601 with millisecond precision.", "instant");
  }

  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    return failure("invalid_instant", "Instant must represent a real UTC date and time.", "instant");
  }

  return success(value as UtcInstant);
}

export function parseIanaTimeZone(value: string): DomainResult<IanaTimeZone> {
  if (!value || value.trim() !== value) {
    return failure("invalid_time_zone", "Time zone must be an explicit IANA identifier.", "timeZone");
  }

  try {
    const canonical = new Intl.DateTimeFormat("en-US", { timeZone: value })
      .resolvedOptions()
      .timeZone;
    return success(canonical as IanaTimeZone);
  } catch {
    return failure("invalid_time_zone", "Time zone must be an explicit IANA identifier.", "timeZone");
  }
}

export function parsePositiveMinutes(value: number): DomainResult<PositiveMinutes> {
  if (!Number.isSafeInteger(value) || value <= 0) {
    return failure("invalid_duration", "Duration must be a positive whole number of minutes.", "durationMinutes");
  }
  return success(value as PositiveMinutes);
}

export function parsePositiveInteger(value: number, field: string): DomainResult<PositiveInteger> {
  if (!Number.isSafeInteger(value) || value <= 0) {
    return failure("invalid_duration", "Value must be a positive whole number.", field);
  }
  return success(value as PositiveInteger);
}

export function createTimedSchedule(input: Readonly<{
  startsAt: string;
  timeZone: string;
  durationMinutes: number;
}>): DomainResult<TimedSchedule> {
  const startsAt = parseUtcInstant(input.startsAt);
  if (!startsAt.ok) return startsAt;
  const timeZone = parseIanaTimeZone(input.timeZone);
  if (!timeZone.ok) return timeZone;
  const durationMinutes = parsePositiveMinutes(input.durationMinutes);
  if (!durationMinutes.ok) return durationMinutes;
  const endEpoch = Date.parse(startsAt.value) + durationMinutes.value * 60_000;
  if (!Number.isFinite(endEpoch) || Math.abs(endEpoch) > 8_640_000_000_000_000) {
    return failure("invalid_duration", "Duration must keep the scheduled interval in the supported instant range.", "durationMinutes");
  }
  return success({ kind: "timed", startsAt: startsAt.value, timeZone: timeZone.value, durationMinutes: durationMinutes.value });
}

export function createDateOnlySchedule(input: Readonly<{
  date: string;
  timeZone: string;
  estimatedDurationMinutes?: number;
}>): DomainResult<DateOnlySchedule> {
  const date = parseLocalDate(input.date);
  if (!date.ok) return date;
  const timeZone = parseIanaTimeZone(input.timeZone);
  if (!timeZone.ok) return timeZone;

  if (input.estimatedDurationMinutes === undefined) {
    return success({ kind: "date_only", date: date.value, timeZone: timeZone.value });
  }

  const estimatedDurationMinutes = parsePositiveMinutes(input.estimatedDurationMinutes);
  if (!estimatedDurationMinutes.ok) return estimatedDurationMinutes;
  return success({
    kind: "date_only",
    date: date.value,
    timeZone: timeZone.value,
    estimatedDurationMinutes: estimatedDurationMinutes.value,
  });
}

export function createAllDaySchedule(input: Readonly<{
  startsOn: string;
  endsBefore: string;
  timeZone: string;
}>): DomainResult<AllDaySchedule> {
  const startsOn = parseLocalDate(input.startsOn);
  if (!startsOn.ok) return startsOn;
  const endsBefore = parseLocalDate(input.endsBefore);
  if (!endsBefore.ok) return endsBefore;
  const timeZone = parseIanaTimeZone(input.timeZone);
  if (!timeZone.ok) return timeZone;
  if (startsOn.value >= endsBefore.value) {
    return failure("invalid_interval", "All-day range must have an exclusive end after its start.", "endsBefore");
  }
  return success({ kind: "all_day", startsOn: startsOn.value, endsBefore: endsBefore.value, timeZone: timeZone.value });
}

export function createAbsoluteInterval(input: Readonly<{
  start: string;
  end: string;
}>): DomainResult<AbsoluteInterval> {
  const start = parseUtcInstant(input.start);
  if (!start.ok) return start;
  const end = parseUtcInstant(input.end);
  if (!end.ok) return end;
  if (start.value >= end.value) {
    return failure("invalid_interval", "Interval end must be after its start.", "end");
  }
  return success({ start: start.value, end: end.value });
}

export function intervalForTimedSchedule(schedule: TimedSchedule): DomainResult<AbsoluteInterval> {
  const endEpoch = Date.parse(schedule.startsAt) + schedule.durationMinutes * 60_000;
  if (!Number.isFinite(endEpoch) || Math.abs(endEpoch) > 8_640_000_000_000_000) {
    return failure("invalid_interval", "Timed schedule exceeds the supported instant range.", "durationMinutes");
  }
  const end = new Date(endEpoch).toISOString() as UtcInstant;
  return success({ start: schedule.startsAt, end });
}

export function copyOccurrenceSchedule(schedule: OccurrenceSchedule): OccurrenceSchedule {
  return { ...schedule };
}

export function occurrenceSchedulesEqual(left: OccurrenceSchedule, right: OccurrenceSchedule) {
  if (left.kind !== right.kind) return false;
  if (left.kind === "timed" && right.kind === "timed") {
    return left.startsAt === right.startsAt
      && left.timeZone === right.timeZone
      && left.durationMinutes === right.durationMinutes;
  }
  if (left.kind === "date_only" && right.kind === "date_only") {
    return left.date === right.date
      && left.timeZone === right.timeZone
      && left.estimatedDurationMinutes === right.estimatedDurationMinutes;
  }
  if (left.kind === "all_day" && right.kind === "all_day") {
    return left.startsOn === right.startsOn
      && left.endsBefore === right.endsBefore
      && left.timeZone === right.timeZone;
  }
  return false;
}
