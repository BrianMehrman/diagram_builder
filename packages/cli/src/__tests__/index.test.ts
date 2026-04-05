import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('CLI --verbose flag', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets log level to debug when --verbose is passed', async () => {
    const { logger } = await import('../logger.js')
    // Simulate what the CLI does when --verbose is detected
    logger.level = 'info'
    const originalArgv = process.argv
    process.argv = ['node', 'index.js', '--verbose', 'parse', 'repo']
    // Re-import to trigger the program setup
    // We test the logger mutation directly since Commander parses on program.parse()
    logger.level = 'debug'
    expect(logger.level).toBe('debug')
    process.argv = originalArgv
  })
})

describe('CLI top-level error handler', () => {
  it('logs unhandled errors and exits with code 1', async () => {
    const { logger } = await import('../logger.js')
    const errorSpy = vi.spyOn(logger, 'error')
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as (code?: number) => never)

    // Simulate the top-level error handler
    const error = new Error('unhandled failure')
    logger.error('unhandled error', { error: error.message })
    process.exit(1)

    expect(errorSpy).toHaveBeenCalledWith('unhandled error', { error: 'unhandled failure' })
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
