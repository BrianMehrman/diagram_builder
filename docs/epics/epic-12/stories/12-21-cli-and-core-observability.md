# Story 12-21: CLI and Core Observability

## Story

**ID:** 12-21
**Key:** 12-21-cli-and-core-observability
**Title:** CLI Structured Logger and Core Timing Metadata
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-G Observability Gap Fill)
**Phase:** Implementation
**Priority:** LOW — Valuable for CLI debugging; core timing enables callers to record accurate metrics

**As a** developer running the CLI to import a codebase,
**I want** structured log output I can read and redirect,
**So that** I can debug CLI failures without adding print statements.

**As a** developer building features on top of core layout and export operations,
**I want** those operations to return duration metadata,
**So that** I can record accurate performance metrics without re-timing operations externally.

---

## Background

The `cli` package has no logger at all — errors surface as unhandled exceptions with no context. The `core` package is a pure library with no I/O; direct OTEL instrumentation is inappropriate, but expensive operations (layout computation, export serialization) currently return results with no timing information, making it impossible for callers to record accurate metrics.

Architecture spec: `docs/specs/2026-04-04-observability-architecture-design.md`

---

## Acceptance Criteria

### CLI

- **AC-1:** `packages/cli` has a Winston logger that writes structured JSON to stdout
- **AC-2:** Log level defaults to `info`; `--verbose` flag sets level to `debug`
- **AC-3:** CLI entry point and major command handlers log start, completion, and errors via the logger
- **AC-4:** Unhandled errors are caught at the top level and logged before `process.exit(1)`

### Core

- **AC-5:** At least two expensive core operations (layout computation, export serialization) return `{ result: T, durationMs: number }` instead of `T` directly
- **AC-6:** Existing callers updated to destructure `{ result }` — no behavior change
- **AC-7:** Return type changes are reflected in TypeScript types and do not break type-check

### Both

- **AC-8:** `npm run type-check && npm run lint && npm run format:check && npm test` — all clean

---

## Tasks

### Task 1: Add Winston logger to CLI

- [x] Add `winston` to `packages/cli/package.json` dependencies
- [x] Create `packages/cli/src/logger.ts`:
  - Winston logger with JSON format, stdout transport
  - Log level from `LOG_LEVEL` env var, defaulting to `info`
  - Export `logger` and `createModuleLogger(module: string)` (same pattern as API/parser)

### Task 2: Wire --verbose flag

- [x] In the CLI's Commander setup (`packages/cli/src/index.ts`):
  - Add global `-v, --verbose` option
  - When set, call `logger.level = 'debug'` before command execution

### Task 3: Instrument CLI commands

- [x] Added `log.info('command started', ...)`, `log.info('command complete', { durationMs })`, and `log.error('command failed', ...)` to command handlers

### Task 4: Top-level error handler

- [x] Wrapped `program.parseAsync()` with `.catch()` handler: `logger.error('unhandled error', { error }); process.exit(1)`

### Task 5: Identify expensive core operations

- [x] Identified: `exportToMermaid`, `exportToSVG`, `exportToDrawio` (serialization), `layoutGraph` (force-directed computation)

### Task 6: Add timing return to core operations

- [x] Changed return type of all four functions to `{ result: T; durationMs: number }`
- [x] Updated all callers in API services, CLI, and demo scripts to destructure `{ result }`

### Task 7: Write tests

- [x] CLI: test that `--verbose` sets log level to debug
- [x] CLI: test that top-level error handler catches and logs before exit
- [x] Core: test that timing metadata is returned and non-negative for all four operations

### Task 8: Verify

- [x] `npm run type-check` — clean (cli + core packages)
- [x] `npm run lint` — clean
- [x] `npm run format:check` — clean
- [x] `npm test` — all passing

---

## Dev Notes

### CLI Logger is stdout-only

The CLI is a one-shot process. No file transports, no Loki, no OTEL. Structured JSON to stdout means operators can pipe or redirect output as needed (`diagram-builder import ./repo 2>&1 | jq .`).

### Core Return Type Change

This is a breaking API change within the monorepo. Use TypeScript to find all callers (`tsc --noEmit` will catch them). The change is safe because `core` is not a public npm package — all consumers are within `packages/`.

### What Counts as "Expensive"

Focus on operations that take >10ms on typical inputs. Layout computation for graphs >100 nodes and export serialization for large diagrams are the primary candidates. Skip trivial operations — timing metadata is only worth the API noise if callers will actually use it.

### Out of Scope

- Loki shipping for CLI (one-shot process, no persistent connection)
- OTEL tracing for CLI (same reason)
- Core metrics (core has no Prometheus exporter — callers record the metrics)

---

## Change Log

- **2026-04-04**: Story created
  - Gap identified against observability architecture spec (`docs/specs/2026-04-04-observability-architecture-design.md`)
  - Part of Epic 12-G: Observability Gap Fill
- **2026-04-05**: All tasks confirmed complete; no post-merge bugs found.

**Status:** done
**Created:** 2026-04-04
**Last Updated:** 2026-04-05
