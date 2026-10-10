import { createTimedSchedule, type TimedSchedule } from "../domain/temporal/index.ts";
import { confirmedInstant } from "./temporal-input.ts";

export type PlanningInput = Readonly<{ start: string; end: string; timeZone: string }>;
export function buildPlanningSchedule(input: PlanningInput): TimedSchedule {
  if (/^[+-]/.test(input.timeZone)) throw new Error("Informe um identificador IANA, não apenas um offset.");
  const start = confirmedInstant(input.start, input.timeZone), end = confirmedInstant(input.end, input.timeZone);
  const schedule = createTimedSchedule({ startsAt: start, timeZone: input.timeZone, durationMinutes: (Date.parse(end) - Date.parse(start)) / 60_000 });
  if (!schedule.ok) throw new Error("O fim planejado deve ser posterior ao início, com duração em minutos inteiros.");
  return schedule.value;
}
export function planningInput(start: string, end: string, timeZone: string): PlanningInput {
  return { start: localPlanningTime(start, timeZone), end: localPlanningTime(end, timeZone), timeZone };
}
export function localPlanningTime(instant: string, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-iso8601-nu-latn", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
  return `${parts.year.padStart(4, "0")}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
