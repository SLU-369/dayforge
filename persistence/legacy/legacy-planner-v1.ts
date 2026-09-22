import type { JsonObject, JsonValue } from "../contracts/index.ts";

export const LEGACY_PLANNER_STORAGE_KEY = "rotina-369:data:v1" as const;
export const LEGACY_DAY_KEYS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const;
export const LEGACY_CATEGORY_KEYS = [
  "trabalho",
  "foco",
  "estudo",
  "saude",
  "pessoal",
  "sono",
] as const;

export type LegacyDayKey = (typeof LEGACY_DAY_KEYS)[number];
export type LegacyCategoryKey = (typeof LEGACY_CATEGORY_KEYS)[number];

export type LegacyRoutineItemV1 = Readonly<{
  id: string;
  start: string;
  end: string;
  title: string;
  notes: string;
  category: LegacyCategoryKey;
}>;

export type LegacyDailyItemV1 = LegacyRoutineItemV1 & Readonly<{
  completed: boolean;
  actualMinutes?: number;
}>;

export type LegacyDailyRecordV1 = Readonly<{
  date: string;
  items: readonly LegacyDailyItemV1[];
  note: string;
  energy: 1 | 2 | 3 | 4 | 5;
}>;

export type LegacyPlannerSnapshotV1 = Readonly<{
  version: 1;
  routine: Readonly<Record<LegacyDayKey, readonly LegacyRoutineItemV1[]>>;
  records: Readonly<Record<string, LegacyDailyRecordV1>>;
  monthlyGoals?: Readonly<Record<string, string>> | null;
}>;

export type NormalizedLegacyPlannerV1 = Readonly<{
  version: 1;
  routine: Readonly<Record<LegacyDayKey, readonly LegacyRoutineItemV1[]>>;
  records: Readonly<Record<string, LegacyDailyRecordV1>>;
  monthlyGoals: Readonly<Record<string, string>>;
}>;

export type LegacyPlannerValidationErrorCode = "invalid_legacy_json" | "invalid_legacy_payload";

export class LegacyPlannerValidationError extends Error {
  readonly code: LegacyPlannerValidationErrorCode;

  constructor(code: LegacyPlannerValidationErrorCode, message: string) {
    super(message);
    this.name = "LegacyPlannerValidationError";
    this.code = code;
  }
}

const ROUTINE_ITEM_FIELDS = ["id", "start", "end", "title", "notes", "category"] as const;
const DAILY_RECORD_FIELDS = ["date", "items", "note", "energy"] as const;
const SNAPSHOT_REQUIRED_FIELDS = ["version", "routine", "records"] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyFields(value: Record<string, unknown>, fields: readonly string[]) {
  return Reflect.ownKeys(value).every(
    (key) => typeof key === "string" && fields.includes(key),
  );
}

function hasAllFields(value: Record<string, unknown>, fields: readonly string[]) {
  return fields.every((field) => Object.hasOwn(value, field));
}

function isLegacyCategory(value: unknown): value is LegacyCategoryKey {
  return LEGACY_CATEGORY_KEYS.some((category) => category === value);
}

function decodeRoutineItem(value: unknown): LegacyRoutineItemV1 {
  if (!isPlainObject(value)
    || !hasAllFields(value, ROUTINE_ITEM_FIELDS)
    || !hasOnlyFields(value, ROUTINE_ITEM_FIELDS)
    || typeof value.id !== "string"
    || typeof value.start !== "string"
    || typeof value.end !== "string"
    || typeof value.title !== "string"
    || typeof value.notes !== "string"
    || !isLegacyCategory(value.category)) {
    throw invalidPayload();
  }

  return {
    id: value.id,
    start: value.start,
    end: value.end,
    title: value.title,
    notes: value.notes,
    category: value.category,
  };
}

function decodeDailyItem(value: unknown): LegacyDailyItemV1 {
  const allowedFields = [...ROUTINE_ITEM_FIELDS, "completed", "actualMinutes"];
  if (!isPlainObject(value)
    || !hasAllFields(value, [...ROUTINE_ITEM_FIELDS, "completed"])
    || !hasOnlyFields(value, allowedFields)
    || typeof value.completed !== "boolean"
    || (Object.hasOwn(value, "actualMinutes")
      && (typeof value.actualMinutes !== "number" || !Number.isFinite(value.actualMinutes)))) {
    throw invalidPayload();
  }

  const routineItem = decodeRoutineItem(Object.fromEntries(
    ROUTINE_ITEM_FIELDS.map((field) => [field, value[field]]),
  ));
  return Object.hasOwn(value, "actualMinutes")
    ? { ...routineItem, completed: value.completed, actualMinutes: value.actualMinutes as number }
    : { ...routineItem, completed: value.completed };
}

function decodeRoutine(value: unknown): Record<LegacyDayKey, readonly LegacyRoutineItemV1[]> {
  if (!isPlainObject(value)
    || !hasAllFields(value, LEGACY_DAY_KEYS)
    || !hasOnlyFields(value, LEGACY_DAY_KEYS)) {
    throw invalidPayload();
  }

  const decodeDay = (day: LegacyDayKey) => {
    const items = value[day];
    if (!Array.isArray(items)) throw invalidPayload();
    return items.map(decodeRoutineItem);
  };
  return {
    seg: decodeDay("seg"),
    ter: decodeDay("ter"),
    qua: decodeDay("qua"),
    qui: decodeDay("qui"),
    sex: decodeDay("sex"),
    sab: decodeDay("sab"),
    dom: decodeDay("dom"),
  };
}

