import {
  type CategoryKey,
  type DayKey,
  type DailyItem,
  type PlannerState,
  type RoutineItem,
} from "./planner-data";
import type { ExecutionBridge, OccurrenceBinding } from "../persistence/execution/bridge.ts";

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
  occurrenceId: string | null;
  sourceItemId: string;
  sourceIndex: number;
  binding?: OccurrenceBinding;
  reschedulable?: boolean;
  planningTimeZone?: string;
  durationMinutes?: number;
  actualMinutes?: number;
}>;

export type TodayContext = Readonly<{
  date: string;
  timeZone: string;
  items: readonly TodayContextItem[];
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
    occurrenceId: null,
    sourceItemId: entry.id,
    sourceIndex: 0,
  };
}

function projectDay(state: PlannerState, sourceDate: string, formatter: Intl.DateTimeFormat, bindings?: ReadonlyMap<string, OccurrenceBinding>): TodayContextItem[] {
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
    const projected = projectItem(entry, sourceDate, formatter, dayOffset);
    const binding = state.records[sourceDate]
      ? bindings?.get(`${sourceDate}:${index}`)
      : undefined;
    if (bindings && state.records[sourceDate] && (!binding
      || Object.keys(binding.item).length !== Object.keys(entry).length
      || !Object.entries(binding.item).every(([key, value]) => entry[key as keyof typeof entry] === value))) {
      throw new Error("Vínculo de ocorrência incompatível com o dia projetado.");
    }
    return { ...projected,
      // Virtual routine items are projections, never persistent occurrence identities.
      id: binding?.occurrenceId ?? `virtual:${JSON.stringify([sourceDate, index, entry.id])}`,
      occurrenceId: binding?.occurrenceId ?? null,
      sourceIndex: index,
      completed: binding?.execution ? true : projected.completed,
      ...(binding ? { binding, reschedulable: !binding.item.completed && !binding.execution
        && entries.filter((candidate) => candidate.id === entry.id).length === 1 } : {}),
    };
  });
}

type EffectiveIndex = { bindings: Map<string, OccurrenceBinding>; byStart: readonly OccurrenceBinding[]; byEnd: readonly OccurrenceBinding[] };
const effectiveIndexes = new WeakMap<ExecutionBridge, EffectiveIndex>();
function auditedLimits(binding: OccurrenceBinding) {
  const audit = binding.planningAudit!;
  const schedule = audit.rescheduleHistory.at(-1)?.to ?? audit.baselineSchedule;
  if (schedule.kind !== "timed") throw new Error("Planejamento auditado sem intervalo horário não é suportado em Hoje.");
  return { start: Date.parse(schedule.startsAt), end: Date.parse(schedule.startsAt) + schedule.durationMinutes * 60_000 };
}
function effectiveIndex(bridge: ExecutionBridge): EffectiveIndex {
  const cached = effectiveIndexes.get(bridge);
  if (cached) return cached;
  const audited = bridge.entries.filter((entry) => entry.planningAudit);
  const index = { bindings: new Map(bridge.entries.map((entry) => [`${entry.sourceDate}:${entry.itemIndex}`, entry])),
    byStart: [...audited].sort((a, b) => auditedLimits(a).start - auditedLimits(b).start),
    byEnd: [...audited].sort((a, b) => auditedLimits(a).end - auditedLimits(b).end) };
  effectiveIndexes.set(bridge, index);
  return index;
}
function auditedBetween(index: EffectiveIndex, start: number, end: number) {
  function boundary(entries: readonly OccurrenceBinding[], matches: (entry: OccurrenceBinding) => boolean) {
    let low = 0, high = entries.length;
    while (low < high) { const middle = (low + high) >>> 1; if (matches(entries[middle])) low = middle + 1; else high = middle; }
    return low;
  }
  const before = boundary(index.byStart, (entry) => auditedLimits(entry).start < end);
  const after = boundary(index.byEnd, (entry) => auditedLimits(entry).end <= start);
  const candidates = before <= index.byEnd.length - after ? index.byStart.slice(0, before) : index.byEnd.slice(after);
  return candidates.filter((entry) => { const limits = auditedLimits(entry); return limits.start < end && limits.end > start; });
}
function auditedItem(binding: OccurrenceBinding, formatter: Intl.DateTimeFormat): TodayContextItem {
  const audit = binding.planningAudit!;
  const schedule = audit.rescheduleHistory.at(-1)?.to ?? audit.baselineSchedule;
  if (schedule.kind !== "timed") throw new Error("Planejamento auditado sem intervalo horário não é suportado em Hoje.");
  const end = new Date(Date.parse(schedule.startsAt) + schedule.durationMinutes * 60_000).toISOString();
  const clock = (instant: string) => { const civil = civilAt(Date.parse(instant), formatter); return `${String(civil.hour).padStart(2, "0")}:${String(civil.minute).padStart(2, "0")}`; };
  return { id: binding.occurrenceId, occurrenceId: binding.occurrenceId, sourceDate: binding.sourceDate,
    sourceIndex: binding.itemIndex, sourceItemId: binding.item.id, title: binding.item.title, notes: binding.item.notes,
    category: binding.item.category, start: clock(schedule.startsAt), end: clock(end), startsAt: schedule.startsAt, endsAt: end,
    completed: !!binding.execution || binding.item.completed, binding, reschedulable: !binding.item.completed && !binding.execution,
    planningTimeZone: schedule.timeZone, durationMinutes: schedule.durationMinutes,
    ...(binding.execution?.timing.kind === "timed" ? { actualMinutes: (Date.parse(binding.execution.timing.interval.end) - Date.parse(binding.execution.timing.interval.start)) / 60_000 }
      : binding.item.actualMinutes === undefined ? {} : { actualMinutes: binding.item.actualMinutes }) };
}

