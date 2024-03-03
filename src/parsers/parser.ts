import { JSDOM } from "jsdom"

export type Post = {
  link: string
}

export type FileLink = {
  url: string
  password?: string
}

export type PostDetails = {
  title: string
  content: string
  publishedDate: Date
  createdDate: Date
  fileLinks: FileLink[]
  location?: string
  website?: string
  filesDescription?: string
}

export interface Parser {
  getPosts(dom: JSDOM): { posts: Post[] } | { details: (PostDetails & { link: string })[] }
  getPostDetails(dom: JSDOM): PostDetails
}
