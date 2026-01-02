/**
 * Authentication Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  setToken,
  getToken,
  clearToken,
  isAuthenticated,
  getCurrentUserId,
  isDevModeAuth,
} from './auth'

describe('auth', () => {
  beforeEach(() => {
    clearToken()
  })

  describe('Token Management', () => {
    it('should start with no token when cleared', () => {
      clearToken()
      
      if (!isDevModeAuth()) {
        expect(getToken()).toBeNull()
      }
    })

    it('should set and get token', () => {
      const token = 'test-jwt-token'
      setToken(token)

      expect(getToken()).toBe(token)
    })

    it('should clear token', () => {
      setToken('test-token')
      clearToken()

      if (!isDevModeAuth()) {
        expect(getToken()).toBeNull()
      }
    })

    it('should not persist token across module reloads', () => {
      // This test documents expected behavior:
      // Token is stored in memory only and will be lost on page refresh
      setToken('test-token')
      expect(getToken()).toBe('test-token')

      // Simulating page refresh would lose the token
      // (can't actually test this in unit tests, but this documents the behavior)
    })

    it('should never use localStorage', () => {
      // This test ensures we never accidentally use localStorage
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')

      setToken('test-token')

      expect(localStorageSpy).not.toHaveBeenCalled()
      localStorageSpy.mockRestore()
    })
  })

  describe('Development Mode', () => {
    it('should detect current environment mode', () => {
      // isDevModeAuth() returns true in development, false in production
      const result = isDevModeAuth()
      expect(typeof result).toBe('boolean')
    })

    it('should return correct auth state for current mode', () => {
      clearToken()
      const authenticated = isAuthenticated()
      expect(typeof authenticated).toBe('boolean')
      
      // If dev mode, should be authenticated without token
      if (isDevModeAuth()) {
        expect(authenticated).toBe(true)
      }
    })

    it('should return dev-user in dev mode', () => {
      clearToken()
      const userId = getCurrentUserId()
      
      if (isDevModeAuth()) {
        expect(userId).toBe('dev-user')
      } else {
        expect(userId).toBeNull()
      }
    })

    it('should use real token if set even in dev mode', () => {
      setToken('real-token')
      expect(getToken()).toBe('real-token')
      clearToken()
    })
  })

  describe('Token-based Authentication', () => {
    beforeEach(() => {
      clearToken()
    })

    it('should return true for isAuthenticated with token', () => {
      setToken('test-token')
      expect(isAuthenticated()).toBe(true)
      clearToken()
    })

    it('should decode userId from JWT token', () => {
      // Create a mock JWT token (header.payload.signature)
      const payload = { userId: 'user-123', exp: Date.now() / 1000 + 3600 }
      const encodedPayload = btoa(JSON.stringify(payload))
      const mockToken = `header.${encodedPayload}.signature`

      setToken(mockToken)
      expect(getCurrentUserId()).toBe('user-123')
      clearToken()
    })

    it('should return sub field if userId not present in token', () => {
      const payload = { sub: 'subject-id' }
      const encodedPayload = btoa(JSON.stringify(payload))
      const mockToken = `header.${encodedPayload}.signature`

      setToken(mockToken)
      expect(getCurrentUserId()).toBe('subject-id')
      clearToken()
    })

    it('should handle invalid JWT token gracefully', () => {
      setToken('invalid-token')
      
      const result = getCurrentUserId()
      
      // In dev mode, returns dev-user; otherwise handles invalid token
      if (isDevModeAuth()) {
        expect(result).toBe('dev-user')
      } else {
        expect(result).toBeNull()
      }
      
      clearToken()
    })
  })
})
