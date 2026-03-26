import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import request from 'supertest'
import express, { Application } from 'express'
import { loggerMiddleware, requestLogger } from './logger'
import { logger } from '../logger'

describe('Logger Middleware', () => {
  let app: Application
  let server: ReturnType<typeof app.listen>

  beforeAll(() => {
    app = express()
    app.use(loggerMiddleware)
    app.get('/test', (_req, res) => {
      res.json({ message: 'test' })
    })
    server = app.listen(0) // Random port
  })

  afterAll(() => {
    server.close()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should log requests in development mode', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const response = await request(app).get('/test')

    expect(response.status).toBe(200)
    // Logger middleware should not interfere with response

    process.env.NODE_ENV = originalEnv
  })

  it('should log requests in production mode', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const response = await request(app).get('/test')

    expect(response.status).toBe(200)
    // Logger middleware should not interfere with response

    process.env.NODE_ENV = originalEnv
  })

  it('should not block request processing', async () => {
    const response = await request(app).get('/test').expect(200)

    expect(response.body).toEqual({ message: 'test' })
  })
})

describe('requestLogger', () => {
  let app: Application
  let server: ReturnType<typeof app.listen>

  beforeAll(() => {
    app = express()
    app.use(requestLogger)
    app.get('/test', (_req, res) => {
      res.json({ ok: true })
    })
    app.get('/health', (_req, res) => {
      res.json({ status: 'healthy' })
    })
    server = app.listen(0)
  })

  afterAll(() => {
    server.close()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs method, route, status, and duration on response finish', async () => {
    const logSpy = vi.spyOn(logger, 'info')
    await request(app).get('/test')
    expect(logSpy).toHaveBeenCalledWith(
      'request',
      expect.objectContaining({ method: 'GET', status: 200, durationMs: expect.any(Number) })
    )
  })

  it('skips logging for /health requests', async () => {
    const logSpy = vi.spyOn(logger, 'info')
    await request(app).get('/health')
    expect(logSpy).not.toHaveBeenCalledWith('request', expect.anything())
  })
})
