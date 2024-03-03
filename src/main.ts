import jsdom from "jsdom"
import { pry } from "pry-ts"
import { cache, getPage } from "./crawler"
import { Parsers, isSupportedType } from "./parsers"

const CACHE_SECONDS = 60 * 60 * 24 * 7 // 7 days

/**
 * Sites to scrape
 */
const SITES = [
  {
    type: "lockbit",
    url: "http://lockbit6knrauo3qafoksvl742vieqbujxw7rd6ofzdtapjb4rrawqad.onion",
  },
  {
    type: "alphv",
    url: "http://alphvuzxyxv6ylumd2ngp46xzq3pw6zflomrghvxeuks6kklberrbmyd.onion",
  },
  {
    type: "8base",
    url: "http://xb6q2aggycmlcrjtbjendcnnwpmmwbosqaugxsqb4nx6cmod3emy7sad.onion",
  },
  {
    type: "play",
    url: "http://mbrlkbtq5jonaqkurjwmxftytyn2ethqvbxfu4rgjbkkknndqwae6byd.onion",
  },
  {
    type: "clop",
    url: "http://toznnag5o3ambca56s2yacteu7q7x2avrfherzmz4nmujrjuib4iusad.onion",
  },
]

async function main() {
  console.log("Hello World")
  for (const site of SITES) {
    const body = await cache(getPage, {
      key: site.url,
      maxAge: CACHE_SECONDS,
    })(site.url)
    // removed all /n /r/n
    // const bodyCleaned = body.replace(/(\r\n|\n|\r)/gm, "")
    const dom = new jsdom.JSDOM(body)
    console.log(dom.window.document.title)

    if (!isSupportedType(site.type)) {
      throw new Error(`Unsupported type: ${site.type}`)
    }
    const parser = Parsers[site.type]
    const posts = parser.getPosts(dom)
    for (const post of posts) {
      // Check if link is relative
      if (!/^(http|https):\/\//.test(post.link)) {
        post.link = `${site.url}${post.link}`
      }
      const body = await cache(getPage, {
        key: post.link,
        maxAge: CACHE_SECONDS,
      })(post.link)
      const dom = new jsdom.JSDOM(body)
      const details = pry(() => parser.getPostDetails(dom))
      if (!details.ok) {
        console.error("Failed to parse post details", { link: post.link })
        throw details.err
      }
    }

    console.log("parsed:", posts)
  }
}

main()
