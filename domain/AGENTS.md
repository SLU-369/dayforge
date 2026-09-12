# Domain DOX

## Purpose

- Own browser-independent TypeScript domain contracts and deterministic rules shared by Dayforge product areas.

## Ownership

- `temporal/` owns identifiers, temporal values, recurring templates, concrete occurrences, execution history, transitions, and minimal availability contracts.

## Local Contracts

- Keep the domain independent from React, App Router, browser globals, persistence, APIs, and external services.
- Require callers to provide IDs and instants; never read the ambient clock or generate identity inside domain operations.
- Preserve original planning and append-only reschedule history. Terminal temporal states never return silently to `planned`.
- Temporal flexibility is exactly `fixed`, `preferred`, or `flexible`; opportunity belongs to availability contracts.
- Do not import or adapt `rotina-369:data:v1`; migration and persistence belong to Stage 1.2.

## Work Guidance

- Prefer readonly discriminated unions, small pure functions, explicit validation, and stable error codes.
- Keep intervals semi-open `[start, end)` and distinguish timed, date-only, and all-day schedules.
- Avoid framework-style abstractions and external dependencies unless a later stage proves them necessary.

## Verification

- Run focused temporal domain tests plus lint, typecheck, build, and the full test suite.
- Search the domain for prohibited imports and browser or persistence globals.

## Child DOX Index

- No child AGENTS.md files are needed for the current domain structure.
