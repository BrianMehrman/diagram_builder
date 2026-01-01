/**
 * useWebSocket Hook Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { io, Socket } from 'socket.io-client'
import useWebSocket from './useWebSocket'
import { useCollaborationStore } from './store'
import { useCanvasStore } from '../canvas/store'

vi.mock('socket.io-client')

describe('useWebSocket', () => {
  let mockSocket: Partial<Socket>

  beforeEach(() => {
    useCollaborationStore.getState().reset()

    mockSocket = {
      on: vi.fn((event: string, callback: any) => mockSocket as Socket),
      off: vi.fn((event: string, callback?: any) => mockSocket as Socket),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connected: false,
    }

    vi.mocked(io).mockReturnValue(mockSocket as Socket)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should not connect when session ID is null', () => {
    renderHook(() => useWebSocket(null))
    expect(io).not.toHaveBeenCalled()
  })

  it('should connect when session ID is provided', async () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')

    renderHook(() => useWebSocket('session-123'))

    await waitFor(() => {
      expect(io).toHaveBeenCalledWith(
        'http://localhost:4000',
        expect.objectContaining({
          auth: {
            sessionId: 'session-123',
            userId: 'user-1',
            username: 'Alice',
          },
        })
      )
    })
  })

  it('should register event listeners on connect', async () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')

    renderHook(() => useWebSocket('session-123'))

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('session.joined', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('session.left', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('position.update', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('positions.sync', expect.any(Function))
    })
  })

  it('should disconnect when session ID changes to null', async () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')

    const { rerender } = renderHook(({ sessionId }) => useWebSocket(sessionId), {
      initialProps: { sessionId: 'session-123' },
    })

    rerender({ sessionId: null })

    await waitFor(() => {
      expect(mockSocket.disconnect).toHaveBeenCalled()
    })
  })

  it('should cleanup on unmount', async () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')

    const { unmount } = renderHook(() => useWebSocket('session-123'))

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalled()
    })

    unmount()

    expect(mockSocket.disconnect).toHaveBeenCalled()
  })
})
