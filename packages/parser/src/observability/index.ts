import { initTracing, shutdownTracing, getTracer } from './tracing'
import { initMetrics } from './metrics'

initTracing()
initMetrics()

export { getTracer, shutdownTracing }
export { runParserPipeline } from './pipeline'
export * from './metrics'