function bySchedule(left: TodayContextItem, right: TodayContextItem) {
  return left.startsAt.localeCompare(right.startsAt)
    || left.endsAt.localeCompare(right.endsAt)
    || `${left.sourceDate}:${left.sourceItemId}`.localeCompare(`${right.sourceDate}:${right.sourceItemId}`)
    || left.sourceIndex - right.sourceIndex;
}

/**
 * View-only projection of the active v2 planner's legacy-shaped document.
 * Local wall-clock times use the caller's IANA timezone. This does not create
 * ScheduleOccurrence facts or write inferred timezone/status back to storage.
 */
export function deriveTodayContext(state: PlannerState, referenceTime: Date, timeZone: string, selectedDate?: string, bridge?: ExecutionBridge): TodayContext {
  if (Number.isNaN(referenceTime.getTime())) throw new Error("Instante de referência inválido.");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const date = selectedDate ?? localDate(referenceTime, formatter);
  const dayStart = zonedEpoch(civilParts(date), formatter);
  const dayEnd = zonedEpoch(civilParts(shiftDate(date, 1)), formatter);
  const previousDate = shiftDate(date, -1);
  const index = bridge ? effectiveIndex(bridge) : undefined;
  const items = [
    ...projectDay(state, previousDate, formatter, index?.bindings).filter((entry) => !entry.binding?.planningAudit),
    ...projectDay(state, date, formatter, index?.bindings).filter((entry) => !entry.binding?.planningAudit),
    ...(index ? auditedBetween(index, dayStart, dayEnd).map((binding) => {
      const physical = state.records[binding.sourceDate]?.items[binding.itemIndex];
      if (!physical || Object.entries(binding.item).some(([key, value]) => physical[key as keyof typeof physical] !== value)) throw new Error("Vínculo auditado incompatível com o planner.");
      const item = auditedItem(binding, formatter);
      return { ...item, reschedulable: item.reschedulable && state.records[binding.sourceDate].items.filter((entry) => entry.id === binding.item.id).length === 1 };
    }) : []),
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
    items,
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
