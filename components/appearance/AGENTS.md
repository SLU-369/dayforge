# Ambient appearance

## Purpose

- Own the decorative castle, solar transition, clouds, and occasional sky visitors without changing product layout.

## Ownership

- `castle-backdrop.tsx` composes the scene using the shared appearance provider.
- `appearance-backdrop.tsx` always selects the approved photographic scene, including old `?scene=3d` URLs. The rejected castle proof is retained but not imported by the application.
- `manual-celestial.tsx` delegates the manual path and sun/moon crossfade to native browser animations, independent of per-frame JavaScript. Global tokens settle at the start, never halfway through the path. Freeze the visible frame before cancelling on reversal.
- `solar-celestial.tsx` interpolates the automatic sun toward its calculated position one minute ahead; refresh immediately after returning from a hidden tab or changing cities.
- `ambient-sky.tsx` renders lightweight creature/silhouette visuals; `sky-schedule.ts` owns the cancellable, testable visit schedule.
- `landscape-motion.tsx` owns one optional WebGL2 overlay, bounded resolution, image loading, pause/resume and resource disposal. `landscape-shader.ts` owns water refraction, downward flow, mist and advected cloud wisps.
- `castle-backdrop.module.css` owns scene lighting, overlay placement and legacy flight paths.

## Local Contracts

- Keep decoration aria-hidden, pointer-transparent, and behind all product content.
- Keep the exact castle image and CSS lighting for day, twilight, and night; no full 3D landscape. The inactive experiment is owned by the child contract below.
- Clouds drift continuously; visitors appear one at a time for 24 seconds, with 55–130 seconds of empty sky between visits. First visit occurs after 12–24 seconds. Avoid immediate repeat species.
- Intended visitors include hippogriffs, thestrals, birds, and students on broomsticks. Current raster/SVG visitors are legacy placeholders, not the requested articulated 3D result. Replacements require suitable models and visual review; keep them subtle and below interactive content.
- Disable visitor scheduling when hidden, motion is paused, or reduced motion is requested. Resume with a fresh interval, never accumulated missed visits.
- Water uses localized sampling displacement, never translating/scaling copies of the whole photograph or adding repeating bright stripes. Masks are in source-image coordinates and follow the same centered cover crop at every viewport, excluding riverbanks and structures. Clouds are procedural wisps in the open lateral sky; the painted clouds remain part of the static image.
- Pause environmental time when disabled, hidden or reduced motion is requested; resume without elapsed-time jumps. Theme lighting can redraw while paused, without moving water/clouds. GPU failure/context loss leaves the original static scene usable. Never render per-frame React state or persist scene data in planner storage.
- Manual theme transitions last 3.6 seconds with a shared duration/easing for the reversible celestial path, face crossfade, and scene lighting. Sun and moon occupy the same moving container; never remount them on theme changes or restart easing at intermediate keyframes. User preference: gentle continuous motion, no midpoint hitch, sudden acceleration, or residual sun passing after the moon.
- Solar tracking and orange twilight are exclusive to automatic mode; manual scenes remain stable after their transition. Sunrise/sunset bound the sun's path, centered at solar midday, with linear minute-long interpolation. Fade the automatic solar disc while it crosses the central castle silhouette so it reads as passing behind the towers. Solar lighting follows altitude, not fixed clock hours. Never animate page geometry.

## Work Guidance

- Reuse `app/appearance.ts` and `useTheme`; do not access planner storage here.
- Use the existing WebP as the overlay's only texture. Cap the buffer at 1440 pixels wide and one CSS pixel per pixel; leave photographic fallback layers intact. Keep generated source images outside the repository.

## Verification

- Run the repository lint/build/tests. Inspect 1440×900, 1024×768, and 390×844 in both themes.
- Run `npx.cmd playwright test`: themes, pause/reduced motion, fixed castle vs changing lake pixels, three viewports, old preview URL, no model downloads, GPU failure/context loss, route continuity and planner storage. Review the recorded water/cloud movement; tests alone do not establish naturalness.

## Child DOX Index

- `scene3d/AGENTS.md`: inactive static castle experiment, responsive camera, resource lifecycle and renderer fallback.
