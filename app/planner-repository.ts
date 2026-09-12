import {
  CATEGORIES,
  DAY_ORDER,
  createDefaultState,
  type DailyItem,
  type DailyRecord,
  type PlannerState,
  type RoutineItem,
} from "./planner-data";

export const PLANNER_STORAGE_KEY = "rotina-369:data:v1";
export type PlannerStorageStatus = "ready" | "blocked";
export type PlannerReadResult = { state: PlannerState; storageStatus: PlannerStorageStatus };

type PlannerStateV1Payload = Omit<PlannerState, "monthlyGoals"> & {
  monthlyGoals?: PlannerState["monthlyGoals"] | null;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRoutineItem(value: unknown): value is RoutineItem {
  if (!isObjectRecord(value)) return false;
  return typeof value.id === "string"
    && typeof value.start === "string"
    && typeof value.end === "string"
    && typeof value.title === "string"
    && typeof value.notes === "string"
    && typeof value.category === "string"
    && Object.hasOwn(CATEGORIES, value.category);
}

function isDailyItem(value: unknown): value is DailyItem {
  if (!isObjectRecord(value)) return false;
  return typeof value.completed === "boolean"
    && (value.actualMinutes === undefined || typeof value.actualMinutes === "number")
    && isRoutineItem(value);
}

function isDailyRecord(value: unknown): value is DailyRecord {
  if (!isObjectRecord(value)) return false;
  return typeof value.date === "string"
    && Array.isArray(value.items)
    && value.items.every(isDailyItem)
    && typeof value.note === "string"
    && typeof value.energy === "number"
    && [1, 2, 3, 4, 5].includes(value.energy);
}

function isRoutine(value: unknown): value is PlannerState["routine"] {
  if (!isObjectRecord(value)) return false;
  return DAY_ORDER.every((day) => Array.isArray(value[day]) && value[day].every(isRoutineItem));
}

function isRecords(value: unknown): value is PlannerState["records"] {
  return isObjectRecord(value) && Object.values(value).every(isDailyRecord);
}

function isMonthlyGoals(value: unknown): value is PlannerState["monthlyGoals"] {
  return isObjectRecord(value) && Object.values(value).every((goal) => typeof goal === "string");
}

function isPlannerStateV1(value: unknown): value is PlannerStateV1Payload {
  if (!isObjectRecord(value)) return false;
  return value.version === 1
    && isRoutine(value.routine)
    && isRecords(value.records)
    && (value.monthlyGoals == null || isMonthlyGoals(value.monthlyGoals));
}

function normalizePlannerState(payload: PlannerStateV1Payload): PlannerState {
  return { ...payload, monthlyGoals: payload.monthlyGoals ?? {} };
}

export function readPlannerState(): PlannerReadResult {
  try {
    const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (saved === null) return { state: createDefaultState(), storageStatus: "ready" };

    const parsed: unknown = JSON.parse(saved);
    if (!isPlannerStateV1(parsed)) throw new Error("Formato de dados inválido");

    return {
      state: normalizePlannerState(parsed),
      storageStatus: "ready",
    };
  } catch {
    return { state: createDefaultState(), storageStatus: "blocked" };
  }
}

export function writePlannerState(state: PlannerState, storageStatus: PlannerStorageStatus) {
  if (storageStatus === "blocked") return false;
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
  return true;
}

export function replacePlannerState(state: PlannerState) {
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
  if (!isPlannerStateV1(parsed)) throw new Error("Formato de backup inválido");
  return normalizePlannerState(parsed);
}
