# Story 12-9: OTEL Collector Templates and Observability Wiring

## Story

**ID:** 12-9
**Key:** 12-9-otel-collector-templates-and-observability-wiring
**Title:** OTEL Collector Templates and Observability Wiring
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-D Helm Charts for Kubernetes)
**Phase:** Implementation
**Priority:** HIGH - Connects application traces/metrics to Jaeger and Prometheus in Kubernetes

**Description:**

Create the OTEL Collector configuration and Helm templates to receive traces and metrics from the API, fan them out to Jaeger and Prometheus, and wire up the Grafana/Prometheus/Jaeger subcharts. Validate with a dry-run install against Docker Desktop Kubernetes.

---

## Acceptance Criteria

- **AC-1:** `config/otel-collector/config.yaml` created with OTLP receivers, batch processors, and Jaeger/Prometheus exporters
- **AC-2:** Helm templates created for OTEL Collector (ConfigMap, Deployment, Service)
- **AC-3:** `kube-prometheus-stack` subchart configured to scrape OTEL Collector metrics
- **AC-4:** Grafana provisioned with Jaeger datasource via subchart values
- **AC-5:** `helm template` renders without errors
- **AC-6:** `helm install --dry-run` against Docker Desktop cluster succeeds with zero errors

---

## Tasks/Subtasks

### Task 1: OTEL Collector config

- [x] Created `config/otel-collector/config.yaml`
  - Receivers: `otlp` (gRPC 4317 + HTTP 4318)
  - Processors: `batch`, `memory_limiter` (512MiB limit, 128MiB spike), `resource_detection`
  - Exporters: `otlp/jaeger` (4317), `prometheus` (8889), `debug`
  - Pipelines: traces → jaeger, metrics → prometheus, logs → debug

### Task 2: Helm templates

- [x] Created `helm/diagram-builder/templates/otel-collector/configmap.yaml`
- [x] Created `helm/diagram-builder/templates/otel-collector/deployment.yaml` — otel-collector-contrib:0.115.0
- [x] Created `helm/diagram-builder/templates/otel-collector/service.yaml` — ports 4317, 4318, 8889
- Note: removed `opentelemetry-collector` subchart (conflict with custom templates)

### Task 3: Subchart wiring

- [x] `kube-prometheus-stack`: additionalScrapeConfigs for otel-collector:8889; Grafana additionalDataSources with Jaeger; dashboard provider for diagram-builder dashboards
- [x] Subchart dependencies fetched: neo4j, redis, kube-prometheus-stack, jaeger in `charts/`

### Task 4: Validation

- [x] `helm template ./helm/diagram-builder -f values.docker-desktop.yaml` — renders ~150+ Kubernetes resources, 0 errors
- [x] `helm install --dry-run --namespace diagram-builder` against Docker Desktop — STATUS: pending-install, 0 errors

---

## Dev Notes

### Files Involved

- `config/otel-collector/config.yaml` (create)
- `helm/diagram-builder/templates/otel-collector/configmap.yaml` (create)
- `helm/diagram-builder/templates/otel-collector/deployment.yaml` (create)
- `helm/diagram-builder/templates/otel-collector/service.yaml` (create)
- `helm/diagram-builder/values.yaml` (modify — subchart wiring)

### Dependencies

- **Depends On:** Story 12-8 (chart scaffold and values files must exist)
- **Depends On:** Story 12-6 (Prometheus metrics endpoint to scrape)
- **Enables:** Story 12-10 (production readiness builds on this wiring)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 4-5 hours

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-D
- **2026-03-24**: Story complete — OTEL Collector templates created, subcharts wired, dry-run passes

**Status:** done
**Created:** 2026-03-22
**Last Updated:** 2026-03-24
