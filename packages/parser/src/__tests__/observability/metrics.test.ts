import { describe, it, expect } from 'vitest'

describe('parser metrics instruments', () => {
  it('parserFilesTotal is a counter with add method', async () => {
    const { parserFilesTotal } = await import('../../observability/metrics')
    expect(typeof parserFilesTotal.add).toBe('function')
  })

  it('parserRunDuration is a histogram with record method', async () => {
    const { parserRunDuration } = await import('../../observability/metrics')
    expect(typeof parserRunDuration.record).toBe('function')
  })

  it('parserErrorsTotal is a counter with add method', async () => {
    const { parserErrorsTotal } = await import('../../observability/metrics')
    expect(typeof parserErrorsTotal.add).toBe('function')
  })

  it('instruments are safe to call without initialization', async () => {
    const { parserFilesTotal, parserRunDuration, parserErrorsTotal } =
      await import('../../observability/metrics')
    expect(() =>
      parserFilesTotal.add(1, { language: 'typescript', status: 'parsed' })
    ).not.toThrow()
    expect(() =>
      parserRunDuration.record(0.5, { language: 'typescript', phase: 'scan' })
    ).not.toThrow()
    expect(() =>
      parserErrorsTotal.add(1, { language: 'typescript', error_type: 'parse_error' })
    ).not.toThrow()
  })
})
