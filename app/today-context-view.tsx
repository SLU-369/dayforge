import type { ReactNode } from "react";
import { CATEGORIES } from "./planner-data";
import type { TodayContext, TodayContextItem } from "./today-context";
import styles from "./today-context.module.css";

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function dateTitle(date: Date) {
  const label = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function Item({ item }: { item: TodayContextItem }) {
  return (
    <article className={styles.item}>
      <span className={styles.time}>{item.start}–{item.end}</span>
      <div>
        <span className={styles.category}>{CATEGORIES[item.category].label}</span>
        <h3>{item.title}</h3>
        {item.notes && <p>{item.notes}</p>}
      </div>
    </article>
  );
}

function ContextSection({ title, items, empty, attention = false }: { title: string; items: readonly TodayContextItem[]; empty: string; attention?: boolean }) {
  return (
    <section className={`panel ${styles.section}`} aria-label={title}>
      <h2>{title}</h2>
      {items.length ? <div className={styles.items}>{items.map((item, index) => <div key={`${item.id}:${index}`}><Item item={item} />{attention && <small className={styles.caption}>Aguardando decisão · sem registro de conclusão</small>}</div>)}</div> : <p className={styles.empty}>{empty}</p>}
    </section>
  );
}

export function TodayContextView({
  context,
  selectedDate,
  onDate,
  blocked,
  error,
  details,
}: {
  context: TodayContext | null;
  selectedDate: Date;
  onDate: (date: Date) => void;
  blocked: boolean;
  error: boolean;
  details: ReactNode;
}) {
  return (
    <div className="page-wrap">
      <div className="page-topline">
        <div><span className="eyebrow">{"// CONTEXTO DO DIA"}</span><h1>O que importa agora</h1><p>{dateTitle(selectedDate)}</p></div>
      </div>
      <div className="date-control">
        <button aria-label="Dia anterior" onClick={() => onDate(addDays(selectedDate, -1))}>‹</button>
        <button className="date-main" onClick={() => onDate(new Date())}>{dateTitle(selectedDate)}</button>
        <button aria-label="Próximo dia" onClick={() => onDate(addDays(selectedDate, 1))}>›</button>
      </div>
      {blocked || error || !context ? (
        <section className={`panel ${styles.section}`} role="alert">
          <h2>Dados locais protegidos</h2>
          <p className={styles.empty}>{blocked
            ? "O armazenamento não pôde ser validado. Esta sessão é temporária; a visão contextual não usa os dados preservados até a recuperação explícita."
            : "Não foi possível interpretar os horários deste dia. Os dados originais foram preservados."}</p>
        </section>
      ) : (
        <>
          <div className={styles.primary}>
            <ContextSection title="Agora" items={context.agora ? [context.agora] : []} empty="Nenhuma atividade planejada para este instante." />
            <ContextSection title="Próximo" items={context.proximo ? [context.proximo] : []} empty="Nenhuma próxima atividade planejada para hoje." />
          </div>
          <div className={styles.secondary}>
            <ContextSection title="Depois" items={context.depois} empty="Nada mais planejado para hoje." />
            <ContextSection title="Atenção" items={context.atencao} attention empty="Nenhuma decisão sinalizada para este dia." />
            <section className={`panel ${styles.section}`} aria-label="Resumo">
              <h2>Resumo</h2>
              <p className={styles.summary}>{context.resumo.total} itens no dia · {context.resumo.completed} concluídos · {context.resumo.future} futuros</p>
              <small className={styles.caption}>Dados do planner ativo. Horários legados interpretados no fuso deste dispositivo.</small>
            </section>
          </div>
        </>
      )}
      {details && <details className={styles.details}>
        <summary>Ver dia completo</summary>
        {details}
      </details>}
    </div>
  );
}
