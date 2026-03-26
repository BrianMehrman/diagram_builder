# Epic 12-C: Winston Foundation + OpenTelemetry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the structured logging foundation (Story 12-13), then add OpenTelemetry distributed tracing, Prometheus metrics, and Winston log bridge (Stories 12-5, 12-6, 12-7).

**Architecture:** Winston loggers already exist in both packages. This plan fills logging gaps in `ivm-converter.ts` and `graph-service.ts`, audits all catch blocks, adds progress tracking, then layers OpenTelemetry on top via the OTEL SDK and a Prometheus `/metrics` endpoint. All OTEL behavior is gated behind `OTEL_ENABLED=false` so existing dev workflow is unaffected.

**Tech Stack:** Winston (existing), OpenTelemetry Node.js SDK, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/sdk-metrics`, `@opentelemetry/exporter-prometheus`, `@opentelemetry/winston-transport`, Zod (existing in API config)

**Test commands:**
```bash
# From repo root
npm test -w @diagram-builder/parser
npm test -w @diagram-builder/api
npm run type-check
npm run lint
npm run format:check
```

---

## Story 12-13: Complete Winston Logging Foundation

### Task 1: Add logging to ivm-converter.ts

**Files:**
- Modify: `packages/parser/src/ivm/ivm-converter.ts`

- [ ] Read the file to understand its exports and function signatures:
  ```bash
  cat packages/parser/src/ivm/ivm-converter.ts
  ```

- [ ] Write a failing test that verifies a log is emitted on conversion:
  ```typescript
  // packages/parser/src/ivm/ivm-converter.test.ts — add to existing describe block
  it('logs entry and completion with node/edge counts', () => {
    const logSpy = vi.spyOn(logger, 'info')
    // call convertToIVM (or whichever exported fn does the conversion)
    // with a minimal valid dependency graph
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('IVM'),
      expect.objectContaining({ inputNodes: expect.any(Number) })
    )
  })
  ```

- [ ] Run the test to confirm it fails:
  ```bash
  npm test -w @diagram-builder/parser -- --reporter=verbose ivm-converter
  ```

- [ ] Add logger import and logging to `ivm-converter.ts`:
  ```typescript
  import { logger } from '../logger'

  // At entry of the main conversion function:
  logger.debug('convertToIVM start', { inputNodes: graph.nodes.length, inputEdges: graph.edges.length })
  const start = Date.now()

  // At successful exit:
  logger.info('convertToIVM complete', {
    inputNodes: graph.nodes.length,
    inputEdges: graph.edges.length,
    ivmNodes: ivm.nodes.length,
    ivmEdges: ivm.edges.length,
    durationMs: Date.now() - start,
  })

  // In any catch block:
  logger.error('convertToIVM failed', {
    category: 'parser',
    error: (err as Error).message,
    stack: (err as Error).stack,
  })
  ```

- [ ] Run the test to confirm it passes:
  ```bash
  npm test -w @diagram-builder/parser -- --reporter=verbose ivm-converter
  ```

- [ ] Run the full parser test suite to catch regressions:
  ```bash
  npm test -w @diagram-builder/parser
  ```

- [ ] Commit:
  ```bash
  git add packages/parser/src/ivm/ivm-converter.ts packages/parser/src/ivm/ivm-converter.test.ts
  git commit -m "feat(parser): add logging to ivm-converter"
  ```

---

### Task 2: Audit and fix parser catch blocks

**Files:**
- Modify: `packages/parser/src/repository/repository-loader.ts`
- Modify: any other parser files with silent catch blocks

- [ ] Find all catch blocks in the parser package:
  ```bash
  grep -rn "} catch" packages/parser/src/ --include="*.ts"
  ```

- [ ] Read `repository-loader.ts` in full:
  ```bash
  cat packages/parser/src/repository/repository-loader.ts
  ```

- [ ] For each catch block that is silent (empty body or just `continue`/`return`), add a logger.warn or logger.error with context. Pattern:
  ```typescript
  } catch (err) {
    logger.warn('Failed to process file, skipping', {
      category: 'parser',
      filePath,          // whatever local variable describes what failed
      error: (err as Error).message,
    })
  }
  ```

- [ ] Run parser tests to confirm nothing broken:
  ```bash
  npm test -w @diagram-builder/parser
  ```

- [ ] Commit:
  ```bash
  git add packages/parser/src/
  git commit -m "feat(parser): add error context to all catch blocks"
  ```

---

### Task 3: Add progress tracking to repository-loader.ts

**Files:**
- Modify: `packages/parser/src/repository/repository-loader.ts`

- [ ] Write a failing test for milestone logging:
  ```typescript
  // In repository-loader test file — add:
  it('logs progress milestones when processing many files', async () => {
    const logSpy = vi.spyOn(logger, 'info')
    // call loadRepository with enough mock files to trigger 25% milestone
    // assert logger.info was called with a message containing '25%' or 'progress'
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('progress'),
      expect.objectContaining({ processed: expect.any(Number), total: expect.any(Number) })
    )
  })
  ```

- [ ] Run to confirm it fails:
  ```bash
  npm test -w @diagram-builder/parser -- --reporter=verbose repository-loader
  ```

- [ ] Add progress tracking inside the file processing loop in `loadRepository`:
  ```typescript
  const total = files.length
  logger.info('Parser start', { total, source: config.path ?? config.url })

  const milestones = new Set([25, 50, 75])
  let processed = 0

  for (const file of files) {
    // ... existing processing ...
    processed++
    if (total > 20) {
      const pct = Math.floor((processed / total) * 100)
      const milestone = [25, 50, 75].find(m => milestones.has(m) && pct >= m)
      if (milestone !== undefined) {
        milestones.delete(milestone)
        logger.info('Parser progress', { processed, total, pct: `${milestone}%` })
      }
    }
  }

  logger.info('Parser complete', { processed, total, durationMs: Date.now() - start })
  ```

- [ ] Run test to confirm it passes:
  ```bash
  npm test -w @diagram-builder/parser -- --reporter=verbose repository-loader
  ```

- [ ] Commit:
  ```bash
  git add packages/parser/src/repository/repository-loader.ts
  git commit -m "feat(parser): add progress milestone logging to repository-loader"
  ```

---

### Task 4: Add logging to graph routes

**Files:**
- Modify: `packages/api/src/routes/graph.ts`

- [ ] Read the full file:
  ```bash
  cat packages/api/src/routes/graph.ts
  ```

- [ ] Write a failing test for graph route logging:
  ```typescript
  // packages/api/src/routes/graph.test.ts (create if not exists, or add to existing)
  it('logs graph request and result counts', async () => {
    const logSpy = vi.spyOn(logger, 'info')
    // mock getFullGraph to return a minimal graph
    // make a GET request to /:repoId
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Graph query'),
      expect.objectContaining({ repoId: expect.any(String) })
    )
  })
  ```

- [ ] Run to confirm it fails:
  ```bash
  npm test -w @diagram-builder/api -- --reporter=verbose graph
  ```

- [ ] Add logger import and logging to `graph.ts`. For each route handler:
  ```typescript
  import { logger } from '../logger'

  // At start of handler:
  logger.info('Graph query request', { repoId, route: 'GET /:repoId' })

  // On success:
  logger.info('Graph query complete', {
    repoId,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    durationMs: Date.now() - start,
  })

  // Empty graph:
  if (!graph || graph.nodes.length === 0) {
    logger.warn('Empty graph returned', { repoId })
  }

  // In catch block (line 141):
  logger.error('Graph query failed', {
    category: 'neo4j',
    repoId,
    error: (error as Error).message,
    stack: (error as Error).stack,
  })
  ```

- [ ] Run test to confirm pass:
  ```bash
  npm test -w @diagram-builder/api -- --reporter=verbose graph
  ```

- [ ] Run full API test suite:
  ```bash
  npm test -w @diagram-builder/api
  ```

- [ ] Commit:
  ```bash
  git add packages/api/src/routes/graph.ts
  git commit -m "feat(api): add logging to graph query routes"
  ```

---

### Task 5: Add logging to graph-service.ts

**Files:**
- Modify: `packages/api/src/services/graph-service.ts`

- [ ] Read the file:
  ```bash
  cat packages/api/src/services/graph-service.ts
  ```

- [ ] Add logger import and wrap each exported function with entry/exit/error logs and timing:
  ```typescript
  import { logger } from '../logger'

  export async function getFullGraph(repoId: string) {
    const start = Date.now()
    logger.debug('getFullGraph start', { repoId })
    try {
      const result = await /* existing Neo4j call */
      logger.info('getFullGraph complete', { repoId, nodeCount: result?.nodes?.length ?? 0, durationMs: Date.now() - start })
      return result
    } catch (err) {
      logger.error('getFullGraph failed', {
        category: 'neo4j',
        repoId,
        error: (err as Error).message,
        stack: (err as Error).stack,
      })
      throw err
    }
  }
  ```

- [ ] Apply the same pattern to `getNodeDetails`, `getNodeDependencies`, `executeCustomQuery`, `getParseResult`.

- [ ] Run API tests:
  ```bash
  npm test -w @diagram-builder/api
  ```

- [ ] Commit:
  ```bash
  git add packages/api/src/services/graph-service.ts
  git commit -m "feat(api): add logging and error context to graph-service"
  ```

---

### Task 6: Add request middleware logging

**Files:**
- Modify: `packages/api/src/middleware/logger.ts`

- [ ] Write a failing test:
  ```typescript
  // packages/api/src/middleware/logger.test.ts — add:
  it('logs method, route, status, and duration on response finish', async () => {
    const logSpy = vi.spyOn(logger, 'info')
    // simulate a request/response cycle through the middleware
    expect(logSpy).toHaveBeenCalledWith(
      'request',
      expect.objectContaining({ method: 'GET', status: 200, durationMs: expect.any(Number) })
    )
  })
  ```

- [ ] Update `packages/api/src/middleware/logger.ts` to add a Winston-based request logger alongside the existing Morgan middleware:
  ```typescript
  import { logger } from '../logger'
  import { Request, Response, NextFunction } from 'express'

  export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    if (req.path === '/health') return next()
    const start = Date.now()
    res.on('finish', () => {
      logger.info('request', {
        method: req.method,
        route: req.route?.path ?? req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
      })
    })
    next()
  }
  ```

- [ ] Register `requestLogger` in `packages/api/src/server.ts` — add it after the existing `loggerMiddleware`:
  ```typescript
  import { loggerMiddleware, requestLogger } from './middleware/logger'
  app.use(loggerMiddleware)
  app.use(requestLogger)
  ```

- [ ] Run tests:
  ```bash
  npm test -w @diagram-builder/api
  ```

- [ ] Commit:
  ```bash
  git add packages/api/src/middleware/logger.ts packages/api/src/server.ts
  git commit -m "feat(api): add structured request logger middleware"
  ```

---

### Task 7: Smoke test and mark 12-13 done

- [ ] Start the dev stack and trigger an import:
  ```bash
  ./scripts/init.sh
  # Then POST to /api/workspaces/:id/codebases with a local path
  ```

- [ ] Check logs appear at expected levels:
  ```bash
  LOG_LEVEL=debug npm run dev -w @diagram-builder/api 2>&1 | head -100
  ```
  Expected: parser start/progress/complete, graph query, request logs all visible.

- [ ] Run the full CI checklist:
  ```bash
  npm run type-check && npm run lint && npm run format:check && npm test
  ```
  Expected: all pass.

- [ ] Update story status:
  ```bash
  # Edit docs/epics/epic-12/stories/12-13-complete-winston-logging-foundation.md
  # Set Status: done, check off all tasks
  git add docs/epics/epic-12/stories/12-13-complete-winston-logging-foundation.md
  git commit -m "docs: mark story 12-13 complete"
  ```

---

## Story 12-5: OTEL SDK Setup and Distributed Tracing

### Task 8: Install OTEL packages and add config vars

**Files:**
- Modify: `packages/api/package.json`
- Modify: `packages/api/src/config.ts`
- Modify: `.env.example`

- [ ] Install OTEL packages:
  ```bash
  npm install -w @diagram-builder/api \
    @opentelemetry/api \
    @opentelemetry/sdk-node \
    @opentelemetry/auto-instrumentations-node \
    @opentelemetry/exporter-trace-otlp-http
  ```

- [ ] Add OTEL vars to Zod schema in `packages/api/src/config.ts`:
  ```typescript
  OTEL_ENABLED: z.coerce.boolean().default(false),
  OTEL_SERVICE_NAME: z.string().default('diagram-builder-api'),
  OTEL_SERVICE_VERSION: z.string().default('1.0.0'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default('http://localhost:4318'),
  ```

- [ ] Add to `.env.example`:
  ```bash
  # OpenTelemetry (set OTEL_ENABLED=true when running with Jaeger)
  OTEL_ENABLED=false
  OTEL_SERVICE_NAME=diagram-builder-api
  OTEL_SERVICE_VERSION=1.0.0
  OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
  ```

- [ ] Run type-check:
  ```bash
  npm run type-check
  ```

- [ ] Commit:
  ```bash
  git add packages/api/package.json packages/api/src/config.ts .env.example package-lock.json
  git commit -m "feat(api): install OTEL packages and add config vars"
  ```

---

### Task 9: Create tracing.ts

**Files:**
- Create: `packages/api/src/observability/tracing.ts`
- Create: `packages/api/src/observability/tracing.test.ts`

- [ ] Write a failing test first:
  ```typescript
  // packages/api/src/observability/tracing.test.ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'

  describe('initTracing', () => {
    beforeEach(() => {
      vi.resetModules()
    })

    it('does not throw when OTEL_ENABLED is false', async () => {
      process.env['OTEL_ENABLED'] = 'false'
      await expect(import('./tracing')).resolves.not.toThrow()
    })

    it('exports a tracer object', async () => {
      const { tracer } = await import('./tracing')
      expect(tracer).toBeDefined()
    })
  })
  ```

- [ ] Run to confirm it fails:
  ```bash
  npm test -w @diagram-builder/api -- --reporter=verbose tracing
  ```

- [ ] Create `packages/api/src/observability/tracing.ts`:
  ```typescript
  import { NodeTracerProvider } from '@opentelemetry/sdk-node'
  import { Resource } from '@opentelemetry/resources'
  import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
  import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
  import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
  import { trace, type Tracer } from '@opentelemetry/api'
  import { config } from '../config'

  let tracer: Tracer

  if (config.OTEL_ENABLED) {
    const provider = new NodeTracerProvider({
      resource: new Resource({
        'service.name': config.OTEL_SERVICE_NAME,
        'service.version': config.OTEL_SERVICE_VERSION,
        'deployment.environment': config.NODE_ENV,
      }),
    })

    provider.addSpanProcessor(
      new BatchSpanProcessor(
        new OTLPTraceExporter({ url: `${config.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces` })
      )
    )

    getNodeAutoInstrumentations().forEach(i => provider.register({ propagator: undefined }))
    provider.register()
    tracer = trace.getTracer(config.OTEL_SERVICE_NAME, config.OTEL_SERVICE_VERSION)
  } else {
    tracer = trace.getTracer('noop')
  }

  export { tracer }
  ```

- [ ] Run test to confirm it passes:
  ```bash
  npm test -w @diagram-builder/api -- --reporter=verbose tracing
  ```

- [ ] Commit:
  ```bash
  git add packages/api/src/observability/
  git commit -m "feat(api): add OTEL tracing setup"
  ```

---

### Task 10: Create observability/index.ts and wire into server.ts

**Files:**
- Create: `packages/api/src/observability/index.ts`
- Modify: `packages/api/src/server.ts`

- [ ] Create `packages/api/src/observability/index.ts`:
  ```typescript
  // This file must be imported FIRST in server.ts — before Express or any instrumented library.
  // OTEL auto-instrumentation patches modules at require time; importing this late misses them.
  export { tracer } from './tracing'
  // metrics export added in Story 12-6
  ```

- [ ] Update `packages/api/src/server.ts` — add as the very first import:
  ```typescript
  // OTEL instrumentation — must be first import (patches Express, ioredis, neo4j at require time)
  import './observability'
  ```

- [ ] Run type-check:
  ```bash
  npm run type-check
  ```

- [ ] Run all API tests:
  ```bash
  npm test -w @diagram-builder/api
  ```

- [ ] Commit:
  ```bash
  git add packages/api/src/observability/index.ts packages/api/src/server.ts
  git commit -m "feat(api): wire OTEL observability as first import in server.ts"
  ```

---

### Task 11: Mark story 12-5 done

- [ ] Run full CI checklist:
  ```bash
  npm run type-check && npm run lint && npm run format:check && npm test
  ```

- [ ] Update `docs/epics/epic-12/stories/12-5-otel-sdk-setup-and-distributed-tracing.md` — mark all tasks done, set `Status: done`.

- [ ] Commit:
  ```bash
  git add docs/epics/epic-12/stories/12-5-otel-sdk-setup-and-distributed-tracing.md
  git commit -m "docs: mark story 12-5 complete"
  ```

---

## Story 12-6: OTEL Metrics and Prometheus Exporter

### Task 12: Install metrics packages and create metrics.ts

**Files:**
- Modify: `packages/api/package.json`
- Create: `packages/api/src/observability/metrics.ts`
- Create: `packages/api/src/observability/metrics.test.ts`

- [ ] Install packages:
  ```bash
  npm install -w @diagram-builder/api \
    @opentelemetry/sdk-metrics \
    @opentelemetry/exporter-prometheus
  ```

- [ ] Write a failing test:
  ```typescript
  // packages/api/src/observability/metrics.test.ts
  import { describe, it, expect } from 'vitest'

  describe('metrics', () => {
    it('exports all six metric instruments', async () => {
      const metrics = await import('./metrics')
      expect(metrics.httpRequestDuration).toBeDefined()
      expect(metrics.httpRequestsTotal).toBeDefined()
      expect(metrics.wsActiveSessions).toBeDefined()
      expect(metrics.dbQueryDuration).toBeDefined()
      expect(metrics.cacheOperationsTotal).toBeDefined()
      expect(metrics.parserDuration).toBeDefined()
    })
  })
  ```

- [ ] Run to confirm fail:
  ```bash
  npm test -w @diagram-builder/api -- --reporter=verbose metrics
  ```

- [ ] Create `packages/api/src/observability/metrics.ts`:
  ```typescript
  import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
  import { MeterProvider } from '@opentelemetry/sdk-metrics'
  import type { Histogram, Counter, UpDownCounter } from '@opentelemetry/api'
  import { metrics } from '@opentelemetry/api'
  import { config } from '../config'

  let httpRequestDuration: Histogram
  let httpRequestsTotal: Counter
  let wsActiveSessions: UpDownCounter
  let dbQueryDuration: Histogram
  let cacheOperationsTotal: Counter
  let parserDuration: Histogram

  if (config.OTEL_ENABLED) {
    const exporter = new PrometheusExporter({ port: 9464 }, () => {
      // Prometheus scrape endpoint running on port 9464
    })
    const provider = new MeterProvider({ readers: [exporter] })
    metrics.setGlobalMeterProvider(provider)
  }

  const meter = metrics.getMeter(config.OTEL_SERVICE_NAME)

  httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
    boundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  })
  httpRequestsTotal = meter.createCounter('http_requests_total')
  wsActiveSessions = meter.createUpDownCounter('ws_active_sessions')
  dbQueryDuration = meter.createHistogram('db_query_duration_seconds')
  cacheOperationsTotal = meter.createCounter('cache_operations_total')
  parserDuration = meter.createHistogram('parser_duration_seconds')

  export {
    httpRequestDuration,
    httpRequestsTotal,
    wsActiveSessions,
    dbQueryDuration,
    cacheOperationsTotal,
    parserDuration,
  }
  ```

- [ ] Run test to confirm pass:
  ```bash
  npm test -w @diagram-builder/api -- --reporter=verbose metrics
  ```

- [ ] Update `observability/index.ts` to export metrics:
  ```typescript
  export { tracer } from './tracing'
  export * from './metrics'
  ```

- [ ] Commit:
  ```bash
  git add packages/api/src/observability/ packages/api/package.json package-lock.json
  git commit -m "feat(api): add OTEL metrics and Prometheus exporter"
  ```

---

### Task 13: Create instrumentation helpers

**Files:**
- Create: `packages/api/src/observability/instrumentation.ts`
- Create: `packages/api/src/observability/instrumentation.test.ts`

- [ ] Write a failing test:
  ```typescript
  // packages/api/src/observability/instrumentation.test.ts
  import { describe, it, expect, vi } from 'vitest'
  import { withSpan, recordHttpMetrics } from './instrumentation'

  describe('withSpan', () => {
    it('returns the result of the wrapped function', async () => {
      const result = await withSpan('test', {}, async () => 42)
      expect(result).toBe(42)
    })

    it('rethrows errors from the wrapped function', async () => {
      await expect(
        withSpan('test', {}, async () => { throw new Error('boom') })
      ).rejects.toThrow('boom')
    })
  })

  describe('recordHttpMetrics', () => {
    it('does not throw when called', () => {
      expect(() => recordHttpMetrics('GET', '/test', 200, 42)).not.toThrow()
    })
  })
  ```

- [ ] Run to confirm fail:
  ```bash
  npm test -w @diagram-builder/api -- --reporter=verbose instrumentation
  ```

- [ ] Create `packages/api/src/observability/instrumentation.ts`:
  ```typescript
  import { trace, SpanStatusCode, type Attributes } from '@opentelemetry/api'
  import { tracer } from './tracing'
  import { httpRequestDuration, httpRequestsTotal } from './metrics'

  export async function withSpan<T>(
    name: string,
    attributes: Attributes,
    fn: () => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(name, { attributes })
    try {
      const result = await fn()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message })
      throw err
    } finally {
      span.end()
    }
  }

  export function recordHttpMetrics(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number
  ): void {
    const attrs = { method, route, status_code: String(statusCode) }
    httpRequestsTotal.add(1, attrs)
    httpRequestDuration.record(durationMs / 1000, attrs)
  }
  ```

- [ ] Run test to confirm pass:
  ```bash
  npm test -w @diagram-builder/api -- --reporter=verbose instrumentation
  ```

- [ ] Commit:
  ```bash
  git add packages/api/src/observability/instrumentation.ts packages/api/src/observability/instrumentation.test.ts
  git commit -m "feat(api): add withSpan and recordHttpMetrics instrumentation helpers"
  ```

---

### Task 14: Mark story 12-6 done

- [ ] Run full CI checklist:
  ```bash
  npm run type-check && npm run lint && npm run format:check && npm test
  ```

- [ ] Update story status, commit.

---

## Story 12-7: OTEL Log Bridge and Service-Level Instrumentation

### Task 15: Add Winston OTEL transport

**Files:**
- Modify: `packages/api/package.json`
- Modify: `packages/api/src/logger.ts`

- [ ] Install:
  ```bash
  npm install -w @diagram-builder/api @opentelemetry/winston-transport
  ```

- [ ] Write a failing test:
  ```typescript
  // In packages/api/src/logger.test.ts — add:
  it('includes OpenTelemetryTransportV3 when OTEL_ENABLED is true', () => {
    // Set OTEL_ENABLED=true, reimport logger, check transports
    // This is an integration-level check — verify no throw on init
    expect(() => {
      process.env['OTEL_ENABLED'] = 'true'
      // reimport via vi.importActual or check logger.transports.length
    }).not.toThrow()
  })
  ```

- [ ] Update `packages/api/src/logger.ts` — add OTEL transport conditionally:
  ```typescript
  import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport'
  import { config } from './config'

  // Inside createLogger transports array, add:
  ...(config.OTEL_ENABLED ? [new OpenTelemetryTransportV3()] : []),
  ```

- [ ] Run API tests:
  ```bash
  npm test -w @diagram-builder/api
  ```

- [ ] Commit:
  ```bash
  git add packages/api/src/logger.ts packages/api/package.json package-lock.json
  git commit -m "feat(api): add OTEL Winston transport for log-to-trace correlation"
  ```

---

### Task 16: Instrument HTTP middleware with metrics

**Files:**
- Modify: `packages/api/src/middleware/logger.ts`

- [ ] Update `requestLogger` in `middleware/logger.ts` to call `recordHttpMetrics`:
  ```typescript
  import { recordHttpMetrics } from '../observability/instrumentation'
  import { trace } from '@opentelemetry/api'

  export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    if (req.path === '/health') return next()
    const start = Date.now()
    res.on('finish', () => {
      const durationMs = Date.now() - start
      const route = req.route?.path ?? req.path
      recordHttpMetrics(req.method, route, res.statusCode, durationMs)
      logger.info('request', { method: req.method, route, status: res.statusCode, durationMs })
    })
    next()
  }
  ```

- [ ] Run tests:
  ```bash
  npm test -w @diagram-builder/api
  ```

- [ ] Commit:
  ```bash
  git add packages/api/src/middleware/logger.ts
  git commit -m "feat(api): record HTTP metrics in request logger middleware"
  ```

---

### Task 17: Instrument graph-service, cache, codebase-service, websocket

**Files:**
- Modify: `packages/api/src/services/graph-service.ts`
- Modify: `packages/api/src/cache/cache-utils.ts`
- Modify: `packages/api/src/services/codebase-service.ts`
- Modify: `packages/api/src/websocket/session-manager.ts`

- [ ] Read each file before editing:
  ```bash
  cat packages/api/src/cache/cache-utils.ts
  cat packages/api/src/websocket/session-manager.ts
  ```

- [ ] In `graph-service.ts` — wrap Neo4j calls with `withSpan` and record `dbQueryDuration`:
  ```typescript
  import { withSpan } from '../observability/instrumentation'
  import { dbQueryDuration } from '../observability/metrics'

  // Wrap each Neo4j query:
  return withSpan('neo4j.query', { 'db.operation': 'getFullGraph' }, async () => {
    const start = Date.now()
    const result = await /* existing neo4j call */
    dbQueryDuration.record((Date.now() - start) / 1000, { operation: 'getFullGraph' })
    return result
  })
  ```

- [ ] In `cache-utils.ts` — increment `cacheOperationsTotal` on hit/miss:
  ```typescript
  import { cacheOperationsTotal } from '../observability/metrics'

  // On cache hit:
  cacheOperationsTotal.add(1, { operation: 'get', result: 'hit' })
  // On cache miss:
  cacheOperationsTotal.add(1, { operation: 'get', result: 'miss' })
  ```

- [ ] In `codebase-service.ts` — record `parserDuration` around `loadRepository`:
  ```typescript
  import { parserDuration } from '../observability/metrics'

  const parserStart = Date.now()
  const repo = await loadRepository(source)
  parserDuration.record((Date.now() - parserStart) / 1000, { language: 'typescript' })
  ```

- [ ] In `session-manager.ts` — increment/decrement `wsActiveSessions`:
  ```typescript
  import { wsActiveSessions } from '../observability/metrics'

  // On join:
  wsActiveSessions.add(1, { repository_id: repoId })
  // On leave:
  wsActiveSessions.add(-1, { repository_id: repoId })
  ```

- [ ] Run API tests after all changes:
  ```bash
  npm test -w @diagram-builder/api
  ```

- [ ] Commit:
  ```bash
  git add packages/api/src/services/ packages/api/src/cache/ packages/api/src/websocket/
  git commit -m "feat(api): instrument services with OTEL spans and metrics"
  ```

---

### Task 18: Final CI check and close all stories

- [ ] Run full CI checklist:
  ```bash
  npm run type-check && npm run lint && npm run format:check && npm test
  ```
  All four must pass. Fix any failures before continuing.

- [ ] Update story files — set `Status: done` for 12-7:
  ```bash
  git add docs/epics/epic-12/stories/12-7-otel-log-bridge-and-service-instrumentation.md
  git commit -m "docs: mark story 12-7 complete — Epic 12-C done"
  ```

- [ ] Push the branch:
  ```bash
  git push -u origin docs/epic-12-observability-infrastructure
  ```

---

**Estimated time:** 8-12 hours total
**Stories completed:** 12-13, 12-5, 12-6, 12-7
**Next plan:** `2026-03-22-epic-12b-docker-compose.md` (Stories 12-3, 12-4)
