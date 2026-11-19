import { describe, expect, it } from 'vitest'
import { MORSE_ALPHABET, MORSE_TREE } from '../morseData'
import { findNode } from '../morseDecoder'
import type { MorseNode, MorseSymbol } from '../types'
import { ITU_NON_CHARACTER_PATHS, ITU_PATHS, ITU_TABLE, allSequences } from './ituTable'

const toSequence = (code: string) => code.split('') as MorseSymbol[]

function collect(node: MorseNode, out: MorseNode[] = []): MorseNode[] {
  out.push(node)
  if (node.dot) collect(node.dot, out)
  if (node.dash) collect(node.dash, out)
  return out
}

describe('alphabet matches ITU-R M.1677-1', () => {
  it('has exactly the 36 ITU characters (A–Z, 0–9) and nothing else', () => {
    expect(Object.keys(MORSE_ALPHABET).sort()).toEqual(Object.keys(ITU_TABLE).sort())
    expect(Object.keys(MORSE_ALPHABET)).toHaveLength(36)
    for (const key of Object.keys(MORSE_ALPHABET)) expect(key).toMatch(/^[A-Z0-9]$/)
  })

  it.each(Object.entries(ITU_TABLE))('%s = %s', (character, code) => {
    expect(MORSE_ALPHABET[character]).toBe(code)
  })

  it('uses a unique code for every character', () => {
    const codes = Object.values(MORSE_ALPHABET)
    expect(new Set(codes).size).toBe(codes.length)
  })
})

describe('decoding tree', () => {
  const nodes = collect(MORSE_TREE)

  it('decodes every ITU code to its character, and only that character', () => {
    for (const [character, code] of Object.entries(ITU_TABLE)) {
      expect(findNode(toSequence(code))?.letter).toBe(character)
    }
  })

  it('contains exactly the ITU valid paths: no missing and no extra nodes', () => {
    const treePaths = nodes.filter((n) => n.code !== '').map((n) => n.code)
    expect(new Set(treePaths).size).toBe(treePaths.length) // no duplicated nodes
    expect([...treePaths].sort()).toEqual([...ITU_PATHS].sort())
  })

  it('has no duplicated or unexpected characters', () => {
    const characters = nodes.map((n) => n.letter).filter((l): l is string => l !== null)
    expect(characters).toHaveLength(36)
    expect(new Set(characters).size).toBe(36)
    expect([...characters].sort()).toEqual(Object.keys(ITU_TABLE).sort())
  })

  it('keeps unlabeled intermediate nodes exactly where a longer code needs them', () => {
    expect(ITU_NON_CHARACTER_PATHS).toEqual(['----', '---.', '..--'])
    const unlabeled = nodes.filter((n) => n.code !== '' && n.letter === null).map((n) => n.code)
    expect(unlabeled.sort()).toEqual([...ITU_NON_CHARACTER_PATHS])
    // ...and each of them leads on to a digit.
    for (const code of ITU_NON_CHARACTER_PATHS) {
      const node = findNode(toSequence(code))!
      expect(node.dot ?? node.dash).not.toBeNull()
    }
  })

  it('links every node to its parent by the right symbol', () => {
    for (const node of nodes) {
      if (node.dot) expect(node.dot.code).toBe(node.code + '.')
      if (node.dash) expect(node.dash.code).toBe(node.code + '-')
      if (node.code !== '') expect(node.symbol).toBe(node.code.at(-1))
      expect(node.depth).toBe(node.code.length)
    }
  })

  it('supports five levels and no more', () => {
    expect(Math.max(...nodes.map((n) => n.depth))).toBe(5)
  })

  it('accepts a path iff it is a valid prefix (every sequence up to length 6)', () => {
    for (const code of allSequences(6)) {
      expect(findNode(toSequence(code)) !== undefined, code).toBe(ITU_PATHS.has(code))
    }
  })
})
