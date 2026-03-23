# Story 12-8: Helm Chart Scaffold and Application Templates

## Story

**ID:** 12-8
**Key:** 12-8-helm-chart-scaffold-and-application-templates
**Title:** Helm Chart Scaffold and Application Templates
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-D Helm Charts for Kubernetes)
**Phase:** Implementation
**Priority:** HIGH - Foundation for Kubernetes deployment

**Description:**

Create the Helm chart scaffold for `diagram-builder` with all application templates (API Deployment, Service, ConfigMap, Secret, HPA; UI Deployment and Service; Ingress). Configure subchart dependencies for Neo4j, Redis, kube-prometheus-stack, Jaeger, and OTEL Collector. Validate with `helm lint`.

---

## Acceptance Criteria

- **AC-1:** `helm/diagram-builder/Chart.yaml` created with all subchart dependencies
- **AC-2:** `values.yaml`, `values.docker-desktop.yaml`, and `values.production.yaml` created
- **AC-3:** All API templates created (Deployment, Service, ConfigMap, Secret, HPA)
- **AC-4:** UI templates created (Deployment, Service)
- **AC-5:** Ingress template created (optional, nginx class)
- **AC-6:** `helm lint ./helm/diagram-builder` passes with zero errors or warnings

---

## Tasks/Subtasks

### Task 1: Chart scaffold

- [ ] Document Helm 3.x as a prerequisite in README (with install link)
- [ ] Create `helm/diagram-builder/Chart.yaml`
  - `apiVersion: v2`, `name: diagram-builder`, `version: 0.1.0`, `appVersion: 1.0.0`
  - Dependencies:
    - `neo4j` from `https://helm.neo4j.com/neo4j` (pinned version ~5.x)
    - `redis` from `https://charts.bitnami.com/bitnami` (pinned version ~20.x)
    - `kube-prometheus-stack` from `https://prometheus-community.github.io/helm-charts` (pinned ~67.x)
    - `jaeger` from `https://jaegertracing.github.io/helm-charts` (pinned ~3.x)
    - `opentelemetry-collector` from `https://open-telemetry.github.io/opentelemetry-helm-charts` (pinned ~0.x)

### Task 2: Values files

- [ ] Create `helm/diagram-builder/values.yaml` (production defaults)
  - `api.replicaCount: 2`, image ref, resource limits (CPU 500m/1, mem 512Mi/1Gi), service ClusterIP
  - `ui.replicaCount: 2`, image ref, service LoadBalancer
  - Ingress disabled by default, TLS config placeholder
  - Dependency chart value overrides (neo4j, redis, prometheus-stack, jaeger)
- [ ] Create `helm/diagram-builder/values.docker-desktop.yaml`
  - `api.replicaCount: 1`, `ui.replicaCount: 1`
  - All services as `NodePort` (no LoadBalancer on Docker Desktop)
  - Reduced resource limits (api: 256Mi mem, neo4j: 1Gi heap)
  - `kube-prometheus-stack.alertmanager.enabled: false`
  - `neo4j.volumes.data.persistentVolumeClaim.storageClassName: hostpath`
  - `jaeger.storage.type: memory` (no persistence needed locally)
- [ ] Create `helm/diagram-builder/values.production.yaml`
  - Multiple replicas, LoadBalancer, PVC cloud storage classes, alertmanager enabled

### Task 3: Helper templates

- [ ] Create `helm/diagram-builder/templates/_helpers.tpl`
  - `diagram-builder.name`, `diagram-builder.fullname`, `diagram-builder.labels`, `diagram-builder.selectorLabels`
- [ ] Create `helm/diagram-builder/templates/namespace.yaml`

### Task 4: API templates

- [ ] Create `helm/diagram-builder/templates/api/deployment.yaml`
  - Liveness probe: `GET /health` (initialDelaySeconds: 30, periodSeconds: 10)
  - Readiness probe: `GET /health` (initialDelaySeconds: 10, periodSeconds: 5)
  - `envFrom`: configmap ref + secret ref
  - `OTEL_EXPORTER_OTLP_ENDPOINT` → `http://{{ .Release.Name }}-otel-collector:4317`
- [ ] Create `helm/diagram-builder/templates/api/service.yaml` (ClusterIP, port 4000)
- [ ] Create `helm/diagram-builder/templates/api/configmap.yaml` (NODE_ENV, LOG_LEVEL, OTEL_SERVICE_NAME, etc.)
- [ ] Create `helm/diagram-builder/templates/api/secret.yaml` (JWT_SECRET, NEO4J_PASSWORD, REDIS_PASSWORD — base64 encoded via `{{ .Values.api.secrets.jwtSecret | b64enc }}`)
- [ ] Create `helm/diagram-builder/templates/api/hpa.yaml`
  - `minReplicas: 1`, `maxReplicas: 10`, CPU target 70%
  - Enabled/disabled via `values.yaml` flag

### Task 5: UI and Ingress templates

- [ ] Create `helm/diagram-builder/templates/ui/deployment.yaml`
- [ ] Create `helm/diagram-builder/templates/ui/service.yaml`
- [ ] Create `helm/diagram-builder/templates/ingress.yaml` (optional, nginx ingress class)

### Task 6: Validation

- [ ] Run `helm lint ./helm/diagram-builder` — zero errors or warnings

---

## Dev Notes

### Files Involved

- `helm/diagram-builder/Chart.yaml` (create)
- `helm/diagram-builder/values.yaml` (create)
- `helm/diagram-builder/values.docker-desktop.yaml` (create)
- `helm/diagram-builder/values.production.yaml` (create)
- `helm/diagram-builder/templates/_helpers.tpl` (create)
- `helm/diagram-builder/templates/namespace.yaml` (create)
- `helm/diagram-builder/templates/api/` (create — 5 files)
- `helm/diagram-builder/templates/ui/` (create — 2 files)
- `helm/diagram-builder/templates/ingress.yaml` (create)

### Dependencies

- **Depends On:** Story 12-1 (Docker images must exist to reference in values.yaml)
- **Enables:** Story 12-9 (OTEL Collector templates), Story 12-10 (production readiness), Story 12-11 (deploy-helm.sh)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 6-8 hours

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-D

**Status:** backlog
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
