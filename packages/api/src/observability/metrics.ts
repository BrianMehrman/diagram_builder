/**
 * OpenTelemetry Metrics Setup
 *
 * Initializes MeterProvider with Prometheus exporter and defines
 * the six standard metric instruments for the API.
 * Instruments are initialized eagerly with a no-op meter so they are
 * always safe to use. When OTEL_ENABLED=true, initMetrics() replaces
 * them with real instruments backed by a PrometheusExporter.
 */

import { metrics, type Counter, type Histogram, type UpDownCounter } from '@opentelemetry/api'
import { getApiConfig } from '../config'

// Initialize with no-op meter immediately — instruments are always safe to call.
// Live CJS export bindings mean initMetrics() can replace them with real instruments.
const _noop = metrics.getMeter('diagram-builder-noop')
let httpRequestDuration: Histogram = _noop.createHistogram('http_request_duration_seconds')
let httpRequestsTotal: Counter = _noop.createCounter('http_requests_total')
let wsActiveSessions: UpDownCounter = _noop.createUpDownCounter('ws_active_sessions')
let dbQueryDuration: Histogram = _noop.createHistogram('db_query_duration_seconds')
let cacheOperationsTotal: Counter = _noop.createCounter('cache_operations_total')

export function initMetrics(): void {
  const config = getApiConfig()

  if (!config.OTEL_ENABLED) {
    return
  }

  // NodeSDK.start() (called in initTracing) has already registered a global MeterProvider
  // with a PrometheusExporter on port 9464. Use it directly — calling setGlobalMeterProvider
  // again would be silently ignored.
  const meter = metrics.getMeter(config.OTEL_SERVICE_NAME, config.OTEL_SERVICE_VERSION)

  httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
    description: 'Duration of HTTP requests in seconds',
    unit: 's',
    advice: {
      explicitBucketBoundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    },
  })

  httpRequestsTotal = meter.createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
  })

  wsActiveSessions = meter.createUpDownCounter('ws_active_sessions', {
    description: 'Number of active WebSocket sessions',
  })

  dbQueryDuration = meter.createHistogram('db_query_duration_seconds', {
    description: 'Duration of database queries in seconds',
    unit: 's',
  })

  cacheOperationsTotal = meter.createCounter('cache_operations_total', {
    description: 'Total number of cache operations',
  })
}

export {
  httpRequestDuration,
  httpRequestsTotal,
  wsActiveSessions,
  dbQueryDuration,
  cacheOperationsTotal,
}
