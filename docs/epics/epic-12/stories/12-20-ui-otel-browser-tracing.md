# Story 12-20: UI OTEL Browser Tracing

## Story

**ID:** 12-20
**Key:** 12-20-ui-otel-browser-tracing
**Title:** UI OTEL Browser Tracing
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-G Observability Gap Fill)
**Phase:** Implementation
**Priority:** MEDIUM — Provides frontend trace visibility; docker-compose already has OTEL_ENABLED=true wired for UI

**As a** developer investigating a slow or broken canvas render,
**I want** the UI to emit OTEL traces to Jaeger,
**So that** I can see browser-side performance spans alongside API spans in the same trace view.

---

## Background

Story 12-18 added `POST /api/logs` for error boundary reporting. The `docker-compose.yml` already sets `OTEL_ENABLED=true` and `OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318` on the UI container, but the UI package has no OTEL SDK installed — those env vars are unused. There is also a malformed env var (`OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318=value`) in the UI service definition that needs to be cleaned up.

12-18 explicitly deferred OTEL browser SDK to a separate story. This is that story.

Architecture spec: `docs/specs/2026-04-04-observability-architecture-design.md`

---

## Acceptance Criteria

- **AC-1:** `@opentelemetry/sdk-trace-web` and `@opentelemetry/exporter-trace-otlp-http` installed in `packages/ui`
- **AC-2:** OTEL initialized in `packages/ui/src/main.tsx` before `<App />` renders, gated on `VITE_OTEL_ENABLED=true`
- **AC-3:** A span `ui.layout.compute` is emitted when the layout engine runs, with attribute `node_count`
- **AC-4:** A span `ui.canvas.render` is emitted when the 3D canvas completes its first render, with attributes `view` (`city` or `basic3d`) and `node_count`
- **AC-5:** Spans are visible in Jaeger UI under service `diagram-builder-ui`
- **AC-6:** The malformed `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318=value` line in `docker-compose.yml` is removed
- **AC-7:** `VITE_OTEL_ENABLED` and `VITE_OTEL_EXPORTER_OTLP_ENDPOINT` added to `packages/ui/.env.example`
- **AC-8:** `npm run type-check && npm run lint && npm run format:check && npm test` — all clean

---

## Tasks

### Task 1: Install OTEL browser packages

- [x] Add to `packages/ui/package.json`:
  - `@opentelemetry/api`
  - `@opentelemetry/sdk-trace-web`
  - `@opentelemetry/exporter-trace-otlp-http`
  - ~~`@opentelemetry/context-zone`~~ — removed (see bugs below; replaced by `StackContextManager`)

### Task 2: Create UI telemetry module

- [x] Create `packages/ui/src/lib/telemetry.ts`:
  - `initTelemetry()` — reads `VITE_OTEL_ENABLED` and `VITE_OTEL_EXPORTER_OTLP_ENDPOINT`; initializes `WebTracerProvider` with `OTLPTraceExporter`; registers with `@opentelemetry/api`; no-op when disabled
  - `getTracer()` — returns `trace.getTracer('diagram-builder-ui')`
  - Export a `withSpan(name, attributes, fn)` helper matching the API's `instrumentation.ts` pattern

### Task 3: Initialize in main.tsx

- [x] Call `initTelemetry()` as the first statement in `packages/ui/src/main.tsx` before the React render

### Task 4: Instrument layout computation

- [x] Wrap layout engine invocation with `withSpan('ui.layout.compute', { node_count }, fn)` in `useCityLayout.ts` and `useBasic3DLayout.ts`

### Task 5: Instrument canvas first render

- [x] Emit `withSpan('ui.canvas.render', { view, node_count }, fn)` on R3F `onCreated` in `Canvas3D.tsx`

### Task 6: Fix docker-compose

- [x] Removed malformed `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318=value` line from `ui` service

### Task 7: Update env example

- [x] Added `VITE_OTEL_ENABLED` and `VITE_OTEL_EXPORTER_OTLP_ENDPOINT` to `packages/ui/.env.example`

### Task 8: Verify

- [x] `npm run type-check` — clean (ui package)
- [x] `npm run lint` — clean
- [x] `npm run format:check` — clean
- [x] `npm test` — all passing
- [x] Smoke test: open canvas with `VITE_OTEL_ENABLED=true`, confirm `ui.layout.compute` and `ui.canvas.render` spans appear in Jaeger under `diagram-builder-ui`

---

## Dev Notes

### CORS on Jaeger

Jaeger 2.x's OTLP HTTP endpoint does not enable CORS by default. The browser OTEL exporter will be blocked by CORS unless either:
1. Jaeger is configured with `--collector.otlp.http.cors.allowed-origins=*` in docker-compose
2. Or the UI OTLP traffic is proxied through the API (adds latency, not recommended for traces)

Option 1 is preferred — add the flag to the `jaeger` service command in `docker-compose.yml`.

### Vite Env Vars

Vite only exposes env vars prefixed with `VITE_` to the browser bundle. Use `import.meta.env.VITE_OTEL_ENABLED` (not `process.env`).

### Out of Scope

- UI metrics to Prometheus (no browser scrape target without a collector — separate design decision)
- Structured UI logging beyond what 12-18 provides
- User interaction tracing (clicks, searches) — too noisy for initial implementation

---

## Change Log

- **2026-04-04**: Story created
  - Deferred from Story 12-18 ("OpenTelemetry browser SDK for distributed frontend traces — separate story")
  - Part of Epic 12-G: Observability Gap Fill
- **2026-04-05**: Post-merge bug fixes
  - `@opentelemetry/context-zone` requires `zone.js` as a peer dependency (an Angular package not installed in this React app). `ZoneContextManager` initialization silently failed, breaking all span export. Fixed by switching to `StackContextManager` from `@opentelemetry/sdk-trace-web` and removing `@opentelemetry/context-zone` from dependencies.
  - `packages/ui/.env` had `OTEL_ENABLED=true` instead of `VITE_OTEL_ENABLED=true`. Vite strips env vars without the `VITE_` prefix from the browser bundle, so telemetry was disabled. Fixed env file.
  - `WebTracerProvider` was initialized without a resource, so `service.name` defaulted to `unknown_service`. Fixed by adding `resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'diagram-builder-ui' })` via `@opentelemetry/resources` and `@opentelemetry/semantic-conventions`.

**Status:** done
**Created:** 2026-04-04
**Last Updated:** 2026-04-05
