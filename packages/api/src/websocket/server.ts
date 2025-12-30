/**
 * WebSocket Server
 *
 * Real-time collaboration server using Socket.io
 * Handles:
 * - Session management (join/leave)
 * - Position synchronization (camera/cursor)
 * - Viewpoint updates
 * - Chat/notifications
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { authenticateSocket, type AuthenticatedSocket } from './auth';
import { sessionManager, type UserPosition } from './session-manager';
import { PositionBatcher } from './position-batcher';

/**
 * Event types for type-safe socket communication
 */
export interface ServerToClientEvents {
  // Session events
  'session.joined': (data: {
    sessionId: string;
    users: Array<{ userId: string; username?: string; joinedAt: number }>;
  }) => void;
  'session.userJoined': (data: { userId: string; username?: string }) => void;
  'session.userLeft': (data: { userId: string }) => void;

  // Position sync
  'position.update': (data: UserPosition) => void;
  'positions.sync': (data: { positions: UserPosition[] }) => void;

  // Viewpoint events
  'viewpoint.created': (data: { viewpointId: string; name: string; createdBy: string }) => void;
  'viewpoint.updated': (data: { viewpointId: string; updatedBy: string }) => void;
  'viewpoint.deleted': (data: { viewpointId: string; deletedBy: string }) => void;

  // Notifications
  'notification': (data: { type: 'info' | 'warning' | 'error'; message: string }) => void;

  // Error events
  'error': (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  // Session management
  'session.join': (data: {
    workspaceId: string;
    repositoryId?: string;
  }) => void;
  'session.leave': () => void;

  // Position updates
  'position.update': (data: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    color?: string;
  }) => void;
  'positions.request': () => void;

  // Viewpoint events (broadcast)
  'viewpoint.created': (data: { viewpointId: string; name: string }) => void;
  'viewpoint.updated': (data: { viewpointId: string }) => void;
  'viewpoint.deleted': (data: { viewpointId: string }) => void;
}

// Global position batcher instance
let positionBatcher: PositionBatcher | null = null;

/**
 * Create and configure WebSocket server
 *
 * @param httpServer - HTTP server instance
 * @returns Configured Socket.IO server
 */
export function createWebSocketServer(httpServer: HTTPServer): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents
> {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Create position batcher for performance optimization
  positionBatcher = new PositionBatcher(io, {
    batchWindowMs: 50,
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  // Connection handler
  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`[WebSocket] User connected: ${authSocket.userId} (${authSocket.id})`);

    // Session join handler
    authSocket.on('session.join', ({ workspaceId, repositoryId }) => {
      try {
        const sessionId = repositoryId
          ? `${workspaceId}:${repositoryId}`
          : workspaceId;

        // Join Socket.io room
        authSocket.join(sessionId);

        // Register in session manager
        const session = sessionManager.joinSession(
          sessionId,
          authSocket,
          workspaceId,
          repositoryId
        );

        // Get all users in session
        const users = sessionManager.getSessionUsers(sessionId).map((u) => ({
          userId: u.userId,
          username: u.username,
          joinedAt: u.joinedAt,
        }));

        // Notify the joining user
        authSocket.emit('session.joined', { sessionId, users });

        // Notify other users in the session
        authSocket.to(sessionId).emit('session.userJoined', {
          userId: authSocket.userId,
          username: undefined, // Can be enhanced with user profile lookup
        });

        console.log(
          `[WebSocket] User ${authSocket.userId} joined session ${sessionId} (${session.users.size} users)`
        );
      } catch (error) {
        authSocket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to join session',
          code: 'SESSION_JOIN_ERROR',
        });
      }
    });

    // Session leave handler
    authSocket.on('session.leave', () => {
      handleSessionLeave(authSocket);
    });

    // Position update handler (with batching)
    authSocket.on('position.update', (data) => {
      try {
        const position: UserPosition = {
          userId: authSocket.userId,
          position: data.position,
          target: data.target,
          color: data.color,
          timestamp: Date.now(),
        };

        const session = sessionManager.updateUserPosition(authSocket, position);

        if (session && positionBatcher) {
          // Add to batch for performance (will be sent within 50ms)
          positionBatcher.addUpdate(session.sessionId, position);
        }
      } catch (error) {
        authSocket.emit('error', {
          message: 'Failed to update position',
          code: 'POSITION_UPDATE_ERROR',
        });
      }
    });

    // Request all positions in session
    authSocket.on('positions.request', () => {
      const session = sessionManager.getUserSession(authSocket.userId);
      if (session) {
        const positions = sessionManager
          .getSessionUsers(session.sessionId)
          .filter((u) => u.position !== undefined)
          .map((u) => u.position!);

        authSocket.emit('positions.sync', { positions });
      }
    });

    // Viewpoint created - broadcast to session
    authSocket.on('viewpoint.created', ({ viewpointId, name }) => {
      const session = sessionManager.getUserSession(authSocket.userId);
      if (session) {
        authSocket.to(session.sessionId).emit('viewpoint.created', {
          viewpointId,
          name,
          createdBy: authSocket.userId,
        });
      }
    });

    // Viewpoint updated - broadcast to session
    authSocket.on('viewpoint.updated', ({ viewpointId }) => {
      const session = sessionManager.getUserSession(authSocket.userId);
      if (session) {
        authSocket.to(session.sessionId).emit('viewpoint.updated', {
          viewpointId,
          updatedBy: authSocket.userId,
        });
      }
    });

    // Viewpoint deleted - broadcast to session
    authSocket.on('viewpoint.deleted', ({ viewpointId }) => {
      const session = sessionManager.getUserSession(authSocket.userId);
      if (session) {
        authSocket.to(session.sessionId).emit('viewpoint.deleted', {
          viewpointId,
          deletedBy: authSocket.userId,
        });
      }
    });

    // Disconnect handler
    authSocket.on('disconnect', (reason) => {
      console.log(`[WebSocket] User disconnected: ${authSocket.userId} (${reason})`);
      handleSessionLeave(authSocket);
    });

    // Error handler
    authSocket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for ${authSocket.userId}:`, error);
    });
  });

  // Periodic cleanup of stale sessions (every 10 minutes)
  setInterval(() => {
    const cleaned = sessionManager.cleanupStaleSessions();
    if (cleaned > 0) {
      console.log(`[WebSocket] Cleaned up ${cleaned} stale sessions`);
    }
  }, 10 * 60 * 1000);

  return io;
}

/**
 * Handle session leave for a socket
 */
function handleSessionLeave(socket: AuthenticatedSocket): void {
  const sessionId = sessionManager.leaveSession(socket);

  if (sessionId) {
    // Leave Socket.io room
    socket.leave(sessionId);

    // Notify other users
    socket.to(sessionId).emit('session.userLeft', {
      userId: socket.userId,
    });

    console.log(`[WebSocket] User ${socket.userId} left session ${sessionId}`);
  }
}

/**
 * Get session statistics
 *
 * @returns Session stats
 */
export function getWebSocketStats() {
  return {
    sessions: sessionManager.getStats(),
    positionBatcher: positionBatcher?.getStats() || null,
  };
}

/**
 * Shutdown WebSocket server and flush pending updates
 */
export function shutdownWebSocketServer(): void {
  if (positionBatcher) {
    console.log('[WebSocket] Flushing pending position updates...');
    positionBatcher.flushAll();
    positionBatcher.clear();
    positionBatcher = null;
  }
}
