import { User } from '../models/User'
import { Post } from '../models/Post'

export function formatUser(user: User): string {
  return `${user.getDisplayName()} <${user.email}>`
}

export function formatPost(post: Post): string {
  return `${post.getSummary()} (${post.body.length} chars)`
}
