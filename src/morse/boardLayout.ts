import { MORSE_TREE } from './morseData'
import type {
  BoardLayout,
  CircuitSegment,
  MorseNode,
  NodeLayout,
  NodeShape,
} from './types'

/**
 * Board geometry, in abstract "board units". The UI scales one unit to
 * (board width / BOARD_WIDTH), so every position stays proportional.
 *
 * Portrait PCB: signal flows left → right, one column per symbol
 * (root, 1st … 5th). Dots branch upward, dashes downward. Leaves are spaced on
 * a fixed row pitch and parents sit centered between their children.
 *
 * Spacing: ROW_PITCH minus a node's height is the clear gap between stacked
 * nodes; COL_PITCH minus the node widths is the room for the stem, bus and leg
 * traces between columns. The board margin is measured from the outermost node
 * edges, so the tree is centered with equal margins on every side.
 */
const COL_PITCH = 4
const ROW_PITCH = 2.2
const MARGIN_X = 1.4
const MARGIN_Y = 1.4

const SHAPE_SIZE: Record<NodeShape, { width: number; height: number }> = {
  root: { width: 1.2, height: 1.2 },
  dot: { width: 1.6, height: 1.6 },
  dash: { width: 2.2, height: 1.4 },
}

function shapeOf(node: MorseNode): NodeShape {
  if (node.symbol === null) return 'root'
  return node.symbol === '.' ? 'dot' : 'dash'
}

function children(node: MorseNode): MorseNode[] {
  const result: MorseNode[] = []
  if (node.dot) result.push(node.dot)
  if (node.dash) result.push(node.dash)
  return result
}

function buildLayout(root: MorseNode): BoardLayout {
  // 1. Row (vertical position) of every node: leaves take consecutive rows in
  //    tree order, parents sit at the mean of their children.
  const rows = new Map<string, number>()
  let nextRow = 0
  const assignRow = (node: MorseNode): number => {
    const kids = children(node)
    const row =
      kids.length === 0
        ? nextRow++
        : kids.reduce((sum, kid) => sum + assignRow(kid), 0) / kids.length
    rows.set(node.code, row)
    return row
  }
  assignRow(root)

  // 2. Nodes.
  const nodes: NodeLayout[] = []
  const byCode = new Map<string, NodeLayout>()
  const place = (node: MorseNode) => {
    const shape = shapeOf(node)
    const layout: NodeLayout = {
      code: node.code,
      letter: node.letter,
      symbol: node.symbol,
      shape,
      x: node.depth * COL_PITCH,
      y: (rows.get(node.code) ?? 0) * ROW_PITCH,
      ...SHAPE_SIZE[shape],
    }
    nodes.push(layout)
    byCode.set(node.code, layout)
    children(node).forEach(place)
  }
  place(root)

  // 3. Traces. Each parent gets a stem to a vertical bus, and each child a
  //    bus run plus a short leg into the child. A lone child is a straight run.
  const segments: CircuitSegment[] = []
  const connect = (node: MorseNode) => {
    const kids = children(node)
    const parent = byCode.get(node.code)!
    if (kids.length > 0) {
      const startX = parent.x + parent.width / 2
      const busX = parent.x + COL_PITCH / 2
      const kidCodes = kids.map((kid) => kid.code)
      const first = byCode.get(kids[0].code)!

      if (kids.length === 1 && first.y === parent.y) {
        segments.push({
          id: `${first.code}:run`,
          orientation: 'horizontal',
          x: startX,
          y: parent.y,
          length: first.x - first.width / 2 - startX,
          reverse: false,
          stage: 0,
          litBy: kidCodes,
        })
      } else {
        segments.push({
          id: `${node.code}:stem`,
          orientation: 'horizontal',
          x: startX,
          y: parent.y,
          length: busX - startX,
          reverse: false,
          stage: 0,
          litBy: kidCodes,
        })
        for (const kid of kids) {
          const child = byCode.get(kid.code)!
          const goesUp = child.y < parent.y
          segments.push({
            id: `${kid.code}:bus`,
            orientation: 'vertical',
            x: busX,
            y: Math.min(parent.y, child.y),
            length: Math.abs(child.y - parent.y),
            reverse: goesUp,
            stage: 1,
            litBy: [kid.code],
          })
          segments.push({
            id: `${kid.code}:leg`,
            orientation: 'horizontal',
            x: busX,
            y: child.y,
            length: child.x - child.width / 2 - busX,
            reverse: false,
            stage: 2,
            litBy: [kid.code],
          })
        }
      }
    }
    kids.forEach(connect)
  }
  connect(root)

  // 4. Shift everything so the outermost node edges sit MARGIN from the board edge.
  const left = Math.min(...nodes.map((n) => n.x - n.width / 2))
  const right = Math.max(...nodes.map((n) => n.x + n.width / 2))
  const top = Math.min(...nodes.map((n) => n.y - n.height / 2))
  const bottom = Math.max(...nodes.map((n) => n.y + n.height / 2))
  const dx = MARGIN_X - left
  const dy = MARGIN_Y - top

  return {
    width: right - left + MARGIN_X * 2,
    height: bottom - top + MARGIN_Y * 2,
    nodes: nodes.map((n) => ({ ...n, x: n.x + dx, y: n.y + dy })),
    segments: segments.map((s) => ({ ...s, x: s.x + dx, y: s.y + dy })),
  }
}

export const BOARD_LAYOUT: BoardLayout = buildLayout(MORSE_TREE)

/** Stage at which a node lights, after the trace stages 0–2 have run. */
export const NODE_STAGE = 3
