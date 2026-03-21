import { User } from './User'

export class Post {
  constructor(
    public id: string,
    public title: string,
    public body: string,
    public author: User
  ) {}

  getSummary(): string {
    return `${this.title} by ${this.author.getDisplayName()}`
  }
}
