/**
 * JWT Authentication Middleware
 *
 * Validates JWT tokens from Authorization: Bearer header
 * Populates req.user with decoded token payload for authenticated requests
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth/jwt';
import { UnauthorizedError } from '../errors';

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 *
 * @throws UnauthorizedError if token is missing, invalid, or expired
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError('Missing authorization header', 'Authorization header is required');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Invalid authorization header', 'Authorization header must use Bearer scheme');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    throw new UnauthorizedError('Missing token', 'Authorization token is required');
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new UnauthorizedError('Token expired', 'Your session has expired. Please log in again');
      }
      if (error.message.includes('invalid')) {
        throw new UnauthorizedError('Invalid token', 'The provided token is invalid');
      }
    }
    throw new UnauthorizedError('Authentication failed', 'Unable to authenticate the request');
  }
}
