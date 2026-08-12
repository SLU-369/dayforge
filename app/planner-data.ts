export type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
export type CategoryKey = "trabalho" | "foco" | "estudo" | "saude" | "pessoal" | "sono";

export type RoutineItem = {
  id: string;
  start: string;
  end: string;
  title: string;
  notes: string;
  category: CategoryKey;
};

export type DailyItem = RoutineItem & {
  completed: boolean;
  actualMinutes?: number;
};

export type DailyRecord = {
  date: string;
  items: DailyItem[];
  note: string;
  energy: 1 | 2 | 3 | 4 | 5;
};

export type PlannerState = {
  version: 1;
  routine: Record<DayKey, RoutineItem[]>;
  records: Record<string, DailyRecord>;
  monthlyGoals: Record<string, string>;
};

export const DAY_ORDER: DayKey[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
export const DAY_NAMES: Record<DayKey, string> = {
  seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo",
};

export const CATEGORIES: Record<CategoryKey, { label: string; short: string; color: string; soft: string }> = {
  trabalho: { label: "Trabalho", short: "TR", color: "#4ade80", soft: "rgba(74,222,128,.12)" },
  foco: { label: "Dev AI / LLM", short: "AI", color: "#38bdf8", soft: "rgba(56,189,248,.12)" },
  estudo: { label: "Estudo", short: "ES", color: "#a78bfa", soft: "rgba(167,139,250,.12)" },
  saude: { label: "Saúde", short: "SA", color: "#fb923c", soft: "rgba(251,146,60,.12)" },
  pessoal: { label: "Pessoal", short: "PE", color: "#f472b6", soft: "rgba(244,114,182,.12)" },
  sono: { label: "Sono", short: "SO", color: "#94a3b8", soft: "rgba(148,163,184,.12)" },
};

const item = (id: string, start: string, end: string, title: string, notes: string, category: CategoryKey): RoutineItem =>
  ({ id, start, end, title, notes, category });

const common = (day: string): RoutineItem[] => [
  item(`${day}-morning`, "06:00", "07:30", "Rotina matinal", "Café, higiene e preparação", "pessoal"),
  item(`${day}-commute-in`, "07:30", "08:10", "Deslocamento", "Bike ou moto", "pessoal"),
  item(`${day}-work-am`, "08:10", "13:30", "Trabalho", "Estudo oportunístico quando possível", "trabalho"),
  item(`${day}-lunch`, "13:30", "14:42", "Almoço", "Pausa e recuperação", "pessoal"),
  item(`${day}-work-pm`, "14:42", "18:30", "Trabalho", "", "trabalho"),
  item(`${day}-commute-out`, "18:30", "19:10", "Volta para casa", "", "pessoal"),
];

export function createDefaultState(): PlannerState {
  const gym = (day: string, course: string): RoutineItem[] => [
    item(`${day}-prep`, "19:10", "19:50", "Preparação", "Ida para a academia", "pessoal"),
    item(`${day}-gym`, "19:50", "20:50", "Academia", "Treino do dia", "saude"),
    item(`${day}-walk`, "20:50", "21:00", "Caminhada", "Volta para casa", "saude"),
    item(`${day}-college`, "21:00", "22:00", "Faculdade", "UNIP", "estudo"),
    item(`${day}-focus`, "22:00", "00:30", "Estudo · Dev AI / LLM", "Foco principal", "foco"),
    item(`${day}-course`, "00:30", "01:30", `Estudo · ${course}`, "Curso complementar", "estudo"),
    item(`${day}-sleep`, "01:30", "02:00", "Desligar e dormir", "", "sono"),
  ];

  return {
    version: 1,
    records: {},
    monthlyGoals: {},
    routine: {
      seg: [
        ...common("seg"),
        item("seg-free", "19:10", "21:00", "Jantar e descanso", "Tempo livre", "pessoal"),
        item("seg-football", "21:00", "22:00", "Futebol", "", "saude"),
        item("seg-return", "22:00", "23:30", "Volta e banho", "Jantar leve", "pessoal"),
        item("seg-focus", "23:30", "01:30", "Estudo · Dev AI / LLM", "Foco principal", "foco"),
        item("seg-sleep", "01:30", "02:00", "Desligar e dormir", "", "sono"),
      ],
      ter: [...common("ter"), ...gym("ter", "Go")],
      qua: [...common("qua"), ...gym("qua", "Python")],
      qui: [
        ...common("qui"),
        item("qui-free", "19:10", "21:00", "Jantar e descanso", "Tempo livre", "pessoal"),
        item("qui-football", "21:00", "22:00", "Futebol", "", "saude"),
        item("qui-return", "22:00", "23:30", "Volta e banho", "Jantar leve", "pessoal"),
        item("qui-college", "23:30", "00:30", "Faculdade", "UNIP", "estudo"),
        item("qui-focus", "00:30", "01:30", "Estudo · Dev AI / LLM", "Foco principal", "foco"),
        item("qui-sleep", "01:30", "02:00", "Desligar e dormir", "", "sono"),
      ],
      sex: [
        ...common("sex"),
        item("sex-prep", "19:10", "19:50", "Preparação", "Ida para a academia", "pessoal"),
        item("sex-gym", "19:50", "20:50", "Academia", "Treino do dia", "saude"),
        item("sex-walk", "20:50", "21:00", "Caminhada", "Volta para casa", "saude"),
        item("sex-college", "21:00", "22:00", "Faculdade", "UNIP", "estudo"),
        item("sex-focus", "22:00", "00:00", "Estudo · Dev AI / LLM", "Foco principal", "foco"),
        item("sex-git", "00:00", "01:30", "Estudo · Git e GitHub", "Curso complementar", "estudo"),
        item("sex-sleep", "01:30", "02:00", "Desligar e dormir", "", "sono"),
      ],
      sab: [
        item("sab-free", "06:00", "16:00", "Tempo livre", "Manhã e início da tarde", "pessoal"),
        item("sab-projects", "16:00", "19:00", "Projetos pessoais", "Jarvis, Tobby ou Barbearia", "estudo"),
        item("sab-rest", "19:00", "23:00", "Descanso", "Lazer sem culpa", "pessoal"),
      ],
      dom: [
        item("dom-free", "06:00", "16:00", "Tempo livre", "Manhã e início da tarde", "pessoal"),
        item("dom-review", "16:00", "18:00", "Revisão da semana", "Resultados, pendências e próxima semana", "estudo"),
        item("dom-plan", "18:00", "19:00", "Planejamento", "Escolher o foco da próxima semana", "foco"),
        item("dom-rest", "19:00", "23:00", "Descanso", "Lazer sem culpa", "pessoal"),
      ],
    },
  };
}

export function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let result = eh * 60 + em - (sh * 60 + sm);
  if (result <= 0) result += 24 * 60;
  return result;
}

export function dayKeyFor(date: Date): DayKey {
  return (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as DayKey[])[date.getDay()];
}

export function localISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseISO(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function hoursLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}min`;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}
