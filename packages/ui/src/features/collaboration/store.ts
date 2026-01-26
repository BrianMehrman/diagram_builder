/**
 * Collaboration Store
 *
 * State management for real-time collaboration sessions
 */

import { create } from 'zustand'
import type { Position3D } from '../../shared/types'

export interface User {
  id: string
  username: string
  color: string
  position: Position3D
  isActive: boolean
}

export interface Session {
  id: string
  name: string
  userCount: number
}

export interface CollaborationState {
  // Connection state
  isConnected: boolean
  connectionError: string | null

  // Session state
  currentSession: Session | null
  currentUserId: string | null
  currentUsername: string | null

  // Users in session
  users: Record<string, User>

  // Actions
  setConnected: (connected: boolean) => void
  setConnectionError: (error: string | null) => void
  joinSession: (sessionId: string, userId: string, username: string) => void
  leaveSession: () => void
  addUser: (user: User) => void
  removeUser: (userId: string) => void
  updateUserPosition: (userId: string, position: Position3D) => void
  setUserActive: (userId: string, active: boolean) => void
  reset: () => void
}

const INITIAL_STATE = {
  isConnected: false,
  connectionError: null,
  currentSession: null,
  currentUserId: null,
  currentUsername: null,
  users: {},
}

/**
 * Generate random user color
 */
function generateUserColor(): string {
  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // green
    '#0ea5e9', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ]
  return colors[Math.floor(Math.random() * colors.length)] || '#6b7280'
}

/**
 * Collaboration store
 */
export const useCollaborationStore = create<CollaborationState>((set) => ({
  ...INITIAL_STATE,

  setConnected: (connected: boolean) => {
    set((state) => ({
      isConnected: connected,
      connectionError: connected ? null : state.connectionError,
    }))
  },

  setConnectionError: (error: string | null) => {
    set((state) => ({
      connectionError: error,
      isConnected: error ? false : state.isConnected,
    }))
  },

  joinSession: (sessionId: string, userId: string, username: string) => {
    set({
      currentSession: { id: sessionId, name: sessionId, userCount: 1 },
      currentUserId: userId,
      currentUsername: username,
      users: {
        [userId]: {
          id: userId,
          username,
          color: generateUserColor(),
          position: { x: 0, y: 0, z: 0 },
          isActive: true,
        },
      },
    })
  },

  leaveSession: () => {
    set({
      currentSession: null,
      currentUserId: null,
      currentUsername: null,
      users: {},
    })
  },

  addUser: (user: User) => {
    set((state) => ({
      users: { ...state.users, [user.id]: user },
      currentSession: state.currentSession
        ? { ...state.currentSession, userCount: Object.keys(state.users).length + 1 }
        : null,
    }))
  },

  removeUser: (userId: string) => {
    set((state) => {
      const { [userId]: removed, ...remainingUsers } = state.users
      return {
        users: remainingUsers,
        currentSession: state.currentSession
          ? { ...state.currentSession, userCount: Object.keys(remainingUsers).length }
          : null,
      }
    })
  },

  updateUserPosition: (userId: string, position: Position3D) => {
    set((state) => {
      const user = state.users[userId]
      if (!user) return state

      return {
        users: {
          ...state.users,
          [userId]: { ...user, position },
        },
      }
    })
  },

  setUserActive: (userId: string, active: boolean) => {
    set((state) => {
      const user = state.users[userId]
      if (!user) return state

      return {
        users: {
          ...state.users,
          [userId]: { ...user, isActive: active },
        },
      }
    })
  },

  reset: () => {
    set(INITIAL_STATE)
  },
}))
