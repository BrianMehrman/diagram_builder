# Story 12-6: OTEL Metrics and Prometheus Exporter

## Story

**ID:** 12-6
**Key:** 12-6-otel-metrics-and-prometheus-exporter
**Title:** OTEL Metrics and Prometheus Exporter
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-C OTEL Instrumentation)
**Phase:** Implementation
**Priority:** HIGH - Enables Prometheus scraping and Grafana dashboards

**Description:**

Add OpenTelemetry metrics instrumentation to the API package with a Prometheus exporter exposing `/metrics`. Define the six metric instruments covering HTTP requests, WebSocket sessions, DB queries, cache operations, and parser duration. All metrics are no-op when `OTEL_ENABLED=false`.

---

## Acceptance Criteria

- **AC-1:** OTEL metrics packages installed
- **AC-2:** `observability/metrics.ts` created with `PrometheusExporter` and 6 metric instruments
- **AC-3:** `observability/instrumentation.ts` created with `withSpan` helper and `recordHttpMetrics`
- **AC-4:** `GET /metrics` returns valid Prometheus text format when `OTEL_ENABLED=true`
- **AC-5:** All instruments are no-op when `OTEL_ENABLED=false`
- **AC-6:** Unit tests pass for metrics initialization

---

## Tasks/Subtasks

### Task 1: Install packages

- [ ] Install additional packages in `packages/api/package.json`:
  - `@opentelemetry/sdk-metrics`
  - `@opentelemetry/exporter-prometheus`

### Task 2: Metrics setup

- [ ] Create `packages/api/src/observability/metrics.ts`
  - `PrometheusExporter` on the default metrics path (`/metrics`) using the API's existing HTTP server
  - `MeterProvider` with the Prometheus exporter as reader
  - Define and export metric instruments:
    - `httpRequestDuration`: `Histogram` — buckets `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]` — attributes: `method`, `route`, `status_code`
    - `httpRequestsTotal`: `Counter` — attributes: `method`, `route`, `status_code`
    - `wsActiveSessions`: `UpDownCounter` — attributes: `repository_id`
    - `dbQueryDuration`: `Histogram` — attributes: `operation`
    - `cacheOperationsTotal`: `Counter` — attributes: `operation` (get/set/del), `result` (hit/miss)
    - `parserDuration`: `Histogram` — attributes: `language`
  - Guard entire setup behind `OTEL_ENABLED` flag — no-op instruments when disabled

### Task 3: Instrumentation helpers

- [ ] Create `packages/api/src/observability/instrumentation.ts`
  - `withSpan<T>(name: string, attributes: Attributes, fn: (span: Span) => Promise<T>): Promise<T>` — wraps async ops in a named span, sets error status on throw
  - `recordHttpMetrics(method, route, statusCode, durationMs)` — increments counter + records histogram
  - Re-export all metric instruments for direct import by services

### Task 4: Wire up

- [ ] Update `packages/api/src/observability/index.ts` to call metrics initialization

### Task 5: Tests and validation

- [ ] Write unit tests for metrics initialization and instrument creation
- [ ] Verify Prometheus `/metrics` endpoint returns valid text format when `OTEL_ENABLED=true`

---

## Dev Notes

### Metric Instruments Reference

| Name | Type | Attributes |
|------|------|------------|
| `httpRequestDuration` | Histogram | method, route, status_code |
| `httpRequestsTotal` | Counter | method, route, status_code |
| `wsActiveSessions` | UpDownCounter | repository_id |
| `dbQueryDuration` | Histogram | operation |
| `cacheOperationsTotal` | Counter | operation, result |
| `parserDuration` | Histogram | language |

### Files Involved

- `packages/api/package.json` (modify — add metrics packages)
- `packages/api/src/observability/metrics.ts` (create)
- `packages/api/src/observability/instrumentation.ts` (create)
- `packages/api/src/observability/index.ts` (modify — add metrics init)

### Dependencies

- **Depends On:** Story 12-5 (OTEL SDK + `observability/index.ts` must exist)
- **Enables:** Story 12-7 (service-level instrumentation uses these instruments)
- **Enables:** Story 12-4 (Grafana dashboard panels rely on these metric names)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 3-4 hours

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-C

**Status:** backlog
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
