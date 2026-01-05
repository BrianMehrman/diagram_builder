/**
 * Helper Functions
 */

import { User } from '../models/User'

export function formatUser(user: User): string {
  return user.getDisplayName()
}

export function validateEmail(email: string): boolean {
  return email.includes('@')
}
