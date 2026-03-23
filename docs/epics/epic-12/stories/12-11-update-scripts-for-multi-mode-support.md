# Story 12-11: Update Scripts for Multi-Mode Support

## Story

**ID:** 12-11
**Key:** 12-11-update-scripts-for-multi-mode-support
**Title:** Update Scripts for Multi-Mode Support
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-E Developer Experience & Scripts)
**Phase:** Implementation
**Priority:** HIGH - Enables one-command startup for all three deployment modes

**Description:**

Update `scripts/init.sh` and `scripts/stop.sh` to support `--mode` flag (local/docker/k8s). Create new `scripts/deploy-helm.sh` and `scripts/port-forward.sh` for Kubernetes workflows. All modes print a colored service URL summary on completion.

---

## Acceptance Criteria

- **AC-1:** `init.sh --mode=local` matches existing behavior exactly
- **AC-2:** `init.sh --mode=docker` starts infra + app + observability profiles, waits for health, seeds DB, prints URLs
- **AC-3:** `init.sh --mode=k8s` checks prerequisites, deploys via Helm, port-forwards, prints URLs
- **AC-4:** `stop.sh` supports matching `--mode` flag for all three modes
- **AC-5:** `deploy-helm.sh` handles install, upgrade, success/failure output
- **AC-6:** `port-forward.sh` forwards all services and cleans up on Ctrl+C

---

## Tasks/Subtasks

### Task 1: Update init.sh

- [ ] Update `scripts/init.sh` to support `--mode` flag (default: `local`)
  - `--mode=local`: existing behavior (docker-compose infra profile + Node.js API/UI processes)
  - `--mode=docker`: `docker-compose --profile infra --profile app --profile observability up -d`, wait for health checks, seed DB, print URLs
  - `--mode=k8s`: check `kubectl` and `helm` are available, call `scripts/deploy-helm.sh`, call `scripts/port-forward.sh`, print URLs
  - All modes: display colored service URL summary at end (including Grafana, Jaeger if observability is active)

### Task 2: Update stop.sh

- [ ] Update `scripts/stop.sh` to support `--mode` flag
  - `--mode=local`: existing behavior
  - `--mode=docker`: `docker-compose --profile infra --profile app --profile observability down`
  - `--mode=k8s`: `helm uninstall diagram-builder --namespace diagram-builder`
  - Add `--observability` flag for local mode to stop/start only the observability Docker Compose profile

### Task 3: Create deploy-helm.sh

- [ ] Create `scripts/deploy-helm.sh`
  - Parse flags: `--context` (default: `docker-desktop`), `--values` (default: `values.docker-desktop.yaml`), `--namespace` (default: `diagram-builder`)
  - Check `helm` and `kubectl` are installed (print install links if not)
  - Run `helm dependency update ./helm/diagram-builder` (only if `Chart.lock` is stale)
  - Run `helm upgrade --install diagram-builder ./helm/diagram-builder --namespace $NAMESPACE --create-namespace --kube-context $CONTEXT -f ./helm/diagram-builder/$VALUES --wait --timeout 5m`
  - On success: print pod status and service URLs
  - On failure: print `helm status` and last 50 lines of failing pod logs

### Task 4: Create port-forward.sh

- [ ] Create `scripts/port-forward.sh`
  - Port-forward these services to localhost in background:
    - `svc/diagram-builder-api 4000:4000`
    - `svc/diagram-builder-ui 3000:80`
    - `svc/diagram-builder-kube-prometheus-stack-grafana 3001:80`
    - `svc/diagram-builder-jaeger-query 16686:16686`
    - `svc/diagram-builder-kube-prometheus-stack-prometheus 9090:9090`
  - Store PIDs in `/tmp/diagram-builder-port-forwards.pid`
  - Trap `SIGINT`/`SIGTERM` to kill all forwards cleanly on exit
  - Print "Port forwarding active — press Ctrl+C to stop" with URL list
  - Add `--stop` flag: reads PID file, kills all forwards, removes PID file

---

## Dev Notes

### Files Involved

- `scripts/init.sh` (modify)
- `scripts/stop.sh` (modify)
- `scripts/deploy-helm.sh` (create)
- `scripts/port-forward.sh` (create)

### Dependencies

- **Depends On:** Story 12-3 (Docker Compose profiles for --mode=docker)
- **Depends On:** Story 12-8 (Helm chart for --mode=k8s)
- **Enables:** Story 12-12 (documentation references these scripts)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 4-6 hours

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-E

**Status:** backlog
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
