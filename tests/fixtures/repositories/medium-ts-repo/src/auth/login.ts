import { User } from '../models/User'
import type { AuthToken, LoginCredentials } from './types'

export function login(credentials: LoginCredentials): AuthToken {
  return {
    userId: credentials.email,
    token: 'mock-token',
    expiresAt: new Date(Date.now() + 3600000),
  }
}

export function validateToken(token: AuthToken): boolean {
  return token.expiresAt > new Date()
}
