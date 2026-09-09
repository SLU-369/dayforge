# Ambient appearance

## Purpose

- Own the decorative castle, solar transition, clouds, and occasional sky visitors without changing product layout.

## Ownership

- `castle-backdrop.tsx` composes the scene using the shared appearance provider.
- `appearance-backdrop.tsx` selects the opt-in `?scene=3d` foundation once at layout mount; ordinary routes retain the approved image scene.
- `manual-celestial.tsx` delegates the manual path and sun/moon crossfade to native browser animations, independent of per-frame JavaScript. Global tokens settle at the start, never halfway through the path. Freeze the visible frame before cancelling on reversal.
- `solar-celestial.tsx` interpolates the automatic sun toward its calculated position one minute ahead; refresh immediately after returning from a hidden tab or changing cities.
- `ambient-sky.tsx` renders lightweight creature/silhouette visuals; `sky-schedule.ts` owns the cancellable, testable visit schedule.
- `castle-backdrop.module.css` owns scene lighting, lake/waterfall motion, cloud drift, flight paths, and responsive effects.

## Local Contracts

- Keep decoration aria-hidden, pointer-transparent, and behind all product content.
- The default scene uses a single aligned castle image with CSS lighting for day, twilight, and night. The opt-in 3D preview is owned by the child contract below.
- Clouds drift continuously; visitors appear one at a time for 24 seconds, with 55–130 seconds of empty sky between visits. First visit occurs after 12–24 seconds. Avoid immediate repeat species.
- Include hippogriffs, thestrals, birds, and students on broomsticks. Keep them subtle and below interactive content.
- Disable visitor scheduling when hidden, motion is paused, or reduced motion is requested. Resume with a fresh interval, never accumulated missed visits.
- Lake reflections and the visible waterfall move continuously through masks aligned to the castle image, with slow glints and restrained mist that remain perceptible behind translucent panels. Pause all water motion with ambient motion, reduce night opacity, and hide waterfall effects when their source region is outside the mobile crop.
- Manual theme transitions last 3.6 seconds with a shared duration/easing for the reversible celestial path, face crossfade, and scene lighting. Sun and moon occupy the same moving container; never remount them on theme changes or restart easing at intermediate keyframes. User preference: gentle continuous motion, no midpoint hitch, sudden acceleration, or residual sun passing after the moon.
- Solar tracking and orange twilight are exclusive to automatic mode; manual scenes remain stable after their transition. Sunrise/sunset bound the sun's path, centered at solar midday, with linear minute-long interpolation. Fade the automatic solar disc while it crosses the central castle silhouette so it reads as passing behind the towers. Solar lighting follows altitude, not fixed clock hours. Never animate page geometry.

## Work Guidance

- Reuse `app/appearance.ts` and `useTheme`; do not access planner storage here.
- Prefer composited opacity/transforms and small WebP assets; keep generated source images outside the repository.

## Verification

- Run the repository lint/build/tests. Inspect 1440×900, 1024×768, and 390×844 in both themes.
- Check motion pause, reduced-motion styles, no horizontal overflow, and browser console errors.

## Child DOX Index

- `scene3d/AGENTS.md`: client-only static castle proof, responsive camera, resource lifecycle and renderer fallback.
