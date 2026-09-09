"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Settings2, SlidersHorizontal, Sparkles, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ThemeToggle from "@/app/theme-toggle";
import { usePlanner } from "@/app/planner-context";
import {
  contextualItems,
  navigationSections,
  pathIsActive,
  sectionIsActive,
} from "./navigation-config";
import styles from "./app-shell.module.css";
import { AnimatedNavigationLink, NavigationIcon } from "./animated-navigation-link";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { toast } = usePlanner();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Tab" && mobileOpen && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
        );
        const first = focusable[0];
        const last = focusable.at(-1);
        if (first && last && event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (first && last && !event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.key !== "Escape") return;
      if (openMenu) headerRef.current?.querySelector<HTMLButtonElement>(`button[aria-controls="menu-${openMenu}"]`)?.focus();
      if (profileOpen) profileRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      setOpenMenu(null);
      setProfileOpen(false);
      if (mobileOpen) {
        setMobileOpen(false);
        mobileTriggerRef.current?.focus();
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (headerRef.current && !headerRef.current.contains(target)) setOpenMenu(null);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [mobileOpen, openMenu, profileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstMobileLinkRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const contextItems = contextualItems(pathname);
  const closeNavigation = () => {
    setOpenMenu(null);
    setMobileOpen(false);
    setProfileOpen(false);
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header} ref={headerRef}>
        <div className={styles.headerInner}>
          <Link href="/hoje" className={styles.brand} aria-label="Dayforge — Hoje" onClick={closeNavigation}>
            <span className={styles.brandMark}>DF</span>
            <span>Dayforge</span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Navegação principal">
            {navigationSections.map((section) => {
              const active = sectionIsActive(pathname, section);
              if (section.href) {
                return (
                  <Link key={section.label} href={section.href} className={styles.navLink} data-active={active || undefined} onClick={closeNavigation}>
                    {section.label}
                  </Link>
                );
              }

              const expanded = openMenu === section.label;
              return (
                <div className={styles.menuRoot} key={section.label}>
                  <button
                    type="button"
                    className={styles.navLink}
                    data-active={active || undefined}
                    data-open={expanded || undefined}
                    aria-expanded={expanded}
                    aria-controls={`menu-${section.label}`}
                    onClick={() => {
                      setProfileOpen(false);
                      setOpenMenu(expanded ? null : section.label);
                    }}
                  >
                    {section.label}
                  </button>
                  {expanded && (
                    <nav id={`menu-${section.label}`} className={styles.megaMenu} aria-label={`Áreas de ${section.label}`}>
                      <div className={styles.megaMenuHeading}>
                        <section.icon size={20} aria-hidden="true" />
                        <div><span>Explorar</span><strong>{section.label}</strong></div>
                      </div>
                      <div className={styles.megaMenuGrid}>
                        {section.items?.map((item) => (
                          <AnimatedNavigationLink key={item.href} href={item.href} className={styles.megaMenuItem} data-active={pathIsActive(pathname, item.href) || undefined} onClick={closeNavigation}>
                            <NavigationIcon icon={item.icon} framed />
                            <span><strong>{item.label}</strong><small>{item.description}</small></span>
                          </AnimatedNavigationLink>
                        ))}
                      </div>
                    </nav>
                  )}
                </div>
              );
            })}
          </nav>

          <div className={styles.headerActions}>
            <Link className={styles.addAction} href="/hoje?new=activity" aria-label="Adicionar atividade" onClick={closeNavigation}>
              <Plus size={18} aria-hidden="true" /><span>Adicionar</span>
            </Link>
            <ThemeToggle compact />
            <div className={styles.profileRoot} ref={profileRef}>
              <button
                type="button"
                className={styles.profileTrigger}
                aria-label="Abrir menu do perfil"
                aria-expanded={profileOpen}
                onClick={() => {
                  setOpenMenu(null);
                  setProfileOpen((open) => !open);
                }}
              >
                <UserRound size={18} aria-hidden="true" />
              </button>
              {profileOpen && (
                <nav className={styles.profileMenu} aria-label="Perfil e configurações">
                  <div className={styles.profileHeading}><span>Perfil local</span><strong>Samuel</strong></div>
                  <Link href="/configuracoes/aparencia" onClick={closeNavigation}><Sparkles size={17} aria-hidden="true" />Aparência e tema</Link>
                  <Link href="/preferencias" onClick={closeNavigation}><SlidersHorizontal size={17} aria-hidden="true" />Preferências</Link>
                  <Link href="/configuracoes/dados-e-backup" onClick={closeNavigation}><Settings2 size={17} aria-hidden="true" />Dados e backup</Link>
                </nav>
              )}
            </div>
            <button
              ref={mobileTriggerRef}
              type="button"
              className={styles.mobileTrigger}
              aria-label="Abrir navegação"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} aria-hidden="true" />
            </button>
          </div>
        </div>

        {contextItems.length > 0 && (
          <nav className={styles.contextNav} aria-label="Navegação da área">
            <div className={styles.contextNavInner}>
              {contextItems.map((item) => (
                <Link key={item.href} href={item.href} data-active={pathIsActive(pathname, item.href) || undefined} onClick={closeNavigation}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className={styles.content}>{children}</main>

      {mobileOpen && (
        <div className={styles.mobileBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) {
            setMobileOpen(false);
            mobileTriggerRef.current?.focus();
          }
        }}>
          <section ref={drawerRef} className={styles.mobileDrawer} role="dialog" aria-modal="true" aria-label="Navegação principal">
            <div className={styles.drawerHeading}>
              <div><span className={styles.brandMark}>DF</span><strong>Dayforge</strong></div>
              <button type="button" aria-label="Fechar navegação" onClick={() => {
                setMobileOpen(false);
                mobileTriggerRef.current?.focus();
              }}><X size={21} aria-hidden="true" /></button>
            </div>
            <nav className={styles.mobileNav}>
              {navigationSections.map((section, sectionIndex) => (
                <div className={styles.mobileGroup} key={section.label}>
                  <span>{section.label}</span>
                  {section.href ? (
                    <AnimatedNavigationLink ref={sectionIndex === 0 ? firstMobileLinkRef : undefined} href={section.href} data-active={sectionIsActive(pathname, section) || undefined} onClick={closeNavigation}>
                      <NavigationIcon icon={section.icon} />{section.label}
                    </AnimatedNavigationLink>
                  ) : section.items?.map((item) => (
                    <AnimatedNavigationLink key={item.href} href={item.href} data-active={pathIsActive(pathname, item.href) || undefined} onClick={closeNavigation}>
                      <NavigationIcon icon={item.icon} /><span><strong>{item.label}</strong><small>{item.description}</small></span>
                    </AnimatedNavigationLink>
                  ))}
                </div>
              ))}
              <div className={styles.mobileGroup}>
                <span>Configurações</span>
                <AnimatedNavigationLink href="/configuracoes/aparencia" onClick={closeNavigation}><NavigationIcon icon={Sparkles} />Aparência e tema</AnimatedNavigationLink>
                <Link href="/preferencias" onClick={closeNavigation}><SlidersHorizontal size={19} aria-hidden="true" />Preferências</Link>
                <Link href="/configuracoes/dados-e-backup" onClick={closeNavigation}><Settings2 size={19} aria-hidden="true" />Dados e backup</Link>
              </div>
            </nav>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
