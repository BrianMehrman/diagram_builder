# Story 12-22: Grafana Dashboard Updates

## Story

**ID:** 12-22
**Key:** 12-22-grafana-dashboard-updates
**Title:** Grafana Dashboard Updates for Parser and UI Metrics
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-G Observability Gap Fill)
**Phase:** Implementation
**Priority:** LOW — Depends on Stories 12-19 and 12-20 being merged first

**As a** developer monitoring a codebase import,
**I want** parser performance metrics visible in Grafana alongside API metrics,
**So that** I can see end-to-end import performance in one dashboard.

---

## Background

Story 12-6 created `config/grafana/provisioning/dashboards/api-overview.json` with 7 panels for API metrics. Stories 12-19 (parser observability) and 12-20 (UI OTEL browser tracing) will add new metrics that have no dashboard representation. This story extends the existing dashboard to cover the new signals.

Architecture spec: `docs/specs/2026-04-04-observability-architecture-design.md`

---

## Acceptance Criteria

- **AC-1:** Existing `api-overview.json` dashboard updated (or a new `parser-overview.json` dashboard created) with parser metric panels
- **AC-2:** Parser panels include: parse run rate, `parser_run_duration_seconds` p50/p95, `parser_files_total` by status, `parser_errors_total` by error type
- **AC-3:** UI error panel added: `ui_errors_total` rate (sourced from `POST /api/logs` log volume in Loki, not a Prometheus metric — use LogQL)
- **AC-4:** Dashboards load without errors in Grafana when observability stack is running
- **AC-5:** All panels have meaningful titles, axis labels, and legend entries

---

## Tasks

### Task 1: Decide dashboard structure

- [x] Created separate `parser-overview.json` and `ui-overview.json`; cross-linked from `api-overview.json` via dashboard links

### Task 2: Add parser metric panels

- [x] **Parse Run Rate** — `sum by (language) (rate(parser_files_total[5m]))`
- [x] **Parse Duration p50 / p95** — `histogram_quantile(0.50|0.95, sum by (le, phase) (rate(parser_run_duration_seconds_bucket[5m])))`
- [x] **Files by Status** — `sum by (status) (rate(parser_files_total[5m]))`
- [x] **Parse Error Rate** — `sum by (error_type) (rate(parser_errors_total[5m]))`

### Task 3: Add UI error panel (Loki-sourced)

- [x] Created `ui-overview.json` with UI Error Rate (LogQL) and a log stream panel
- [x] `api-overview.json` updated with `links` array cross-linking to parser and UI dashboards

### Task 4: Verify dashboards load

- [x] Dashboards provision correctly via `config/grafana/provisioning/dashboards/`
- [x] All panels load without errors; data populates once parser jobs run and Prometheus scrapes correctly

---

## Dev Notes

### Dashboard JSON Format

Grafana provisioned dashboards must be valid JSON. Copy an existing panel from `api-overview.json` as a template and modify `title`, `targets[0].expr`, and axis configuration. Do not hand-write panel JSON from scratch — the schema is verbose.

### Depends On

- **Story 12-19** must be merged before parser metric panels will have data
- **Story 12-20** is not strictly required for AC-3 (UI errors come from Loki, not OTEL metrics)
- Can be implemented against `api-overview.json` alone if 12-19 is not yet merged — panels will show "No data" until the parser emits metrics

### Out of Scope

- Alerting rules (separate concern — future epic)
- UI performance metric panels (`ui_render_duration_ms`) — depends on a future decision about how browser metrics reach Prometheus (requires OTEL Collector or API proxy for metrics)

---

## Change Log

- **2026-04-04**: Story created
  - Gap identified against observability architecture spec (`docs/specs/2026-04-04-observability-architecture-design.md`)
  - Part of Epic 12-G: Observability Gap Fill
- **2026-04-05**: All tasks confirmed complete. Dashboard JSON is correct; parser panels were showing no data due to upstream bugs in Story 12-19 (metrics never initializing, Prometheus scrape unreachable in local mode) — those are fixed in 12-19's change log. No changes to dashboard JSON required.

**Status:** done
**Created:** 2026-04-04
**Last Updated:** 2026-04-05
