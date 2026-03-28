# Epic 12: Observability & Infrastructure

**Epic ID:** 12
**Epic Key:** epic-12
**Epic Title:** Observability & Infrastructure
**Phase:** Implementation
**Priority:** HIGH - Production Readiness

## Overview

Add full observability infrastructure (OpenTelemetry traces → Jaeger, metrics → Prometheus, logs → Grafana) and support three deployment modes: local Node.js dev, full Docker Compose stack, and Kubernetes via Helm.

This epic also completes the Winston structured logging foundation (Story 12-13) begun in Epic 6, Story 6-2, before layering OpenTelemetry on top.

## Business Value

**Operational Value:**
- Full pipeline visibility — no more "black box" failures
- Distributed tracing across parser → API → Neo4j → Redis
- Prometheus metrics enable alerting and SLO tracking
- Grafana dashboards surface performance trends
- Structured logs with trace correlation reduce MTTR

**Developer Value:**
- Three deployment modes reduce onboarding friction
- Kubernetes Helm chart enables production-grade deploys
- Docker Compose profiles enable full-stack local testing
- OTEL Winston bridge correlates logs to traces in Grafana

## Subsections

### Epic 12-A: Application Containerization
Dockerfiles for API and UI services, image hardening.

### Epic 12-B: Docker Compose Full Stack with Observability
Compose profiles for infra, app, and observability stacks.

### Epic 12-C: OTEL Instrumentation — API Package
OpenTelemetry SDK, Prometheus metrics exporter, Winston log bridge.
**Prerequisite:** Story 12-13 (complete Winston foundation from Epic 6) must be done first.

### Epic 12-D: Helm Charts for Kubernetes
Helm chart scaffold, OTEL Collector templates, production readiness.

### Epic 12-E: Developer Experience & Scripts
Multi-mode init/stop scripts, documentation updates.

### Epic 12-F: Logging Completeness
Fill gaps identified during Loki audit (2026-03-28): infrastructure files bypassing Winston, unlogged routes and services, duplicate HTTP log entries, and UI error visibility.

## Stories

| ID | Title | Group | Status |
|----|-------|-------|--------|
| 12-1 | Dockerfiles for API and UI | 12-A | in-progress |
| 12-2 | Docker image hardening | 12-A | in-progress |
| 12-3 | Restructure Docker Compose with profiles | 12-B | backlog |
| 12-4 | Add observability services to Docker Compose | 12-B | backlog |
| 12-5 | OTEL SDK setup and distributed tracing | 12-C | backlog |
| 12-6 | OTEL metrics and Prometheus exporter | 12-C | backlog |
| 12-7 | OTEL log bridge and service-level instrumentation | 12-C | backlog |
| 12-8 | Helm chart scaffold and application templates | 12-D | backlog |
| 12-9 | OTEL Collector templates and observability wiring | 12-D | backlog |
| 12-10 | Kubernetes production readiness | 12-D | backlog |
| 12-11 | Update scripts for multi-mode support | 12-E | done |
| 12-12 | Documentation updates | 12-E | backlog |
| 12-13 | Complete Winston logging foundation | 12-C prereq | done |
| 12-14 | Module logger factory and operation wrapper | 12-F | backlog |
| 12-15 | Infrastructure logger migration | 12-F | backlog |
| 12-16 | HTTP log deduplication | 12-F | backlog |
| 12-17 | Service and route instrumentation | 12-F | backlog |
| 12-18 | UI error reporting | 12-F | backlog |

**Total Stories:** 18

## Dependencies

**Depends On:**
- Epic 6 Story 6-2: MVP Winston logging in parser + API (complete — foundation for Story 12-13)
- Epics 3–11 complete before full 12-C/12-D work begins

**Story 12-13 should be implemented before Stories 12-5, 12-6, 12-7** — it completes the Winston foundation that 12-7 builds on (OTEL Winston transport requires a solid logger.ts base).

## Success Metrics

- All pipeline stages emit structured logs with timestamps and context
- Distributed traces visible in Jaeger for every import request
- Prometheus `/metrics` endpoint returns valid data when `OTEL_ENABLED=true`
- Grafana dashboard shows request rate, latency, error rate, cache hit/miss
- `./scripts/init.sh --mode=docker` brings up full stack including observability
- `helm install` deploys to Docker Desktop Kubernetes without errors

## Notes

- Winston logger.ts files already exist in `packages/parser/src/logger.ts` and `packages/api/src/logger.ts` (created in Story 6-2 MVP)
- Story 12-13 completes logging gaps deferred from 6-2 before OTEL is layered on
- Story 12-7 adds `@opentelemetry/winston-transport` to the existing logger — needs complete logger first

## Change Log

- **2026-03-22**: Epic created
  - Defined from Phase 9 in TASKS.md
  - Added Story 12-13 to capture deferred items from Epic 6 Story 6-2
  - 13 stories across 5 subsections (12-A through 12-E)
- **2026-03-28**: Added group 12-F — Logging Completeness
  - Loki audit revealed: 13 infra files bypassing Winston, 8 unlogged routes/services, duplicate HTTP log entries, no UI error visibility
  - Added Stories 12-14 through 12-18
  - Updated 12-11 and 12-13 status to done (completed this session)
  - Total stories: 18

**Status:** in-progress
**Created:** 2026-03-22
**Last Updated:** 2026-03-28
