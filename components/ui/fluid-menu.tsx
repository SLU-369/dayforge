"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

export type FluidMenuItem = {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

type FluidMenuProps = {
  ariaLabel: string;
  items: FluidMenuItem[];
};

export function FluidMenu({ ariaLabel, items }: FluidMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemsId = useId();

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      const focusWasInside = root.contains(document.activeElement);
      setIsExpanded(false);
      if (focusWasInside && !(event.target instanceof HTMLElement && event.target.closest("button, a, input, textarea, select, [tabindex]"))) {
        triggerRef.current?.focus();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !isExpanded) return;
      setIsExpanded(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  return (
    <nav
      ref={rootRef}
      className="fluid-menu"
      data-expanded={isExpanded}
      aria-label={ariaLabel}
    >
      <button
        ref={triggerRef}
        type="button"
        className="fluid-menu-trigger"
        aria-expanded={isExpanded}
        aria-controls={itemsId}
        aria-label={isExpanded ? "Fechar navegação" : "Abrir navegação"}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <span className="fluid-menu-trigger-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="fluid-menu-tooltip" aria-hidden="true">
          {isExpanded ? "Fechar" : "Menu"}
        </span>
      </button>

      <div id={itemsId} className="fluid-menu-items" aria-hidden={!isExpanded}>
        {items.map((item, index) => (
          <div
            className="fluid-menu-item-shell"
            key={item.id}
            style={{ "--fluid-index": index + 1 } as CSSProperties}
          >
            <button
              type="button"
              className={`fluid-menu-item${item.danger ? " danger" : ""}`}
              data-active={item.active || undefined}
              aria-current={item.active ? "page" : undefined}
              aria-label={item.label}
              disabled={item.disabled}
              tabIndex={isExpanded ? 0 : -1}
              onClick={() => {
                item.onSelect();
                setIsExpanded(false);
                triggerRef.current?.focus();
              }}
            >
              <span className="fluid-menu-symbol" aria-hidden="true">{item.icon}</span>
              <span className="fluid-menu-tooltip" aria-hidden="true">{item.label}</span>
            </button>
          </div>
        ))}
      </div>
    </nav>
  );
}
