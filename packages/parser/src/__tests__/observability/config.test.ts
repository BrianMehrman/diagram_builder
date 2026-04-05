import { describe, it, expect, beforeEach } from 'vitest'

describe('parser observability config', () => {
  beforeEach(() => {
    delete process.env.OTEL_ENABLED
    delete process.env.OTEL_SERVICE_NAME
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    delete process.env.LOKI_ENABLED
    delete process.env.LOKI_HOST
  })

  it('returns defaults when env vars are absent', async () => {
    const { getParserConfig } = await import('../../observability/config')
    const config = getParserConfig()
    expect(config.OTEL_ENABLED).toBe(false)
    expect(config.OTEL_SERVICE_NAME).toBe('diagram-builder-parser')
    expect(config.OTEL_EXPORTER_OTLP_ENDPOINT).toBe('http://localhost:4318')
    expect(config.LOKI_ENABLED).toBe(false)
    expect(config.LOKI_HOST).toBe('http://localhost:3100')
  })

  it('reads OTEL_ENABLED=true from env', async () => {
    process.env.OTEL_ENABLED = 'true'
    const { getParserConfig } = await import('../../observability/config')
    const config = getParserConfig()
    expect(config.OTEL_ENABLED).toBe(true)
  })

  it('reads LOKI_ENABLED=true from env', async () => {
    process.env.LOKI_ENABLED = 'true'
    const { getParserConfig } = await import('../../observability/config')
    const config = getParserConfig()
    expect(config.LOKI_ENABLED).toBe(true)
  })

  it('reads custom LOKI_HOST from env', async () => {
    process.env.LOKI_HOST = 'http://loki:3100'
    const { getParserConfig } = await import('../../observability/config')
    const config = getParserConfig()
    expect(config.LOKI_HOST).toBe('http://loki:3100')
  })

  it('reads custom OTEL_SERVICE_NAME from env', async () => {
    process.env.OTEL_SERVICE_NAME = 'custom-parser'
    const { getParserConfig } = await import('../../observability/config')
    const config = getParserConfig()
    expect(config.OTEL_SERVICE_NAME).toBe('custom-parser')
  })
})
