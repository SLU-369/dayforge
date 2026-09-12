import {
  Activity,
  Apple,
  Calculator,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  CircleDot,
  ClipboardList,
  Code2,
  Compass,
  Dumbbell,
  GraduationCap,
  LibraryBig,
  Repeat2,
  Target,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type NavigationSection = {
  label: string;
  href?: string;
  icon: LucideIcon;
  items?: NavigationItem[];
};

export const navigationSections: NavigationSection[] = [
  { label: "Hoje", href: "/hoje", icon: CircleDot },
  {
    label: "Planejamento",
    icon: CalendarRange,
    items: [
      { label: "Semana", description: "Distribua suas prioridades", href: "/planejamento/semana", icon: CalendarDays },
      { label: "Agenda", description: "Dias, compromissos e eventos", href: "/planejamento/agenda", icon: CalendarRange },
      { label: "Rotina", description: "O molde reutilizável da semana", href: "/planejamento/rotina", icon: Repeat2 },
      { label: "Metas", description: "Direções ligadas a resultados", href: "/planejamento/metas", icon: Target },
    ],
  },
  {
    label: "Formação",
    icon: GraduationCap,
    items: [
      { label: "Visão geral", description: "Seu percurso de aprendizado", href: "/formacao", icon: LibraryBig },
      { label: "Acadêmico", description: "Semestres, disciplinas e entregas", href: "/formacao/academico", icon: GraduationCap },
      { label: "Cursos técnicos", description: "Go, IA para Devs e histórico", href: "/formacao/cursos", icon: Code2 },
      { label: "Cursos rápidos", description: "Formações curtas escolhidas por você", href: "/formacao/cursos-rapidos", icon: Code2 },
      { label: "Leituras & Exploração", description: "Conteúdo consumido com reflexão", href: "/formacao/exploracao", icon: Compass },
    ],
  },
  {
    label: "Academia",
    icon: Dumbbell,
    items: [
      { label: "Visão geral", description: "Seu plano e o próximo treino", href: "/academia", icon: Dumbbell },
      { label: "Semana", description: "Treinos preferenciais da semana", href: "/academia/semana", icon: CalendarCheck },
      { label: "Fichas", description: "Organize séries e repetições", href: "/academia/fichas", icon: ClipboardList },
      { label: "Exercícios", description: "Carga, execução e histórico", href: "/academia/exercicios", icon: Activity },
      { label: "Evolução", description: "Acompanhe frequência e carga", href: "/academia/evolucao", icon: TrendingUp },
    ],
  },
  {
    label: "Nutri",
    icon: Apple,
    items: [
      { label: "Visão geral", description: "Resumo alimentar e metas", href: "/nutri", icon: Apple },
      { label: "Plano alimentar", description: "Monte e organize suas refeições", href: "/nutri/plano", icon: UtensilsCrossed },
      { label: "Calculadoras", description: "IMC, calorias, proteína, fibras e água", href: "/nutri/calculadoras", icon: Calculator },
    ],
  },
  { label: "Progresso", href: "/progresso", icon: ChartNoAxesCombined },
];

export function pathIsActive(pathname: string, href: string) {
  if (href === "/hoje") return pathname === "/" || pathname === "/hoje";
  if (href === "/formacao" || href === "/academia" || href === "/nutri") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function sectionIsActive(pathname: string, section: NavigationSection) {
  if (section.href) return pathIsActive(pathname, section.href);
  return section.items?.some((item) => pathIsActive(pathname, item.href)) ?? false;
}

export function contextualItems(pathname: string) {
  return navigationSections.find((section) => !section.href && sectionIsActive(pathname, section))?.items ?? [];
}
