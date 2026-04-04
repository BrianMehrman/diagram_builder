# Story 12-19: Parser Observability

## Story

**ID:** 12-19
**Key:** 12-19-parser-observability
**Title:** Parser Observability — Traces, Metrics, and Loki Log Shipping
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-G Observability Gap Fill)
**Phase:** Implementation
**Priority:** HIGH — Parser runs are the most expensive operations in the system; currently invisible

**As a** developer investigating a slow or failed codebase import,
**I want** the parser package to emit structured logs to Loki, traces to Jaeger, and metrics to Prometheus,
**So that** I can diagnose parser performance and errors in Grafana without adding ad-hoc console logging.

---

## Background

All Epic 12 OTEL work (Stories 12-5, 12-6, 12-7) targeted `packages/api` only. The parser package has a Winston logger (`packages/parser/src/logger.ts`) that was completed in Story 12-13, but it only ships to console/file — no Loki transport and no OTEL instrumentation.

The API currently records a proxy `parser_duration_seconds` metric in `codebase-service.ts`. This should be replaced by metrics emitted directly from the parser with finer granularity. The API-side metric is removed as part of this story to avoid double-counting.

Architecture spec: `docs/specs/2026-04-04-observability-architecture-design.md`

---

## Acceptance Criteria

- **AC-1:** `packages/parser` has `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/exporter-trace-otlp-http`, and `@opentelemetry/exporter-prometheus` installed
- **AC-2:** Parser emits a root span `parser.run` with attributes: `language`, `file_count`, `repository_path`
- **AC-3:** Parser emits child spans for each phase: `parser.scan`, `parser.parse`, `parser.graph`
- **AC-4:** `PrometheusExporter` runs on port 9465 when `OTEL_ENABLED=true`
- **AC-5:** Three metrics emitted: `parser_files_total` (counter), `parser_run_duration_seconds` (histogram), `parser_errors_total` (counter) — see metric detail below
- **AC-6:** Parser Winston logger ships to Loki when `LOKI_ENABLED=true` with label `{app="diagram-builder-parser"}`
- **AC-7:** `config/prometheus/prometheus.yml` scrape config updated to include `parser:9465`
- **AC-8:** API's `parser_duration_seconds` metric removed from `packages/api/src/observability/metrics.ts` and its recording site in `codebase-service.ts`
- **AC-9:** All existing parser tests pass; new unit tests cover metric recording and span creation
- **AC-10:** `npm run type-check && npm run lint && npm run format:check && npm test` — all clean

---

## Metric Detail

| Metric | Type | Labels |
|---|---|---|
| `parser_files_total` | Counter | `language`, `status` (`parsed`, `skipped`, `error`) |
| `parser_run_duration_seconds` | Histogram | `language`, `phase` (`scan`, `parse`, `graph`) |
| `parser_errors_total` | Counter | `language`, `error_type` |

---

## Tasks

### Task 1: Install OTEL packages in parser

- [ ] Add to `packages/parser/package.json`:
  - `@opentelemetry/api`
  - `@opentelemetry/sdk-node`
  - `@opentelemetry/exporter-trace-otlp-http`
  - `@opentelemetry/exporter-prometheus`
  - `@opentelemetry/sdk-metrics`

### Task 2: Create parser observability module

- [ ] Create `packages/parser/src/observability/tracing.ts` — mirrors API pattern (`initTracing`, `shutdownTracing`, `getTracer`)
- [ ] Create `packages/parser/src/observability/metrics.ts` — `initMetrics`, exports `parserFilesTotal`, `parserRunDuration`, `parserErrorsTotal`; no-op defaults; `PrometheusExporter` on port 9465 when `OTEL_ENABLED=true`
- [ ] Create `packages/parser/src/observability/index.ts` — calls `initTracing()` and `initMetrics()`

### Task 3: Add Loki transport to parser logger

- [ ] Update `packages/parser/src/logger.ts`:
  - Add `winston-loki` transport when `LOKI_ENABLED=true`
  - Label: `{app: 'diagram-builder-parser'}`
  - Match API logger pattern from Story 12-7

### Task 4: Instrument parse pipeline

- [ ] Wrap the top-level parse entry point in a `parser.run` span (attributes: `language`, `file_count`, `repository_path`)
- [ ] Add child spans for `parser.scan`, `parser.parse`, `parser.graph` phases
- [ ] Record `parser_files_total` per file processed (increment with `language` + `status`)
- [ ] Record `parser_run_duration_seconds` at end of each phase
- [ ] Record `parser_errors_total` on caught parse errors

### Task 5: Update Prometheus scrape config

- [ ] Edit `config/prometheus/prometheus.yml`:
  - Add scrape job `diagram-builder-parser` targeting `parser:9465`

### Task 6: Remove API proxy metric

- [ ] Remove `parserDuration` from `packages/api/src/observability/metrics.ts`
- [ ] Remove `parserDuration.record(...)` call from `packages/api/src/services/codebase-service.ts`
- [ ] Remove `parserDuration` re-export from `packages/api/src/observability/instrumentation.ts`

### Task 7: Add env var config to parser

- [ ] Add `OTEL_ENABLED`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `LOKI_ENABLED`, `LOKI_HOST` to parser config (read from `process.env` directly or via a small config module — keep it lightweight, no Zod dependency needed)

### Task 8: Write tests

- [ ] Unit tests for metric recording: verify counters increment and histograms record
- [ ] Unit test for span creation: verify `parser.run` span emitted with correct attributes
- [ ] Verify Loki transport wired correctly in logger

### Task 9: Verify

- [ ] `npm run type-check` — clean (parser package)
- [ ] `npm run lint` — clean (parser package)
- [ ] `npm run format:check` — clean
- [ ] `npm test` — all passing
- [ ] Smoke test: run a parse job with `OTEL_ENABLED=true`, confirm spans in Jaeger and metrics at `localhost:9465/metrics`

---

## Dev Notes

### Pattern Reference

Mirror `packages/api/src/observability/` exactly — same file structure, same no-op default pattern for instruments, same env-gated initialization. The only differences are service name (`diagram-builder-parser`), port (9465), and the specific instruments defined.

### Parser Entry Point

Identify where the top-level parse call is made (likely `loadRepository` → `buildDependencyGraph` → `convertToIVM` pipeline) and wrap that in the root span. The API's `codebase-service.ts` is the caller — the span should start inside the parser, not the API.

### OTEL Init Order

If the parser is invoked in-process by the API, the API's OTEL SDK will already be initialized. The parser's `initTracing()` should check if a global tracer provider is already set before initializing its own — or simply use `trace.getTracer('diagram-builder-parser')` from the already-initialized global provider.

### Out of Scope

- Per-file spans (too noisy for large repos — can be added later behind a flag)
- Parser metrics in Grafana dashboard (covered by Story 12-23)

---

## Change Log

- **2026-04-04**: Story created
  - Gap identified against observability architecture spec (`docs/specs/2026-04-04-observability-architecture-design.md`)
  - Part of Epic 12-G: Observability Gap Fill

**Status:** backlog
**Created:** 2026-04-04
**Last Updated:** 2026-04-04
