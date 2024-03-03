import { JSDOM } from "jsdom"
import type { FileLink, Parser, PostDetails } from "./parser"
import { cleanText } from "./utils"

function filterEmptyNodes(nodes: NodeListOf<ChildNode>) {
  return Array.from(nodes).filter((node) => node.textContent && node.textContent.trim() !== "")
}

function createDate(str: string) {
  // validate
  // Sometimes one digit, sometimes year is 2 or 4 digit
  if (!/^\d{1,2}\.\d{1,2}\.(?:\d{2}|\d{4})$/.test(str)) {
    throw new Error(`Invalid date format: ${str}`)
  }

  let [month, day, year] = str.split(".")
  if (year.length === 2) {
    year = "20" + year
  }

  return new Date(+year, +month - 1, +day)
}

export class EightBaseParser implements Parser {
  getPosts(dom: JSDOM) {
    const posts = dom.window.document.querySelectorAll(".list-group > .list-group-item")

    const results: (PostDetails & { link: string })[] = []
    for (const post of posts) {
      // viewtopic('dJ2E98T3dd8gF2')
      const url = post.querySelector(":scope > a")?.getAttribute("href") ?? ""
      if (url === "") {
        continue
      }
      try {
        const details = this.getPostDetailsFromContainer(
          new JSDOM(post.outerHTML).window.document.body.firstChild as HTMLDivElement
        )
        results.push(Object.assign(details, { link: url }))
      } catch (e) {
        console.error("Failed to parse post", url)
        throw e
      }
    }

    return { details: results }
  }
  getPostDetails(dom: JSDOM) {
    const container = dom.window.document.querySelector(".list-group-item") as HTMLDivElement
    if (!container) {
      throw new Error(`Failed to find post container`)
    }
    return this.getPostDetailsFromContainer(container)
  }

  getPostDetailsFromContainer(container: HTMLDivElement) {
    const title = container.querySelector(":scope > a.stretched-link")?.textContent?.trim() ?? ""
    const createdDate = createDate(
      container.querySelector(":scope > a.stretched-link ~ div > div:nth-child(1) > b")?.textContent?.trim() ?? ""
    )
    const publishedDate = createDate(
      container.querySelector(":scope > a.stretched-link ~ div > div:nth-child(2) > b")?.textContent?.trim() ?? ""
    )

    /** Content and website */
    const contentContainer = container.querySelector(":scope > a.stretched-link ~ div ~ div") as HTMLDivElement
    const contentParagraphs = filterEmptyNodes(contentContainer.querySelectorAll("p"))
    let website: string | undefined
    // <p>Bla bla bla<br>google.com</p>
    const m = /<br>(.+)<\/p>/.exec(contentContainer.innerHTML)
    if (m?.[1]) {
      website = m[1]
    } else if (contentParagraphs.length > 1) {
      website = contentParagraphs.pop()?.textContent?.trim()
    }
    let content = contentContainer.textContent ?? ""
    if (website) {
      content = content.replace(website, "").trim()
    }
    content = cleanText(content)

    // Fallback extract any website from content (sometimes near the end)
    // http:// or https:// followed by space or end of content
    if (!website) {
      const m = content.match(/(https?:\/\/\S+)(?:\s|$)/)
      if (m?.[1]) {
        website = m[1]
      }
    }

    const fileContainer = container.querySelector(":scope > a.stretched-link ~ div ~ div ~ div") as HTMLDivElement
    const fileAnchor = fileContainer.querySelector(":scope > a") as HTMLAnchorElement
    const fileParagraphs = filterEmptyNodes(fileContainer.querySelectorAll("p"))
    const fileLinks: FileLink[] = []
    const filesDescription: string[] = []
    if (fileParagraphs.length === 2) {
      const text = fileParagraphs[1].textContent
      if (text) {
        // split by https:// or http:// to handle multiple links
        const urls = text.split(/(?=https?:\/\/)/)
        for (const url of urls) {
          fileLinks.push({
            url: url.trim(),
          })
        }
      }
    } else if (fileAnchor && fileContainer.childNodes.length === 3) {
      // Single anchor link
      // NodeList(3) [text, a, text]
      fileLinks.push({
        url: fileAnchor.href,
      })
    } else {
      // handle text node based
      const nodes = Array.from(fileContainer.childNodes)
        // text nodes
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent?.trim())
        .filter((t): t is string => !!t)

      for (const text of nodes) {
        // node is a file (link)
        // http:// or https://
        if (/(https?:\/\/)/.test(text)) {
          fileLinks.push({
            url: text,
          })
          continue
        }

        // Is a useless comment
        // The data contains:
        // ends with \w:
        // letter then colon
        if (/\w:$/.test(text)) {
          continue
        }

        filesDescription.push(text)
      }
    }

    return {
      title,
      content,
      createdDate,
      publishedDate,
      fileLinks,
      filesDescription: filesDescription.length > 0 ? filesDescription.join(", ") : undefined,

      website,
    } satisfies PostDetails
  }
}
