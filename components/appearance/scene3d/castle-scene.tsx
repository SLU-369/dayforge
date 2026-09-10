"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Box3, Vector3, Mesh, MeshStandardMaterial, PerspectiveCamera, Texture, type Group } from "three";
import { WebGPURenderer } from "three/webgpu";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { CASTLE_ASSET, sceneCamera, type SceneEnvironment } from "./scene-contract";

type SceneProps = { environment: SceneEnvironment; onReady: (backend: string) => void; onFailure: () => void };

function Composition({ environment, model, onReady }: Pick<SceneProps, "environment" | "onReady"> & { model: Group }) {
  const { camera, size, invalidate, gl, scene } = useThree();
  useLayoutEffect(() => {
    const renderer = gl as unknown as WebGPURenderer;
    const canvas = renderer.domElement;
    const before = scene.onAfterRender;
    let reported = false;
    let frames = 0;
    scene.onAfterRender = () => {
      canvas.dataset.sceneFrames = String(++frames);
      if (reported) return;
      reported = true;
      canvas.dataset.sceneReadyMs = String(Math.round(performance.now()));
      onReady("isWebGPUBackend" in renderer.backend ? "WebGPU" : "WebGL 2");
    };
    invalidate();
    return () => { scene.onAfterRender = before; };
  }, [gl, scene, invalidate, onReady]);
  useLayoutEffect(() => {
    const frame = sceneCamera(size.width / size.height);
    if (camera instanceof PerspectiveCamera) { camera.fov = frame.fov; camera.updateProjectionMatrix(); }
    camera.position.set(...frame.position); camera.lookAt(...frame.target); invalidate();
  }, [camera, size, invalidate]);
  useLayoutEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
        if (mat instanceof MeshStandardMaterial && mat.emissive.getHex() !== 0) mat.emissiveIntensity = environment.theme === "night" ? 1.1 : .03;
      }
    });
    invalidate();
  }, [model, environment.theme, invalidate]);
  const night = environment.theme === "night";
  return <>
    <color attach="background" args={[night ? "#182839" : "#adcbd9"]} />
    <fog attach="fog" args={[night ? "#182839" : "#adcbd9", 34, 95]} />
    <hemisphereLight args={[night ? "#819bbd" : "#e3f0ff", night ? "#182722" : "#777b62", night ? 1 : 2]} />
    <directionalLight position={[-12, 18, 10]} intensity={night ? .8 : 3} color={night ? "#a3c5fc" : "#fff0d4"} />
    <primitive object={model} dispose={null} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .03, 0]}>
      <planeGeometry args={[240, 240]} />
      <meshStandardMaterial color={night ? "#142e3d" : "#517f91"} roughness={.35} metalness={.3} />
    </mesh>
  </>;
}

function LoadedModel(props: SceneProps) {
  const { gl } = useThree();
  const [model, setModel] = useState<Group | null>(null);
  const { onFailure } = props;
  useEffect(() => {
    let disposed = false;
    let resource: Group | undefined;
    const controller = new AbortController();
    const texturesLoader = new KTX2Loader().setTranscoderPath("/scenes/basis/").setWorkerLimit(2)
      .detectSupport(gl as unknown as WebGPURenderer);
    const release = (group: Group) => {
      const textures = new Set<Texture>();
      group.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
          material.dispose();
        }
      });
      for (const texture of textures) { texture.dispose(); if (texture.image instanceof ImageBitmap) texture.image.close(); }
    };
    void (async () => {
      try {
        const response = await fetch(CASTLE_ASSET.url, { signal: controller.signal });
        if (!response.ok) throw new Error("Scene asset unavailable");
        const data = await response.arrayBuffer();
        if (disposed) return;
        const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(texturesLoader);
        const gltf = await loader.parseAsync(data, "/scenes/castle/");
        if (disposed) { release(gltf.scene); return; }
        resource = gltf.scene;
        const bounds = new Box3().setFromObject(resource);
        const center = bounds.getCenter(new Vector3());
        const factor = 12 / bounds.getSize(new Vector3()).x;
        resource.scale.setScalar(factor);
        resource.position.set(-center.x * factor, -bounds.min.y * factor, -center.z * factor);
        setModel(resource);
      } catch { if (!disposed) onFailure(); }
    })();
    return () => { disposed = true; controller.abort(); texturesLoader.dispose(); if (resource) release(resource); };
  }, [gl, onFailure]);
  return model ? <Composition environment={props.environment} model={model} onReady={props.onReady} /> : null;
}

export default function CastleScene(props: SceneProps) {
  const [visible, setVisible] = useState(true);
  const { onFailure } = props;
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { document.removeEventListener("visibilitychange", update); };
  }, []);
  const createRenderer = useCallback(async (defaults: { canvas: EventTarget }) => {
    if (!(defaults.canvas instanceof HTMLCanvasElement)) throw new Error("Scene requires an HTML canvas");
    const renderer = new WebGPURenderer({ canvas: defaults.canvas, antialias: true, forceWebGL: new URLSearchParams(window.location.search).get("renderer") === "webgl2" });
    renderer.onDeviceLost = onFailure;
    try { await renderer.init(); } catch { onFailure(); }
    return renderer;
  }, [onFailure]);
  return <Canvas frameloop={visible ? "demand" : "never"} dpr={[1, 1.5]} camera={{ near: .1, far: 150 }}
    gl={createRenderer}>
    <LoadedModel {...props} />
  </Canvas>;
}
