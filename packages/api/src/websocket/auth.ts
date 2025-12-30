/**
 * WebSocket Authentication Middleware
 *
 * Validates JWT tokens during WebSocket handshake
 * Attaches user information to socket instance
 */

import { Socket } from 'socket.io';
import { verifyToken } from '../auth/jwt';

/**
 * Extended socket interface with user data
 */
export interface AuthenticatedSocket extends Socket {
  userId: string;
}

/**
 * WebSocket authentication middleware
 * Validates JWT token from handshake auth or query parameters
 *
 * @throws Error if authentication fails
 */
export function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
  try {
    // Try to get token from auth object (recommended)
    let token = socket.handshake.auth?.token;

    // Fallback to query parameter for backwards compatibility
    if (!token) {
      token = socket.handshake.query?.token as string;
    }

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify the token
    const payload = verifyToken(token);

    // Attach user information to socket
    (socket as AuthenticatedSocket).userId = payload.userId;

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return next(new Error('Authentication error: Token expired'));
      }
      if (error.message.includes('invalid')) {
        return next(new Error('Authentication error: Invalid token'));
      }
    }
    return next(new Error('Authentication error: Failed to authenticate'));
  }
}