function decodeDailyRecord(value: unknown): LegacyDailyRecordV1 {
  if (!isPlainObject(value)
    || !hasAllFields(value, DAILY_RECORD_FIELDS)
    || !hasOnlyFields(value, DAILY_RECORD_FIELDS)
    || typeof value.date !== "string"
    || !Array.isArray(value.items)
    || typeof value.note !== "string"
    || ![1, 2, 3, 4, 5].includes(value.energy as number)) {
    throw invalidPayload();
  }

  return {
    date: value.date,
    items: value.items.map(decodeDailyItem),
    note: value.note,
    energy: value.energy as LegacyDailyRecordV1["energy"],
  };
}

function decodeRecords(value: unknown): Record<string, LegacyDailyRecordV1> {
  if (!isPlainObject(value)) throw invalidPayload();
  return Object.fromEntries(Object.entries(value).map(([key, record]) => {
    const decoded = decodeDailyRecord(record);
    return [key, decoded];
  }));
}

function decodeMonthlyGoals(value: unknown): Record<string, string> | null {
  if (value === null) return null;
  if (!isPlainObject(value) || !Object.values(value).every((goal) => typeof goal === "string")) {
    throw invalidPayload();
  }
  return Object.fromEntries(Object.entries(value).map(([key, goal]) => [key, goal as string]));
}

function invalidPayload() {
  return new LegacyPlannerValidationError(
    "invalid_legacy_payload",
    "Os dados locais v1 não correspondem ao formato legado esperado.",
  );
}

export function parseLegacyPlannerSnapshotV1(raw: string): LegacyPlannerSnapshotV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new LegacyPlannerValidationError(
      "invalid_legacy_json",
      "Os dados locais v1 não contêm JSON válido.",
    );
  }

  const allowedFields = [...SNAPSHOT_REQUIRED_FIELDS, "monthlyGoals"];
  if (!isPlainObject(parsed)
    || !hasAllFields(parsed, SNAPSHOT_REQUIRED_FIELDS)
    || !hasOnlyFields(parsed, allowedFields)
    || parsed.version !== 1) {
    throw invalidPayload();
  }

  const snapshot: LegacyPlannerSnapshotV1 = {
    version: 1,
    routine: decodeRoutine(parsed.routine),
    records: decodeRecords(parsed.records),
  };
  if (!Object.hasOwn(parsed, "monthlyGoals")) return snapshot;
  return { ...snapshot, monthlyGoals: decodeMonthlyGoals(parsed.monthlyGoals) };
}

export function normalizeLegacyPlannerSnapshotV1(
  snapshot: LegacyPlannerSnapshotV1,
): NormalizedLegacyPlannerV1 {
  return {
    version: 1,
    routine: snapshot.routine,
    records: snapshot.records,
    monthlyGoals: snapshot.monthlyGoals ?? {},
  };
}

function encodeRoutineItem(item: LegacyRoutineItemV1): JsonObject {
  return {
    id: item.id,
    start: item.start,
    end: item.end,
    title: item.title,
    notes: item.notes,
    category: item.category,
  };
}

function encodeDailyItem(item: LegacyDailyItemV1): JsonObject {
  const encoded: Record<string, JsonValue> = {
    ...encodeRoutineItem(item),
    completed: item.completed,
  };
  if (item.actualMinutes !== undefined) encoded.actualMinutes = item.actualMinutes;
  return encoded;
}

function encodeRoutine(
  routine: Readonly<Record<LegacyDayKey, readonly LegacyRoutineItemV1[]>>,
): JsonObject {
  return Object.fromEntries(LEGACY_DAY_KEYS.map((day) => [
    day,
    routine[day].map(encodeRoutineItem),
  ]));
}

function encodeRecords(records: Readonly<Record<string, LegacyDailyRecordV1>>): JsonObject {
  return Object.fromEntries(Object.entries(records).map(([key, record]) => [key, {
    date: record.date,
    items: record.items.map(encodeDailyItem),
    note: record.note,
    energy: record.energy,
  }]));
}

function encodeMonthlyGoals(goals: Readonly<Record<string, string>>): JsonObject {
  return Object.fromEntries(Object.entries(goals));
}

export function encodeLegacyPlannerSnapshotV1(snapshot: LegacyPlannerSnapshotV1): JsonObject {
  const encoded: Record<string, JsonValue> = {
    version: 1,
    routine: encodeRoutine(snapshot.routine),
    records: encodeRecords(snapshot.records),
  };
  if (snapshot.monthlyGoals !== undefined) {
    encoded.monthlyGoals = snapshot.monthlyGoals === null
      ? null
      : encodeMonthlyGoals(snapshot.monthlyGoals);
  }
  return encoded;
}

export function encodeNormalizedLegacyPlannerV1(snapshot: NormalizedLegacyPlannerV1): JsonObject {
  return {
    version: 1,
    routine: encodeRoutine(snapshot.routine),
    records: encodeRecords(snapshot.records),
    monthlyGoals: encodeMonthlyGoals(snapshot.monthlyGoals),
  };
}

export interface LegacyPlannerSource {
  readRaw(): string | null;
}

export class LocalStorageLegacyPlannerSource implements LegacyPlannerSource {
  private readonly storage: Pick<Storage, "getItem">;

  constructor(storage: Pick<Storage, "getItem">) {
    this.storage = storage;
  }

  readRaw() {
    return this.storage.getItem(LEGACY_PLANNER_STORAGE_KEY);
  }
}
