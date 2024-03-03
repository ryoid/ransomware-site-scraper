import { EightBaseParser } from "./8base"
import { LockbitParser } from "./lockbit"
import type { Parser } from "./parser"
import { PlayParser } from "./play"

export const Parsers: Record<string, Parser> = {
  lockbit: new LockbitParser(),
  play: new PlayParser(),
  "8base": new EightBaseParser(),
} as const
export type ParserType = keyof typeof Parsers

export const isSupportedType = (type: string): type is ParserType => {
  return Object.keys(Parsers).includes(type)
}
