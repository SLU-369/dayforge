"use client";

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
import { createDefaultState, type PlannerState } from "./planner-data";
import { decodePlannerState, downloadJsonBackup } from "./planner-repository";
import {
  IndexedDbPersistenceRepository,
  bootstrapPlannerV2,
  exportDayforgeBackupV2,
  recoverPlannerV2,
  resetPlannerV2,
  saveActivePlannerV2,
  type NormalizedLegacyPlannerV1,
  type ExecutionBridge,
} from "@/persistence";

type PlannerContextValue = {
  state: PlannerState;
  executionBridge: ExecutionBridge | null;
  completeOccurrence: (id: string, execution: ExecutionRecord) => Promise<void>;
  completingIds: readonly string[];
  setState: Dispatch<SetStateAction<PlannerState>>;
  exportBackup: () => Promise<boolean>;
  importBackup: (raw: string) => Promise<boolean>;
  resetData: () => Promise<boolean>;
  ready: boolean;
  storageBlocked: boolean;
  storageWarning: string;
  toast: string;
  notify: (message: string) => void;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);
const BLOCKED_MESSAGE = "Os dados locais foram preservados. Alterações desta sessão não serão salvas. Importe um backup válido ou restaure o padrão em Dados e backup.";
const MARKER_WARNING = "O marcador local não pôde ser reparado. Exporte um backup antes de limpar os dados do navegador.";
const browserStorage = {
  getItem(key: string) { return window.localStorage.getItem(key); },
  setItem(key: string, value: string) { window.localStorage.setItem(key, value); },
};

function toPlannerState(snapshot: NormalizedLegacyPlannerV1): PlannerState {
  const parsed: unknown = JSON.parse(JSON.stringify(snapshot));
  return decodePlannerState(parsed);
}

