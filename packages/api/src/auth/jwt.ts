/**
 * JWT token generation and validation
 *
 * Handles JWT token lifecycle for authentication across REST API, WebSocket, and CLI
 * Tokens expire after 24 hours and must be passed in Authorization: Bearer header
 */

import jwt from 'jsonwebtoken';

/**
 * JWT payload structure
 * Contains user identifier and standard JWT claims
 */
export interface JWTPayload {
  userId: string;
  iat: number;  // Issued at timestamp
  exp: number;  // Expiration timestamp
}

/**
 * Token expiration duration: 24 hours
 */
export const TOKEN_EXPIRATION = '24h';

/**
 * Generate a JWT token for the given user ID
 *
 * @param userId - Unique identifier for the user
 * @param secret - JWT secret key (defaults to environment variable)
 * @returns Signed JWT token string
 */
export function generateToken(userId: string, secret?: string): string {
  const jwtSecret = secret || process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload = { userId };
  return jwt.sign(payload, jwtSecret, { expiresIn: TOKEN_EXPIRATION });
}

/**
 * Verify and decode a JWT token
 *
 * @param token - JWT token string to verify
 * @param secret - JWT secret key (defaults to environment variable)
 * @returns Decoded JWT payload
 * @throws Error if token is invalid, expired, or malformed
 */
export function verifyToken(token: string, secret?: string): JWTPayload {
  const jwtSecret = secret || process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.verify(token, jwtSecret) as JWTPayload;
}
