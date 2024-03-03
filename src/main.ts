import jsdom from "jsdom"
import { ProxyAgent, RequestInit, fetch } from "undici"

import { createCache } from "cachecan"
import { createStorage } from "unstorage"
import fsDriver from "unstorage/drivers/fs"
import { Parsers, isSupportedType } from "./parsers"

const storage = createStorage({
  driver: fsDriver({ base: "./tmp" }),
})

const [cache] = createCache({
  storage,
  defaults: {},
})

const torProxy = new ProxyAgent("http://127.0.0.1:8118")

async function getPage(url: string, options: RequestInit = {}) {
  const response = await fetch(url, { dispatcher: torProxy, ...options })
  if (!response.ok) {
    throw new Error(`Error fetching ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

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
      maxAge: 60 * 3,
    })(site.url)
    // removed all /n /r/n
    // const bodyCleaned = body.replace(/(\r\n|\n|\r)/gm, "")
    const dom = new jsdom.JSDOM(body)
    console.log(dom.window.document.title)

    if (!isSupportedType(site.type)) {
      throw new Error(`Unsupported type: ${site.type}`)
    }
    const result = Parsers[site.type](dom)
    console.log("parsed:", result)
  }
}

main()
