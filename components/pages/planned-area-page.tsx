import {
  Activity,
  CalendarCheck,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Code2,
  Compass,
  Dumbbell,
  GraduationCap,
  LibraryBig,
  SlidersHorizontal,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import styles from "./planned-area-page.module.css";

type PlannedArea =
  | "week"
  | "goals"
  | "formation"
  | "academic"
  | "courses"
  | "exploration"
  | "gym"
  | "gym-week"
  | "workouts"
  | "exercises"
  | "gym-progress"
  | "progress"
  | "preferences";

const areas: Record<PlannedArea, { eyebrow: string; title: string; description: string; icon: LucideIcon }> = {
  week: { eyebrow: "Planejamento · Em preparação", title: "Sua semana, sem sobrecarga", description: "Prioridades, âncoras e blocos flexíveis ficarão reunidos aqui em uma visão semanal.", icon: CalendarDays },
  goals: { eyebrow: "Planejamento · Em preparação", title: "Metas ligadas ao que acontece", description: "Frequência, tempo, progresso e prazo transformarão intenção em direção mensurável.", icon: Target },
  formation: { eyebrow: "Formação · Em preparação", title: "Um percurso para tudo que você aprende", description: "Acadêmico, cursos técnicos e exploração terão espaços próprios, conectados pelo seu progresso.", icon: LibraryBig },
  academic: { eyebrow: "Formação · Acadêmico · Em preparação", title: "Faculdade com contexto", description: "Semestres, disciplinas, trabalhos, provas e sessões ficarão organizados aqui.", icon: GraduationCap },
  courses: { eyebrow: "Formação · Cursos", title: "Cursos com continuidade", description: "Go e IA para Devs terão níveis, sessões e progresso; Python e Git permanecerão no histórico.", icon: Code2 },
  exploration: { eyebrow: "Formação · Exploração · Em preparação", title: "Consumir, registrar, refletir", description: "Livros, filmes, documentários, artigos e estudos livres terão um registro centrado em progresso e aprendizado.", icon: Compass },
  gym: { eyebrow: "Academia · Em preparação", title: "Treino como prática, não checklist", description: "Semana, fichas, exercícios e evolução formarão uma visão contínua do seu treino.", icon: Dumbbell },
  "gym-week": { eyebrow: "Academia · Semana", title: "O plano de treino da semana", description: "Dias preferenciais e reagendamento serão apresentados sem transformar a semana em uma lista rígida.", icon: CalendarCheck },
  workouts: { eyebrow: "Academia · Fichas · Em preparação", title: "Fichas claras durante o treino", description: "Exercícios, séries, repetições e cargas ficarão disponíveis em uma estrutura direta para execução.", icon: ClipboardList },
  exercises: { eyebrow: "Academia · Exercícios", title: "Cada exercício com histórico", description: "Execução, carga e evolução ficarão conectadas às sessões de treino.", icon: Activity },
  "gym-progress": { eyebrow: "Academia · Evolução · Em preparação", title: "Evolução que responde perguntas", description: "Frequência, carga e volume serão apresentados somente quando ajudarem a entender seu treino.", icon: TrendingUp },
  progress: { eyebrow: "Progresso · Em preparação", title: "Uma leitura clara da sua evolução", description: "Contexto, métrica e período ajudarão você a entender o que está realmente evoluindo.", icon: ChartNoAxesCombined },
  preferences: { eyebrow: "Preferências", title: "O Dayforge do seu jeito", description: "Preferências pessoais serão adicionadas quando produzirem uma consequência real na experiência.", icon: SlidersHorizontal },
};

export function PlannedAreaPage({ area }: { area: PlannedArea }) {
  const content = areas[area];
  const Icon = content.icon;

  return (
    <div className={styles.page}>
      <EmptyState icon={<Icon size={28} />} eyebrow={content.eyebrow} title={content.title} description={content.description} />
    </div>
  );
}
