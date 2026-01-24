/**
 * Test Codebase - Main Entry Point
 */

import { formatUser } from './utils/helpers'
import { User } from './models/User'

export function main(): void {
  const user = new User('test@example.com', 'Test User')
  console.log(formatUser(user))
}

main()
