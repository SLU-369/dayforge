"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import type { OccurrenceSchedule } from "../domain/temporal/index";
import { planningEnvelope } from "../persistence/contracts/planning-envelope";
import { queryTemporalSnapshot, scheduleIntersects } from "../persistence/execution/query";
import type { EventCreationIntent } from "../persistence/execution/event-creation";
import { EventDialog } from "./event-dialog";
import { usePlanner } from "./planner-context";
import PlannerApp from "./planner-app";
import { localPlanningTime } from "./rescheduling-input";
import { readCivilDayWindow } from "./today-context";
import styles from "./agenda.module.css";

const flexibilityLabels = { fixed: "Fixo", preferred: "Preferencial", flexible: "Flexível" };
const statusLabels = { planned: "Planejado", completed: "Concluído", completed_rescheduled: "Concluído após reagendamento", not_completed: "Não realizado", cancelled: "Cancelado" };
function monthStart(date: string, offset = 0) {
  const value = new Date(`${date.slice(0, 7)}-01T12:00:00.000Z`);
  value.setUTCMonth(value.getUTCMonth() + offset);
  const result = value.toISOString().slice(0, 10);
  if (!/^\d{4}-/.test(result) || result.startsWith("0000")) throw new Error("Limite do calendário alcançado.");
  return result;
}
function scheduleLabel(schedule: OccurrenceSchedule, displayZone: string) {
  if (schedule.kind === "timed") {
    const end = new Date(Date.parse(schedule.startsAt) + schedule.durationMinutes * 60000).toISOString();
    return `${localPlanningTime(schedule.startsAt, displayZone).replace("T", " · ")} → ${localPlanningTime(end, displayZone).replace("T", " · ")} · ${displayZone}`;
  }
  return schedule.kind === "date_only" ? `${schedule.date} · sem horário · ${schedule.timeZone}`
    : `${schedule.startsOn} → ${schedule.endsBefore} (fim exclusivo) · dia inteiro · ${schedule.timeZone}`;
}
export default function AgendaView() {
  const { state, executionBridge, authorityEpoch, datasetRevision, ready, storageBlocked, completingIds,
    createEvent, beginEditing, endEditing } = usePlanner();
  const [zone, setZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [date, setDate] = useState(() => localPlanningTime(new Date().toISOString(), zone).slice(0, 10));
  const [base, setBase] = useState<Pick<EventCreationIntent, "expectedAuthorityEpoch" | "expectedDatasetRevision" | "expectedSequence"> | null>(null);
  const [navigationError, setNavigationError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => () => { if (base) endEditing(); }, [base, endEditing]);
  const projection = useMemo(() => {
    if (!ready || !date || !executionBridge) return null;
    try {
      const first = monthStart(date), next = monthStart(date, 1);
      const monthWindow = { startsAt: readCivilDayWindow(first, zone).startsAt, endsBefore: readCivilDayWindow(next, zone).startsAt };
      const input = { planner: planningEnvelope(state), registry: executionBridge,
        referenceTime: new Date().toISOString(), displayTimeZone: zone };
      const monthItems = queryTemporalSnapshot({ ...input, window: monthWindow });
      const items = queryTemporalSnapshot({ ...input, window: readCivilDayWindow(date, zone) });
      const count = Math.round((Date.parse(`${next}T12:00:00.000Z`) - Date.parse(`${first}T12:00:00.000Z`)) / 86400000);
      const days = Array.from({ length: count }, (_, index) => {
        const day = `${first.slice(0, 7)}-${String(index + 1).padStart(2, "0")}`, window = readCivilDayWindow(day, zone);
        return { day, count: monthItems.filter(item => item.nature === "canonical" && item.planning && scheduleIntersects(item.planning, window.startsAt, window.endsBefore)).length };
      });
      return { items, days, leading: (new Date(`${first}T12:00:00.000Z`).getUTCDay() + 6) % 7, error: "" };
    } catch { return { items: [], days: [], leading: 0, error: "Não foi possível consultar este período. Os dados foram preservados; confira a data e o fuso." }; }
  }, [ready, date, zone, state, executionBridge]);
  function navigate(offset: number) {
    try { setDate(monthStart(date, offset)); setNavigationError(""); }
    catch { setNavigationError("Limite do calendário alcançado."); }
  }
  function open() {
    if (!executionBridge || !beginEditing()) return;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setBase({ expectedAuthorityEpoch: authorityEpoch, expectedDatasetRevision: datasetRevision, expectedSequence: executionBridge.nextSequence });
  }
  function close() {
    setBase(null);
    window.requestAnimationFrame(() => trigger.current?.focus());
  }
  const canonical = projection?.items.filter(item => item.nature === "canonical") ?? [];
  const legacy = projection?.items.filter(item => item.nature === "legacy_partial") ?? [];
  if (showSummary) return <><div className="page-wrap"><Button variant="secondary" onClick={() => setShowSummary(false)}>Voltar à Agenda</Button></div><PlannerApp view="mes" /></>;
  return <div className="page-wrap">
    <div className={`page-topline ${styles.heading}`}><div><span className="eyebrow">PLANEJAMENTO</span><h1>Agenda</h1><p>Consulte seus eventos e planeje novos compromissos.</p></div>
      <div className={styles.controls}><Button variant="secondary" onClick={() => setShowSummary(true)} disabled={!ready}>Ver resumo mensal</Button>
        <Button onClick={open} disabled={!ready || storageBlocked || !executionBridge || !date || completingIds.length > 0}>Novo evento</Button></div></div>
    {!ready || !date ? <p role="status">Preparando a Agenda…</p> : <>
      <section className={`panel ${styles.panel}`} aria-label="Calendário da Agenda">
        <div className={styles.controls}><Button variant="secondary" onClick={() => navigate(-1)}>Mês anterior</Button><strong>{date.slice(0, 7)}</strong><Button variant="secondary" onClick={() => navigate(1)}>Próximo mês</Button></div>
        <div className={styles.filters}><label>Data consultada<input aria-label="Data consultada" type="date" required value={date} onChange={event => { if (event.target.value) setDate(event.target.value); }} /></label>
          <label>Fuso de consulta<input value={zone} onChange={event => setZone(event.target.value)} /></label></div>
        <p className={styles.caption}>Os números indicam eventos canônicos que intersectam cada dia. Eventos com horário são exibidos no fuso de consulta; datas sem horário mantêm seu fuso original.</p>
        <div className={styles.calendar}>
          {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map(day => <span key={day} className={styles.weekday}>{day}</span>)}
          {Array.from({ length: projection?.leading ?? 0 }, (_, index) => <span key={`blank-${index}`} />)}
          {projection?.days.map(day => <button key={day.day} aria-label={`Consultar ${day.day}: ${day.count} eventos`} aria-pressed={day.day === date} onClick={() => setDate(day.day)}><strong>{Number(day.day.slice(8))}</strong><span>{day.count || "—"}</span></button>)}
        </div>
      </section>
      {(projection?.error || navigationError) && <p role="alert">{projection?.error || navigationError}</p>}
      {storageBlocked && <p role="note">O armazenamento precisa de recuperação em Dados e backup antes de criar eventos.</p>}
      {projection && !projection.error && <section className={`panel ${styles.panel}`} aria-label="Eventos da data">
        <h2>Eventos em {date}</h2>
        {!canonical.length && <p>Nenhum evento canônico nesta data.</p>}
        <ul className={styles.list}>{canonical.map(item => {
          const entry = executionBridge?.entries.find(entry => entry.kind === "canonical" && entry.occurrence.id === item.id);
          if (!entry || entry.kind !== "canonical" || !item.planning) return null;
          return <li key={item.id}><h3>{item.title}</h3><p>{scheduleLabel(item.planning, zone)}</p>
            <p className={styles.caption}>{statusLabels[entry.occurrence.status]} · {flexibilityLabels[entry.occurrence.flexibility]} · Origem: {entry.occurrence.origin.kind === "event" ? "evento" : entry.occurrence.origin.kind} · {item.id}</p>
            {item.planning.kind === "timed" && <p className={styles.caption}>Fuso registrado: {item.planning.timeZone}</p>}
            <details><summary>Detalhes do planejamento</summary><p>Criado em {entry.occurrence.createdAt}</p><p>Planejamento original: {scheduleLabel(entry.occurrence.originalSchedule, zone)}</p><p>Reagendamentos registrados: {item.history.length}</p><p>{item.execution ? `Execução registrada em ${item.execution.recordedAt}` : "Sem execução registrada."}</p></details>
          </li>;
        })}</ul>
      </section>}
      {!!legacy.length && <section className={`panel ${styles.panel}`} aria-label="Registros legados candidatos">
        <h2>Registros legados</h2><p className={styles.caption}>Itens com planejamento confirmado intersectam esta data. Itens sem confirmação são candidatos por data de origem e podem pertencer ao dia anterior.</p>
        <ul className={styles.list}>{legacy.map(item => <li key={item.id}><strong>{item.title}</strong><p>{item.planning ? scheduleLabel(item.planning, zone) : "Planejamento temporal ainda não confirmado."}</p>{"sourceDate" in item.provenance && <Link href={`/planejamento/dia/${item.provenance.sourceDate}`}>Consultar dia de origem {item.provenance.sourceDate}</Link>}</li>)}</ul>
      </section>}
    </>}
    {base && <EventDialog date={date} timeZone={zone} base={base} onCreate={createEvent} onClose={close} />}
  </div>;
}
