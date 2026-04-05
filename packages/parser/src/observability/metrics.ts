import { MeterProvider } from '@opentelemetry/sdk-metrics'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { metrics, type Counter, type Histogram } from '@opentelemetry/api'
import { getParserConfig } from './config'

// No-op meter — instruments are always safe to call before initMetrics().
const _noop = metrics.getMeter('diagram-builder-parser-noop')
export let parserFilesTotal: Counter = _noop.createCounter('parser_files_total')
export let parserRunDuration: Histogram = _noop.createHistogram('parser_run_duration_seconds')
export let parserErrorsTotal: Counter = _noop.createCounter('parser_errors_total')

let _initialized = false

export function initMetrics(): void {
  if (_initialized) return
  _initialized = true
  const config = getParserConfig()

  if (!config.OTEL_ENABLED) {
    return
  }

  // Hardcode the parser service name — when running in-process with the API,
  // process.env.OTEL_SERVICE_NAME is set to the API's name and config.OTEL_SERVICE_NAME
  // would inherit that value via the shared env.
  const resource = resourceFromAttributes({
    'service.name': 'diagram-builder-parser',
  })

  const exporter = new PrometheusExporter({
    port: 9465,
    withResourceConstantLabels: /^service\.(name|version)$/,
  })

  const provider = new MeterProvider({
    resource,
    readers: [exporter],
  })

  // Use the local provider directly — setGlobalMeterProvider() is silently ignored
  // when the API (or any other in-process SDK) has already registered a global provider.
  // Bypassing the global ensures instruments are always wired to this exporter on :9465.
  const meter = provider.getMeter('diagram-builder-parser')

  parserFilesTotal = meter.createCounter('parser_files_total', {
    description: 'Total files processed by the parser',
  })

  parserRunDuration = meter.createHistogram('parser_run_duration_seconds', {
    description: 'Duration of parser phases in seconds',
    unit: 's',
    advice: {
      explicitBucketBoundaries: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60],
    },
  })

  parserErrorsTotal = meter.createCounter('parser_errors_total', {
    description: 'Total parser errors by type',
  })
}
