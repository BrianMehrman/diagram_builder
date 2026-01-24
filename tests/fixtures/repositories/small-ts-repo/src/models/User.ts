/**
 * User Model
 */

export class User {
  constructor(
    public email: string,
    public name: string
  ) {}

  getDisplayName(): string {
    return `${this.name} (${this.email})`
  }
}
