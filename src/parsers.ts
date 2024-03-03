import jsdom from "jsdom"

function cleanText(text: string) {
  // Remove \n, \r\n and leading/trailing whitespace
  return text.replace(/(\r\n|\n|\r)/gm, "").trim()
}

export const Parsers = {
  lockbit: (dom: jsdom.JSDOM) => {
    const posts = dom.window.document.querySelectorAll(".post-block")

    const results: { title: string; body: string; published: boolean; link?: string }[] = []
    for (const post of posts) {
      const link = post.getAttribute("href") ?? undefined
      const title = cleanText(post.querySelector(".post-title")?.textContent ?? "")
      const body = cleanText(post.querySelector(".post-block-body > .post-block-text")?.textContent ?? "")
      if (title === "") {
        continue
      }
      const published = !!post.classList.contains("good") // .bad for unpublished
      results.push({ title, body, published, link })
    }

    return results
  },
} as const
export type ParserType = keyof typeof Parsers

export const isSupportedType = (type: string): type is ParserType => {
  return Object.keys(Parsers).includes(type)
}
