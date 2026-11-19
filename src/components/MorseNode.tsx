import { memo, type CSSProperties } from 'react'
import type { NodeLayout, NodeShape, NodeState } from '../morse/types'
import './MorseNode.css'

/** Position and size are in board units (see NodeLayout). */
export interface MorseNodeProps extends Pick<NodeLayout, 'letter' | 'shape' | 'x' | 'y' | 'width' | 'height'> {
  state: NodeState
  /** Stage at which the node lights after the traces leading to it. */
  stage: number
}

const SHAPE_LABEL: Record<NodeShape, string> = {
  root: 'Start',
  dot: 'dot',
  dash: 'dash',
}

/** A letter pad: round for a dot, rectangular for a dash. */
export const MorseNode = memo(function MorseNode({
  letter,
  shape,
  x,
  y,
  width,
  height,
  state,
  stage,
}: MorseNodeProps) {
  const style = {
    '--x': x,
    '--y': y,
    '--w': width,
    '--h': height,
    '--stage': stage,
  } as CSSProperties

  return (
    <div
      className={`morse-node morse-node--${shape} morse-node--${state}`}
      style={style}
      role="img"
      aria-label={letter ? `${letter}, ${SHAPE_LABEL[shape]} node` : SHAPE_LABEL[shape]}
    >
      {letter && <span className="morse-node__letter">{letter}</span>}
    </div>
  )
})
