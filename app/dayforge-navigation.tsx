"use client";

import { useCallback, useState } from "react";
import ThemeToggle from "./theme-toggle";
import { ProfilePopover } from "@/components/ui/profile-popover";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePopoverToggle = useCallback((open: boolean) => {
    setIsPopoverOpen(open);
  }, []);

  const mainItems = [
    { id: "hoje", label: "Hoje", icon: "◉", view: "hoje" as const },
    { id: "mes", label: "Visão mensal", icon: "▦", view: "mes" as const },
    { id: "rotina", label: "Rotina-base", icon: "≡", view: "rotina" as const },
  ];

  const actionItems = [
    { id: "exportar", label: "Exportar backup", icon: "↓", onSelect: onExportBackup },
    { id: "importar", label: "Importar backup", icon: "↑", onSelect: onImportBackup },
    { id: "restaurar", label: "Restaurar padrão", icon: "↺", danger: true, onSelect: onResetData },
  ];

  const activeIndex = mainItems.findIndex(item => item.id === activeView);

  return (
    <aside
      className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}
      aria-label="Barra lateral"
    >
      <div className="sidebar-top">
        <ProfilePopover isOpen={isPopoverOpen} onToggle={handlePopoverToggle} />
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Recolher menu" : "Expandir menu"}
        >
          {isExpanded ? "◂" : "▸"}
        </button>
      </div>

      <nav className={`sidebar-nav ${isPopoverOpen ? "popover-displaced" : ""}`}>
        {/* Only show the indicator for main items */}
        {activeIndex !== -1 && (
          <div
            className="active-indicator"
            style={{ top: `${activeIndex * 52}px` }}
            aria-hidden="true"
          />
        )}

        <ul className="sidebar-menu">
          {mainItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`sidebar-item ${item.id === activeView ? "active" : ""}`}
                onClick={() => onViewChange(item.view)}
                aria-current={item.id === activeView ? "page" : undefined}
                title={!isExpanded ? item.label : undefined}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-divider" />

        <ul className="sidebar-menu actions-menu">
          {actionItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`sidebar-item ${item.danger ? "danger" : ""}`}
                onClick={item.onSelect}
                title={!isExpanded ? item.label : undefined}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="local-status" title="Dados salvos neste PC">
          <span className="status-dot" />
          <span className="sidebar-label">LOCAL</span>
        </div>
        <ThemeToggle compact={!isExpanded} />
      </div>
    </aside>
  );
}
