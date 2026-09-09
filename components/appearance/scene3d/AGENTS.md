# Static 3D scene foundation

## Purpose

- Own the opt-in B.3.1 static proof, not the B.3.2 environment or B.3.3 inhabitants.

## Ownership

- `scene-preview.tsx`: lazy client-only boundary, static fallback and failure state.
- `castle-scene.tsx`: WebGPU/WebGL2 renderer, fixed responsive camera and static lighting.
- `scene-contract.ts`: asset manifest, environment and camera contracts.

## Local Contracts

- Activate only through `?scene=3d`; normal routes retain their existing backdrop until visual approval.
- Query selection is captured once at the layout boundary, so navigation does not recreate the scene.
- Never read/write planner storage or change theme preferences from renderer code.
- Decorative Canvas is pointer-transparent and aria-hidden. Use on-demand rendering and stop when the tab is hidden.
- Keep the static image visible until a frame actually renders; initialization, loading and context failures must preserve a usable dashboard.
- `renderer=webgl2` forces the fallback backend for verification. Do not label it WebGPU merely because it uses WebGPURenderer.

## Work Guidance

- Use uniforms/refs for future animation; no per-frame React state.
- Keep nodes/materials compatible with WebGPURenderer. No gameplay controls or physics.

## Verification

- Lint/build/Node tests and browser tests in the three requested viewports, both themes and fallback paths.

## Child DOX Index

- None.
