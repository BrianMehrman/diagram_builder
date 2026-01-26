/**
 * WebSocket Connection Manager
 *
 * Manages WebSocket connections with JWT authentication
 */

import { io, Socket } from 'socket.io-client'
import { getToken } from '../api/auth'

/**
 * WebSocket manager configuration
 */
interface WebSocketManagerConfig {
  url: string
  reconnection?: boolean
  reconnectionDelay?: number
  reconnectionAttempts?: number
}

/**
 * WebSocket connection manager
 */
export class WebSocketManager {
  private socket: Socket | null = null
  private config: WebSocketManagerConfig

  constructor(config: WebSocketManagerConfig) {
    this.config = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      ...config,
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(sessionId: string, userId: string, username: string): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    const token = getToken()

    this.socket = io(this.config.url, {
      auth: {
        token,
        sessionId,
        userId,
        username,
      },
      transports: ['websocket'],
      reconnection: this.config.reconnection ?? true,
      reconnectionDelay: this.config.reconnectionDelay ?? 1000,
      reconnectionAttempts: this.config.reconnectionAttempts ?? 5,
    })

    return this.socket
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  /**
   * Get current socket instance
   */
  getSocket(): Socket | null {
    return this.socket
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Emit event
   */
  emit(event: string, data: any): void {
    this.socket?.emit(event, data)
  }

  /**
   * Listen to event
   */
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback)
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback)
  }
}

/**
 * Default WebSocket manager instance
 */
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000'

export const wsManager = new WebSocketManager({
  url: WS_URL,
})
