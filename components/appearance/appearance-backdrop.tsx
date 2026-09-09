"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { CastleBackdrop } from "./castle-backdrop";

const ScenePreview = lazy(() => import("./scene3d/scene-preview"));

export function AppearanceBackdrop() {
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPreview(new URLSearchParams(window.location.search).get("scene") === "3d");
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  if (!preview) return <CastleBackdrop />;
  return <Suspense fallback={<CastleBackdrop />}><ScenePreview /></Suspense>;
}
