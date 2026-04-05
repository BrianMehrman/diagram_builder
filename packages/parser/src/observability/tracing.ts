import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { trace } from '@opentelemetry/api'
import { getParserConfig } from './config'

let sdk: NodeSDK | null = null

export function initTracing(): void {
  const config = getParserConfig()

  if (!config.OTEL_ENABLED) {
    return
  }

  // If running in-process with the API, the global provider is already set.
  // getTracer() will use it automatically — avoid re-initializing.
  //
  // ProxyTracerProvider (the OTEL no-op default) has no _delegate until a real SDK
  // registers itself. Checking _delegate is stable across minification and minor
  // version changes; constructor.name is not.
  const existingProvider = trace.getTracerProvider() as { _delegate?: unknown }
  if (existingProvider._delegate !== undefined) {
    return
  }

  const resource = resourceFromAttributes({
    'service.name': config.OTEL_SERVICE_NAME,
  })

  const traceExporter = new OTLPTraceExporter({
    url: `${config.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  })

  sdk = new NodeSDK({
    resource,
    traceExporter,
  })

  sdk.start()
}

export function shutdownTracing(): Promise<void> {
  return sdk?.shutdown() ?? Promise.resolve()
}

export function getTracer() {
  return trace.getTracer('diagram-builder-parser')
}
