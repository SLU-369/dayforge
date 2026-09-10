# Static 3D scene foundation

## Purpose

- Retain the inactive B.3.1 static proof for recoverability. The user chose the photographic environment instead; this code is not mounted by the application.

## Ownership

- `scene-preview.tsx`: lazy client-only boundary, static fallback and failure state.
- `castle-scene.tsx`: WebGPU/WebGL2 renderer, fixed responsive camera and static lighting.
- `scene-contract.ts`: asset manifest, environment and camera contracts.

## Local Contracts

- Do not reactivate via query string or navigation. Any reuse must respect the parent hybrid-scene contract and explicit user direction.
- Never read/write planner storage or change theme preferences from renderer code.
- Decorative Canvas is pointer-transparent and aria-hidden. Use on-demand rendering and stop when the tab is hidden.
- Keep the static image visible until a frame actually renders; initialization, loading and context failures must preserve a usable dashboard.
- `renderer=webgl2` forces the fallback backend for verification. Do not label it WebGPU merely because it uses WebGPURenderer.

## Work Guidance

- Use uniforms/refs for future animation; no per-frame React state.
- Keep nodes/materials compatible with WebGPURenderer. No gameplay controls or physics.

## Verification

- Lint/build and retained Node asset-structure tests still cover this dormant code/assets. Active browser tests verify that the castle preview is not loaded.

## Child DOX Index

- None.
