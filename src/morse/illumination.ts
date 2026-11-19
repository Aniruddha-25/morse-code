import type { CircuitSegment, MorseCode, NodeState } from './types'

/** How a node should look while `activeCode` is the sequence being entered. */
export function nodeStateFor(code: MorseCode, activeCode: MorseCode): NodeState {
  if (activeCode === '') return 'idle'
  if (code === activeCode) return 'current'
  return activeCode.startsWith(code) ? 'trail' : 'idle'
}

/** A trace is lit when the entered path runs through any child it feeds. */
export function isSegmentLit(segment: CircuitSegment, activeCode: MorseCode): boolean {
  return segment.litBy.some((code) => activeCode.startsWith(code))
}
