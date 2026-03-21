export interface AuthToken {
  userId: string
  token: string
  expiresAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}
