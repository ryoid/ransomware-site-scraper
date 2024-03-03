import jsdom from "jsdom"

function cleanText(text: string) {
  // Remove \n, \r\n and leading/trailing whitespace
  return text.replace(/(\r\n|\n|\r)/gm, "").trim()
}

export type Post = {
  link: string
}

export type PostDetails = {
  title: string
  content: string
  uploadedDate: Date
  updatedDate: Date
  fileLinks: string[]
}

interface Parser {
  getPosts(dom: jsdom.JSDOM): { link: string }[]
  getPostDetails(dom: jsdom.JSDOM): PostDetails
}

export class LockbitParser implements Parser {
  getPosts(dom: jsdom.JSDOM) {
    const posts = dom.window.document.querySelectorAll(".post-block")

    const results: { link: string }[] = []
    for (const post of posts) {
      // Relative
      const link = post.getAttribute("href") ?? ""
      if (link === "") {
        continue
      }
      results.push({ link })
    }

    return results
  }
  getPostDetails(dom: jsdom.JSDOM) {
    const title = cleanText(dom.window.document.querySelector(".post-big-title")?.textContent ?? "")
    const content = cleanText(dom.window.document.querySelector(".desc")?.textContent ?? "")
    const uploadedDateStr = cleanText(dom.window.document.querySelector(".uploaded-date-utc")?.textContent ?? "")
    const updatedDateStr = cleanText(dom.window.document.querySelector(".updated-date-utc")?.textContent ?? "")
    const fileLinks = Array.from(dom.window.document.querySelectorAll(".reserve-links > a").values())
      // Full
      .map((el) => cleanText(el.getAttribute("href") ?? ""))
      .filter((link) => link !== "")

    if (!title || !content || !uploadedDateStr || !updatedDateStr) {
      throw new Error(`Failed to parse post details`)
    }
    const uploadedDate = new Date(uploadedDateStr)
    const updatedDate = new Date(updatedDateStr)
    return { title, content, uploadedDate, updatedDate, fileLinks }
  }
}

export const Parsers: Record<string, Parser> = {
  lockbit: new LockbitParser(),
} as const
export type ParserType = keyof typeof Parsers

export const isSupportedType = (type: string): type is ParserType => {
  return Object.keys(Parsers).includes(type)
}
