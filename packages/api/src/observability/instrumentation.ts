/**
 * OpenTelemetry Instrumentation Helpers
 *
 * Provides convenience wrappers for creating spans and recording metrics.
 * Re-exports metric instruments for direct use by service modules.
 */

import { trace, context, SpanStatusCode, type Attributes, type Span } from '@opentelemetry/api'
import {
  httpRequestDuration,
  httpRequestsTotal,
  wsActiveSessions,
  dbQueryDuration,
  cacheOperationsTotal,
} from './metrics'

/**
 * Wraps an async function in a named span.
 * Sets error status and records the error message on throw.
 */
export async function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = trace.getActiveSpan()
    ? trace.getTracer('diagram-builder-api')
    : trace.getTracer('diagram-builder-api')

  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      })
      span.recordException(err instanceof Error ? err : new Error(String(err)))
      throw err
    } finally {
      span.end()
    }
  })
}

/**
 * Records HTTP request metrics (counter + duration histogram).
 */
export function recordHttpMetrics(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number
): void {
  const attributes = { method, route, status_code: String(statusCode) }
  httpRequestsTotal.add(1, attributes)
  httpRequestDuration.record(durationMs / 1000, attributes)
}

// Re-export instruments for direct use by services
export {
  httpRequestDuration,
  httpRequestsTotal,
  wsActiveSessions,
  dbQueryDuration,
  cacheOperationsTotal,
  context,
}
