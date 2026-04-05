/**
 * OpenTelemetry Distributed Tracing Setup
 *
 * Initializes NodeTracerProvider with OTLP HTTP exporter and auto-instrumentation.
 * All setup is gated behind OTEL_ENABLED — no-op when disabled.
 *
 * IMPORTANT: This module must be imported BEFORE any other modules in server.ts
 * so that auto-instrumentation can monkey-patch Express, ioredis, and neo4j-driver
 * at require time.
 */

import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { trace } from '@opentelemetry/api'
import { getApiConfig } from '../config'

let sdk: NodeSDK | null = null

export function initTracing(): void {
  const config = getApiConfig()

  if (!config.OTEL_ENABLED) {
    return
  }

  const resource = resourceFromAttributes({
    'service.name': config.OTEL_SERVICE_NAME,
    'service.version': config.OTEL_SERVICE_VERSION,
    'deployment.environment': config.NODE_ENV,
  })

  const traceExporter = new OTLPTraceExporter({
    url: `${config.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  })

  // metricReader wires the PrometheusExporter into the SDK's MeterProvider.
  // NodeSDK.start() calls metrics.setGlobalMeterProvider() — if we don't pass a
  // metricReader here, the SDK registers a no-reader provider first and our
  // subsequent metrics.setGlobalMeterProvider() call in initMetrics() is silently dropped.
  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: new PrometheusExporter({
      port: 9464,
      // Promote service.name and service.version from the resource onto every metric
      // so Prometheus/Grafana can filter by service without joining target_info.
      withResourceConstantLabels: /^service\.(name|version)$/,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk.start()
}

export function shutdownTracing(): Promise<void> {
  return sdk?.shutdown() ?? Promise.resolve()
}

export function getTracer(name: string, version?: string) {
  return trace.getTracer(name, version)
}
