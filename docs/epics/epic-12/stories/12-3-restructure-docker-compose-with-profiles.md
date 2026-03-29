# Story 12-3: Restructure Docker Compose with Profiles

## Story

**ID:** 12-3
**Key:** 12-3-restructure-docker-compose-with-profiles
**Title:** Restructure Docker Compose with Profiles
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-B Docker Compose Full Stack)
**Phase:** Implementation
**Priority:** HIGH - Enables full-stack local development and observability stack

**Description:**

Refactor `docker-compose.yml` to use named profiles (`infra`, `app`, `observability`), separating infrastructure services from application containers and observability tooling. Existing local dev behavior must be preserved with `--profile infra`.

---

## Acceptance Criteria

- **AC-1:** `docker-compose.yml` refactored with three named profiles
- **AC-2:** `api` service added under `app` profile using the Dockerfile from Story 12-1
- **AC-3:** `ui` service added under `app` profile using the Dockerfile from Story 12-1
- **AC-4:** Existing `docker-compose --profile infra up -d` behavior unchanged
- **AC-5:** Named volumes added for any new persistent data

---

## Tasks/Subtasks

### Task 1: Refactor profiles

- [x] Refactored `docker-compose.yml` with named profiles
  - Profile `infra`: `neo4j` and `redis` (unchanged config)
  - Profile `app`: `api` and `ui` using Dockerfiles from Epic 12-A
  - Profile `observability`: placeholder comment (services added in Story 12-4)

### Task 2: Add app services

- [x] Added `api` service (profile: `app`)
  - Build context: `docker/api/Dockerfile`
  - `env_file: .env`
  - Environment overrides: `NEO4J_URI=bolt://neo4j:7687`, `REDIS_HOST=redis`, `OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318`
  - `depends_on: [neo4j, redis]`, `ports: ["8741:8741"]`
- [x] Added `ui` service (profile: `app`)
  - Build context: `docker/ui/Dockerfile`
  - `depends_on: [api]`, `ports: ["5173:80"]`

### Task 3: Validation

- [x] No new named volumes needed (api/ui are stateless)
- [x] `docker compose --profile infra config` — only neo4j and redis present (unchanged)
- [x] `docker compose --profile infra --profile app config` — all four containers present

---

## Dev Notes

### Files Involved

- `docker-compose.yml` (modify)

### Dependencies

- **Depends On:** Story 12-1 (Dockerfiles), Story 12-2 (hardened images)
- **Enables:** Story 12-4 (observability services), Story 12-11 (init.sh --mode=docker)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 2-3 hours

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-B
- **2026-03-24**: Story complete — three profiles added, infra behavior unchanged

**Status:** done
**Created:** 2026-03-22
**Last Updated:** 2026-03-24
