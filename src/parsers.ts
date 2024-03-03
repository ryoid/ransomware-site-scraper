import jsdom from "jsdom"

export const Parsers = {
  lockbit: (dom: jsdom.JSDOM) => {
    let elements = dom.window.document.querySelectorAll(".post-title-block")
    let results: string[] = []
    elements.forEach((element) => {
      console.log('element', element.textContent  );
      
      let content = element.textContent?.trim() //trim is like your sed command, it will remove start and end spaces
      if (content === undefined || content === "...") {
        return
      }
      results.push(content)
    })
    return []
  },
} as const
export type ParserType = keyof typeof Parsers

export const isSupportedType = (type: string): type is ParserType => {
  return Object.keys(Parsers).includes(type)
}
