import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('CLI logger', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a logger with default info level', async () => {
    delete process.env['LOG_LEVEL']
    const { logger } = await import('../logger.js')
    expect(logger.level).toBe('info')
  })

  it('respects LOG_LEVEL env var', async () => {
    process.env['LOG_LEVEL'] = 'debug'
    const { logger } = await import('../logger.js')
    expect(logger.level).toBe('debug')
    delete process.env['LOG_LEVEL']
  })

  it('createModuleLogger returns a child logger with module metadata', async () => {
    const { createModuleLogger } = await import('../logger.js')
    const mod = createModuleLogger('test-module')
    expect(mod).toBeDefined()
    expect(typeof mod.info).toBe('function')
    expect(typeof mod.error).toBe('function')
    expect(typeof mod.debug).toBe('function')
  })
})
