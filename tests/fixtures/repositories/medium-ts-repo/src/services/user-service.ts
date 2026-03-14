import { User } from '../models/User'
import { validateUser } from '../utils/validators'
import { formatUser } from '../utils/formatters'
import { login } from '../auth/login'
import type { AuthToken } from '../auth/types'

export class UserService {
  private users: User[] = []

  createUser(name: string, email: string): User {
    const user = new User(String(this.users.length + 1), name, email)
    const errors = validateUser(user)
    if (errors.length > 0) throw new Error(errors.join(', '))
    this.users.push(user)
    return user
  }

  authenticate(email: string, password: string): AuthToken {
    return login({ email, password })
  }

  listUsers(): string[] {
    return this.users.map(formatUser)
  }
}
