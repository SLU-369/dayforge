import type { OccurrenceBinding } from "../persistence/execution/bridge";
import { deriveCompletedStatus, type OccurrenceSchedule } from "../domain/temporal/index";
import { localPlanningTime } from "./rescheduling-input";
import styles from "./today-context.module.css";

function label(schedule: OccurrenceSchedule): string {
  if (schedule.kind === "timed") return `${localPlanningTime(schedule.startsAt, schedule.timeZone).replace("T", ", ")} → ${localPlanningTime(new Date(Date.parse(schedule.startsAt) + schedule.durationMinutes * 60_000).toISOString(), schedule.timeZone).replace("T", ", ")} · ${schedule.timeZone}`;
  return schedule.kind === "date_only" ? `${schedule.date} · ${schedule.timeZone}` : `${schedule.startsOn} → ${schedule.endsBefore} · ${schedule.timeZone}`;
}
export function PlanningHistoryView({ binding }: { binding: OccurrenceBinding }) {
  const audit = binding.planningAudit;
  if (!audit) return null;
  const execution = binding.execution;
  return <details className={styles.history}><summary>Histórico de {binding.item.title}</summary>
    <p>Original legado: {binding.sourceDate}, {binding.originalItem.start}–{binding.originalItem.end} · fuso histórico não registrado</p>
    <p>Planejamento confirmado: {label(audit.baselineSchedule)}</p><small>Confirmado em {audit.confirmedAt}</small>
    <ol>{audit.rescheduleHistory.map((event) => <li key={event.id}><p>Reagendado: {label(event.to)}</p><small>Decisão em {event.changedAt}</small>{event.reason?.note && <p>Motivo: {event.reason.note}</p>}</li>)}</ol>
    <p>Vigente: {label(audit.rescheduleHistory.at(-1)?.to ?? audit.baselineSchedule)}</p>
    {execution && <><p data-derived-status={deriveCompletedStatus(audit.rescheduleHistory)}>Estado: {deriveCompletedStatus(audit.rescheduleHistory) === "completed_rescheduled" ? "Concluída após reagendamento" : "Concluída"}</p><p>Execução real: {execution.timing.kind === "timed" ? `${localPlanningTime(execution.timing.interval.start, execution.timing.timeZone).replace("T", ", ")} → ${localPlanningTime(execution.timing.interval.end, execution.timing.timeZone).replace("T", ", ")} · ${execution.timing.timeZone}` : execution.timing.kind === "date_only" ? `${execution.timing.date} · ${execution.timing.timeZone}` : `${execution.timing.startsOn} → ${execution.timing.endsBefore} · ${execution.timing.timeZone}`}</p></>}
  </details>;
}
