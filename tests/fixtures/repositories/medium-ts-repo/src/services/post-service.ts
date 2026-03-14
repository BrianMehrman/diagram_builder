import { Post } from '../models/Post'
import { User } from '../models/User'
import { formatPost } from '../utils/formatters'

export class PostService {
  private posts: Post[] = []

  createPost(title: string, body: string, author: User): Post {
    const post = new Post(String(this.posts.length + 1), title, body, author)
    this.posts.push(post)
    return post
  }

  listPosts(): string[] {
    return this.posts.map(formatPost)
  }
}
