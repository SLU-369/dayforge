"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createDefaultState, type PlannerState } from "./planner-data";
import {
  readPlannerState,
  replacePlannerState,
  writePlannerState,
  type PlannerStorageStatus,
} from "./planner-repository";

type PlannerContextValue = {
  state: PlannerState;
  setState: Dispatch<SetStateAction<PlannerState>>;
  recoverState: (state: PlannerState) => boolean;
  ready: boolean;
  storageBlocked: boolean;
  toast: string;
  notify: (message: string) => void;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<PlannerState>(() => createDefaultState());
  const [ready, setReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState<PlannerStorageStatus>("ready");
  const [toast, setToast] = useState("");

  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const result = readPlannerState();
        setState(result.state);
        setStorageStatus(result.storageStatus);
        if (result.storageStatus === "blocked") {
          notify("Os dados originais foram preservados. Alterações desta sessão não serão salvas.");
        }
      } catch {
        setStorageStatus("blocked");
        notify("O navegador bloqueou o acesso aos dados. Alterações desta sessão não serão salvas.");
      }
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [notify]);

  useEffect(() => {
    if (!ready || storageStatus === "blocked") return;
    try {
      writePlannerState(state, storageStatus);
    } catch {
      const timer = window.setTimeout(() => notify("O navegador não conseguiu salvar esta alteração."), 0);
      return () => window.clearTimeout(timer);
    }
  }, [state, ready, storageStatus, notify]);

  const recoverState = useCallback((nextState: PlannerState) => {
    try {
      replacePlannerState(nextState);
      setState(nextState);
      setStorageStatus("ready");
      return true;
    } catch {
      notify("O navegador não conseguiu substituir os dados locais.");
      return false;
    }
  }, [notify]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(
    () => ({ state, setState, recoverState, ready, storageBlocked: storageStatus === "blocked", toast, notify }),
    [state, recoverState, ready, storageStatus, toast, notify],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("usePlanner must be used inside PlannerProvider");
  return context;
}
