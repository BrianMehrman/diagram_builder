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

- [ ] Create `config/otel-collector/config.yaml`
  - Receivers: `otlp` (protocols: grpc 4317, http 4318)
  - Processors: `batch`, `memory_limiter` (512MiB limit, 0.8 spike ratio), `resource_detection`
  - Exporters:
    - `otlp/jaeger`: endpoint `jaeger-collector:4317`
    - `prometheus`: endpoint `0.0.0.0:8889` (scraped by prometheus)
    - `debug`: verbosity `detailed` (disabled in production via values)
  - Pipelines: traces (otlp → batch → otlp/jaeger), metrics (otlp → batch → prometheus), logs (otlp → batch → debug)

### Task 2: Helm templates

- [ ] Create `helm/diagram-builder/templates/otel-collector/configmap.yaml`
  - Mounts `config/otel-collector/config.yaml` as ConfigMap data
- [ ] Create `helm/diagram-builder/templates/otel-collector/deployment.yaml`
  - `image: otel/opentelemetry-collector-contrib:0.115.0`
  - Mounts configmap as `/etc/otelcol-contrib/config.yaml`
  - Resource limits (CPU 200m, mem 256Mi)
- [ ] Create `helm/diagram-builder/templates/otel-collector/service.yaml`
  - Port 4317 (OTLP gRPC, used by API pods)
  - Port 4318 (OTLP HTTP)
  - Port 8889 (Prometheus metrics scrape port)

### Task 3: Subchart wiring

- [ ] Configure `kube-prometheus-stack` subchart in `values.yaml`
  - Add scrape config for otel-collector port 8889
  - Grafana additional datasources: Jaeger at `http://{{ .Release.Name }}-jaeger-query:16686`
  - Import API overview dashboard via Grafana sidecar configmap
- [ ] Configure `jaeger` subchart in `values.yaml` — point to `otel-collector` as collector endpoint

### Task 4: Validation

- [ ] Run `helm template ./helm/diagram-builder -f values.docker-desktop.yaml` — inspect rendered manifests
- [ ] Run `helm install diagram-builder ./helm/diagram-builder -f values.docker-desktop.yaml --dry-run --debug` against Docker Desktop cluster — zero errors

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

**Status:** backlog
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
