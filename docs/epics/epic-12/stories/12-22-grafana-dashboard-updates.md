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

- [ ] Determine whether to extend `api-overview.json` or create a separate `parser-overview.json`
  - Recommendation: create `parser-overview.json` to keep dashboards focused; cross-link via dashboard links

### Task 2: Add parser metric panels

Add the following panels to the parser dashboard:

- [ ] **Parse Run Rate** — `sum(rate(parser_files_total[5m]))` by `language`
- [ ] **Parse Duration p50 / p95** — `histogram_quantile(0.5|0.95, rate(parser_run_duration_seconds_bucket[5m]))` grouped by `phase`
- [ ] **Files by Status** — `sum by (status) (rate(parser_files_total[5m]))` (parsed / skipped / error)
- [ ] **Parse Error Rate** — `sum(rate(parser_errors_total[5m]))` by `error_type`

### Task 3: Add UI error panel (Loki-sourced)

- [ ] Add a panel to `api-overview.json` (or a new `ui-overview.json`):
  - **UI Error Rate** — LogQL: `sum(rate({app="diagram-builder-ui"} | json | level="error" [5m]))`
  - This uses the existing Loki datasource — no new Prometheus metric required

### Task 4: Verify dashboards load

- [ ] Start observability stack: `./scripts/init.sh --mode=local --observability`
- [ ] Open Grafana at `http://localhost:8743`
- [ ] Confirm all new panels load without errors (empty data is fine without active parser runs)
- [ ] Confirm Loki-sourced UI error panel renders without query errors

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

**Status:** backlog
**Created:** 2026-04-04
**Last Updated:** 2026-04-04
