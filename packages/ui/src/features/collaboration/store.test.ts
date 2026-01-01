/**
 * Collaboration Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useCollaborationStore } from './store'

describe('useCollaborationStore', () => {
  beforeEach(() => {
    useCollaborationStore.getState().reset()
  })

  it('should have initial state', () => {
    const state = useCollaborationStore.getState()
    expect(state.isConnected).toBe(false)
    expect(state.currentSession).toBeNull()
    expect(state.users).toEqual({})
  })

  it('should set connected state', () => {
    useCollaborationStore.getState().setConnected(true)
    expect(useCollaborationStore.getState().isConnected).toBe(true)
  })

  it('should set connection error', () => {
    useCollaborationStore.getState().setConnectionError('Connection failed')
    expect(useCollaborationStore.getState().connectionError).toBe('Connection failed')
    expect(useCollaborationStore.getState().isConnected).toBe(false)
  })

  it('should join session', () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    const state = useCollaborationStore.getState()

    expect(state.currentSession).toEqual({
      id: 'session-123',
      name: 'session-123',
      userCount: 1,
    })
    expect(state.currentUserId).toBe('user-1')
    expect(state.currentUsername).toBe('Alice')
    expect(state.users['user-1']).toBeDefined()
    expect(state.users['user-1']?.username).toBe('Alice')
  })

  it('should leave session', () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    useCollaborationStore.getState().leaveSession()

    const state = useCollaborationStore.getState()
    expect(state.currentSession).toBeNull()
    expect(state.currentUserId).toBeNull()
    expect(state.users).toEqual({})
  })

  it('should add user', () => {
    const user = {
      id: 'user-2',
      username: 'Bob',
      color: '#ef4444',
      position: { x: 1, y: 2, z: 3 },
      isActive: true,
    }

    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    useCollaborationStore.getState().addUser(user)

    expect(useCollaborationStore.getState().users['user-2']).toEqual(user)
  })

  it('should remove user', () => {
    const user = {
      id: 'user-2',
      username: 'Bob',
      color: '#ef4444',
      position: { x: 1, y: 2, z: 3 },
      isActive: true,
    }

    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    useCollaborationStore.getState().addUser(user)
    useCollaborationStore.getState().removeUser('user-2')

    expect(useCollaborationStore.getState().users['user-2']).toBeUndefined()
  })

  it('should update user position', () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    useCollaborationStore.getState().updateUserPosition('user-1', { x: 5, y: 10, z: 15 })

    const user = useCollaborationStore.getState().users['user-1']
    expect(user?.position).toEqual({ x: 5, y: 10, z: 15 })
  })

  it('should set user active state', () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    useCollaborationStore.getState().setUserActive('user-1', false)

    expect(useCollaborationStore.getState().users['user-1']?.isActive).toBe(false)
  })

  it('should reset to initial state', () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    useCollaborationStore.getState().setConnected(true)
    useCollaborationStore.getState().reset()

    const state = useCollaborationStore.getState()
    expect(state.isConnected).toBe(false)
    expect(state.currentSession).toBeNull()
    expect(state.users).toEqual({})
  })
})
