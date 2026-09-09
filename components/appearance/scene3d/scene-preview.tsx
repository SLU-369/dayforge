"use client";

import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "@/app/theme-provider";
import { CASTLE_ASSET } from "./scene-contract";
import styles from "./scene-preview.module.css";

const CastleScene = lazy(() => import("./castle-scene"));
class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function ScenePreview() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [backend, setBackend] = useState("loading");
  const readyRef = useRef(false);
  const fail = useCallback(() => { setFailed(true); setReady(false); }, []);
  const rendered = useCallback((name: string) => { readyRef.current = true; setBackend(name); setReady(true); }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    const timeout = window.setTimeout(() => {
      // A stalled asset/renderer must not leave an invisible, running canvas behind.
      if (!readyRef.current) setFailed(true);
    }, 30000);
    return () => { cancelAnimationFrame(frame); clearTimeout(timeout); };
  }, []);
  return <>
    <div className={styles.backdrop} data-theme={theme} data-scene-status={failed ? "fallback" : ready ? "ready" : "loading"} data-scene-backend={backend} aria-hidden="true">
      <div className={styles.poster} />
      <div className={styles.canvas} data-ready={ready}>
        {mounted && !failed && <SceneBoundary onFailure={fail}><Suspense fallback={null}>
          <CastleScene environment={{ theme }} onReady={rendered} onFailure={fail} />
        </Suspense></SceneBoundary>}
      </div>
    </div>
    <aside className={styles.credit} aria-label="Créditos da prévia 3D">
      Prévia estática B.3.1 · {failed ? "Imagem de segurança" : backend === "loading" ? "Carregando" : backend} · <a href={CASTLE_ASSET.attributionUrl} target="_blank" rel="noreferrer">Ju Designer / CC BY 4.0 · créditos</a>
    </aside>
  </>;
}
