import { User } from '../models/User'

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateUser(user: User): string[] {
  const errors: string[] = []
  if (!validateEmail(user.email)) errors.push('Invalid email')
  if (!user.name) errors.push('Name required')
  return errors
}