export function PlannerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [repository] = useState(() => new IndexedDbPersistenceRepository());
  const [snapshot, setSnapshot] = useState(() => ({ state: createDefaultState(), executionBridge: null as ExecutionBridge | null, revision: 0 }));
  const { state, executionBridge } = snapshot;
  const [completingIds, setCompletingIds] = useState<readonly string[]>([]);
  const [ready, setReady] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");
  const [toast, setToast] = useState("");
  const saveQueue = useRef(new PlannerWriteQueue());
  const writesBlocked = useRef(false);
  const bootPromise = useRef<ReturnType<typeof bootstrapPlannerV2> | null>(null);

  const notify = useCallback((message: string) => setToast(message), []);

  const setState: Dispatch<SetStateAction<PlannerState>> = useCallback((action) => {
    if (saveQueue.current.completingIds.length) { notify("Aguarde a conclusão em andamento."); return; }
    setSnapshot((current) => ({ ...current, state: typeof action === "function" ? action(current.state) : action }));
  }, [notify]);

  useEffect(() => {
    let cancelled = false;
    bootPromise.current ??= bootstrapPlannerV2({
      repository,
      legacyStorage: browserStorage,
      markerStorage: browserStorage,
      defaultState: createDefaultState(),
      instant: new Date().toISOString(),
    });
    bootPromise.current.then((result) => {
      if (cancelled) return;
      setSnapshot({ state: toPlannerState(result.state), executionBridge: result.executionBridge, revision: saveQueue.current.revision });
      if (!result.markerRepaired) setStorageWarning(MARKER_WARNING);
      setReady(true);
    }).catch(() => {
      if (cancelled) return;
      writesBlocked.current = true;
      setStorageBlocked(true);
      setStorageWarning(BLOCKED_MESSAGE);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [repository]);

  useEffect(() => {
    if (!ready || storageBlocked) return;
    void saveQueue.current.autosave(snapshot.revision, async () => {
      if (writesBlocked.current) return;
      try {
        const bridge = await saveActivePlannerV2({ repository, state });
        setSnapshot((current) => current.state === state && current.revision === snapshot.revision
          ? { ...current, executionBridge: bridge } : current);
      } catch (error) {
        writesBlocked.current = true;
        setStorageBlocked(true);
        setStorageWarning(BLOCKED_MESSAGE);
        throw error;
      }
    }).catch(() => undefined);
  }, [repository, state, snapshot.revision, ready, storageBlocked]);

  const completeOccurrence = useCallback((id: string, execution: ExecutionRecord) => {
    const request = saveQueue.current.complete(id, execution, async () => {
      if (writesBlocked.current) throw new Error("O armazenamento está bloqueado; recupere os dados antes de concluir.");
      try {
        await persistCompletion({ repository, occurrenceId: id, execution, publish: (persisted) => {
          const revision = ++saveQueue.current.revision;
          setSnapshot({ state: toPlannerState(persisted.state), executionBridge: persisted.executionBridge, revision });
        } });
        notify("Ocorrência concluída.");
      } catch (error) {
        if (error instanceof CompletionPersistenceError && error.blocked) {
          writesBlocked.current = true;
          setStorageBlocked(true);
          setStorageWarning(BLOCKED_MESSAGE);
        }
        throw error;
      }
    });
    setCompletingIds(saveQueue.current.completingIds);
    const finished = () => setCompletingIds(saveQueue.current.completingIds);
    void request.then(finished, finished);
    return request;
  }, [repository, notify]);

  const exportBackup = useCallback(async () => {
    try {
      return await saveQueue.current.enqueue(async () => {
        if (writesBlocked.current) throw new Error("Planner persistence is blocked");
        const backup = await exportDayforgeBackupV2({
          repository,
          exportedAt: new Date().toISOString(),
          active: true,
        });
        downloadJsonBackup(backup);
        return true;
      });
    } catch {
      notify("Não foi possível exportar o backup. Os dados locais foram preservados.");
      return false;
    }
  }, [repository, notify]);

  const importBackup = useCallback(async (raw: string) => {
    try {
      return await saveQueue.current.enqueue(async () => {
        const restored = await recoverPlannerV2({
          repository,
          markerStorage: browserStorage,
          input: raw,
          instant: new Date().toISOString(),
        });
        const revision = ++saveQueue.current.revision;
        setSnapshot({ state: toPlannerState(restored.state), executionBridge: restored.executionBridge, revision });
        writesBlocked.current = false;
        setStorageBlocked(false);
        setStorageWarning(restored.markerRepaired ? "" : MARKER_WARNING);
        return true;
      });
    } catch {
      notify("Esse arquivo não é um backup válido ou o armazenamento local não está disponível.");
      return false;
    }
  }, [repository, notify]);

  const resetData = useCallback(async () => {
    try {
      return await saveQueue.current.enqueue(async () => {
        const restored = await resetPlannerV2({
          repository,
          markerStorage: browserStorage,
          defaultState: createDefaultState(),
          instant: new Date().toISOString(),
        });
        const revision = ++saveQueue.current.revision;
        setSnapshot({ state: toPlannerState(restored.state), executionBridge: restored.executionBridge, revision });
        writesBlocked.current = false;
        setStorageBlocked(false);
        setStorageWarning(restored.markerRepaired ? "" : MARKER_WARNING);
        return true;
      });
    } catch {
      notify("Não foi possível restaurar os dados locais. O conteúdo anterior foi preservado.");
      return false;
    }
  }, [repository, notify]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(
    () => ({ state, executionBridge, setState, completeOccurrence, completingIds, exportBackup, importBackup, resetData, ready, storageBlocked, storageWarning, toast, notify }),
    [state, executionBridge, setState, completeOccurrence, completingIds, exportBackup, importBackup, resetData, ready, storageBlocked, storageWarning, toast, notify],
  );

  return (
    <PlannerContext.Provider value={value}>
      {storageWarning && <div role="alert" className="storage-warning">{storageWarning}</div>}
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("usePlanner must be used inside PlannerProvider");
  return context;
}
