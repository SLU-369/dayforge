"use client";

import { useEffect, useRef } from "react";

type ProfilePopoverProps = {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
};

export function ProfilePopover({ isOpen, onToggle }: ProfilePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onToggle(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onToggle(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="profile-container" ref={popoverRef}>
      <button
        type="button"
        className="profile-trigger"
        onClick={() => onToggle(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Menu do Usuário"
      >
        <img src="https://avatars.githubusercontent.com/u/1?v=4" alt="Samuel Uchoa" />
      </button>

      {isOpen && (
        <div className="profile-popover">
          <div className="profile-popover-header">
            <img src="https://avatars.githubusercontent.com/u/1?v=4" alt="Samuel Uchoa" className="profile-popover-avatar" />
            <div className="profile-popover-info">
              <strong>Samuel Uchoa <span className="arrow-down">⌄</span></strong>
              <small>Adicionar descrição...</small>
              <span className="status-offline"><span className="status-dot-hollow" /> Off-line</span>
            </div>
            <button type="button" className="close-popover" onClick={() => onToggle(false)}>×</button>
          </div>

          <div className="profile-popover-actions">
            <button className="standup-btn" type="button">✨ Obter StandUp</button>
          </div>

          <div className="profile-popover-tabs">
            <button type="button" className="active">Atividade</button>
            <button type="button">Tarefas (0)</button>
            <button type="button">Comentários (0)</button>
          </div>

          <div className="profile-popover-body">
            <button type="button" className="add-time-off-btn">
              + Adicionar folga
            </button>

            <div className="profile-detail-row">
              <span className="icon">✉</span>
              <span>samuel.uchoa@esup.edu.br</span>
            </div>

            <div className="profile-detail-row">
              <span className="icon">⏱</span>
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()} hora local</span>
            </div>

            <div className="profile-detail-row faint">
              <span className="icon">👤</span>
              <span>Nenhum gerente atribuído</span>
            </div>

            <div className="priorities-section">
              <div className="priorities-header">
                <strong>Prioridades <span>ⓘ</span></strong>
                <button type="button">+ Adicionar</button>
              </div>
              <div className="priorities-empty">
                <button type="button">+ Adicione suas tarefas mais importantes aqui.</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
