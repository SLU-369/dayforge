import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function EmptyState({ icon, eyebrow, title, description, children }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {children && <div className="empty-state-actions">{children}</div>}
    </section>
  );
}
