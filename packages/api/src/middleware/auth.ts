/**
 * JWT Authentication Middleware
 *
 * Validates JWT tokens from Authorization: Bearer header
 * Populates req.user with decoded token payload for authenticated requests
 * In development mode, authentication is optional for easier testing
 */

import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../auth/jwt'
import { UnauthorizedError } from '../errors'

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 * In development mode, uses a default user if no token is provided
 *
 * @throws UnauthorizedError if token is invalid or expired (only in production)
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const isDevelopment = process.env.NODE_ENV === 'development'

  // In development, allow requests without auth and use a default user
  if (isDevelopment && !authHeader) {
    req.user = {
      userId: 'dev-user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    }
    next()
    return
  }

  if (!authHeader) {
    throw new UnauthorizedError('Missing authorization header', 'Authorization header is required')
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError(
      'Invalid authorization header',
      'Authorization header must use Bearer scheme'
    )
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  if (!token) {
    throw new UnauthorizedError('Missing token', 'Authorization token is required')
  }

  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new UnauthorizedError(
          'Token expired',
          'Your session has expired. Please log in again'
        )
      }
      if (error.message.includes('invalid')) {
        throw new UnauthorizedError('Invalid token', 'The provided token is invalid')
      }
    }
    throw new UnauthorizedError('Authentication failed', 'Unable to authenticate the request')
  }
}
