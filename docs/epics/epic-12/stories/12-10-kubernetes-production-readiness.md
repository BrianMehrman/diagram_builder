# Story 12-10: Kubernetes Production Readiness

## Story

**ID:** 12-10
**Key:** 12-10-kubernetes-production-readiness
**Title:** Kubernetes Production Readiness
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-D Helm Charts for Kubernetes)
**Phase:** Implementation
**Priority:** HIGH - Required before any production Kubernetes deployment

**Description:**

Harden the Helm chart for production use: add PodDisruptionBudgets, NetworkPolicies, topology spread constraints, security contexts, and resource limits. Validate manifests against the Kubernetes 1.29 schema. Test upgrade and rollback flows.

---

## Acceptance Criteria

- **AC-1:** `PodDisruptionBudget` created for API (`minAvailable: 1`)
- **AC-2:** `NetworkPolicy` created allowing only required traffic paths, denying all other ingress
- **AC-3:** `topologySpreadConstraints` added to API deployment
- **AC-4:** All containers have `resources.requests` AND `resources.limits`
- **AC-5:** API pod security context enforces non-root, read-only filesystem, no privilege escalation
- **AC-6:** `kubeconform` validation passes against Kubernetes 1.29 schema
- **AC-7:** `helm upgrade` and `helm rollback` work cleanly

---

## Tasks/Subtasks

### Task 1: Availability and scheduling

- [ ] Create `helm/diagram-builder/templates/api/pdb.yaml` (`PodDisruptionBudget`, `minAvailable: 1`)
- [ ] Add `topologySpreadConstraints` to API deployment (spread across zones/nodes)

### Task 2: Network policies

- [ ] Create `helm/diagram-builder/templates/networkpolicy.yaml`
  - Allow api → neo4j (7687), api → redis (6379), api → otel-collector (4317)
  - Allow prometheus → api (4000/metrics), prometheus → otel-collector (8889)
  - Allow ui → api (4000)
  - Deny all other ingress by default

### Task 3: Resource and security hardening

- [ ] Verify all containers have `resources.requests` AND `resources.limits` set
- [ ] Add `securityContext` to API pod spec: `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`

### Task 4: Schema validation and lifecycle testing

- [ ] Validate manifests with `kubeconform` against Kubernetes 1.29 schema — zero errors
- [ ] Test `helm upgrade` with changed values — pods roll over cleanly
- [ ] Test `helm rollback` to previous release — verifies rollback works

---

## Dev Notes

### Files Involved

- `helm/diagram-builder/templates/api/pdb.yaml` (create)
- `helm/diagram-builder/templates/networkpolicy.yaml` (create)
- `helm/diagram-builder/templates/api/deployment.yaml` (modify — securityContext, topologySpreadConstraints)

### kubeconform command

```bash
helm template ./helm/diagram-builder -f values.docker-desktop.yaml | \
  kubeconform -kubernetes-version 1.29.0 -strict -
```

### Dependencies

- **Depends On:** Story 12-9 (all templates must exist before hardening)
- **Enables:** Story 12-11 (scripts can rely on a production-ready chart)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 3-4 hours

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-D

**Status:** backlog
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
