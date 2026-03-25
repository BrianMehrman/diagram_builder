# Story 12-12: Documentation Updates

## Story

**ID:** 12-12
**Key:** 12-12-documentation-updates
**Title:** Documentation Updates
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-E Developer Experience & Scripts)
**Phase:** Implementation
**Priority:** MEDIUM - Completes Epic 12; required before handoff

**Description:**

Update project documentation to reflect Epic 12's new infrastructure: port configuration, deployment modes, observability access, Kubernetes quick start, and OTEL environment variables. Updates span `PORT-CONFIGURATION.md`, `README.md`, `CLAUDE.md`, and `.env.example`.

---

## Acceptance Criteria

- **AC-1:** `PORT-CONFIGURATION.md` updated with all new service ports and Kubernetes forwarding section
- **AC-2:** `README.md` updated with prerequisites, deployment modes, observability section, and quick start commands
- **AC-3:** `CLAUDE.md` updated with new paths and `--mode` flag examples
- **AC-4:** `.env.example` updated with all OTEL environment variables

---

## Tasks/Subtasks

### Task 1: Port configuration

- [x] Updated `PORT-CONFIGURATION.md` — added Kubernetes Port Forwarding section with port-forward.sh usage; note that 3001 is Grafana-only
  (observability ports were added in Story 12-4)

### Task 2: README

- [x] Updated `README.md`:
  - Replaced Requirements with Prerequisites table (Node.js, Docker, Helm, kubectl)
  - Added Deployment Modes section (local/docker/k8s with commands)
  - Added Observability section (Grafana/Jaeger/Prometheus URLs + default creds)
  - Added Docker/k8s quick start commands

### Task 3: CLAUDE.md

- [x] Updated `CLAUDE.md`:
  - Document Locations expanded with helm/, docker/, config/ paths
  - Added Deployment Modes section with `--mode` table, k8s scripts, OTEL env vars
  - Updated init.sh reference to include `--mode=local`

### Task 4: .env.example

- [x] Updated `.env.example`:
  - Added OTEL block: OTEL_ENABLED, OTEL_SERVICE_NAME, OTEL_SERVICE_VERSION, OTEL_EXPORTER_OTLP_ENDPOINT
  - Added DEPLOY_MODE comment block explaining local/docker/k8s options

---

## Dev Notes

### Files Involved

- `PORT-CONFIGURATION.md` (modify)
- `README.md` (modify)
- `CLAUDE.md` (modify)
- `.env.example` (modify)

### Dependencies

- **Depends On:** Story 12-11 (scripts must exist before documenting them)
- **Completes:** Epic 12

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 2-3 hours

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-E
- **2026-03-24**: Story complete — all four files updated, Epic 12 complete

**Status:** done
**Created:** 2026-03-22
**Last Updated:** 2026-03-24
