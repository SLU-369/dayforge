"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Download, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanner } from "@/app/planner-context";
import { createDefaultState } from "@/app/planner-data";
import { downloadPlannerBackup, parsePlannerBackup } from "@/app/planner-repository";
import styles from "./page.module.css";

export default function DataBackupPage() {
  const { state, recoverState, ready, storageBlocked, notify } = usePlanner();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  function exportBackup() {
    downloadPlannerBackup(state);
    notify("Backup exportado.");
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      if (recoverState(await parsePlannerBackup(file))) notify("Backup importado com sucesso.");
    } catch {
      notify("Esse arquivo não é um backup válido do Dayforge.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  function resetData() {
    const confirmed = window.confirm(
      "Restaurar a rotina padrão e apagar todo o histórico local? Exporte um backup antes se quiser guardar os dados.",
    );
    if (!confirmed) return;
    if (recoverState(createDefaultState())) notify("Dados restaurados.");
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
        <div><strong>{storageBlocked ? "Dados locais protegidos" : "Armazenamento local ativo"}</strong><p>{storageBlocked ? "O conteúdo salvo não pôde ser lido e permanece intacto. Importe um backup válido ou restaure o padrão para voltar a salvar." : "Exporte uma cópia antes de limpar os dados do navegador ou trocar de computador."}</p></div>
      </section>

      <div className={styles.actionGrid}>
        <section className={styles.actionCard}>
          <Download size={22} aria-hidden="true" />
          <div><h2>Exportar backup</h2><p>Baixe uma cópia completa da rotina e do histórico em JSON.</p></div>
          <Button variant="secondary" onClick={exportBackup} disabled={!ready}>Exportar arquivo</Button>
        </section>

        <section className={styles.actionCard}>
          <Upload size={22} aria-hidden="true" />
          <div><h2>Importar backup</h2><p>Restaure um arquivo compatível sem alterar o formato dos seus dados.</p></div>
          <Button variant="secondary" loading={importing} onClick={() => inputRef.current?.click()} disabled={!ready}>Selecionar arquivo</Button>
          <input ref={inputRef} hidden type="file" accept="application/json" onChange={importBackup} />
        </section>
      </div>

      <section className={styles.dangerCard}>
        <div><RotateCcw size={21} aria-hidden="true" /><span><h2>Restaurar padrão</h2><p>Remove o histórico local e recupera a rotina inicial do Dayforge.</p></span></div>
        <Button variant="danger" onClick={resetData} disabled={!ready}>Restaurar dados</Button>
      </section>
    </div>
  );
}
