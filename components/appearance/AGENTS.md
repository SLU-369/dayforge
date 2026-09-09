# Ambient appearance

## Purpose

- Own the decorative castle, solar transition, clouds, and occasional sky visitors without changing product layout.

## Ownership

- `castle-backdrop.tsx` composes the scene using the shared appearance provider.
- `ambient-sky.tsx` renders lightweight creature/silhouette visuals; `sky-schedule.ts` owns the cancellable, testable visit schedule.
- `castle-backdrop.module.css` owns scene lighting, cloud drift, flight paths, and responsive effects.

## Local Contracts

- Keep decoration aria-hidden, pointer-transparent, and behind all product content.
- Use a single aligned castle image with CSS lighting for day, twilight, and night; do not claim these are extracted game assets or distinct rendered night artwork.
- Clouds drift continuously; visitors appear one at a time for 24 seconds, with 55–130 seconds of empty sky between visits. First visit occurs after 12–24 seconds. Avoid immediate repeat species.
- Include hippogriffs, thestrals, birds, and students on broomsticks. Keep them subtle and below interactive content.
- Disable visitor scheduling when hidden, motion is paused, or reduced motion is requested. Resume with a fresh interval, never accumulated missed visits.
- Manual theme transitions last approximately 1.8 seconds; solar lighting interpolates continuously from altitude. Never animate page geometry.

## Work Guidance

- Reuse `app/appearance.ts` and `useTheme`; do not access planner storage here.
- Prefer composited opacity/transforms and small WebP assets; keep generated source images outside the repository.

## Verification

- Run the repository lint/build/tests. Inspect 1440×900, 1024×768, and 390×844 in both themes.
- Check motion pause, reduced-motion styles, no horizontal overflow, and browser console errors.

## Child DOX Index

- None.
