# Scene asset preparation

## Purpose

- Retain reproducible offline preparation of the inactive B.3 castle experiment. These tools are not required to install or run the approved photographic frontend.

## Ownership

- `optimize-castle.mjs` simplifies sanitized GLB geometry and encodes KTX2/Meshopt.
- `prepare-castle.py` runs in Blender on the supplied source: `blender --background --factory-startup --disable-autoexec source.blend --python tooling/scene-assets/prepare-castle.py -- C:/Dev_369/dayforge/work`. Place the four documented CC0 JPGs under that work directory's `scene-materials/` before running. Output goes to `hogwarts-prepared/`.

## Local Contracts

- Input must have all source Textures.com images replaced with the documented CC0 materials.
- Tools and intermediate images belong in ignored `work/`; never execute embedded source scripts.
- Run with explicit input, output and official KTX Software `toktx` paths. The script overwrites only the explicit output and numbered scratch images.
- After regeneration, update attribution checksum and run asset/browser checks.

## Work Guidance

- Preserve existing original sources separately. Regeneration or new articulated models require a future authorized task; this tooling is not an outstanding step in the completed visual stage.

## Verification

- `node --test tests/scene-assets.test.mjs` and browser scene tests.

## Child DOX Index

- None.
