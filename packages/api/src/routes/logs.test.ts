/**
 * Tests for POST /api/logs
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import { logsRouter } from './logs'
import { errorHandler } from '../middleware/error-handler'

let app: Express

beforeAll(() => {
  app = express()
  app.use(express.json())
  app.use('/api/logs', logsRouter)
  app.use(errorHandler)

  process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long'
  process.env.NEO4J_PASSWORD = 'test-password'
})

describe('POST /api/logs', () => {
  it('returns 204 for a valid error log body', async () => {
    const res = await request(app).post('/api/logs').send({
      level: 'error',
      message: 'Something went wrong in the UI',
    })

    expect(res.status).toBe(204)
  })

  it('returns 204 for a valid info log body with context', async () => {
    const res = await request(app)
      .post('/api/logs')
      .send({
        level: 'info',
        message: 'User clicked button',
        context: { componentStack: '\n    at Button\n    at App' },
      })

    expect(res.status).toBe(204)
  })

  it('defaults level to error when omitted', async () => {
    const res = await request(app).post('/api/logs').send({
      message: 'Missing level field',
    })

    expect(res.status).toBe(204)
  })

  it('returns 400 when message is missing', async () => {
    const res = await request(app).post('/api/logs').send({
      level: 'error',
    })

    expect(res.status).toBe(400)
  })

  it('returns 400 when level is not in the allowlist', async () => {
    const res = await request(app).post('/api/logs').send({
      level: 'critical',
      message: 'Not a valid level',
    })

    expect(res.status).toBe(400)
  })

  it('does not require authentication', async () => {
    // No Authorization header — should still succeed
    const res = await request(app).post('/api/logs').send({
      level: 'warn',
      message: 'Unauthenticated error report',
    })

    expect(res.status).toBe(204)
  })
})
