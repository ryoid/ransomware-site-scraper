import { JSDOM } from "jsdom"
import type { Parser, Post, PostDetails } from "./parser"
import { cleanText } from "./utils"

export class PlayParser implements Parser {
  getPosts(dom: JSDOM) {
    const posts = dom.window.document.querySelectorAll("th.News")

    const results: Post[] = []
    for (const post of posts) {
      // viewtopic('dJ2E98T3dd8gF2')
      const link = post.getAttribute("onclick") ?? ""
      if (link === "") {
        continue
      }
      const match = /viewtopic\('(.+)'\)/.exec(link)
      if (!match?.[1]) {
        continue
      }
      const topicId = match[1]
      results.push({ link: `/topic.php?id=${topicId}` })
    }

    return { posts: results }
  }
  getPostDetails(dom: JSDOM) {
    const container = dom.window.document.querySelector("th.News > div")
    if (!container) {
      throw new Error(`Failed to find post container`)
    }

    const title = cleanText(container.childNodes[0]?.textContent ?? "")
    const location = cleanText(container.querySelector(":scope > div")?.childNodes[1]?.textContent ?? "")
    const createdDateStr = cleanText(
      container.querySelector(":scope > div > div > div > div > div")?.childNodes[0]?.textContent ?? ""
    )
    const publishedDateStr = cleanText(
      container.querySelector(":scope > div > div > div > div > div > div")?.childNodes[0]?.textContent ?? ""
    )

    let content = cleanText(
      container.querySelector(":scope > div > div > div > div > div > div > div")?.childNodes[0]?.textContent ?? ""
    )
    content = content.replace("information:", "").trim()

    let filesDescription = cleanText(
      container.querySelector(":scope > div > div > div > div > div > div > div > div")?.childNodes[0]?.textContent ??
        ""
    )
    filesDescription = filesDescription.replace("comment:", "").trim()

    let fileLink = cleanText(
      container.querySelector(":scope > div > div > div > div > div > div > div > div > div")?.childNodes[0]
        ?.textContent ?? ""
    )
    fileLink = fileLink.replace("DOWNLOAD LINKS:", "").trim()

    let password = cleanText(
      container.querySelector(":scope > div > div > div > div > div > div > div > div > div")?.childNodes[2]
        ?.textContent ?? ""
    )
    password = password.replace("Rar password:", "").trim()

    if (!title || !content || !createdDateStr || !publishedDateStr) {
      throw new Error(`Failed to parse post details`)
    }
    const createdDate = new Date(createdDateStr)
    const publishedDate = new Date(publishedDateStr)
    return {
      title,
      content,
      createdDate,
      publishedDate,
      fileLinks: fileLink
        ? [
            {
              url: fileLink,
              password,
            },
          ]
        : [],
      filesDescription,
      location,
    } satisfies PostDetails
  }
}
