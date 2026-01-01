/**
 * Position Update Batcher
 *
 * Batches position updates over a time window (default 50ms) to reduce
 * WebSocket message overhead for high-frequency position updates
 */

import type { Server } from 'socket.io';
import type { UserPosition } from './session-manager';
import type { ServerToClientEvents, ClientToServerEvents } from './server';

/**
 * Position batcher configuration
 */
export interface PositionBatcherConfig {
  /** Batch window in milliseconds */
  batchWindowMs: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PositionBatcherConfig = {
  batchWindowMs: 50,
};

/**
 * Position update batcher
 *
 * Collects position updates and broadcasts them in batches to reduce
 * the number of WebSocket messages
 */
export class PositionBatcher {
  private pendingUpdates: Map<string, Map<string, UserPosition>> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: PositionBatcherConfig;
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    config?: Partial<PositionBatcherConfig>
  ) {
    this.io = io;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a position update to the batch
   *
   * @param sessionId - Session identifier
   * @param position - User position update
   */
  addUpdate(sessionId: string, position: UserPosition): void {
    // Get or create pending updates for this session
    let sessionUpdates = this.pendingUpdates.get(sessionId);
    if (!sessionUpdates) {
      sessionUpdates = new Map();
      this.pendingUpdates.set(sessionId, sessionUpdates);
    }

    // Store the position (overwrites previous update from same user)
    sessionUpdates.set(position.userId, position);

    // Schedule batch flush if not already scheduled
    if (!this.batchTimers.has(sessionId)) {
      const timer = setTimeout(() => {
        this.flushBatch(sessionId);
      }, this.config.batchWindowMs);

      this.batchTimers.set(sessionId, timer);
    }
  }

  /**
   * Flush pending updates for a session
   *
   * @param sessionId - Session identifier
   */
  private flushBatch(sessionId: string): void {
    const sessionUpdates = this.pendingUpdates.get(sessionId);
    if (!sessionUpdates || sessionUpdates.size === 0) {
      return;
    }

    // Convert map to array of positions
    const positions = Array.from(sessionUpdates.values());

    // Clear pending updates and timer
    this.pendingUpdates.delete(sessionId);
    const timer = this.batchTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(sessionId);
    }

    // Broadcast the batch (Socket.io with MessagePack binary serialization)
    this.io.to(sessionId).emit('positions.sync', { positions });
  }

  /**
   * Flush all pending batches immediately
   * Useful during shutdown
   */
  flushAll(): void {
    for (const sessionId of this.pendingUpdates.keys()) {
      this.flushBatch(sessionId);
    }
  }

  /**
   * Clear all pending updates and timers
   * Useful during shutdown
   */
  clear(): void {
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }

    this.batchTimers.clear();
    this.pendingUpdates.clear();
  }

  /**
   * Get statistics about batching
   *
   * @returns Batching statistics
   */
  getStats(): {
    pendingSessions: number;
    totalPendingUpdates: number;
    averageUpdatesPerSession: number;
  } {
    let totalUpdates = 0;
    for (const updates of this.pendingUpdates.values()) {
      totalUpdates += updates.size;
    }

    const pendingSessions = this.pendingUpdates.size;

    return {
      pendingSessions,
      totalPendingUpdates: totalUpdates,
      averageUpdatesPerSession: pendingSessions > 0 ? totalUpdates / pendingSessions : 0,
    };
  }
}
