export function cleanText(text: string) {
  // Remove \n, \r\n and leading/trailing whitespace
  return text
    .replace(/(\r\n|\n|\r)/gm, "")
    .replace("&nbsp;", " ")
    .trim()
}
