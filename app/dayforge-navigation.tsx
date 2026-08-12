"use client";

import { FluidMenu, type FluidMenuItem } from "@/components/ui/fluid-menu";
import ThemeToggle from "./theme-toggle";

export type DayforgeView = "hoje" | "mes" | "rotina";

type DayforgeNavigationProps = {
  activeView: DayforgeView;
  onViewChange: (view: DayforgeView) => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onResetData: () => void;
};

export default function DayforgeNavigation({
  activeView,
  onViewChange,
  onExportBackup,
  onImportBackup,
  onResetData,
}: DayforgeNavigationProps) {
  const items: FluidMenuItem[] = [
    { id: "hoje", label: "Hoje", icon: "◉", active: activeView === "hoje", onSelect: () => onViewChange("hoje") },
    { id: "mes", label: "Visão mensal", icon: "▦", active: activeView === "mes", onSelect: () => onViewChange("mes") },
    { id: "rotina", label: "Rotina-base", icon: "≡", active: activeView === "rotina", onSelect: () => onViewChange("rotina") },
    { id: "exportar", label: "Exportar backup", icon: "↓", onSelect: onExportBackup },
    { id: "importar", label: "Importar backup", icon: "↑", onSelect: onImportBackup },
    { id: "restaurar", label: "Restaurar padrão", icon: "↺", danger: true, onSelect: onResetData },
  ];

  return (
    <aside className="floating-navigation" aria-label="Barra lateral">
      <div className="floating-navigation-brand" aria-label="Dayforge" title="Dayforge">
        <span>DF</span>
      </div>

      <FluidMenu ariaLabel="Navegação e dados" items={items} />

      <div className="floating-navigation-footer">
        <div className="local-status" title="Dados salvos neste PC">
          <span className="status-dot" />
          <span>LOCAL</span>
        </div>
        <ThemeToggle compact />
      </div>
    </aside>
  );
}
