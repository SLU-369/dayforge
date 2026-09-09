export type SceneQuality = "automatic" | "economy" | "balanced" | "high";
export type SceneEnvironment = { theme: "day" | "night" };
export type SceneAssetManifest = {
  id: string; version: number; url: string; attributionUrl: string;
  sourceUrl: string; license: string; animations: readonly string[];
};

export const CASTLE_ASSET: SceneAssetManifest = {
  id: "ju-designer-castle", version: 1, url: "/scenes/castle/castle.glb",
  attributionUrl: "/scenes/castle/ATTRIBUTION.md",
  sourceUrl: "https://sketchfab.com/3d-models/hogwarts-3d-70dcec840f8444dda2974aa6a9b049e2",
  license: "CC-BY-4.0 (geometry); CC0-1.0 (replacement textures)", animations: [],
};

export function sceneCamera(aspect: number) {
  const portrait = aspect < .8;
  return {
    position: (portrait ? [15, 8, 25] : [13, 7, 20]) as [number, number, number],
    target: (portrait ? [0, -2, 0] : [-3, 1.8, 0]) as [number, number, number],
    fov: portrait ? 45 : 36,
  };
}
