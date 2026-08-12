"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FlowButton } from "@/components/ui/flow-button";
import {
  CATEGORIES,
  CategoryKey,
  createDefaultState,
  DailyItem,
  DailyRecord,
  DAY_NAMES,
  DAY_ORDER,
  DayKey,
  dayKeyFor,
  hoursLabel,
  localISO,
  minutesBetween,
  monthKey,
  parseISO,
  PlannerState,
  RoutineItem,
} from "./planner-data";
import DayforgeNavigation, { type DayforgeView } from "./dayforge-navigation";
import ThemeToggle from "./theme-toggle";

const STORAGE_KEY = "rotina-369:data:v1";
type View = DayforgeView;
type EditorTarget = { type: "day" | "routine"; item?: RoutineItem; index?: number } | null;

function cloneDay(state: PlannerState, date: string): DailyRecord {
  const key = dayKeyFor(parseISO(date));
  return {
    date,
    note: "",
    energy: 3,
    items: state.routine[key].map((entry) => ({ ...entry, id: `${date}:${entry.id}`, completed: false })),
  };
}

function safePercent(value: number, total: number) {
  return total ? Math.min(100, Math.round((value / total) * 100)) : 0;
}

function dateTitle(date: Date) {
  const label = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function monthTitle(date: Date) {
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function itemMinutes(item: RoutineItem) {
  return minutesBetween(item.start, item.end);
}

export default function PlannerApp() {
  const [state, setState] = useState<PlannerState>(() => createDefaultState());
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("hoje");
  const [selectedDate, setSelectedDate] = useState(() => localISO(new Date()));
  const [monthDate, setMonthDate] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1); });
  const [routineDay, setRoutineDay] = useState<DayKey>(() => dayKeyFor(new Date()));
  const [editor, setEditor] = useState<EditorTarget>(null);
  const [toast, setToast] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as PlannerState;
          if (parsed.version === 1 && parsed.routine && parsed.records) setState(parsed);
        }
      } catch {
        setToast("Não foi possível ler os dados salvos. A rotina padrão foi carregada.");
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      const timer = window.setTimeout(() => setToast("O navegador não conseguiu salvar esta alteração."), 0);
      return () => window.clearTimeout(timer);
    }
  }, [state, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const record = selectedDate ? state.records[selectedDate] || cloneDay(state, selectedDate) : undefined;
  const selectedDateObject = selectedDate ? parseISO(selectedDate) : new Date();
  const todayISO = ready ? localISO(new Date()) : "";

  const metrics = useMemo(() => {
    if (!record) return { planned: 0, completed: 0, focus: 0, count: 0, done: 0 };
    const planned = record.items.reduce((sum, entry) => sum + itemMinutes(entry), 0);
    const completed = record.items.reduce((sum, entry) => sum + (entry.completed ? entry.actualMinutes || itemMinutes(entry) : 0), 0);
    const focus = record.items.reduce((sum, entry) => sum + (entry.completed && entry.category === "foco" ? entry.actualMinutes || itemMinutes(entry) : 0), 0);
    return { planned, completed, focus, count: record.items.length, done: record.items.filter((entry) => entry.completed).length };
  }, [record]);

  function updateRecord(mutator: (current: DailyRecord) => DailyRecord) {
    if (!selectedDate) return;
    setState((current) => {
      const base = current.records[selectedDate] || cloneDay(current, selectedDate);
      return { ...current, records: { ...current.records, [selectedDate]: mutator(base) } };
    });
  }

  function toggleItem(index: number) {
    updateRecord((current) => ({
      ...current,
      items: current.items.map((entry, itemIndex) =>
        itemIndex === index
          ? { ...entry, completed: !entry.completed, actualMinutes: !entry.completed ? entry.actualMinutes || itemMinutes(entry) : entry.actualMinutes }
          : entry,
      ),
    }));
  }

  function deleteItem(index: number, target: "day" | "routine") {
    if (target === "day") {
      updateRecord((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
    } else {
      setState((current) => ({
        ...current,
        routine: { ...current.routine, [routineDay]: current.routine[routineDay].filter((_, itemIndex) => itemIndex !== index) },
      }));
    }
    setToast("Atividade removida.");
  }

  function saveEditor(item: RoutineItem, actualMinutes?: number) {
    if (!editor) return;
    if (editor.type === "day") {
      updateRecord((current) => {
        const dailyItem: DailyItem = {
          ...item,
          id: editor.item?.id || `${selectedDate}:custom:${Date.now()}`,
          completed: (editor.item as DailyItem | undefined)?.completed || false,
          actualMinutes,
        };
        const items = editor.index === undefined
          ? [...current.items, dailyItem]
          : current.items.map((entry, index) => (index === editor.index ? dailyItem : entry));
        return { ...current, items: items.sort((a, b) => a.start.localeCompare(b.start)) };
      });
    } else {
      setState((current) => {
        const routineItem = { ...item, id: editor.item?.id || `${routineDay}:custom:${Date.now()}` };
        const items = editor.index === undefined
          ? [...current.routine[routineDay], routineItem]
          : current.routine[routineDay].map((entry, index) => (index === editor.index ? routineItem : entry));
        return { ...current, routine: { ...current.routine, [routineDay]: items.sort((a, b) => a.start.localeCompare(b.start)) } };
      });
    }
    setEditor(null);
    setToast("Atividade salva.");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dayforge-backup-${localISO(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Backup exportado.");
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as PlannerState;
      if (parsed.version !== 1 || !parsed.routine || !parsed.records) throw new Error("Formato inválido");
      setState(parsed);
      setToast("Backup importado com sucesso.");
    } catch {
    setToast("Esse arquivo não é um backup válido do Dayforge.");
    }
    event.target.value = "";
  }

  function resetData() {
    if (!window.confirm("Restaurar a rotina padrão e apagar todo o histórico local? Exporte um backup antes se quiser guardar os dados.")) return;
    setState(createDefaultState());
    setToast("Dados restaurados.");
  }

  if (!ready || !selectedDate || !monthDate) {
    return <div className="app-loading"><span>369</span><p>Preparando seu painel…</p></div>;
  }

  return (
    <div className="app-shell">
      <DayforgeNavigation
        activeView={view}
        onViewChange={setView}
        onExportBackup={exportBackup}
        onImportBackup={() => importRef.current?.click()}
        onResetData={resetData}
      />

      <main className="main-content">
        <header className="mobile-header">
          <div className="brand"><span className="brand-mark">DF</span><strong>Dayforge</strong></div>
          <div className="mobile-header-actions">
            <div className="saved-pill"><span className="status-dot" /> salvo</div>
            <div className="mobile-data-actions" aria-label="Backup local">
              <button type="button" aria-label="Exportar backup" title="Exportar backup" onClick={exportBackup}>↓</button>
              <button type="button" aria-label="Importar backup" title="Importar backup" onClick={() => importRef.current?.click()}>↑</button>
              <button type="button" className="danger-text" aria-label="Restaurar padrão" title="Restaurar padrão" onClick={resetData}>↺</button>
            </div>
            <ThemeToggle compact />
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Navegação principal">
          <NavButton active={view === "hoje"} icon="◉" label="Hoje" onClick={() => setView("hoje")} />
          <NavButton active={view === "mes"} icon="▦" label="Mensal" onClick={() => setView("mes")} />
          <NavButton active={view === "rotina"} icon="≡" label="Rotina" onClick={() => setView("rotina")} />
        </nav>

        <div className="view-stage" key={view}>
          {view === "hoje" && (
            <TodayView
              record={record!}
              selectedDate={selectedDateObject}
              todayISO={todayISO}
              metrics={metrics}
              onDate={(date) => setSelectedDate(localISO(date))}
              onToggle={toggleItem}
              onEdit={(item, index) => setEditor({ type: "day", item, index })}
              onDelete={(index) => deleteItem(index, "day")}
              onAdd={() => setEditor({ type: "day" })}
              onNote={(note) => updateRecord((current) => ({ ...current, note }))}
              onEnergy={(energy) => updateRecord((current) => ({ ...current, energy }))}
            />
          )}
          {view === "mes" && (
            <MonthView
              state={state}
              monthDate={monthDate}
              todayISO={todayISO}
              onMonth={(date) => setMonthDate(date)}
              onOpenDay={(date) => { setSelectedDate(date); setView("hoje"); }}
              onGoal={(goal) => setState((current) => ({ ...current, monthlyGoals: { ...current.monthlyGoals, [monthKey(monthDate)]: goal } }))}
            />
          )}
          {view === "rotina" && (
            <RoutineView
              state={state}
              day={routineDay}
              onDay={setRoutineDay}
              onEdit={(item, index) => setEditor({ type: "routine", item, index })}
              onDelete={(index) => deleteItem(index, "routine")}
              onAdd={() => setEditor({ type: "routine" })}
            />
          )}
        </div>
      </main>

      <input ref={importRef} hidden type="file" accept="application/json" onChange={importBackup} />
      {editor && <ItemEditor target={editor} onClose={() => setEditor(null)} onSave={saveEditor} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button type="button" className={active ? "active" : ""} aria-current={active ? "page" : undefined} onClick={onClick}><span>{icon}</span>{label}</button>;
}

function TodayView({ record, selectedDate, todayISO, metrics, onDate, onToggle, onEdit, onDelete, onAdd, onNote, onEnergy }: {
  record: DailyRecord;
  selectedDate: Date;
  todayISO: string;
  metrics: { planned: number; completed: number; focus: number; count: number; done: number };
  onDate: (date: Date) => void;
  onToggle: (index: number) => void;
  onEdit: (item: DailyItem, index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
  onNote: (note: string) => void;
  onEnergy: (energy: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const percentage = safePercent(metrics.done, metrics.count);
  const isToday = localISO(selectedDate) === todayISO;
  const now = new Date();

  return (
    <div className="page-wrap">
      <div className="page-topline"><div><span className="eyebrow">{"// CONTROLE DIÁRIO"}</span><h1>{isToday ? "Seu dia, em uma visão" : dateTitle(selectedDate)}</h1><p>{isToday ? dateTitle(selectedDate) : "Revise e ajuste o registro deste dia."}</p></div><FlowButton className="primary-button" text="＋ Nova atividade" onClick={onAdd} /></div>
      <div className="date-control">
        <button aria-label="Dia anterior" onClick={() => onDate(addDays(selectedDate, -1))}>‹</button>
        <button className="date-main" onClick={() => onDate(new Date())}>{isToday ? "Hoje" : dateTitle(selectedDate)}</button>
        <button aria-label="Próximo dia" onClick={() => onDate(addDays(selectedDate, 1))}>›</button>
      </div>

      <section className="metric-grid" aria-label="Resumo do dia">
        <MetricCard label="Progresso" value={`${percentage}%`} helper={`${metrics.done} de ${metrics.count} atividades`} accent="var(--accent)" />
        <MetricCard label="Tempo concluído" value={hoursLabel(metrics.completed)} helper={`de ${hoursLabel(metrics.planned)} planejadas`} accent="var(--success)" />
        <MetricCard label="Foco AI / LLM" value={hoursLabel(metrics.focus)} helper="tempo efetivamente concluído" accent="var(--focus-accent)" />
        <div className="metric-card energy-card"><span>Energia do dia</span><div className="energy-row">{([1, 2, 3, 4, 5] as const).map((level) => <button key={level} className={record.energy === level ? "selected" : ""} onClick={() => onEnergy(level)} aria-label={`Energia ${level}`}>{level}</button>)}</div><small>1 baixa · 5 excelente</small></div>
      </section>

      <div className="content-grid">
        <section className="panel timeline-panel">
          <div className="panel-heading"><div><span className="eyebrow">LINHA DO TEMPO</span><h2>Planejado x realizado</h2></div><span className="progress-chip">{percentage}% concluído</span></div>
          <div className="timeline-list">
            {record.items.map((entry, index) => {
              const category = CATEGORIES[entry.category];
              const isNow = isToday && timeContains(entry, now);
              return (
                <article className={`timeline-item ${entry.completed ? "completed" : ""} ${isNow ? "current" : ""}`} key={entry.id} style={{ "--item-color": category.color, "--item-soft": category.soft } as React.CSSProperties}>
                  <button className="check-button" aria-label={entry.completed ? "Marcar como pendente" : "Marcar como concluída"} onClick={() => onToggle(index)}>{entry.completed ? "✓" : ""}</button>
                  <div className="time-column"><strong>{entry.start}</strong><span>{entry.end}</span></div>
                  <div className="item-body"><div className="item-tags"><span className="category-tag">{category.label}</span>{isNow && <span className="now-tag">agora</span>}</div><h3>{entry.title}</h3>{entry.notes && <p>{entry.notes}</p>}<small>{entry.completed ? `${entry.actualMinutes || itemMinutes(entry)} min realizados` : `${itemMinutes(entry)} min planejados`}</small></div>
                  <div className="item-actions"><button aria-label="Editar atividade" onClick={() => onEdit(entry, index)}>Editar</button><button aria-label="Excluir atividade" onClick={() => onDelete(index)}>×</button></div>
                </article>
              );
            })}
            <FlowButton className="add-inline" tone="neutral" text="＋ Adicionar atividade a este dia" onClick={onAdd} />
          </div>
        </section>

        <aside className="side-column">
          <section className="panel daily-note"><span className="eyebrow">FECHAMENTO</span><h2>Nota do dia</h2><textarea value={record.note} onChange={(event) => onNote(event.target.value)} placeholder="O que funcionou? O que precisa mudar amanhã?" /><small>Salvo automaticamente neste PC.</small></section>
          <section className="panel focus-card"><div className="focus-orbit"><span>AI</span></div><div><span className="eyebrow">FOCO ATUAL</span><h2>Dev AI / LLM</h2><p>Proteja este bloco. Consistência vale mais que uma sessão perfeita.</p></div></section>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper, accent }: { label: string; value: string; helper: string; accent: string }) {
  return <div className="metric-card" style={{ "--metric-accent": accent } as React.CSSProperties}><span>{label}</span><strong>{value}</strong><small>{helper}</small></div>;
}

function timeContains(item: RoutineItem, now: Date) {
  let current = now.getHours() * 60 + now.getMinutes();
  const start = Number(item.start.slice(0, 2)) * 60 + Number(item.start.slice(3));
  let end = Number(item.end.slice(0, 2)) * 60 + Number(item.end.slice(3));
  if (end <= start) {
    end += 1440;
    if (current < start) current += 1440;
  }
  return current >= start && current < end;
}

function MonthView({ state, monthDate, todayISO, onMonth, onOpenDay, onGoal }: {
  state: PlannerState;
  monthDate: Date;
  todayISO: string;
  onMonth: (date: Date) => void;
  onOpenDay: (date: string) => void;
  onGoal: (goal: string) => void;
}) {
  const key = monthKey(monthDate);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const firstOffset = (new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay() + 6) % 7;
  const cells: (string | null)[] = Array(firstOffset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(localISO(new Date(monthDate.getFullYear(), monthDate.getMonth(), day)));
  while (cells.length % 7) cells.push(null);

  const monthMetrics = useMemo(() => {
    let planned = 0, completed = 0, activities = 0, done = 0;
    const byCategory = Object.fromEntries(Object.keys(CATEGORIES).map((category) => [category, 0])) as Record<CategoryKey, number>;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = localISO(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
      if (date > todayISO) continue;
      const record = state.records[date];
      const entries = record?.items || state.routine[dayKeyFor(parseISO(date))];
      planned += entries.reduce((sum, entry) => sum + itemMinutes(entry), 0);
      activities += entries.length;
      if (record) {
        for (const entry of record.items) {
          if (!entry.completed) continue;
          const minutes = entry.actualMinutes || itemMinutes(entry);
          completed += minutes;
          done += 1;
          byCategory[entry.category] += minutes;
        }
      }
    }
    let streak = 0;
    const lastDay = key === monthKey(new Date()) ? new Date().getDate() : daysInMonth;
    for (let day = lastDay; day >= 1; day--) {
      const date = localISO(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
      const record = state.records[date];
      if (!record) break;
      const ratio = safePercent(record.items.filter((entry) => entry.completed).length, record.items.length);
      if (ratio < 60) break;
      streak++;
    }
    return { planned, completed, activities, done, byCategory, streak };
  }, [state, monthDate, daysInMonth, todayISO, key]);

  const maxCategory = Math.max(1, ...Object.values(monthMetrics.byCategory));

  return (
    <div className="page-wrap">
      <div className="page-topline"><div><span className="eyebrow">{"// VISÃO MENSAL"}</span><h1>Seu ritmo ao longo do mês</h1><p>Resultados reais, sem culpa e sem maquiagem.</p></div><div className="month-control"><button onClick={() => onMonth(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>‹</button><strong>{monthTitle(monthDate)}</strong><button onClick={() => onMonth(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>›</button></div></div>
      <section className="metric-grid month-metrics">
        <MetricCard label="Aproveitamento" value={`${safePercent(monthMetrics.completed, monthMetrics.planned)}%`} helper={`${hoursLabel(monthMetrics.completed)} de ${hoursLabel(monthMetrics.planned)}`} accent="var(--accent)" />
        <MetricCard label="Atividades" value={`${monthMetrics.done}`} helper={`de ${monthMetrics.activities} planejadas`} accent="var(--success)" />
        <MetricCard label="Sequência" value={`${monthMetrics.streak} dias`} helper="dias com ao menos 60%" accent="var(--accent-strong)" />
        <MetricCard label="Foco AI / LLM" value={hoursLabel(monthMetrics.byCategory.foco)} helper="tempo concluído no mês" accent="var(--focus-accent)" />
      </section>

      <div className="monthly-grid">
        <section className="panel calendar-panel">
          <div className="panel-heading"><div><span className="eyebrow">CALENDÁRIO</span><h2>Consistência diária</h2></div><div className="calendar-legend"><span /> menor <span /> maior</div></div>
          <div className="weekday-row">{["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">{cells.map((date, index) => {
            if (!date) return <span className="calendar-empty" key={`empty-${index}`} />;
            const dayRecord = state.records[date];
            const rate = dayRecord ? safePercent(dayRecord.items.filter((entry) => entry.completed).length, dayRecord.items.length) : 0;
            const isFuture = date > todayISO;
            return <button key={date} className={`${date === todayISO ? "today" : ""} ${isFuture ? "future" : ""}`} style={{ "--day-rate": `${rate}%` } as React.CSSProperties} onClick={() => onOpenDay(date)}><strong>{Number(date.slice(-2))}</strong><span>{rate ? `${rate}%` : "—"}</span></button>;
          })}</div>
        </section>

        <aside className="side-column">
          <section className="panel category-panel"><span className="eyebrow">DISTRIBUIÇÃO</span><h2>Tempo concluído</h2><div className="category-bars">{(Object.keys(CATEGORIES) as CategoryKey[]).map((categoryKey) => {
            const category = CATEGORIES[categoryKey];
            const value = monthMetrics.byCategory[categoryKey];
            return <div className="category-row" key={categoryKey}><div><span style={{ background: category.color }} />{category.label}<strong>{hoursLabel(value)}</strong></div><div className="bar-track"><span style={{ width: `${(value / maxCategory) * 100}%`, background: category.color }} /></div></div>;
          })}</div></section>
          <section className="panel goal-panel"><span className="eyebrow">META DO MÊS</span><h2>Uma direção clara</h2><textarea value={state.monthlyGoals[key] || ""} onChange={(event) => onGoal(event.target.value)} placeholder="Ex.: concluir 20 horas de Dev AI / LLM e manter 3 treinos por semana." /><small>Escolha uma meta simples e mensurável.</small></section>
        </aside>
      </div>
    </div>
  );
}

function RoutineView({ state, day, onDay, onEdit, onDelete, onAdd }: {
  state: PlannerState;
  day: DayKey;
  onDay: (day: DayKey) => void;
  onEdit: (item: RoutineItem, index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}) {
  const weekly = useMemo(() => {
    const result = Object.fromEntries(Object.keys(CATEGORIES).map((category) => [category, 0])) as Record<CategoryKey, number>;
    DAY_ORDER.forEach((dayKey) => state.routine[dayKey].forEach((entry) => { result[entry.category] += itemMinutes(entry); }));
    return result;
  }, [state.routine]);

  return (
    <div className="page-wrap">
      <div className="page-topline"><div><span className="eyebrow">{"// ROTINA-BASE"}</span><h1>O molde da sua semana</h1><p>Alterações aqui valem para novos dias. Seu histórico permanece intacto.</p></div><FlowButton className="primary-button" text="＋ Nova atividade" onClick={onAdd} /></div>
      <div className="day-tabs">{DAY_ORDER.map((dayKey) => <button className={day === dayKey ? "active" : ""} key={dayKey} onClick={() => onDay(dayKey)}><span>{DAY_NAMES[dayKey].slice(0, 3)}</span><small>{hoursLabel(state.routine[dayKey].reduce((sum, entry) => sum + itemMinutes(entry), 0))}</small></button>)}</div>
      <div className="routine-layout">
        <section className="panel routine-panel"><div className="panel-heading"><div><span className="eyebrow">{DAY_NAMES[day].toUpperCase()}</span><h2>{state.routine[day].length} blocos planejados</h2></div><FlowButton className="secondary-button" tone="neutral" text="＋ adicionar" onClick={onAdd} /></div><div className="routine-list">{state.routine[day].map((entry, index) => {
          const category = CATEGORIES[entry.category];
          return <article key={entry.id} style={{ "--item-color": category.color, "--item-soft": category.soft } as React.CSSProperties}><div className="routine-time"><strong>{entry.start}</strong><span>{entry.end}</span></div><span className="category-initial">{category.short}</span><div><h3>{entry.title}</h3><p>{entry.notes || category.label}</p></div><span className="duration-pill">{hoursLabel(itemMinutes(entry))}</span><div className="item-actions"><button onClick={() => onEdit(entry, index)}>Editar</button><button onClick={() => onDelete(index)}>×</button></div></article>;
        })}</div></section>
        <aside className="panel weekly-summary"><span className="eyebrow">RESUMO SEMANAL</span><h2>Para onde vai seu tempo</h2><div className="weekly-donut" style={{ background: weeklyGradient(weekly) }}><div><strong>{hoursLabel(Object.values(weekly).reduce((sum, value) => sum + value, 0))}</strong><span>planejadas</span></div></div><div className="weekly-legend">{(Object.keys(CATEGORIES) as CategoryKey[]).map((categoryKey) => <div key={categoryKey}><span style={{ background: CATEGORIES[categoryKey].color }} />{CATEGORIES[categoryKey].label}<strong>{hoursLabel(weekly[categoryKey])}</strong></div>)}</div></aside>
      </div>
    </div>
  );
}

function weeklyGradient(values: Record<CategoryKey, number>) {
  const entries = Object.entries(values) as [CategoryKey, number][];
  const total = Math.max(1, entries.reduce((sum, [, value]) => sum + value, 0));
  let current = 0;
  const stops = entries.map(([key, value]) => {
    const start = current;
    current += (value / total) * 100;
    return `${CATEGORIES[key].color} ${start}% ${current}%`;
  });
  return `conic-gradient(${stops.join(",")})`;
}

function ItemEditor({ target, onClose, onSave }: { target: NonNullable<EditorTarget>; onClose: () => void; onSave: (item: RoutineItem, actualMinutes?: number) => void }) {
  const base = target.item;
  const [title, setTitle] = useState(base?.title || "");
  const [notes, setNotes] = useState(base?.notes || "");
  const [start, setStart] = useState(base?.start || "19:00");
  const [end, setEnd] = useState(base?.end || "20:00");
  const [category, setCategory] = useState<CategoryKey>(base?.category || "pessoal");
  const [actual, setActual] = useState((base as DailyItem | undefined)?.actualMinutes?.toString() || "");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({ id: base?.id || "", title: title.trim(), notes: notes.trim(), start, end, category }, actual ? Number(actual) : undefined);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <form className="editor-modal" onSubmit={submit}>
        <div className="modal-heading"><div><span className="eyebrow">{target.index === undefined ? "NOVA ATIVIDADE" : "EDITAR ATIVIDADE"}</span><h2>{target.type === "routine" ? "Rotina-base" : "Registro do dia"}</h2></div><button type="button" onClick={onClose}>×</button></div>
        <label className="full-field"><span>Atividade</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Estudo de Go" required /></label>
        <div className="form-row"><label><span>Início</span><input type="time" value={start} onChange={(event) => setStart(event.target.value)} required /></label><label><span>Fim</span><input type="time" value={end} onChange={(event) => setEnd(event.target.value)} required /></label></div>
        <label className="full-field"><span>Categoria</span><select value={category} onChange={(event) => setCategory(event.target.value as CategoryKey)}>{(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => <option key={key} value={key}>{CATEGORIES[key].label}</option>)}</select></label>
        {target.type === "day" && <label className="full-field"><span>Minutos realizados (opcional)</span><input type="number" min="0" max="1440" value={actual} onChange={(event) => setActual(event.target.value)} placeholder="Preenchido automaticamente ao concluir" /></label>}
        <label className="full-field"><span>Observação</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Detalhe opcional" /></label>
        <div className="modal-actions"><FlowButton className="secondary-button" tone="neutral" text="Cancelar" onClick={onClose} /><FlowButton className="primary-button" text="Salvar atividade" type="submit" /></div>
      </form>
    </div>
  );
}
