import {
  type CategoryKey,
  type DayKey,
  type DailyItem,
  type PlannerState,
  type RoutineItem,
} from "./planner-data";

export type TodayContextItem = Readonly<{
  id: string;
  title: string;
  notes: string;
  category: CategoryKey;
  sourceDate: string;
  start: string;
  end: string;
  startsAt: string;
  endsAt: string;
  completed: boolean;
}>;

export type TodayContext = Readonly<{
  date: string;
  timeZone: string;
  agora: TodayContextItem | null;
  proximo: TodayContextItem | null;
  depois: readonly TodayContextItem[];
  atencao: readonly TodayContextItem[];
  resumo: Readonly<{
    total: number;
    completed: number;
    active: number;
    future: number;
    attention: number;
  }>;
}>;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

type Civil = Readonly<{ year: number; month: number; day: number; hour: number; minute: number }>;

function utcEpoch(civil: Civil) {
  const date = new Date(0);
  date.setUTCFullYear(civil.year, civil.month - 1, civil.day);
  date.setUTCHours(civil.hour, civil.minute, 0, 0);
  return date.getTime();
}

function civilParts(date: string): Civil {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Data local inválida para a visão Hoje.");
  const civil = { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)), hour: 0, minute: 0 };
  const parsed = new Date(utcEpoch(civil));
  if (civil.year < 1 || parsed.getUTCFullYear() !== civil.year
    || parsed.getUTCMonth() + 1 !== civil.month || parsed.getUTCDate() !== civil.day) {
    throw new Error("Data local inválida para a visão Hoje.");
  }
  return civil;
}

function timeParts(time: string): readonly [number, number] {
  const match = TIME_PATTERN.exec(time);
  if (!match) throw new Error("Horário legado inválido para a visão Hoje.");
  return [Number(match[1]), Number(match[2])];
}

function shiftDate(date: string, days: number) {
  const shifted = new Date(utcEpoch(civilParts(date)) + days * 86_400_000);
  return shifted.toISOString().slice(0, 10);
}

function civilAt(epoch: number, formatter: Intl.DateTimeFormat): Civil {
  const fields = Object.fromEntries(formatter.formatToParts(new Date(epoch)).map((part) => [part.type, part.value]));
  return {
    year: Number(fields.year), month: Number(fields.month), day: Number(fields.day),
    hour: Number(fields.hour), minute: Number(fields.minute),
  };
}

function localDate(date: Date, formatter: Intl.DateTimeFormat) {
  const civil = civilAt(date.getTime(), formatter);
  return `${String(civil.year).padStart(4, "0")}-${String(civil.month).padStart(2, "0")}-${String(civil.day).padStart(2, "0")}`;
}

function zonedEpoch(civil: Civil, formatter: Intl.DateTimeFormat) {
  const naive = utcEpoch(civil);
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    const probe = naive + hours * 3_600_000;
    offsets.add(utcEpoch(civilAt(probe, formatter)) - probe);
  }
  const candidates = [...offsets].map((offset) => naive - offset).sort((left, right) => left - right);
  const exact = candidates.find((candidate) => utcEpoch(civilAt(candidate, formatter)) === naive);
  if (exact !== undefined) return exact; // First instant during an autumn overlap.
  const later = candidates
    .map((candidate) => ({ candidate, local: utcEpoch(civilAt(candidate, formatter)) }))
    .filter((entry) => entry.local > naive)
    .sort((left, right) => left.local - right.local || left.candidate - right.candidate)[0];
  if (later) return later.candidate; // Move a nonexistent spring time forward.
  throw new Error("Horário local não representável para a visão Hoje.");
}

function dayKey(date: string): DayKey {
  const day = new Date(utcEpoch(civilParts(date))).getUTCDay();
  return (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const)[day];
}

function entriesForDay(state: PlannerState, date: string): readonly (RoutineItem | DailyItem)[] {
  const record = state.records[date];
  if (record) {
    if (record.date !== date) throw new Error("Registro diário inconsistente para a visão Hoje.");
    return record.items;
  }
  return state.routine[dayKey(date)];
}

