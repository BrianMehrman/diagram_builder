export interface ParserObservabilityConfig {
  OTEL_ENABLED: boolean
  OTEL_SERVICE_NAME: string
  OTEL_EXPORTER_OTLP_ENDPOINT: string
  LOKI_ENABLED: boolean
  LOKI_HOST: string
}

export function getParserConfig(): ParserObservabilityConfig {
  return {
    OTEL_ENABLED: process.env.OTEL_ENABLED === 'true',
    OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME ?? 'diagram-builder-parser',
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318',
    LOKI_ENABLED: process.env.LOKI_ENABLED === 'true',
    LOKI_HOST: process.env.LOKI_HOST ?? 'http://localhost:3100',
  }
}
