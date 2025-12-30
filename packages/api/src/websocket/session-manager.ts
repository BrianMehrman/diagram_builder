/**
 * Session Manager
 *
 * Manages multi-user collaboration sessions
 * Tracks active users, cursor positions, and session state
 */

import type { AuthenticatedSocket } from './auth';

/**
 * User's cursor/camera position in 3D space
 */
export interface UserPosition {
  userId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  target: {
    x: number;
    y: number;
    z: number;
  };
  color?: string;
  timestamp: number;
}

/**
 * Active user in a session
 */
export interface SessionUser {
  userId: string;
  socketId: string;
  username?: string;
  joinedAt: number;
  lastActivity: number;
  position?: UserPosition;
}

/**
 * Collaboration session
 */
export interface Session {
  sessionId: string;
  workspaceId: string;
  repositoryId: string | undefined;
  users: Map<string, SessionUser>;
  createdAt: number;
  lastActivity: number;
}

/**
 * Session manager for handling multi-user collaboration
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userToSession: Map<string, string> = new Map();

  /**
   * Create or join a session
   *
   * @param sessionId - Session identifier (typically workspaceId or workspaceId:repoId)
   * @param socket - Authenticated socket
   * @param workspaceId - Workspace ID
   * @param repositoryId - Optional repository ID
   * @returns Session object
   */
  joinSession(
    sessionId: string,
    socket: AuthenticatedSocket,
    workspaceId: string,
    repositoryId?: string
  ): Session {
    const now = Date.now();

    // Get or create session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        workspaceId,
        repositoryId: repositoryId || undefined,
        users: new Map(),
        createdAt: now,
        lastActivity: now,
      };
      this.sessions.set(sessionId, session);
    }

    // Add user to session
    const user: SessionUser = {
      userId: socket.userId,
      socketId: socket.id,
      joinedAt: now,
      lastActivity: now,
    };

    session.users.set(socket.userId, user);
    session.lastActivity = now;

    // Track user's session
    this.userToSession.set(socket.userId, sessionId);

    return session;
  }

  /**
   * Leave a session
   *
   * @param socket - Authenticated socket
   * @returns Session ID that was left, or null
   */
  leaveSession(socket: AuthenticatedSocket): string | null {
    const sessionId = this.userToSession.get(socket.userId);
    if (!sessionId) {
      return null;
    }

    const session = this.sessions.get(sessionId);
    if (session) {
      session.users.delete(socket.userId);
      session.lastActivity = Date.now();

      // Clean up empty sessions
      if (session.users.size === 0) {
        this.sessions.delete(sessionId);
      }
    }

    this.userToSession.delete(socket.userId);

    return sessionId;
  }

  /**
   * Update user's position in session
   *
   * @param socket - Authenticated socket
   * @param position - User's camera/cursor position
   * @returns Updated session or null
   */
  updateUserPosition(socket: AuthenticatedSocket, position: UserPosition): Session | null {
    const sessionId = this.userToSession.get(socket.userId);
    if (!sessionId) {
      return null;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const user = session.users.get(socket.userId);
    if (user) {
      user.position = {
        ...position,
        userId: socket.userId,
        timestamp: Date.now(),
      };
      user.lastActivity = Date.now();
      session.lastActivity = Date.now();
    }

    return session;
  }

  /**
   * Get session by ID
   *
   * @param sessionId - Session identifier
   * @returns Session or undefined
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session for a user
   *
   * @param userId - User ID
   * @returns Session or undefined
   */
  getUserSession(userId: string): Session | undefined {
    const sessionId = this.userToSession.get(userId);
    if (!sessionId) {
      return undefined;
    }
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   *
   * @returns Array of sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get users in a session
   *
   * @param sessionId - Session identifier
   * @returns Array of users
   */
  getSessionUsers(sessionId: string): SessionUser[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    return Array.from(session.users.values());
  }

  /**
   * Clean up stale sessions (no activity for > 1 hour)
   */
  cleanupStaleSessions(): number {
    const now = Date.now();
    const staleThreshold = 60 * 60 * 1000; // 1 hour
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > staleThreshold) {
        // Remove all users from tracking
        for (const userId of session.users.keys()) {
          this.userToSession.delete(userId);
        }

        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get session statistics
   *
   * @returns Session stats
   */
  getStats(): {
    totalSessions: number;
    totalUsers: number;
    averageUsersPerSession: number;
  } {
    const totalSessions = this.sessions.size;
    let totalUsers = 0;

    for (const session of this.sessions.values()) {
      totalUsers += session.users.size;
    }

    return {
      totalSessions,
      totalUsers,
      averageUsersPerSession: totalSessions > 0 ? totalUsers / totalSessions : 0,
    };
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
