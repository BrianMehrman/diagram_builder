/**
 * Observability initialization
 *
 * Initializes OpenTelemetry tracing and metrics.
 * MUST be imported as the very first statement in server.ts so that
 * auto-instrumentation can monkey-patch modules at require time.
 */

import { initTracing, shutdownTracing, getTracer } from './tracing'
import { initMetrics } from './metrics'

initTracing()
initMetrics()

export { getTracer, shutdownTracing }
export * from './instrumentation'
