// TypeScript file
export interface User {
  id: number;
  name: string;
  email: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

export function validateUser(user: User): boolean {
  return user.id > 0 && user.name.length > 0;
}
