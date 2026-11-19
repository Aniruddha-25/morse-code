/** A single Morse element: '.' is a dot (·), '-' is a dash (−). */
export type MorseSymbol = '.' | '-'

/** A sequence of symbols joined into a string, e.g. ".-" for A. "" is the root. */
export type MorseCode = string

/** A node in the Morse binary tree. Dot goes one way, dash the other. */
export interface MorseNode {
  /** Path from the root; unique id of the node. "" for the root. */
  readonly code: MorseCode
  /** Last symbol of the path (how this node is reached). null for the root. */
  readonly symbol: MorseSymbol | null
  /** The character (A–Z, 0–9) decoded at this node. null for the root and for nodes that only lead on to longer codes. */
  readonly letter: string | null
  readonly depth: number
  dot: MorseNode | null
  dash: MorseNode | null
}

/**
 * idle    – unlit
 * trail   – on the entered path, already passed
 * current – the node the entered sequence currently ends on
 */
export type NodeState = 'idle' | 'trail' | 'current'

/** Visual shape of a node on the board. */
export type NodeShape = 'root' | 'dot' | 'dash'

/** Position and size of a node, in board units (see boardLayout.ts). */
export interface NodeLayout {
  readonly code: MorseCode
  readonly letter: string | null
  readonly symbol: MorseSymbol | null
  readonly shape: NodeShape
  /** Center point. */
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** A straight copper trace on the board, in board units. */
export interface CircuitSegment {
  readonly id: string
  readonly orientation: 'horizontal' | 'vertical'
  /** Start point: left end of a horizontal run, top end of a vertical run. */
  readonly x: number
  readonly y: number
  readonly length: number
  /** Signal travels toward the start point (e.g. upward) instead of away. */
  readonly reverse: boolean
  /** Order within one connection (stem → branch → leg), used to stagger the glow. */
  readonly stage: number
  /** The trace is lit when the active path passes through any of these codes. */
  readonly litBy: readonly MorseCode[]
}

export interface BoardLayout {
  readonly width: number
  readonly height: number
  readonly nodes: readonly NodeLayout[]
  readonly segments: readonly CircuitSegment[]
}

export interface MorseTiming {
  /** How long the red "invalid input" flash lasts. */
  readonly errorFlashMs: number
}
