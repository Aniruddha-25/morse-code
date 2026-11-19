import type { MorseCode, MorseNode, MorseSymbol } from './types'

/** International (ITU) Morse code, A–Z and 0–9. Single source of truth for the tree. */
export const MORSE_ALPHABET: Readonly<Record<string, MorseCode>> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
}

const SYMBOL_GLYPHS: Readonly<Record<MorseSymbol, string>> = {
  '.': '·',
  '-': '−',
}

export function symbolGlyph(symbol: MorseSymbol): string {
  return SYMBOL_GLYPHS[symbol]
}

function createNode(
  code: MorseCode,
  letter: string | null,
  symbol: MorseSymbol | null,
): MorseNode {
  return { code, symbol, letter, depth: code.length, dot: null, dash: null }
}

/**
 * Builds the Morse binary tree (dot branch / dash branch) from the alphabet.
 * Some nodes have no character (e.g. ··−−, which only leads on to 2); they stay
 * in the tree as structure. Throws if a dead-end node has no character, so a bad
 * edit to MORSE_ALPHABET fails loudly instead of decoding wrongly.
 */
function buildMorseTree(alphabet: Readonly<Record<string, MorseCode>>): MorseNode {
  const root = createNode('', null, null)
  const letters = new Map<MorseCode, string>()
  for (const [letter, code] of Object.entries(alphabet)) {
    if (!/^[.-]+$/.test(code)) throw new Error(`Invalid code for ${letter}: ${code}`)
    if (letters.has(code)) throw new Error(`Duplicate code ${code}`)
    letters.set(code, letter)
  }

  for (const [code, letter] of letters) {
    let node = root
    for (let i = 0; i < code.length; i++) {
      const symbol = code[i] as MorseSymbol
      const childCode = code.slice(0, i + 1)
      const isLast = i === code.length - 1
      const key = symbol === '.' ? 'dot' : 'dash'
      let child = node[key]
      if (!child) {
        child = createNode(childCode, isLast ? letter : (letters.get(childCode) ?? null), symbol)
        node[key] = child
      }
      node = child
    }
  }

  const missing: string[] = []
  const visit = (node: MorseNode) => {
    if (node.letter === null && node.code !== '' && !node.dot && !node.dash) missing.push(node.code)
    if (node.dot) visit(node.dot)
    if (node.dash) visit(node.dash)
  }
  visit(root)
  if (missing.length > 0) {
    throw new Error(`Morse tree has unassigned nodes: ${missing.join(', ')}`)
  }
  return root
}

export const MORSE_TREE: MorseNode = buildMorseTree(MORSE_ALPHABET)
