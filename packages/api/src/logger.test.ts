import { describe, it, expect, vi, afterEach } from 'vitest'
import { PassThrough } from 'stream'
import winston from 'winston'
import { createModuleLogger, withOperation } from './logger'

afterEach(() => {
  vi.restoreAllMocks()
})

// Capture log entries written by a given logger into an array.
function captureEntries(log: winston.Logger): { entries: Record<string, unknown>[] } {
  const entries: Record<string, unknown>[] = []
  const pass = new PassThrough()
  pass.on('data', (chunk: Buffer) => {
    try {
      entries.push(JSON.parse(chunk.toString()) as Record<string, unknown>)
    } catch {
      // ignore non-JSON
    }
  })
  log.add(new winston.transports.Stream({ stream: pass }))
  return { entries }
}

describe('createModuleLogger', () => {
  it('returns a valid logger instance with standard log methods', () => {
    const log = createModuleLogger('test-module')
    expect(typeof log.info).toBe('function')
    expect(typeof log.error).toBe('function')
    expect(typeof log.debug).toBe('function')
    expect(typeof log.warn).toBe('function')
  })

  it('includes the module name in every log entry', () => {
    const log = createModuleLogger('workspace-service')
    const { entries } = captureEntries(log)

    log.info('hello')

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ module: 'workspace-service', message: 'hello' })
  })

  it('different module names produce distinct logger instances', () => {
    const logA = createModuleLogger('module-a')
    const logB = createModuleLogger('module-b')
    expect(logA).not.toBe(logB)
  })
})

describe('withOperation', () => {
  it('emits .start at debug before the function runs', async () => {
    const log = createModuleLogger('test')
    const spy = vi.spyOn(log, 'debug')

    await withOperation(log, 'doThing', { userId: 'u1' }, async () => 'result')

    expect(spy).toHaveBeenCalledWith('doThing.start', { userId: 'u1' })
  })

  it('emits .complete at info with durationMs on success', async () => {
    const log = createModuleLogger('test')
    const spy = vi.spyOn(log, 'info')

    await withOperation(log, 'doThing', { userId: 'u1' }, async () => 'result')

    expect(spy).toHaveBeenCalledWith(
      'doThing.complete',
      expect.objectContaining({ userId: 'u1', durationMs: expect.any(Number) })
    )
  })

  it('returns the value from the wrapped function', async () => {
    const log = createModuleLogger('test')
    const result = await withOperation(log, 'doThing', {}, async () => 42)
    expect(result).toBe(42)
  })

  it('emits .failed at error with error message and durationMs on throw', async () => {
    const log = createModuleLogger('test')
    const spy = vi.spyOn(log, 'error')

    await expect(
      withOperation(log, 'doThing', { userId: 'u1' }, async () => {
        throw new Error('something broke')
      })
    ).rejects.toThrow('something broke')

    expect(spy).toHaveBeenCalledWith(
      'doThing.failed',
      expect.objectContaining({
        userId: 'u1',
        durationMs: expect.any(Number),
        error: 'something broke',
      })
    )
  })

  it('re-throws the original error after logging', async () => {
    const log = createModuleLogger('test')
    const originalError = new Error('original')

    await expect(
      withOperation(log, 'doThing', {}, async () => {
        throw originalError
      })
    ).rejects.toBe(originalError)
  })

  it('does not emit .complete when the function throws', async () => {
    const log = createModuleLogger('test')
    const infoSpy = vi.spyOn(log, 'info')

    await expect(
      withOperation(log, 'doThing', {}, async () => {
        throw new Error('fail')
      })
    ).rejects.toThrow()

    expect(infoSpy).not.toHaveBeenCalledWith('doThing.complete', expect.anything())
  })
})
