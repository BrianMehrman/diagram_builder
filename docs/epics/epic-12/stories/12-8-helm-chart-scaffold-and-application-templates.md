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

- [x] Create `helm/diagram-builder/Chart.yaml`
  - `apiVersion: v2`, `name: diagram-builder`, `version: 0.1.0`, `appVersion: 1.0.0`
  - All 5 subchart dependencies with pinned versions and condition gates

### Task 2: Values files

- [x] Created `helm/diagram-builder/values.yaml` — production defaults
- [x] Created `helm/diagram-builder/values.docker-desktop.yaml` — NodePort, 1 replica, hostpath storage
- [x] Created `helm/diagram-builder/values.production.yaml` — multi-replica, Ingress+TLS, gp3 PVCs

### Task 3: Helper templates

- [x] Created `helm/diagram-builder/templates/_helpers.tpl` — name, fullname, labels, selectorLabels (+ api/ui variants)
- [x] Created `helm/diagram-builder/templates/namespace.yaml`

### Task 4: API templates

- [x] Created `helm/diagram-builder/templates/api/deployment.yaml` — health probes, envFrom configmap+secret
- [x] Created `helm/diagram-builder/templates/api/service.yaml` — NodePort-aware
- [x] Created `helm/diagram-builder/templates/api/configmap.yaml` — all env config
- [x] Created `helm/diagram-builder/templates/api/secret.yaml` — JWT/Neo4j/Redis via b64enc
- [x] Created `helm/diagram-builder/templates/api/hpa.yaml` — autoscaling/v2, enabled flag

### Task 5: UI and Ingress templates

- [x] Created `helm/diagram-builder/templates/ui/deployment.yaml`
- [x] Created `helm/diagram-builder/templates/ui/service.yaml`
- [x] Created `helm/diagram-builder/templates/ingress.yaml` — nginx class, TLS, path routing

### Task 6: Validation

- [x] `helm lint ./helm/diagram-builder` — 0 errors, 0 failures

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
- **2026-03-24**: Story complete — all templates created, helm lint passes (0 errors)

**Status:** done
**Created:** 2026-03-22
**Last Updated:** 2026-03-24
