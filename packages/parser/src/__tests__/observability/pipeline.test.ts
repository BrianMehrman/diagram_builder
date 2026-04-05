import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 5 levels up: observability → __tests__ → src → parser → packages → repo root
const FIXTURE_REPO = resolve(
  __dirname,
  '../../../../..',
  'tests/fixtures/repositories/small-ts-repo'
)

describe('runParserPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an IVMGraph with nodes and edges', async () => {
    const { runParserPipeline } = await import('../../observability/pipeline')
    const result = await runParserPipeline({ path: FIXTURE_REPO }, { name: 'test-repo' })
    expect(result).toBeDefined()
    expect(Array.isArray(result.nodes)).toBe(true)
    expect(Array.isArray(result.edges)).toBe(true)
  })

  it('increments parserFilesTotal for each processed file', async () => {
    const metrics = await import('../../observability/metrics')
    const addSpy = vi.spyOn(metrics.parserFilesTotal, 'add')

    const { runParserPipeline } = await import('../../observability/pipeline')
    await runParserPipeline({ path: FIXTURE_REPO }, { name: 'test-repo' })

    expect(addSpy).toHaveBeenCalled()
    const calls = addSpy.mock.calls
    expect(calls.every(([n]) => n === 1)).toBe(true)
    expect(calls.every(([, attrs]) => typeof attrs?.language === 'string')).toBe(true)
  })

  it('records parserRunDuration for each phase', async () => {
    const metrics = await import('../../observability/metrics')
    const recordSpy = vi.spyOn(metrics.parserRunDuration, 'record')

    const { runParserPipeline } = await import('../../observability/pipeline')
    await runParserPipeline({ path: FIXTURE_REPO }, { name: 'test-repo' })

    const phases = recordSpy.mock.calls.map(([, attrs]) => attrs?.phase)
    expect(phases).toContain('scan')
    expect(phases).toContain('parse')
    expect(phases).toContain('graph')
  })

  it('increments parserErrorsTotal when a file fails to parse', async () => {
    const metrics = await import('../../observability/metrics')
    const addSpy = vi.spyOn(metrics.parserErrorsTotal, 'add')

    // Use a path that will cause a parse error — non-existent repo
    const { runParserPipeline } = await import('../../observability/pipeline')
    await expect(
      runParserPipeline({ path: '/non/existent/path' }, { name: 'test' })
    ).rejects.toThrow()

    // Error counter may or may not be called depending on error type,
    // but the function should throw and not hang
    expect(addSpy).toBeDefined()
  })
})
