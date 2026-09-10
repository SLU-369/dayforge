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
import { readPlannerState, writePlannerState } from "./planner-repository";

type PlannerContextValue = {
  state: PlannerState;
  setState: Dispatch<SetStateAction<PlannerState>>;
  ready: boolean;
  toast: string;
  notify: (message: string) => void;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<PlannerState>(() => createDefaultState());
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setState(readPlannerState());
      } catch {
        notify("Não foi possível ler os dados salvos. A rotina padrão foi carregada.");
      }
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [notify]);

  useEffect(() => {
    if (!ready) return;
    try {
      writePlannerState(state);
    } catch {
      const timer = window.setTimeout(() => notify("O navegador não conseguiu salvar esta alteração."), 0);
      return () => window.clearTimeout(timer);
    }
  }, [state, ready, notify]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(
    () => ({ state, setState, ready, toast, notify }),
    [state, ready, toast, notify],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("usePlanner must be used inside PlannerProvider");
  return context;
}
