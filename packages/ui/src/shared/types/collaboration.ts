/**
 * Collaboration Types
 *
 * Types for real-time collaboration and WebSocket communication
 */

import type { Position3D } from './graph';

/**
 * User position in 3D space
 */
export interface UserPosition {
  userId: string;
  position: Position3D;
  target: Position3D;
  color?: string;
  timestamp: number;
}

/**
 * Session user
 */
export interface SessionUser {
  userId: string;
  username?: string;
  joinedAt: number;
  position?: UserPosition;
}

/**
 * Collaboration session
 */
export interface Session {
  sessionId: string;
  workspaceId: string;
  repositoryId?: string;
  users: SessionUser[];
}

/**
 * WebSocket connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * Notification
 */
export interface Notification {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}
