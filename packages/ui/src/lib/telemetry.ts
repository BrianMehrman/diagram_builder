import {
  WebTracerProvider,
  SimpleSpanProcessor,
  StackContextManager,
} from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { trace, SpanStatusCode, type Span, type Attributes } from '@opentelemetry/api'

export function initTelemetry(): void {
  const enabled = import.meta.env.VITE_OTEL_ENABLED === 'true'
  if (!enabled) return

  const endpoint =
    (import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT as string | undefined) ??
    'http://localhost:4318'

  const exporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
  })

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'diagram-builder-ui',
  })

  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  })

  provider.register({
    contextManager: new StackContextManager(),
  })
}

export function getTracer() {
  return trace.getTracer('diagram-builder-ui')
}

export function withSpan<T>(name: string, attributes: Attributes, fn: (span: Span) => T): T
// eslint-disable-next-line no-redeclare
export function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => Promise<T>
): Promise<T>
// eslint-disable-next-line no-redeclare
export function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => T | Promise<T>
): T | Promise<T> {
  const tracer = getTracer()
  return tracer.startActiveSpan(name, { attributes }, (span) => {
    try {
      const result = fn(span)
      if (result instanceof Promise) {
        return result.then(
          (value) => {
            span.setStatus({ code: SpanStatusCode.OK })
            span.end()
            return value
          },
          (err: unknown) => {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: err instanceof Error ? err.message : String(err),
            })
            span.recordException(err instanceof Error ? err : new Error(String(err)))
            span.end()
            throw err
          }
        )
      }
      span.end()
      return result
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      })
      span.recordException(err instanceof Error ? err : new Error(String(err)))
      span.end()
      throw err
    }
  })
}
