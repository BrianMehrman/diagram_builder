/**
 * Authentication Routes
 *
 * Handles JWT token generation and refresh
 * Supports email/password authentication for testing
 */

import { Router, Request, Response } from 'express'
import { generateToken } from '../auth/jwt'
import { authenticate } from '../middleware/auth'
import { ValidationError } from '../errors'

export const authRouter = Router()

/**
 * Token response interface
 */
interface TokenResponse {
  token: string
  expiresIn: number // seconds
  user: {
    userId: string
    email: string
  }
}

/**
 * Login request body interface
 */
interface LoginRequest {
  email?: unknown
  password?: unknown
  userId?: unknown // Legacy support
}

/**
 * Test user credentials (from .env)
 */
const TEST_USER = {
  userId: 'test-user-123',
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
}

/**
 * POST /api/auth/login
 * Authenticate user and generate JWT token
 *
 * Accepts email/password or legacy userId
 */
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password, userId } = req.body as LoginRequest

  let authenticatedUserId: string
  let userEmail: string

  // Support email/password login
  if (email && password) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new ValidationError('Invalid credentials', 'Email and password must be strings')
    }

    // Validate against test user
    if (email === TEST_USER.email && password === TEST_USER.password) {
      authenticatedUserId = TEST_USER.userId
      userEmail = TEST_USER.email
    } else {
      res.status(401).json({
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Authentication Failed',
        status: 401,
        detail: 'Invalid email or password',
      })
      return
    }
  }
  // Legacy: Support userId-only login for backwards compatibility
  else if (userId && typeof userId === 'string') {
    authenticatedUserId = userId
    userEmail = `${userId}@example.com`
  } else {
    throw new ValidationError('Invalid login request', 'Email and password, or userId is required')
  }

  const token = generateToken(authenticatedUserId)
  const expiresIn = 24 * 60 * 60 // 24 hours in seconds

  const response: TokenResponse = {
    token,
    expiresIn,
    user: {
      userId: authenticatedUserId,
      email: userEmail,
    },
  }

  res.json(response)
})

/**
 * POST /api/auth/refresh
 * Refresh an existing JWT token
 *
 * Requires valid authentication
 * Generates a new token with extended expiration
 */
authRouter.post('/refresh', authenticate, (req: Request, res: Response) => {
  if (!req.user) {
    throw new ValidationError('Missing user', 'User information not found in request')
  }

  const token = generateToken(req.user.userId)
  const expiresIn = 24 * 60 * 60 // 24 hours in seconds

  const response: TokenResponse = {
    token,
    expiresIn,
  }

  res.json(response)
})
