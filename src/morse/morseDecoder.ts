import { MORSE_TREE } from './morseData'
import type { MorseCode, MorseNode, MorseSymbol } from './types'

export function sequenceToCode(sequence: readonly MorseSymbol[]): MorseCode {
  return sequence.join('')
}

/** Walks the tree along the sequence. Undefined if no letter continues that way. */
export function findNode(sequence: readonly MorseSymbol[]): MorseNode | undefined {
  let node: MorseNode | null = MORSE_TREE
  for (const symbol of sequence) {
    node = symbol === '.' ? node.dot : node.dash
    if (!node) return undefined
  }
  return node
}

/** Decodes a complete sequence to its letter, or null if it is not a letter. */
export function decodeSequence(sequence: readonly MorseSymbol[]): string | null {
  return findNode(sequence)?.letter ?? null
}
