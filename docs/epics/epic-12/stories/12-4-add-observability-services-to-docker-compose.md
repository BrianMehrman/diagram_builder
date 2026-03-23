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

- [ ] Add `jaeger` service (profile: `observability`)
  - Image: `jaegertracing/all-in-one:2.1`
  - `environment: COLLECTOR_OTLP_ENABLED=true`
  - Ports: `16686:16686` (UI), `4317:4317` (OTLP gRPC), `4318:4318` (OTLP HTTP)
  - `networks: [diagram-builder-network]`
- [ ] Add `prometheus` service (profile: `observability`)
  - Image: `prom/prometheus:v3.1.0`
  - Volume mount: `./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro`
  - Volume: `prometheus-data:/prometheus`
  - Port: `9090:9090`
  - `networks: [diagram-builder-network]`
- [ ] Add `grafana` service (profile: `observability`)
  - Image: `grafana/grafana:11.4.0`
  - Port: `3001:3000` (avoids conflict with UI on 3000)
  - Volume: `grafana-data:/var/lib/grafana`
  - Volume mount: `./config/grafana/provisioning:/etc/grafana/provisioning:ro`
  - `depends_on: [prometheus, jaeger]`
  - `networks: [diagram-builder-network]`
- [ ] Add `prometheus-data` and `grafana-data` to `volumes:` block in docker-compose

### Task 2: Prometheus configuration

- [ ] Create `config/prometheus/prometheus.yml`
  - Global: `scrape_interval: 15s`, `evaluation_interval: 15s`
  - Scrape job `diagram-builder-api`: target `api:4000`, path `/metrics`
  - Scrape job `prometheus` (self-scrape)

### Task 3: Grafana provisioning

- [ ] Create `config/grafana/provisioning/datasources/datasources.yaml`
  - Prometheus datasource: `http://prometheus:9090`, default datasource
  - Jaeger datasource: `http://jaeger:16686`, with `tracesToLogs` correlation
- [ ] Create `config/grafana/provisioning/dashboards/dashboards.yaml`
  - File-based dashboard provider pointing to `/etc/grafana/provisioning/dashboards`
- [ ] Create `config/grafana/provisioning/dashboards/api-overview.json`
  - Panel: HTTP request rate by route (Counter, `http_requests_total`)
  - Panel: HTTP latency p50/p95/p99 (Histogram, `http_request_duration_seconds`)
  - Panel: HTTP error rate 4xx/5xx
  - Panel: Active WebSocket sessions (`ws_active_sessions`)
  - Panel: Cache hit/miss ratio (`cache_operations_total`)
  - Panel: DB query duration (`db_query_duration_seconds`)
  - Panel: Trace search link to Jaeger

### Task 4: Documentation

- [ ] Update `PORT-CONFIGURATION.md` — add Grafana (3001), Jaeger UI (16686), Prometheus (9090), OTLP HTTP (4318), OTLP gRPC (4317)

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

**Status:** backlog
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
