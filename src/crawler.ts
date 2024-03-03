import { ProxyAgent, RequestInit, fetch } from "undici"

import { createCache } from "cachecan"
import { createStorage } from "unstorage"
import fsDriver from "unstorage/drivers/fs"

const storage = createStorage({
  driver: fsDriver({ base: "./tmp" }),
})

export const [cache] = createCache({
  storage,
  defaults: {},
})

const torProxy = new ProxyAgent("http://127.0.0.1:8118")

export async function getPage(url: string, options: RequestInit = {}) {
  console.log("[Fetching]", url)
  const response = await fetch(url, { dispatcher: torProxy, ...options })
  if (!response.ok) {
    throw new Error(`Error fetching ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}
