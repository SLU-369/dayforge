"use client";

import { MapPin, Moon, Sparkles, Sun, Sunrise, Sunset } from "lucide-react";
import { useTheme } from "@/app/theme-provider";
import { CAPITALS, solarSnapshot } from "@/app/appearance";
import styles from "./page.module.css";

export default function AppearancePage() {
  const { theme, preferences, ready, now, setTheme, updatePreferences } = useTheme();
  const city = CAPITALS.find((c) => c.id === preferences.cityId);
  const solar = city && now ? solarSnapshot(now, city) : null;
  const formatTime = (date: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: city!.timeZone, hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(date);
  return (
    <div className={styles.page}>
      <header className={styles.heading}><span>CONFIGURAÇÕES / APARÊNCIA</span><h1>A luz acompanha você.</h1><p>Escolha seu tema ou deixe o dia conduzir o cenário.</p></header>
      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="theme-heading">
          <div className={styles.title}><Sparkles size={22} /><h2 id="theme-heading">Aparência e tema</h2></div>
          <fieldset disabled={!ready} className={styles.themes}><legend>Tema manual</legend>
            <button type="button" aria-pressed={theme === "day" && preferences.mode === "manual"} onClick={() => setTheme("day")}><Sun size={26} /><strong>Dia</strong><span>Luz sobre o castelo</span></button>
            <button type="button" aria-pressed={theme === "night" && preferences.mode === "manual"} onClick={() => setTheme("night")}><Moon size={26} /><strong>Noite</strong><span>Luar e céu profundo</span></button>
          </fieldset>
          <div className={styles.toggle}><span><label htmlFor="solar-mode">Acompanhar o sol</label><small id="solar-help">Ative após escolher uma cidade. Uma troca manual desativa o automático.</small></span><input id="solar-mode" aria-describedby="solar-help" type="checkbox" role="switch" checked={preferences.mode === "automatic"} disabled={!ready || !city} onChange={(e) => updatePreferences({ mode: e.target.checked ? "automatic" : "manual" })} /></div>
          <label className={styles.city}><span><MapPin size={16} />Cidade de referência</span><select disabled={!ready} value={preferences.cityId ?? ""} onChange={(e) => updatePreferences({ cityId: e.target.value || null })}><option value="">Escolha uma capital</option>{CAPITALS.map((c) => <option value={c.id} key={c.id}>{c.name} · {c.state}</option>)}</select></label>
          <p className={styles.note}>Os horários são calculados neste dispositivo. Nenhuma localização é solicitada ou enviada.</p>
          <div className={styles.toggle}><span><label htmlFor="ambient-motion">Movimento do cenário</label><small id="motion-help">Nuvens lentas e visitas ocasionais: criaturas, pássaros e alunos em vassouras.</small></span><input id="ambient-motion" aria-describedby="motion-help" type="checkbox" role="switch" checked={preferences.ambientMotion} disabled={!ready} onChange={(e) => updatePreferences({ ambientMotion: e.target.checked })} /></div>
          <p className={styles.note}>A preferência de movimento reduzido do sistema sempre é respeitada.</p>
        </section>
        <aside className={styles.card} aria-labelledby="solar-heading"><span className={styles.eyebrow}>O RITMO DO DIA</span><h2 id="solar-heading">{city ? `${city.name} · ${city.state}` : "Um céu no seu horário"}</h2>
          {solar ? <><p>{preferences.mode === "automatic" ? "Automático ativo" : "Horários solares de referência"}</p><dl className={styles.events}><div><dt><Sunrise size={22} />Próximo nascer do sol</dt><dd>{formatTime(solar.nextSunrise)}</dd></div><div><dt><Sunset size={22} />Próximo pôr do sol</dt><dd>{formatTime(solar.nextSunset)}</dd></div></dl><p className={styles.note}>Horários na cidade selecionada. Entre dia e noite, a luz do cenário atravessa o crepúsculo.</p></> : <p>Selecione uma capital para ver o nascer e o pôr do sol e habilitar o ciclo automático.</p>}
          <div className={styles.status} role="status">{!ready ? "Carregando preferências…" : preferences.mode === "automatic" ? `Seguindo o sol em ${city?.name}` : `Tema ${theme === "day" ? "claro" : "escuro"} · controle manual`}</div>
        </aside>
      </div>
    </div>
  );
}
