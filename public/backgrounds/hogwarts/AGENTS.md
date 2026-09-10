# Castle scene assets

## Purpose

- Provide lightweight decorative artwork for the Dayforge appearance system.

## Ownership

- `castle.webp`: generated castle/lake matte painting, 1536×1024, shared by all lighting states.
- `hippogriff.webp` and `thestral.webp`: generated transparent creature sprites, resized to 384×256.
- Root-owned legacy `public/backgrounds/day.webp` and `night.webp` remain available but are not used by this scene.

## Local Contracts

- Artwork was generated for this project, not extracted from Hogwarts Legacy. Recognizable fictional subject matter does not imply affiliation or a license from the rights holder.
- Twilight/night lighting, clouds, birds, and broom-riding student silhouettes are rendered in frontend code.
- Preserve alpha in sprites, retain original generation outputs outside Git, and avoid committing large PNG source files.

## Work Guidance

- Inspect replacements against both themes and portrait crops before integration.

## Verification

- Confirm assets load without errors and keep the castle recognizable in desktop and mobile backgrounds.

## Child DOX Index

- None.
