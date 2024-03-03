import { JSDOM } from "jsdom"
import type { Parser, PostDetails } from "./parser"
import { cleanText } from "./utils"

function filterEmptyNodes(nodes: NodeListOf<ChildNode>) {
  return Array.from(nodes).filter((node) => node.textContent && node.textContent.trim() !== "")
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
    const nonEmptyNodes = filterEmptyNodes(container.childNodes)

    // for (const node of nonEmptyNodes) {
    //   console.log("node", node.textContent)
    // }
    if (nonEmptyNodes.length < 5) {
      console.error(`Failed to parse post details`, container.childNodes.length, dom.window.document.body.innerHTML)
      throw new Error(`Failed to parse post details`)
    }

    if (nonEmptyNodes[0].textContent === "NEW" || nonEmptyNodes[0].textContent === "Published") {
      nonEmptyNodes.shift()
    }

    if (!filterEmptyNodes(nonEmptyNodes[1].childNodes)[0].textContent?.includes("Downloaded: ")) {
      // nonEmptyNodes[1] Still at title
      nonEmptyNodes.shift()
    }

    const title = cleanText(nonEmptyNodes[0]?.textContent ?? "")

    const createdDateStr = cleanText(
      (filterEmptyNodes(nonEmptyNodes[1].childNodes)[0] as HTMLElement)?.querySelector("b")?.textContent ?? ""
    )

    const publishedDateStr = cleanText(
      (filterEmptyNodes(nonEmptyNodes[1].childNodes)[1] as HTMLElement)?.querySelector("b")?.textContent ?? ""
    )

    let content = cleanText(filterEmptyNodes(nonEmptyNodes[2].childNodes)[0].textContent?.trim() ?? "")

    let website: string | undefined

    const match = (nonEmptyNodes[2] as HTMLDivElement).innerHTML.match(/<br>(.+)<\/p>/)
    if (match?.[1]) {
      website = match[1]
    } else {
      const websiteTemp = filterEmptyNodes(nonEmptyNodes[2].childNodes)
      if (websiteTemp.length > 1) {
        website = cleanText(websiteTemp.pop()?.textContent ?? "")
      }
    }
    if (website) {
      // remove all <br>
      website = website.replace(/<br>/g, "")
    }

    const commentEl = nonEmptyNodes[4] as HTMLElement
    if (!commentEl) {
      throw new Error(`Failed to find comment element`)
    }
    let filesDescription: string[] = []
    let fileLinks: string[] = []
    const commentPtags = commentEl.querySelectorAll("p")
    if (commentPtags) {
      fileLinks = [cleanText(commentPtags[commentPtags.length - 1]?.textContent?.trim() ?? "")]
      let desc = commentPtags[0]?.textContent ?? ""
      // replace
      desc = desc.replace("Were uploaded to the servers:", "")
      desc = desc.replace("A small part of the files:", "")

      desc = desc.replace("\n", ", ").trim()
      filesDescription.push(desc)
    } else {
      // impossible to parse from structure, maybe regex
      commentEl.childNodes.forEach((el) => {
        if (!el?.textContent || el.textContent.trim() === "") {
          return
        }

        const text = el.textContent.trim()
        if (text.startsWith("https://mega.nz") || text.startsWith("https://anonfiles.com")) {
          fileLinks.push(text)
          return
        }

        // Skip comment
        // e.g. "were uploaded to the servers:"
        if (text.endsWith(":")) {
          return
        }
        filesDescription.push(text)
      })
    }

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
      fileLinks: fileLinks.map((url) => ({
        url,
      })),
      filesDescription: filesDescription.join(", "),

      website,
    } satisfies PostDetails
  }
}
