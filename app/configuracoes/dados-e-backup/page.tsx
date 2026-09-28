"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Download, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanner } from "@/app/planner-context";
import styles from "./page.module.css";

export default function DataBackupPage() {
  const { exportBackup, importBackup: restoreBackup, resetData: restoreDefault, ready, storageBlocked, notify } = usePlanner();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function downloadBackup() {
    if (await exportBackup()) notify("Backup exportado.");
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      if (await restoreBackup(await file.text())) notify("Backup importado com sucesso.");
    } catch {
      notify("Esse arquivo não é um backup válido do Dayforge.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  async function resetData() {
    const confirmed = window.confirm(
      "Substituir a rotina e o histórico ativos pelo padrão? Exporte um backup antes se quiser guardar os dados atuais. A cópia legada v1 será preservada.",
    );
    if (!confirmed) return;
    if (await restoreDefault()) notify("Dados restaurados.");
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <span className="eyebrow">Configurações</span>
        <h1>Dados e backup</h1>
        <p>Seus registros continuam salvos somente neste navegador.</p>
      </header>

      <section className={styles.statusCard}>
        <span className={styles.statusIcon}><ShieldCheck size={22} aria-hidden="true" /></span>
        <div><strong>{storageBlocked ? "Dados locais protegidos" : "Armazenamento local ativo"}</strong><p>{storageBlocked ? "A persistência v2 não pôde ser validada. Importe um backup válido ou restaure o padrão para tentar recuperar o armazenamento." : "Exporte uma cópia antes de limpar os dados do navegador ou trocar de computador."}</p></div>
      </section>

      <div className={styles.actionGrid}>
        <section className={styles.actionCard}>
          <Download size={22} aria-hidden="true" />
          <div><h2>Exportar backup</h2><p>Baixe uma cópia completa da rotina e do histórico em JSON.</p></div>
          <Button variant="secondary" onClick={downloadBackup} disabled={!ready || storageBlocked}>Exportar arquivo</Button>
        </section>

        <section className={styles.actionCard}>
          <Upload size={22} aria-hidden="true" />
          <div><h2>Importar backup</h2><p>Restaure um backup v2 ou importe um arquivo legado v1 compatível.</p></div>
          <Button variant="secondary" loading={importing} onClick={() => inputRef.current?.click()} disabled={!ready}>Selecionar arquivo</Button>
          <input ref={inputRef} hidden type="file" accept="application/json" onChange={importBackup} />
        </section>
      </div>

      <section className={styles.dangerCard}>
        <div><RotateCcw size={21} aria-hidden="true" /><span><h2>Restaurar padrão</h2><p>Substitui o histórico ativo e recupera a rotina inicial do Dayforge.</p></span></div>
        <Button variant="danger" onClick={resetData} disabled={!ready}>Restaurar dados</Button>
      </section>
    </div>
  );
}
