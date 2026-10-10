"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import type { ReschedulingIntent } from "../persistence/execution/rescheduling";
import { occurrenceRevision } from "../persistence/execution/bridge";
import type { TodayContextItem } from "./today-context";
import { buildPlanningSchedule, planningInput, type PlanningInput } from "./rescheduling-input";
import styles from "./today-context.module.css";

export function ReschedulingDialog({ item, authorityEpoch, onReschedule, onClose }: {
  item: TodayContextItem; authorityEpoch: number;
  onReschedule: (intent: ReschedulingIntent) => Promise<void>; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), submitting = useRef(false);
  const cached = useRef<{ key: string; intent: ReschedulingIntent } | null>(null);
  const zone = item.planningTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const initial = () => planningInput(item.startsAt, item.endsAt, zone);
  const [previous, setPrevious] = useState(initial), [next, setNext] = useState(initial);
  const [confirmed, setConfirmed] = useState(false), [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const first = !item.binding?.planningAudit;
  let duration: number | null = null;
  try { duration = buildPlanningSchedule(next).durationMinutes; } catch { /* Input feedback on submit. */ }
  useEffect(() => { const element = dialog.current!; element.showModal(); return () => element.close(); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      if (!item.binding || !item.occurrenceId) throw new Error("Ocorrência canônica indisponível.");
      if (first && !confirmed) throw new Error("Confirme explicitamente o planejamento anterior.");
      const key = JSON.stringify({ previous, next, reason });
      if (cached.current?.key !== key) cached.current = { key, intent: {
        occurrenceId: item.occurrenceId, expectedAuthorityEpoch: authorityEpoch,
        expectedRevision: occurrenceRevision(item.binding), expectedHistoryLength: item.binding.planningAudit?.rescheduleHistory.length ?? 0,
        ...(first ? { previousSchedule: buildPlanningSchedule(previous) } : {}),
        schedule: buildPlanningSchedule(next), changedAt: new Date().toISOString(),
        ...(reason.trim() ? { reason: { code: "user_note", note: reason.trim() } } : {}),
      } };
      await onReschedule(cached.current.intent); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível reagendar. Tente novamente."); }
    finally { submitting.current = false; setBusy(false); }
  }
  function fields(input: PlanningInput, setInput: (value: PlanningInput) => void, prefix: string) {
    return <>
      <label className="full-field"><span>{prefix} início</span><input type="datetime-local" required step="60" disabled={busy} value={input.start} onChange={(event) => setInput({ ...input, start: event.target.value })} /></label>
      <label className="full-field"><span>{prefix} fim</span><input type="datetime-local" required step="60" disabled={busy} value={input.end} onChange={(event) => setInput({ ...input, end: event.target.value })} /></label>
      <label className="full-field"><span>{prefix} fuso IANA</span><input required disabled={busy} value={input.timeZone} onChange={(event) => setInput({ ...input, timeZone: event.target.value })} /></label>
    </>;
  }
  return <dialog ref={dialog} className={`editor-modal ${styles.dialog}`} aria-labelledby="rescheduling-title" onCancel={(event) => { event.preventDefault(); if (!submitting.current) onClose(); }}>
    <form onSubmit={submit}>
      <div className="modal-heading"><h2 id="rescheduling-title">Reagendar {item.title}</h2></div>
      <p className={styles.caption}>Altere o planejamento desta ocorrência. A execução será registrada separadamente.</p>
      {first ? <fieldset disabled={busy} className={styles.baseline}><legend>Planejamento anterior</legend>
        <p className={styles.caption}>Confira as datas, horários e fuso sugeridos. Sua confirmação inicia o histórico auditável; a projeção legada ainda não era um fato temporal confirmado.</p>
        {fields(previous, setPrevious, "Anterior")}
        <label className={styles.confirmation}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Confirmo este planejamento anterior</label>
      </fieldset> : <p className={styles.caption}>Planejamento vigente: {previous.start.replace("T", ", ")} → {previous.end.replace("T", ", ")} · {previous.timeZone}</p>}
      {fields(next, setNext, "Novo")}
      <p className={styles.caption} aria-live="polite">Duração resultante: {duration === null ? "confira os limites" : `${duration} min`}. Ao atravessar meia-noite, informe a data final.</p>
      <label className="full-field"><span>Motivo (opcional)</span><textarea disabled={busy} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
      {error && <p role="alert" className={styles.caption}>{error}</p>}
      <div className="modal-actions"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" loading={busy}>Confirmar reagendamento</Button></div>
    </form>
  </dialog>;
}
