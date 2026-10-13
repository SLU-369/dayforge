import type { TimedSchedule } from "../domain/temporal/index.ts";
import { buildPlanningSchedule } from "./rescheduling-input.ts";

export type EventInput = Readonly<{ kind: "timed"; start: string; end: string; timeZone: string }>;
export function buildEventSchedule(input: EventInput): TimedSchedule {
  if (input.kind !== "timed") throw new Error("A criação nesta etapa exige início e fim com horário.");
  return buildPlanningSchedule(input);
}
