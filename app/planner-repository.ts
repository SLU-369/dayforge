import { createDefaultState, type PlannerState } from "./planner-data";

export const PLANNER_STORAGE_KEY = "rotina-369:data:v1";

function isPlannerState(value: unknown): value is PlannerState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PlannerState>;
  return candidate.version === 1 && Boolean(candidate.routine) && Boolean(candidate.records);
}

export function readPlannerState(): PlannerState {
  const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
  if (!saved) return createDefaultState();

  const parsed: unknown = JSON.parse(saved);
  if (!isPlannerState(parsed)) throw new Error("Formato de dados inválido");

  return {
    ...parsed,
    monthlyGoals: parsed.monthlyGoals ?? {},
  };
}

export function writePlannerState(state: PlannerState) {
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
}

export function downloadPlannerBackup(state: PlannerState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  link.href = url;
  link.download = `dayforge-backup-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function parsePlannerBackup(file: File): Promise<PlannerState> {
  const parsed: unknown = JSON.parse(await file.text());
  if (!isPlannerState(parsed)) throw new Error("Formato de backup inválido");

  return {
    ...parsed,
    monthlyGoals: parsed.monthlyGoals ?? {},
  };
}
