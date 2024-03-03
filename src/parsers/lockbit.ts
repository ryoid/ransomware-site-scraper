import { JSDOM } from "jsdom"
import type { Parser, Post, PostDetails } from "./parser"
import { cleanText } from "./utils"

export class LockbitParser implements Parser {
  getPosts(dom: JSDOM) {
    const posts = dom.window.document.querySelectorAll(".post-block")

    const results: Post[] = []
    for (const post of posts) {
      // Relative
      const link = post.getAttribute("href") ?? ""
      if (link === "") {
        continue
      }
      results.push({ link })
    }

    return { posts: results }
  }
  getPostDetails(dom: JSDOM) {
    const title = cleanText(dom.window.document.querySelector(".post-big-title")?.textContent ?? "")
    const content = cleanText(dom.window.document.querySelector(".desc")?.textContent ?? "")
    const uploadedDateStr = cleanText(dom.window.document.querySelector(".uploaded-date-utc")?.textContent ?? "")
    const updatedDateStr = cleanText(dom.window.document.querySelector(".updated-date-utc")?.textContent ?? "")
    const fileLinks = Array.from(dom.window.document.querySelectorAll(".reserve-links > a").values())
      // Full
      .map((el) => cleanText(el.getAttribute("href") ?? ""))
      .filter((link) => link !== "")
      .map((link) => ({
        url: link,
      }))

    if (!title || !content || !uploadedDateStr || !updatedDateStr) {
      throw new Error(`Failed to parse post details`)
    }
    const uploadedDate = new Date(uploadedDateStr)
    const updatedDate = new Date(updatedDateStr)
    return {
      title,
      website: title,
      content,
      publishedDate: uploadedDate,
      createdDate: updatedDate,
      fileLinks,
    } satisfies PostDetails
  }
}
