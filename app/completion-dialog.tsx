"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import type { ExecutionRecord } from "../domain/temporal/index";
import { buildCompletionRecord, type CompletionInput } from "./completion-input";
import styles from "./today-context.module.css";

export function CompletionDialog({ occurrenceId, title, onComplete, onClose }: {
  occurrenceId: string; title: string;
  onComplete: (id: string, execution: ExecutionRecord) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const cached = useRef<{ key: string; record: ExecutionRecord } | null>(null);
  const [input, setInput] = useState<CompletionInput>(() => ({ start: "", end: "", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, note: "" }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const key = JSON.stringify(input);
      if (cached.current?.key !== key) cached.current = { key, record: buildCompletionRecord(occurrenceId, input, new Date().toISOString()) };
      await onComplete(occurrenceId, cached.current.record);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível confirmar a conclusão. Tente novamente.");
    } finally { submitting.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} className={`editor-modal ${styles.dialog}`} aria-labelledby="completion-title"
    onCancel={(event) => { event.preventDefault(); if (!submitting.current) onClose(); }}>
    <form onSubmit={submit}>
      <div className="modal-heading"><div><span className="eyebrow">CONCLUSÃO EXPLÍCITA</span><h2 id="completion-title">Concluir {title}</h2></div></div>
      <p className={styles.caption}>Informe o intervalo realmente realizado. Confira o fuso; os horários planejados não serão usados como execução.</p>
      <label className="full-field"><span>Início real</span><input type="datetime-local" required step="60" disabled={busy} value={input.start} onChange={(event) => setInput({ ...input, start: event.target.value })} /></label>
      <label className="full-field"><span>Fim real</span><input type="datetime-local" required step="60" disabled={busy} value={input.end} onChange={(event) => setInput({ ...input, end: event.target.value })} /></label>
      <label className="full-field"><span>Fuso IANA da execução</span><input required disabled={busy} value={input.timeZone} onChange={(event) => setInput({ ...input, timeZone: event.target.value })} /></label>
      <label className="full-field"><span>Observação da execução (opcional)</span><textarea disabled={busy} value={input.note} onChange={(event) => setInput({ ...input, note: event.target.value })} /></label>
      <p className={styles.caption}>Ao confirmar, você registra estes horários e este fuso. Esta etapa não permite desfazer a conclusão.</p>
      {error && <p role="alert" className={styles.caption}>{error}</p>}
      <div className="modal-actions"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" loading={busy}>Confirmar conclusão</Button></div>
    </form>
  </dialog>;
}
