"use client";

import { legacyPlanner } from "../persistence/contracts/planning-envelope.ts";


import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { ExecutionRecord } from "../domain/temporal/index";
import { PlannerWriteQueue } from "./planner-write-queue";
import { CompletionPersistenceError, persistCompletion } from "./completion-command";
import { persistRescheduling } from "./rescheduling-command";
import type { ReschedulingIntent } from "../persistence/execution/rescheduling";
import { readPlannerAuthoritySnapshot } from "../persistence/backup/export-backup-v2";
import { createDefaultState, type PlannerState } from "./planner-data";
import { decodePlannerState, downloadJsonBackup } from "./planner-repository";
import {
  IndexedDbPersistenceRepository,
  bootstrapPlannerV2,
  exportDayforgeBackup,
  recoverPlannerV2,
  resetPlannerV2,
  saveActivePlannerV2,
  type NormalizedLegacyPlannerV1,
  type ExecutionBridge,
} from "@/persistence";

import { PlanningConflictError, capturePlanningFence } from "../persistence/contracts/dataset-revision";
import { PlannerDraftSession, type PlannerSnapshot } from "./planner-draft-session";
import { Button } from "../components/ui/button";
import conflictStyles from "./planning-conflict.module.css";
type CompletionFence = { expectedAuthorityEpoch: number; expectedDatasetRevision: number; expectedRevision: string };
type PlannerContextValue = {
  state: PlannerState; executionBridge: ExecutionBridge | null; authorityEpoch: number; datasetRevision: number;
  completeOccurrence: (id: string, execution: ExecutionRecord, fence: CompletionFence) => Promise<void>;
  rescheduleOccurrence: (intent: ReschedulingIntent) => Promise<void>; completingIds: readonly string[];
  setState: Dispatch<SetStateAction<PlannerState>>; beginEditing: () => boolean; endEditing: () => void;
  exportBackup: () => Promise<boolean>; importBackup: (raw: string) => Promise<boolean>; resetData: () => Promise<boolean>;
  ready: boolean; storageBlocked: boolean; storageWarning: string; toast: string; notify: (message: string) => void;
};
const PlannerContext = createContext<PlannerContextValue | null>(null);
const BLOCKED_MESSAGE = "Os dados locais foram preservados. Alterações desta sessão não serão salvas. Importe um backup válido ou restaure o padrão em Dados e backup.";
const MARKER_WARNING = "O marcador local não pôde ser reparado. Exporte um backup antes de limpar os dados do navegador.";
const browserStorage = {
  getItem(key: string) { return window.localStorage.getItem(key); },
  setItem(key: string, value: string) { window.localStorage.setItem(key, value); },
};
function toPlannerState(snapshot: NormalizedLegacyPlannerV1): PlannerState { return decodePlannerState(JSON.parse(JSON.stringify(snapshot))); }
function fromAuthority(current: Awaited<ReturnType<typeof readPlannerAuthoritySnapshot>>): PlannerSnapshot {
  return { state: toPlannerState(legacyPlanner(current.backup.payload.planner)), executionBridge: current.backup.payload.executionBridge!.bridge,
    authorityEpoch: current.authorityEpoch, datasetRevision: current.datasetRevision };
}
export function PlannerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [repository] = useState(() => new IndexedDbPersistenceRepository());
  const [session] = useState(() => new PlannerDraftSession({ state: createDefaultState(), executionBridge: null, authorityEpoch: 0, datasetRevision: 0 }));
  const [renderRevision, render] = useState(0);
  const update = useCallback(() => render((value) => value + 1), []);
  const [completingIds, setCompletingIds] = useState<readonly string[]>([]);
  const [ready, setReady] = useState(false), [storageBlocked, setStorageBlocked] = useState(false);
  const [storageWarning, setStorageWarning] = useState(""), [saveError, setSaveError] = useState(""), [toast, setToast] = useState("");
  const saveQueue = useRef(new PlannerWriteQueue()), writesBlocked = useRef(false);
  const bootPromise = useRef<ReturnType<typeof bootstrapPlannerV2> | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const replacing = useRef(false);
  const notify = useCallback((message: string) => setToast(message), []);
  const read = useCallback(async () => fromAuthority(await readPlannerAuthoritySnapshot({ repository, exportedAt: new Date().toISOString(), active: true })), [repository]);
  const block = useCallback(() => { writesBlocked.current = true; setStorageBlocked(true); setStorageWarning(BLOCKED_MESSAGE); }, []);
  const signal = useCallback(() => { channel.current?.postMessage("invalidate"); }, []);
  const setState: Dispatch<SetStateAction<PlannerState>> = useCallback((action) => {
    if (saveQueue.current.completingIds.length || replacing.current) { notify("Aguarde a operação em andamento."); return; }
    session.edit(action); update();
  }, [session, update, notify]);
  const beginEditing = useCallback(() => {
    if (replacing.current || saveQueue.current.completingIds.length) { notify("Aguarde a operação em andamento."); return false; }
    session.beginEditing(); update(); return true;
  }, [session, update, notify]);
  const endEditing = useCallback(() => { session.endEditing(); update(); }, [session, update]);

  useEffect(() => {
    let cancelled = false;
    bootPromise.current ??= bootstrapPlannerV2({ repository, legacyStorage: browserStorage, markerStorage: browserStorage,
      defaultState: createDefaultState(), instant: new Date().toISOString() });
    bootPromise.current.then(async (result) => {
      const current = await read(); if (cancelled) return;
      session.load(current); update(); if (!result.markerRepaired) setStorageWarning(MARKER_WARNING); setReady(true);
    }).catch(async (error: unknown) => {
      if (cancelled) return;
      if (error instanceof PlanningConflictError) {
        try { const current = await read(); if (cancelled) return; session.load(current); session.conflict(current); update(); }
        catch { block(); }
      } else block();
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [repository, read, session, update, block]);

  useEffect(() => {
    if (!ready || storageBlocked || !session.dirty || session.paused) return;
    const draft = session.state;
    void saveQueue.current.enqueue(async () => {
      if (writesBlocked.current || session.paused || !session.dirty || session.state !== draft) return;
      const fence = session.fence;
      try {
        await saveActivePlannerV2({ repository, state: draft, ...fence });
        const persisted = await read();
        if (session.saved(draft, fence, persisted)) { setSaveError(""); notify("Alterações salvas."); signal(); }
        update();
      } catch (error) {
        try {
          const latest = await read();
          if (error instanceof PlanningConflictError || latest.authorityEpoch !== fence.expectedAuthorityEpoch || latest.datasetRevision !== fence.expectedDatasetRevision) {
            session.conflict(latest); setSaveError("");
          } else {
            session.pause(); setSaveError("Não foi possível salvar. Seu rascunho permanece nesta sessão. Confira o espaço disponível e tente novamente.");
          }
          update();
        } catch { block(); }
      }
    }).catch(() => undefined);
  }, [renderRevision, ready, storageBlocked, session, repository, read, notify, signal, update, block]);

  useEffect(() => {
    if (!ready || storageBlocked) return;
    let cancelled = false;
    const refresh = () => { void saveQueue.current.enqueue(async () => {
      if (cancelled || writesBlocked.current) return;
      try {
        const latest = await read();
        if (latest.authorityEpoch !== session.persisted.authorityEpoch || latest.datasetRevision !== session.persisted.datasetRevision) {
          session.observe(latest); update();
        }
      } catch { if (!cancelled) block(); }
    }); };
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel("dayforge:planning-invalidation:v1"); channel.current.onmessage = refresh;
    }
    const interval = window.setInterval(refresh, 2000);
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { cancelled = true; window.clearInterval(interval); window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh); channel.current?.close(); channel.current = null; };
  }, [ready, storageBlocked, read, session, update, block]);

  const publish = useCallback((persisted: { state: NormalizedLegacyPlannerV1; executionBridge: ExecutionBridge; authorityEpoch: number; datasetRevision: number }) => {
    const next = { ...persisted, state: toPlannerState(persisted.state) };
    ++saveQueue.current.revision;
    session.observe(next); update();
  }, [session, update]);
  const command = useCallback((id: string, intent: unknown, work: () => Promise<void>) => {
    const request = saveQueue.current.command(id, intent, async () => {
      if (writesBlocked.current) throw new Error("O armazenamento está bloqueado; recupere os dados antes de continuar.");
      if (session.dirty || session.remote) throw new PlanningConflictError();
      try { await work(); signal(); } catch (error) {
        if (error instanceof CompletionPersistenceError && error.blocked) block();
        throw error;
      }
    });
    setCompletingIds(saveQueue.current.completingIds);
    const finished = () => setCompletingIds(saveQueue.current.completingIds); void request.then(finished, finished);
    return request;
  }, [session, signal, block]);
  const completeOccurrence = useCallback((id: string, execution: ExecutionRecord, fence: CompletionFence) => command(id, { kind: "completion", execution, ...fence }, async () => {
    await persistCompletion({ repository, occurrenceId: id, execution, ...fence, publish }); notify("Ocorrência concluída.");
  }), [command, repository, publish, notify]);
  const rescheduleOccurrence = useCallback((intent: ReschedulingIntent) => command(intent.occurrenceId, { kind: "rescheduling", intent }, async () => {
    await persistRescheduling({ ...intent, repository, publish }); notify("Ocorrência reagendada. A execução será registrada separadamente.");
  }), [command, repository, publish, notify]);

  const exportBackup = useCallback(async () => {
    try { return await saveQueue.current.enqueue(async () => {
      if (writesBlocked.current) throw new Error("Planner persistence is blocked");
      downloadJsonBackup(await exportDayforgeBackup({ repository, exportedAt: new Date().toISOString(), active: true }));
      if (session.dirty || session.remote) notify("Backup exportado com os dados salvos. O rascunho local não faz parte deste backup.");
      return true;
    }); } catch { notify("Não foi possível exportar o backup. Os dados locais foram preservados."); return false; }
  }, [repository, session, notify]);
  const replace = useCallback(async (raw?: string) => {
    try {
      // Explicit structural recovery has no usable logical UI base; fence the destination metadata.
      const fence = writesBlocked.current ? await capturePlanningFence(repository) : session.fence;
      return await saveQueue.current.enqueue(async () => {
      replacing.current = true;
      try {
      const restored = raw === undefined
        ? await resetPlannerV2({ repository, markerStorage: browserStorage, defaultState: createDefaultState(), instant: new Date().toISOString(), ...fence })
        : await recoverPlannerV2({ repository, markerStorage: browserStorage, input: raw, instant: new Date().toISOString(), ...fence });
      session.load(await read()); ++saveQueue.current.revision; update();
      writesBlocked.current = false; setStorageBlocked(false); setSaveError(""); setStorageWarning(restored.markerRepaired ? "" : MARKER_WARNING); signal(); return true;
      } finally { replacing.current = false; }
    }); } catch (error) {
      if (error instanceof PlanningConflictError) { try { session.conflict(await read()); update(); } catch { block(); } }
      else notify(raw === undefined ? "Não foi possível restaurar os dados locais. O conteúdo anterior foi preservado." : "Esse arquivo não é um backup válido ou o armazenamento local não está disponível.");
      return false;
    }
  }, [session, repository, read, update, signal, notify, block]);
  const importBackup = useCallback((raw: string) => replace(raw), [replace]);
  const resetData = useCallback(() => replace(), [replace]);
  const loadSaved = useCallback(async () => {
    if (session.openEditors || saveQueue.current.completingIds.length) return;
    if (!window.confirm("Carregar a versão salva? O rascunho desta sessão será descartado. Baixe o rascunho antes se quiser reaplicar suas alterações.")) return;
    await saveQueue.current.enqueue(async () => { try { session.load(await read()); setSaveError(""); update(); } catch { block(); } });
  }, [session, read, update, block]);
  const downloadDraft = useCallback(() => downloadJsonBackup({ format: "dayforge-planning-draft", formatVersion: 1,
    state: session.state, executionBridge: session.persisted.executionBridge, base: session.fence }), [session]);
  const retry = useCallback(() => { session.retry(); setSaveError(""); update(); }, [session, update]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 3200); return () => window.clearTimeout(timer); }, [toast]);
  const value = useMemo(() => {
    void renderRevision;
    return { state: session.state, executionBridge: session.persisted.executionBridge, authorityEpoch: session.persisted.authorityEpoch,
      datasetRevision: session.persisted.datasetRevision, setState, beginEditing, endEditing, completeOccurrence, rescheduleOccurrence,
      completingIds, exportBackup, importBackup, resetData, ready, storageBlocked, storageWarning, toast, notify };
  }, [renderRevision, session, setState, beginEditing, endEditing, completeOccurrence, rescheduleOccurrence, completingIds, exportBackup, importBackup, resetData, ready, storageBlocked, storageWarning, toast, notify]);
  return <PlannerContext.Provider value={value}>
    {storageWarning && <div role="alert" className="storage-warning">{storageWarning}</div>}
    {(session.remote || saveError) && <section role="alert" aria-label="Alterações locais preservadas" className={conflictStyles.notice}>
      <p>{session.remote ? "O planejamento mudou em outra sessão. Suas alterações locais foram preservadas e não serão salvas sobre a versão atual. Feche o editor, baixe seu rascunho e carregue a versão salva para revisar e reaplicar as alterações." : saveError}</p>
      <div className={conflictStyles.actions}><Button variant="secondary" onClick={downloadDraft} disabled={session.openEditors > 0}>Baixar rascunho local</Button>
        {session.remote ? <Button onClick={() => void loadSaved()} disabled={session.openEditors > 0 || completingIds.length > 0}>Carregar versão salva</Button>
          : <Button onClick={retry}>Tentar salvar novamente</Button>}</div>
    </section>}
    {children}
  </PlannerContext.Provider>;
}
export function usePlanner() { const context = useContext(PlannerContext); if (!context) throw new Error("usePlanner must be used inside PlannerProvider"); return context; }
