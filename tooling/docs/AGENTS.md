# Documentation tooling

## Purpose

- Own deterministic generation and verification of derived documentation artifacts.

## Ownership

- `generate-master.mjs` compiles the numbered canonical documents into `docs/DAYFORGE_MASTER_SPEC.md`.

## Local Contracts

- Numbered Markdown files in `docs/` are canonical; the master has no independent authored content.
- Generation must be deterministic and must not add timestamps, environment-specific paths, or external dependencies.
- Check mode is read-only and fails when the committed master differs from generated content.

## Work Guidance

- Keep document order lexical by two-digit prefix and normalize output to LF with one final newline.

## Verification

- Run `npm.cmd run docs:master:check` after changing canonical documentation or this generator.

## Child DOX Index

- None.
