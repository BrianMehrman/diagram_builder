import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock VITE env before importing the module
const mockEnv = { VITE_OTEL_ENABLED: 'false', VITE_OTEL_EXPORTER_OTLP_ENDPOINT: '' }
vi.stubGlobal('import.meta', { env: mockEnv })

describe('telemetry module', () => {
  beforeEach(() => {
    vi.resetModules()
    mockEnv.VITE_OTEL_ENABLED = 'false'
    mockEnv.VITE_OTEL_EXPORTER_OTLP_ENDPOINT = ''
  })

  it('getTracer returns an object with startActiveSpan method', async () => {
    const { getTracer } = await import('./telemetry')
    const tracer = getTracer()
    expect(typeof tracer.startActiveSpan).toBe('function')
  })

  it('withSpan executes the function and returns its result', async () => {
    const { withSpan } = await import('./telemetry')
    const result = withSpan('test.span', { count: 1 }, () => 42)
    expect(result).toBe(42)
  })

  it('withSpan passes span to the function', async () => {
    const { withSpan } = await import('./telemetry')
    let receivedSpan: unknown = null
    withSpan('test.span', {}, (span) => {
      receivedSpan = span
    })
    expect(receivedSpan).not.toBeNull()
    expect(typeof (receivedSpan as { end: unknown }).end).toBe('function')
  })

  it('withSpan ends the span after the function completes', async () => {
    const { withSpan } = await import('./telemetry')
    let ended = false
    withSpan('test.span', {}, (span) => {
      const orig = span.end.bind(span)
      span.end = (...args: Parameters<typeof span.end>) => {
        ended = true
        return orig(...args)
      }
    })
    expect(ended).toBe(true)
  })

  it('initTelemetry is a callable function', async () => {
    const { initTelemetry } = await import('./telemetry')
    expect(typeof initTelemetry).toBe('function')
    expect(() => initTelemetry()).not.toThrow()
  })

  it('initTelemetry does not throw when VITE_OTEL_ENABLED is false', async () => {
    mockEnv.VITE_OTEL_ENABLED = 'false'
    const { initTelemetry } = await import('./telemetry')
    expect(() => initTelemetry()).not.toThrow()
  })
})
