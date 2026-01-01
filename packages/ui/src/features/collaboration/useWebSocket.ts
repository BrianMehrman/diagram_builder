/**
 * useWebSocket Hook
 *
 * Hook for managing WebSocket connection to collaboration server
 */

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useCollaborationStore } from './store'
import { useCanvasStore } from '../canvas/store'
import type { Position3D } from '../../shared/types'
import type { User } from './store'

interface WebSocketEvents {
  onUserJoined?: (user: User) => void
  onUserLeft?: (userId: string) => void
  onPositionUpdate?: (userId: string, position: Position3D) => void
}

/**
 * Hook for WebSocket connection management
 */
export function useWebSocket(sessionId: string | null, events?: WebSocketEvents) {
  const socketRef = useRef<Socket | null>(null)
  const positionTimerRef = useRef<NodeJS.Timeout | null>(null)

  const setConnected = useCollaborationStore((state) => state.setConnected)
  const setConnectionError = useCollaborationStore((state) => state.setConnectionError)
  const currentUserId = useCollaborationStore((state) => state.currentUserId)
  const currentUsername = useCollaborationStore((state) => state.currentUsername)
  const addUser = useCollaborationStore((state) => state.addUser)
  const removeUser = useCollaborationStore((state) => state.removeUser)
  const updateUserPosition = useCollaborationStore((state) => state.updateUserPosition)

  const camera = useCanvasStore((state) => state.camera)

  // Broadcast position updates (throttled to 50ms)
  const broadcastPosition = useCallback(() => {
    if (!socketRef.current || !currentUserId) return

    socketRef.current.emit('position.update', {
      position: camera.position,
    })
  }, [camera.position, currentUserId])

  // Connect to WebSocket server
  useEffect(() => {
    if (!sessionId || !currentUserId || !currentUsername) return

    // Create socket connection
    const socket = io('http://localhost:4000', {
      auth: {
        sessionId,
        userId: currentUserId,
        username: currentUsername,
      },
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      setConnected(true)
      setConnectionError(null)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('connect_error', (error) => {
      setConnectionError(error.message)
    })

    // Session events
    socket.on('session.joined', (data: { userId: string; username: string }) => {
      const user: User = {
        id: data.userId,
        username: data.username,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        position: { x: 0, y: 0, z: 0 },
        isActive: true,
      }
      addUser(user)
      if (events?.onUserJoined) {
        events.onUserJoined(user)
      }
    })

    socket.on('session.left', (data: { userId: string }) => {
      removeUser(data.userId)
      if (events?.onUserLeft) {
        events.onUserLeft(data.userId)
      }
    })

    // Position sync events
    socket.on('position.update', (data: { userId: string; position: Position3D }) => {
      if (data.userId !== currentUserId) {
        updateUserPosition(data.userId, data.position)
        if (events?.onPositionUpdate) {
          events.onPositionUpdate(data.userId, data.position)
        }
      }
    })

    socket.on(
      'positions.sync',
      (data: { users: Array<{ userId: string; position: Position3D }> }) => {
        data.users.forEach((user) => {
          if (user.userId !== currentUserId) {
            updateUserPosition(user.userId, user.position)
          }
        })
      }
    )

    // Cleanup
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [
    sessionId,
    currentUserId,
    currentUsername,
    setConnected,
    setConnectionError,
    addUser,
    removeUser,
    updateUserPosition,
    events,
  ])

  // Broadcast position updates on camera changes
  useEffect(() => {
    if (!socketRef.current || !currentUserId) return

    // Clear existing timer
    if (positionTimerRef.current) {
      clearTimeout(positionTimerRef.current)
    }

    // Throttle position updates to 50ms
    positionTimerRef.current = setTimeout(() => {
      broadcastPosition()
    }, 50)

    return () => {
      if (positionTimerRef.current) {
        clearTimeout(positionTimerRef.current)
      }
    }
  }, [camera.position, broadcastPosition, currentUserId])

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  }
}

export default useWebSocket
