import { describe, expect, it } from 'vitest'
import { BOARD_LAYOUT } from '../boardLayout'
import { isSegmentLit, nodeStateFor } from '../illumination'
import type { CircuitSegment, NodeLayout } from '../types'

const { nodes, segments } = BOARD_LAYOUT
const byCode = new Map(nodes.map((n) => [n.code, n]))
const allCodes = nodes.filter((n) => n.code !== '').map((n) => n.code)
const EPS = 1e-6

// A trace as a zero-thickness axis-aligned box.
interface Box {
  x1: number
  y1: number
  x2: number
  y2: number
}
const box = (s: CircuitSegment): Box =>
  s.orientation === 'horizontal'
    ? { x1: s.x, y1: s.y, x2: s.x + s.length, y2: s.y }
    : { x1: s.x, y1: s.y, x2: s.x, y2: s.y + s.length }
const touch = (a: Box, b: Box) =>
  a.x1 <= b.x2 + EPS && b.x1 <= a.x2 + EPS && a.y1 <= b.y2 + EPS && b.y1 <= a.y2 + EPS
const pointBox = (x: number, y: number): Box => ({ x1: x, y1: y, x2: x, y2: y })
const rightEdge = (n: NodeLayout) => pointBox(n.x + n.width / 2, n.y)
const leftEdge = (n: NodeLayout) => pointBox(n.x - n.width / 2, n.y)
const prefixesOf = (code: string) => Array.from({ length: code.length + 1 }, (_, i) => code.slice(0, i))
const litSegments = (code: string) => segments.filter((s) => isSegmentLit(s, code))

const padBox = (n: NodeLayout): Box => ({
  x1: n.x - n.width / 2,
  y1: n.y - n.height / 2,
  x2: n.x + n.width / 2,
  y2: n.y + n.height / 2,
})

/** True if the lit conductors (traces, plus the lit pads they pass through) link `from` to `to`. */
function routed(conductors: Box[], from: Box, to: Box): boolean {
  const seen = new Set<Box>()
  const queue = conductors.filter((c) => touch(c, from))
  queue.forEach((c) => seen.add(c))
  while (queue.length) {
    const current = queue.shift()!
    if (touch(current, to)) return true
    for (const next of conductors) {
      if (!seen.has(next) && touch(current, next)) {
        seen.add(next)
        queue.push(next)
      }
    }
  }
  return false
}

/** Lit traces and lit pads for the active path. */
const litConductors = (active: string): Box[] => [
  ...litSegments(active).map(box),
  ...nodes.filter((n) => n.code !== '' && active.startsWith(n.code)).map(padBox),
]

describe('node illumination', () => {
  it('lights nothing when no sequence is active', () => {
    for (const node of nodes) expect(nodeStateFor(node.code, '')).toBe('idle')
    expect(litSegments('')).toHaveLength(0)
  })

  it.each(allCodes)('path %s: root and ancestors trail, end node current, all others dark', (active) => {
    for (const node of nodes) {
      const expected = node.code === active ? 'current' : active.startsWith(node.code) ? 'trail' : 'idle'
      expect(nodeStateFor(node.code, active), node.code).toBe(expected)
    }
    const lit = nodes.filter((n) => nodeStateFor(n.code, active) !== 'idle')
    expect(lit).toHaveLength(active.length + 1) // root + one node per symbol entered
  })

  it('keeps earlier nodes lit as the sequence grows, and darkens them when it shrinks', () => {
    const litCodes = (code: string) =>
      nodes.filter((n) => nodeStateFor(n.code, code) !== 'idle').map((n) => n.code)
    expect(litCodes('.-.')).toEqual(expect.arrayContaining(litCodes('.-')))
    expect(litCodes('.-')).toEqual(expect.arrayContaining(litCodes('.')))
    expect(litCodes('.')).not.toContain('.-')
  })
})

describe('circuit trace illumination', () => {
  it.each(allCodes)('path %s lights one connected route, parent to child, from the source', (active) => {
    const lit = litConductors(active)
    expect(routed(lit, rightEdge(byCode.get('')!), leftEdge(byCode.get(active)!))).toBe(true)
    // Each hop is wired by traces alone: parent's right edge → child's left edge.
    for (let depth = 1; depth <= active.length; depth++) {
      const parent = byCode.get(active.slice(0, depth - 1))!
      const child = byCode.get(active.slice(0, depth))!
      expect(routed(litSegments(active).map(box), rightEdge(parent), leftEdge(child)), active.slice(0, depth)).toBe(true)
    }
  })

  it.each(allCodes)('path %s lights no trace that runs through a node off the path', (active) => {
    const onPath = new Set(prefixesOf(active))
    const inset = 0.05
    for (const s of litSegments(active)) {
      const b = box(s)
      for (const node of nodes) {
        if (onPath.has(node.code)) continue
        const overlaps =
          b.x1 < node.x + node.width / 2 - inset &&
          b.x2 > node.x - node.width / 2 + inset &&
          b.y1 < node.y + node.height / 2 - inset &&
          b.y2 > node.y - node.height / 2 + inset
        expect(overlaps, `${s.id} crosses ${node.code}`).toBe(false)
      }
    }
  })

  it('never darkens an already-lit trace as the sequence grows', () => {
    const ids = (code: string) => new Set(litSegments(code).map((s) => s.id))
    for (const code of ['....-', '.----', '-----', '..---', '---..']) {
      for (let n = 1; n < code.length; n++) {
        const shorter = ids(code.slice(0, n))
        const longer = ids(code.slice(0, n + 1))
        for (const id of shorter) expect(longer.has(id), `${code}: ${id}`).toBe(true)
        expect(longer.size).toBeGreaterThan(shorter.size)
      }
    }
  })

  it('lights different traces for the dot branch and the dash branch of a node', () => {
    for (const node of nodes) {
      const dot = byCode.get(node.code + '.')
      const dash = byCode.get(node.code + '-')
      if (!dot || !dash) continue
      const dotIds = new Set(litSegments(dot.code).map((s) => s.id))
      const dashIds = new Set(litSegments(dash.code).map((s) => s.id))
      expect([...dotIds].filter((id) => !dashIds.has(id)).length, node.code).toBeGreaterThan(0)
      expect([...dashIds].filter((id) => !dotIds.has(id)).length, node.code).toBeGreaterThan(0)
    }
  })
})
