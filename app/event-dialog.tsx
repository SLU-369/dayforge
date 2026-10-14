"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import type { Flexibility } from "../domain/temporal/index";
import type { EventCreationIntent } from "../persistence/execution/event-creation";
import { buildEventSchedule, type EventInput } from "./event-input";
import { downloadJsonBackup } from "./planner-repository";
import styles from "./agenda.module.css";

export function EventDialog({ date, timeZone, base, onCreate, onClose }: {
  date: string; timeZone: string; base: Pick<EventCreationIntent, "expectedAuthorityEpoch" | "expectedDatasetRevision" | "expectedSequence" | "creationIntentId">;
  onCreate: (intent: EventCreationIntent) => Promise<void>; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), submitting = useRef(false);
  const cached = useRef<{ key: string; intent: EventCreationIntent } | null>(null);
  const [title, setTitle] = useState(""), [flexibility, setFlexibility] = useState<Flexibility | "">("");
  const [input, setInput] = useState<EventInput>({ kind: "timed", start: "", end: "", timeZone });
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => { const element = dialog.current!; element.showModal(); return () => element.close(); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      if (!flexibility) throw new Error("Escolha a flexibilidade deste evento.");
      const key = JSON.stringify({ title, flexibility, input });
      if (cached.current?.key !== key) cached.current = { key, intent: { ...base, title, flexibility,
        schedule: buildEventSchedule(input), createdAt: new Date().toISOString() } };
      await onCreate(cached.current.intent); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar o evento."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} className="editor-modal" aria-labelledby="event-title" onCancel={event => { event.preventDefault(); if (!submitting.current) onClose(); }}>
    <form onSubmit={submit}>
      <div className="modal-heading"><h2 id="event-title">Novo evento</h2></div>
      <p className={styles.caption}>Confirme o planejamento deste compromisso com horário. Data selecionada: {date}.</p>
      <label className="full-field"><span>Título do evento</span><input required disabled={busy} value={title} onChange={event => setTitle(event.target.value)} /></label>
      <label className="full-field"><span>Início planejado</span><input required type="datetime-local" step="60" disabled={busy} value={input.start} onChange={event => setInput({ ...input, start: event.target.value })} /></label>
      <label className="full-field"><span>Fim planejado</span><input required type="datetime-local" step="60" disabled={busy} value={input.end} onChange={event => setInput({ ...input, end: event.target.value })} /></label>
      <label className="full-field"><span>Fuso IANA do evento</span><input required disabled={busy} value={input.timeZone} onChange={event => setInput({ ...input, timeZone: event.target.value })} /></label>
      <label className="full-field"><span>Flexibilidade</span><select aria-label="Flexibilidade" required disabled={busy} value={flexibility} onChange={event => setFlexibility(event.target.value as Flexibility)}>
        <option value="" disabled>Escolha a flexibilidade</option><option value="fixed">Fixo</option><option value="preferred">Preferencial</option><option value="flexible">Flexível</option>
      </select></label>
      <p className={styles.caption}>Ao atravessar a meia-noite, informe a data final. Horários ambíguos ou inexistentes exigem entradas inequívocas.</p>
      {error && <><p role="alert">{error}</p><p className={styles.caption}>Baixe os campos antes de fechar para revisar e reaplicar após carregar os dados salvos. Este rascunho não é um backup de recuperação.</p>
        <Button variant="secondary" disabled={busy} onClick={() => downloadJsonBackup({ format: "dayforge-event-draft", formatVersion: 1,
          fields: { title, flexibility, planning: input }, base }, "dayforge-event-draft.json")}>Baixar rascunho do evento</Button></>}
      <div className="modal-actions"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" loading={busy}>Criar evento</Button></div>
    </form>
  </dialog>;
}
