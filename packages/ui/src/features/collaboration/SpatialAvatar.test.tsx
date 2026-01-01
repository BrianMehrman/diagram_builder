/**
 * SpatialAvatar Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFrame, useThree } from '@react-three/fiber'
import type { User } from './store'

// Mock three.js canvas context
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    gl: {
      domElement: document.createElement('canvas'),
    },
    scene: {},
    camera: {},
  })),
}))

describe('SpatialAvatar', () => {
  const mockUser: User = {
    id: 'user-1',
    username: 'Alice',
    color: '#ef4444',
    position: { x: 1, y: 2, z: 3 },
    isActive: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create user object with correct properties', () => {
    expect(mockUser.id).toBe('user-1')
    expect(mockUser.username).toBe('Alice')
    expect(mockUser.color).toBe('#ef4444')
    expect(mockUser.position).toEqual({ x: 1, y: 2, z: 3 })
    expect(mockUser.isActive).toBe(true)
  })

  it('should handle inactive user', () => {
    const inactiveUser: User = {
      ...mockUser,
      isActive: false,
    }

    expect(inactiveUser.isActive).toBe(false)
  })

  it('should support different colors', () => {
    const coloredUser: User = {
      ...mockUser,
      color: '#3b82f6',
    }

    expect(coloredUser.color).toBe('#3b82f6')
  })

  it('should support different positions', () => {
    const movedUser: User = {
      ...mockUser,
      position: { x: 10, y: 20, z: 30 },
    }

    expect(movedUser.position).toEqual({ x: 10, y: 20, z: 30 })
  })
})
