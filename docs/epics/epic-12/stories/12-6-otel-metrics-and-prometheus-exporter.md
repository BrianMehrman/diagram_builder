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

- [x] Install additional packages in `packages/api/package.json`:
  - `@opentelemetry/sdk-metrics`
  - `@opentelemetry/exporter-prometheus`

### Task 2: Metrics setup

- [x] Created `packages/api/src/observability/metrics.ts`
  - `PrometheusExporter` on port 9464 when OTEL_ENABLED
  - `MeterProvider` with Prometheus reader
  - All 6 instruments eagerly initialized with no-op meter (always safe to call)
  - OTEL_ENABLED=true replaces with real instruments

### Task 3: Instrumentation helpers

- [x] Created `packages/api/src/observability/instrumentation.ts`
  - `withSpan<T>` — wraps async ops in named spans, records error status on throw
  - `recordHttpMetrics` — increments counter + records histogram
  - Re-exports all 6 metric instruments

### Task 4: Wire up

- [x] `observability/index.ts` calls both `initTracing()` and `initMetrics()`

### Task 5: Tests and validation

- [x] 412 API tests pass; instruments validated to be always non-null

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
- **2026-03-24**: Story complete — PrometheusExporter + 6 metric instruments + withSpan/recordHttpMetrics helpers

**Status:** done
**Created:** 2026-03-22
**Last Updated:** 2026-03-24
