"use client";

import { useEffect, useRef } from "react";
import { landscapeFragment, landscapeVertex } from "./landscape-shader";
import styles from "./castle-backdrop.module.css";

type MotionSettings = { moving: boolean; day: number; twilight: number; duration: number };
type LandscapeRenderer = { update: (settings: MotionSettings) => void; dispose: () => void };

function createLandscape(canvas: HTMLCanvasElement, initial: MotionSettings): LandscapeRenderer | null {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, depth: false, powerPreference: "low-power" });
  if (!gl) return null;
  const program = gl.createProgram();
  const texture = gl.createTexture();
  if (!program || !texture) { gl.deleteProgram(program); gl.deleteTexture(texture); return null; }
  let disposed = false, loaded = false, frame = 0, lastFrame = 0, elapsed = 0, frames = 0;
  let settings = initial;
  let current = [initial.day, initial.twilight];
  let from = [...current], target = [...current], transitionStart = 0;
  const image = new Image();
  const shaders: WebGLShader[] = [];
  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener("webglcontextlost", lost);
    image.onload = null; image.onerror = null;
    gl.deleteTexture(texture); gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
  };
  const lost = (event: Event) => {
    event.preventDefault();
    canvas.style.visibility = "hidden";
    canvas.dataset.landscapeStatus = "fallback";
    dispose();
  };
  const schedule = () => { if (!frame && !disposed && loaded) frame = requestAnimationFrame(draw); };
  const observer = new ResizeObserver(schedule);
  const fail = () => { canvas.dataset.landscapeStatus = "fallback"; dispose(); };
  for (const [type, source] of [[gl.VERTEX_SHADER, landscapeVertex], [gl.FRAGMENT_SHADER, landscapeFragment]] as const) {
    const shader = gl.createShader(type);
    if (!shader) { fail(); return null; }
    shaders.push(shader);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { fail(); return null; }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { fail(); return null; }
  gl.useProgram(program);
  const resolution = gl.getUniformLocation(program, "resolution");
  const time = gl.getUniformLocation(program, "time");
  const light = gl.getUniformLocation(program, "light");
  gl.uniform1i(gl.getUniformLocation(program, "painting"), 0);
  function draw(now: number) {
    frame = 0;
    if (disposed) return;
    const delta = lastFrame ? Math.min((now-lastFrame)/1000,.05) : 0;
    lastFrame = now;
    if (settings.moving && !document.hidden) elapsed += delta;
    const progress = settings.duration ? Math.min(1,(now-transitionStart)/(settings.duration*1000)) : 1;
    const eased = progress*progress*(3-2*progress);
    current = target.map((value, index) => from[index]+(value-from[index])*eased);
    // One CSS pixel per pixel, capped at 1440 wide: no high-DPR full-screen buffer.
    const scale = Math.min(1,1440/canvas.clientWidth);
    const width = Math.max(1,Math.round(canvas.clientWidth*scale));
    const height = Math.max(1,Math.round(canvas.clientHeight*scale));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    gl.viewport(0,0,width,height);
    gl.uniform2f(resolution,width,height); gl.uniform1f(time,elapsed);
    gl.uniform2f(light,current[0],current[1]);
    gl.drawArrays(gl.TRIANGLES,0,3);
    canvas.dataset.landscapeStatus = "ready";
    canvas.dataset.landscapeFrames = String(++frames);
    if (!document.hidden && (settings.moving || progress < 1)) schedule();
  }
  image.onload = () => {
    if (disposed) return;
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    loaded = true; schedule();
  };
  image.onerror = fail;
  canvas.addEventListener("webglcontextlost",lost);
  observer.observe(canvas);
  image.src = "/backgrounds/hogwarts/castle.webp";
  return {
    update(next) {
      if (disposed) return;
      if (next.day !== target[0] || next.twilight !== target[1]) {
        from = [...current]; target = [next.day,next.twilight]; transitionStart = performance.now();
      }
      if (next.moving !== settings.moving) lastFrame = 0;
      settings = next; schedule();
    },
    dispose,
  };
}

export function LandscapeMotion(settings: MotionSettings) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<LandscapeRenderer | null>(null);
  useEffect(() => {
    if (!canvas.current) return;
    renderer.current = createLandscape(canvas.current, { moving: false, day: 0, twilight: 0, duration: 0 });
    if (!renderer.current) canvas.current.dataset.landscapeStatus = "fallback";
    return () => { renderer.current?.dispose(); renderer.current = null; };
  }, []);
  const { moving, day, twilight, duration } = settings;
  useEffect(() => { renderer.current?.update({ moving, day, twilight, duration }); }, [moving, day, twilight, duration]);
  return <canvas ref={canvas} className={styles.landscapeMotion} data-landscape-status="loading" aria-hidden="true" />;
}
