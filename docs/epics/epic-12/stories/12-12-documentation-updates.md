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

- [ ] Update `PORT-CONFIGURATION.md`
  - Add new services table rows: Grafana (3001), Jaeger UI (16686), Prometheus (9090), OTLP HTTP (4318), OTLP gRPC (4317)
  - Add "Kubernetes Port Forwarding" section (via `scripts/port-forward.sh`)
  - Add note that port 3001 is Grafana — do NOT use for any app service
  - Update "Files That Reference Ports" section with new config files

### Task 2: README

- [ ] Update `README.md`
  - Add "Prerequisites" section listing Docker Desktop (with Kubernetes enabled), Helm 3.x, Node.js 22
  - Add "Deployment Modes" section explaining local / docker / k8s
  - Add "Observability" section: how to access Grafana (default creds), Jaeger trace search, Prometheus query
  - Add Kubernetes quick start: `./scripts/init.sh --mode=k8s`
  - Add Docker full-stack quick start: `./scripts/init.sh --mode=docker`

### Task 3: CLAUDE.md

- [ ] Update `CLAUDE.md`
  - Add new paths to "Document Locations" section (Helm chart, config/, docker/)
  - Update "Development Commands" section with `--mode` flag examples
  - Add OTEL env vars to relevant sections

### Task 4: .env.example

- [ ] Update `.env.example`
  - Add `OTEL_ENABLED=false`
  - Add `OTEL_SERVICE_NAME=diagram-builder-api`
  - Add `OTEL_SERVICE_VERSION=1.0.0`
  - Add `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` (local Jaeger)
  - Add `# DEPLOY_MODE: local | docker | k8s` comment block

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

**Status:** backlog
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
