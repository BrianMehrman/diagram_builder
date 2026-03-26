# Story 12-5: OTEL SDK Setup and Distributed Tracing

## Story

**ID:** 12-5
**Key:** 12-5-otel-sdk-setup-and-distributed-tracing
**Title:** OTEL SDK Setup and Distributed Tracing
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-C OTEL Instrumentation)
**Phase:** Implementation
**Priority:** HIGH - Foundation for distributed tracing across all pipeline stages

**Description:**

Install and configure the OpenTelemetry Node.js SDK in the API package. Set up distributed tracing with auto-instrumentation covering Express, HTTP, Neo4j driver, and ioredis. Traces export to Jaeger via OTLP HTTP. All OTEL behavior is gated behind an `OTEL_ENABLED` flag — no-op when disabled.

**Prerequisite:** Story 12-13 (complete Winston logging foundation) must be done first.

---

## Acceptance Criteria

- **AC-1:** OTEL packages installed in `packages/api`
- **AC-2:** OTEL env vars added to Zod config schema with sensible defaults
- **AC-3:** `observability/tracing.ts` created with `NodeTracerProvider`, OTLP exporter, auto-instrumentation
- **AC-4:** Tracing initialized as very first import in `server.ts`
- **AC-5:** `OTEL_ENABLED=false` produces a no-op — no errors, no performance impact
- **AC-6:** Unit tests pass, zero TypeScript errors

---

## Tasks/Subtasks

### Task 1: Install packages

- [x] Install packages in `packages/api/package.json`:
  - `@opentelemetry/api`
  - `@opentelemetry/sdk-node`
  - `@opentelemetry/auto-instrumentations-node`
  - `@opentelemetry/exporter-trace-otlp-http`

### Task 2: Config schema

- [x] Add OTEL env vars to Zod schema in `packages/api/src/config.ts`
  - `OTEL_ENABLED`: `z.coerce.boolean().default(false)`
  - `OTEL_SERVICE_NAME`: `z.string().default('diagram-builder-api')`
  - `OTEL_SERVICE_VERSION`: `z.string().default('1.0.0')`
  - `OTEL_EXPORTER_OTLP_ENDPOINT`: `z.string().default('http://localhost:4318')`
- [x] Add OTEL vars to `packages/api/.env.example`

### Task 3: Tracing setup

- [x] Create `packages/api/src/observability/tracing.ts`
  - `NodeSDK` with `resourceFromAttributes`: `service.name`, `service.version`, `deployment.environment`
  - `OTLPTraceExporter` using `OTEL_EXPORTER_OTLP_ENDPOINT` from config
  - Auto-instrumentation via `getNodeAutoInstrumentations()`
  - Guard entire setup behind `OTEL_ENABLED` flag — no-op when disabled
- [x] Create `packages/api/src/observability/index.ts`
  - Initializes tracing and metrics; exports `getTracer` and `shutdownTracing`

### Task 4: Server integration

- [x] Updated `packages/api/src/server.ts`
  - `import './observability'` as the very first import with comment

### Task 5: Tests and validation

- [x] 412 API tests pass; type-check has zero new errors

---

## Dev Notes

### Why First Import Matters

OTEL auto-instrumentation works by monkey-patching modules at require time. If Express or ioredis are imported before OTEL initializes, their instrumentation won't be applied. The `import './observability'` must be line 1 of `server.ts`.

### Files Involved

- `packages/api/package.json` (modify — add OTEL packages)
- `packages/api/src/config.ts` (modify — add OTEL env vars)
- `packages/api/src/observability/tracing.ts` (create)
- `packages/api/src/observability/index.ts` (create)
- `packages/api/src/server.ts` (modify — add first import)
- `.env.example` (modify — add OTEL vars)

### Dependencies

- **Depends On:** Story 12-13 (Winston logging foundation complete)
- **Enables:** Story 12-6 (metrics), Story 12-7 (log bridge + service instrumentation)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 3-4 hours

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-C
- **2026-03-24**: Story complete — NodeSDK + OTLP + auto-instrumentation + config vars + server wiring

**Status:** done
**Created:** 2026-03-22
**Last Updated:** 2026-03-24
