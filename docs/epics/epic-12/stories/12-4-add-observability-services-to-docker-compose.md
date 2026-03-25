# Story 12-4: Add Observability Services to Docker Compose

## Story

**ID:** 12-4
**Key:** 12-4-add-observability-services-to-docker-compose
**Title:** Add Observability Services to Docker Compose
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-B Docker Compose Full Stack)
**Phase:** Implementation
**Priority:** HIGH - Enables local observability stack (Jaeger, Prometheus, Grafana)

**Description:**

Add Jaeger, Prometheus, and Grafana to Docker Compose under the `observability` profile. Create all required configuration files (prometheus.yml, Grafana datasources, dashboard provisioning). Update port documentation to include new observability service ports.

---

## Acceptance Criteria

- **AC-1:** `jaeger`, `prometheus`, and `grafana` services added under `observability` profile
- **AC-2:** Prometheus scrapes API `/metrics` endpoint every 15s
- **AC-3:** Grafana provisioned with Prometheus and Jaeger datasources
- **AC-4:** API overview dashboard provisioned with 7 panels
- **AC-5:** `PORT-CONFIGURATION.md` updated with new service ports

---

## Tasks/Subtasks

### Task 1: Add observability services

- [x] Added `jaeger` service (profile: `observability`) — `jaegertracing/all-in-one:2.1`, ports 16686/4317/4318
- [x] Added `prometheus` service (profile: `observability`) — `prom/prometheus:v3.1.0`, port 9090
- [x] Added `grafana` service (profile: `observability`) — `grafana/grafana:11.4.0`, port 3001:3000
- [x] Added `prometheus-data` and `grafana-data` volumes

### Task 2: Prometheus configuration

- [x] Created `config/prometheus/prometheus.yml`
  - `scrape_interval: 15s`, `evaluation_interval: 15s`
  - Scrape job `diagram-builder-api`: target `api:9464` (PrometheusExporter port), path `/metrics`
  - Self-scrape job

### Task 3: Grafana provisioning

- [x] Created `config/grafana/provisioning/datasources/datasources.yaml` — Prometheus (default) + Jaeger
- [x] Created `config/grafana/provisioning/dashboards/dashboards.yaml` — file-based provider
- [x] Created `config/grafana/provisioning/dashboards/api-overview.json` — 7 panels:
  - HTTP request rate by route, HTTP latency p50/p95/p99, HTTP error rate 4xx/5xx
  - Active WebSocket sessions (stat), Cache hit/miss rate, DB query duration p50/p95, Jaeger link

### Task 4: Documentation

- [x] Updated `PORT-CONFIGURATION.md` — added Grafana (3001), Jaeger UI (16686), Prometheus (9090), OTLP HTTP (4318), OTLP gRPC (4317), Prometheus scrape (9464)

---

## Dev Notes

### Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Grafana | 3001 | Dashboard UI |
| Jaeger UI | 16686 | Trace viewer |
| Prometheus | 9090 | Metrics query |
| OTLP HTTP | 4318 | Trace/metric ingestion |
| OTLP gRPC | 4317 | Trace/metric ingestion |

### Files Involved

- `docker-compose.yml` (modify — add observability services)
- `config/prometheus/prometheus.yml` (create)
- `config/grafana/provisioning/datasources/datasources.yaml` (create)
- `config/grafana/provisioning/dashboards/dashboards.yaml` (create)
- `config/grafana/provisioning/dashboards/api-overview.json` (create)
- `PORT-CONFIGURATION.md` (modify)

### Dependencies

- **Depends On:** Story 12-3 (profiles structure must exist)
- **Depends On:** Story 12-6 (Prometheus metrics endpoint must exist for dashboard to have data)
- **Enables:** Story 12-11 (init.sh --mode=docker brings up full observability stack)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 4-6 hours

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-B
- **2026-03-24**: Story complete — Jaeger + Prometheus + Grafana added, all config files created

**Status:** done
**Created:** 2026-03-22
**Last Updated:** 2026-03-24
