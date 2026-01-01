/**
 * Authentication Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setToken, getToken, clearToken, isAuthenticated } from './auth'

describe('auth', () => {
  beforeEach(() => {
    clearToken()
  })

  it('should start with no token', () => {
    expect(getToken()).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })

  it('should set and get token', () => {
    const token = 'test-jwt-token'
    setToken(token)

    expect(getToken()).toBe(token)
    expect(isAuthenticated()).toBe(true)
  })

  it('should clear token', () => {
    setToken('test-token')
    clearToken()

    expect(getToken()).toBeNull()
    expect(isAuthenticated()).toBe(false)
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