function projectItem(entry: RoutineItem | DailyItem, sourceDate: string, formatter: Intl.DateTimeFormat, dayOffset = 0): TodayContextItem {
  const source = civilParts(dayOffset ? shiftDate(sourceDate, dayOffset) : sourceDate);
  const [startHour, startMinute] = timeParts(entry.start);
  const [endHour, endMinute] = timeParts(entry.end);
  const starts = zonedEpoch({ ...source, hour: startHour, minute: startMinute }, formatter);
  const crossesMidnight = endHour * 60 + endMinute <= startHour * 60 + startMinute;
  const endSource = crossesMidnight ? civilParts(shiftDate(sourceDate, dayOffset + 1)) : source;
  const ends = zonedEpoch({ ...endSource, hour: endHour, minute: endMinute }, formatter);
  if (ends <= starts) throw new Error("Intervalo legado inválido para a visão Hoje.");
  return {
    id: `${sourceDate}:${entry.id}`,
    title: entry.title,
    notes: entry.notes,
    category: entry.category,
    sourceDate,
    start: entry.start,
    end: entry.end,
    startsAt: new Date(starts).toISOString(),
    endsAt: new Date(ends).toISOString(),
    completed: "completed" in entry && entry.completed,
  };
}

function projectDay(state: PlannerState, sourceDate: string, formatter: Intl.DateTimeFormat): TodayContextItem[] {
  const entries = entriesForDay(state, sourceDate);
  let dayOffset = 0;
  return entries.map((entry, index) => {
    const previous = entries[index - 1];
    if (previous) {
      const [previousStartHour, previousStartMinute] = timeParts(previous.start);
      const [previousEndHour, previousEndMinute] = timeParts(previous.end);
      const crossesMidnight = previousEndHour * 60 + previousEndMinute <= previousStartHour * 60 + previousStartMinute;
      // A contiguous entry after a midnight crossing belongs to the next civil day.
      // This uses only the legacy list's explicit order and matching boundary.
      dayOffset = entry.start === previous.end && (dayOffset === 1 || crossesMidnight) ? 1 : 0;
    }
    return projectItem(entry, sourceDate, formatter, dayOffset);
  });
}

function bySchedule(left: TodayContextItem, right: TodayContextItem) {
  return left.startsAt.localeCompare(right.startsAt)
    || left.endsAt.localeCompare(right.endsAt)
    || left.id.localeCompare(right.id);
}

/**
 * View-only projection of the active v2 planner's legacy-shaped document.
 * Local wall-clock times use the caller's IANA timezone. This does not create
 * ScheduleOccurrence facts or write inferred timezone/status back to storage.
 */
export function deriveTodayContext(state: PlannerState, referenceTime: Date, timeZone: string, selectedDate?: string): TodayContext {
  if (Number.isNaN(referenceTime.getTime())) throw new Error("Instante de referência inválido.");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const date = selectedDate ?? localDate(referenceTime, formatter);
  const dayStart = zonedEpoch(civilParts(date), formatter);
  const dayEnd = zonedEpoch(civilParts(shiftDate(date, 1)), formatter);
  const previousDate = shiftDate(date, -1);
  const items = [
    ...projectDay(state, previousDate, formatter),
    ...projectDay(state, date, formatter),
  ].filter((entry) => Date.parse(entry.startsAt) < dayEnd && Date.parse(entry.endsAt) > dayStart)
    .sort(bySchedule);
  const pending = items.filter((entry) => !entry.completed);
  const active = pending.filter((entry) => entry.startsAt <= referenceTime.toISOString() && referenceTime.toISOString() < entry.endsAt);
  const future = pending.filter((entry) => entry.startsAt > referenceTime.toISOString());
  // A finished interval without a completion record still needs a user decision.
  // This does not infer not_completed, lateness, or any other terminal status.
  const atencao = pending.filter((entry) => entry.endsAt <= referenceTime.toISOString());
  const agora = active[0] ?? null;
  const proximo = future[0] ?? null;
  const depois = future.slice(1);
  return {
    date,
    timeZone,
    agora,
    proximo,
    depois,
    atencao,
    resumo: {
      total: items.length,
      completed: items.filter((entry) => entry.completed).length,
      active: active.length,
      future: future.length,
      attention: atencao.length,
    },
  };
}
