import { describe, expect, it } from 'vitest'
import { BOARD_LAYOUT } from '../boardLayout'
import { ITU_TABLE } from './ituTable'
import type { NodeLayout } from '../types'

const { nodes, segments } = BOARD_LAYOUT
const byCode = new Map(nodes.map((n) => [n.code, n]))
const nonRoot = nodes.filter((n) => n.code !== '')

describe('circuit board nodes', () => {
  it('has the root plus one node per ITU path (36 characters + 3 blank), no duplicates', () => {
    expect(nodes).toHaveLength(40)
    expect(byCode.size).toBe(40)
  })

  it('places every ITU character at the node for its own code, once', () => {
    for (const [character, code] of Object.entries(ITU_TABLE)) {
      expect(byCode.get(code)?.letter, code).toBe(character)
    }
    const labels = nodes.map((n) => n.letter).filter((l) => l !== null)
    expect(labels).toHaveLength(36)
    expect(new Set(labels).size).toBe(36)
  })

  it('leaves only the three structural nodes unlabeled', () => {
    const blank = nonRoot.filter((n) => n.letter === null).map((n) => n.code)
    expect(blank.sort()).toEqual(['----', '---.', '..--'])
  })

  it('draws a circle for every dot and a rectangle for every dash', () => {
    for (const node of nonRoot) {
      const last = node.code.at(-1)
      expect(node.symbol, node.code).toBe(last)
      if (last === '.') {
        expect(node.shape, node.code).toBe('dot')
        expect(node.width).toBe(node.height) // circle
      } else {
        expect(node.shape, node.code).toBe('dash')
        expect(node.width).toBeGreaterThan(node.height) // rectangle
      }
    }
  })

  it('uses one column per level: root + five levels = six columns', () => {
    expect(new Set(nodes.map((n) => n.x)).size).toBe(6)
    const pitch = byCode.get('.')!.x - byCode.get('')!.x
    for (const node of nonRoot) {
      const parent = byCode.get(node.code.slice(0, -1))!
      expect(node.x - parent.x, node.code).toBeCloseTo(pitch)
    }
  })

  it('puts dots above and dashes below their parent', () => {
    for (const node of nodes) {
      const dot = byCode.get(node.code + '.')
      const dash = byCode.get(node.code + '-')
      if (dot && dash) {
        expect(dot.y).toBeLessThan(node.y)
        expect(dash.y).toBeGreaterThan(node.y)
      }
    }
  })

  it('does not overlap any two nodes', () => {
    const hit = (a: NodeLayout, b: NodeLayout) =>
      Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        expect(hit(nodes[i], nodes[j]), `${nodes[i].code} / ${nodes[j].code}`).toBe(false)
      }
    }
  })
})

describe('circuit traces', () => {
  it('only feeds nodes that exist, and gives every node a way in', () => {
    for (const segment of segments) {
      for (const code of segment.litBy) expect(byCode.has(code), code).toBe(true)
    }
    for (const node of nonRoot) {
      expect(
        segments.some((s) => s.litBy.includes(node.code)),
        node.code,
      ).toBe(true)
    }
  })

  it('keeps every trace inside the board', () => {
    for (const s of segments) {
      const endX = s.orientation === 'horizontal' ? s.x + s.length : s.x
      const endY = s.orientation === 'vertical' ? s.y + s.length : s.y
      for (const v of [s.x, s.y, endX, endY]) expect(v).toBeGreaterThan(0)
      expect(endX).toBeLessThan(BOARD_LAYOUT.width)
      expect(endY).toBeLessThan(BOARD_LAYOUT.height)
    }
  })
})

describe('spacing and balance', () => {
  const nodeBox = (n: NodeLayout) => ({
    x1: n.x - n.width / 2,
    x2: n.x + n.width / 2,
    y1: n.y - n.height / 2,
    y2: n.y + n.height / 2,
  })
  /** Straight-line distance between two axis-aligned boxes (0 if they touch or overlap). */
  const distance = (
    a: { x1: number; x2: number; y1: number; y2: number },
    b: { x1: number; x2: number; y1: number; y2: number },
  ) => Math.hypot(Math.max(0, a.x1 - b.x2, b.x1 - a.x2), Math.max(0, a.y1 - b.y2, b.y1 - a.y2))

  it('leaves at least 0.5 units of clear space between any two nodes', () => {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        expect(distance(nodeBox(nodes[i]), nodeBox(nodes[j])), `${nodes[i].code} / ${nodes[j].code}`).toBeGreaterThanOrEqual(0.5)
      }
    }
  })

  it('keeps every trace at least 0.5 units clear of any node it does not connect to', () => {
    for (const s of segments) {
      const traceBox =
        s.orientation === 'horizontal'
          ? { x1: s.x, x2: s.x + s.length, y1: s.y, y2: s.y }
          : { x1: s.x, x2: s.x, y1: s.y, y2: s.y + s.length }
      for (const node of nodes) {
        const gap = distance(traceBox, nodeBox(node))
        if (gap < 1e-6) continue // the node this trace plugs into
        expect(gap, `${s.id} near ${node.code || 'root'}`).toBeGreaterThanOrEqual(0.5)
      }
    }
  })

  it('gives every trace run a visible length (no stubs)', () => {
    for (const s of segments) expect(s.length, s.id).toBeGreaterThanOrEqual(0.8)
  })

  it('uses an even row pitch: all end-of-tree nodes sit on consecutive, equally spaced rows', () => {
    const hasChild = (n: NodeLayout) => byCode.has(n.code + '.') || byCode.has(n.code + '-')
    const ys = [...new Set(nodes.filter((n) => !hasChild(n)).map((n) => n.y))].sort((a, b) => a - b)
    expect(ys).toHaveLength(17)
    const pitch = ys[1] - ys[0]
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeCloseTo(pitch)
  })

  it('centres the tree: equal margins left/right and top/bottom', () => {
    const boxes = nodes.map(nodeBox)
    const left = Math.min(...boxes.map((b) => b.x1))
    const right = BOARD_LAYOUT.width - Math.max(...boxes.map((b) => b.x2))
    const top = Math.min(...boxes.map((b) => b.y1))
    const bottom = BOARD_LAYOUT.height - Math.max(...boxes.map((b) => b.y2))
    expect(left).toBeCloseTo(right)
    expect(top).toBeCloseTo(bottom)
    expect(left).toBeGreaterThanOrEqual(1)
  })
})
