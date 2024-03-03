import jsdom from "jsdom"
import { pry } from "pry-ts"
import { cache, getPage, storage } from "./crawler"
import { Parsers, isSupportedType } from "./parsers"
import type { Post, PostDetails } from "./parsers/parser"

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
    type: "play",
    url: "http://mbrlkbtq5jonaqkurjwmxftytyn2ethqvbxfu4rgjbkkknndqwae6byd.onion/index.php?page=${range:4-22}", // 2023 range
  },
  {
    type: "8base",
    url: "http://xb6q2aggycmlcrjtbjendcnnwpmmwbosqaugxsqb4nx6cmod3emy7sad.onion/?page=${range:1-2}",
  },
  // {
  //   type: "alphv",
  //   url: "http://alphvuzxyxv6ylumd2ngp46xzq3pw6zflomrghvxeuks6kklberrbmyd.onion",
  // },
  // {
  //   type: "clop",
  //   url: "http://toznnag5o3ambca56s2yacteu7q7x2avrfherzmz4nmujrjuib4iusad.onion",
  // },
]
const RANGE_EXPR = /\${range:(\d+-\d+)}/

async function scrapeSite(site: (typeof SITES)[0]) {
  const Tag = `[${site.type}]`

  if (!isSupportedType(site.type)) {
    throw new Error(`Unsupported type: ${site.type}`)
  }
  const parser = Parsers[site.type]
  const siteUrl = new URL(site.url)

  // Fetch pages with range
  // Collect all posts
  let allPosts: Post[] = []
  const postDetails: (PostDetails & { url: string })[] = []
  let crawlPostDetails = true

  const rangeMatch = RANGE_EXPR.exec(site.url)
  if (rangeMatch?.[1]) {
    const [start, end] = rangeMatch[1].split("-").map(Number)
    for (let i = start; i <= end; i++) {
      const url = site.url.replace(RANGE_EXPR, i.toString())
      const body = await cache(getPage, {
        key: [
          "pages",
          site.type,
          siteUrl.hostname,
          encodeURIComponent(siteUrl.pathname + siteUrl.search),
          i.toString() + ".html",
        ],
        maxAge: CACHE_SECONDS,
      })(url)
      const dom = new jsdom.JSDOM(body)
      // console.log(Tag, `fetched ${dom.window.document.title}`)

      const posts = pry(() => parser.getPosts(dom))
      if (!posts.ok) {
        console.error(Tag, "Failed to parse posts", { url: site.url })
        throw posts.err
      }

      if ("posts" in posts.val) {
        console.log(Tag, "found posts:", posts.val.posts.length)
        allPosts.push(...posts.val.posts)
      } else {
        allPosts.push(...posts.val.details.map((d) => ({ link: d.link })))
        postDetails.push(
          ...posts.val.details.map(({ link, ...rest }) => {
            // Check if link is relative
            let url = link
            if (!/^(http|https):\/\//.test(link)) {
              url = `${siteUrl.origin}${link}`
            }
            return { ...rest, url }
          })
        )
        crawlPostDetails = false
      }
    }
  } else {
    const body = await cache(getPage, {
      key: ["pages", site.type, siteUrl.hostname, encodeURIComponent(siteUrl.pathname + siteUrl.search) + ".html"],
      maxAge: CACHE_SECONDS,
    })(site.url)
    const dom = new jsdom.JSDOM(body)
    console.log(Tag, `fetched ${dom.window.document.title}`)

    const posts = pry(() => parser.getPosts(dom))
    if (!posts.ok) {
      console.error(Tag, "Failed to parse posts", { url: site.url })
      throw posts.err
    }

    if ("posts" in posts.val) {
      console.log(Tag, "found posts:", posts.val.posts.length)
      allPosts.push(...posts.val.posts)
    } else {
      allPosts.push(...posts.val.details.map((d) => ({ link: d.link })))
      postDetails.push(
        ...posts.val.details.map(({ link, ...rest }) => {
          // Check if link is relative
          let url = link
          if (!/^(http|https):\/\//.test(link)) {
            url = `${siteUrl.origin}${link}`
          }
          return { ...rest, url }
        })
      )
      crawlPostDetails = false
    }
  }

  if (crawlPostDetails) {
    for (const post of allPosts) {
      // Check if link is relative
      let postUrl = post.link
      if (!/^(http|https):\/\//.test(post.link)) {
        postUrl = `${siteUrl.origin}${post.link}`
      }
      const body = await cache(getPage, {
        key: ["pages", site.type, siteUrl.hostname, encodeURIComponent(post.link) + ".html"],
        maxAge: CACHE_SECONDS,
      })(postUrl)
      const dom = new jsdom.JSDOM(body)
      const details = pry(() => parser.getPostDetails(dom))
      if (!details.ok) {
        console.error(Tag, "Failed to parse post details", { link: postUrl })
        throw details.err
      }
      // console.log(Tag, "details", details.val)
      postDetails.push(Object.assign(details.val, { url: postUrl }))
    }
  }

  console.log(`Storing ${postDetails.length} post details for ${site.type} at ${siteUrl.hostname}`);
  
  await storage.setItemRaw(`parsed/${site.type}/${siteUrl.hostname}/posts.json`, JSON.stringify(postDetails, null, 2))
}

async function main() {
  console.log("Hello World")

  await Promise.all(
    SITES.map(async (site) => {
      console.log("Scraping", site.type)
      await scrapeSite(site)
    })
  )

  console.log("Done")
}

main()
