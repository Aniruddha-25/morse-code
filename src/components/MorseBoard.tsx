import { memo, type CSSProperties } from 'react'
import { BOARD_LAYOUT, NODE_STAGE } from '../morse/boardLayout'
import { isSegmentLit, nodeStateFor } from '../morse/illumination'
import type { MorseCode } from '../morse/types'
import { CircuitLine } from './CircuitLine'
import { MorseNode } from './MorseNode'
import './MorseBoard.css'

export interface MorseBoardProps {
  /** Path to light up: the sequence being entered. */
  activeCode: MorseCode
  /** Flash the lit path red (invalid input). */
  error: boolean
}

const { width, height, nodes, segments } = BOARD_LAYOUT

const fitStyle = { '--board-ratio': width / height } as CSSProperties
const boardStyle = { aspectRatio: `${width} / ${height}` } as CSSProperties
// One board unit = board width / layout width, so everything scales together.
const surfaceStyle = { '--u': `calc(100cqw / ${width})` } as CSSProperties

const MOUNTING_HOLES = ['tl', 'tr', 'bl', 'br'] as const
const LEGEND = ['dot', 'dash'] as const

/** Memoised: a theme switch re-renders App but leaves the board's props unchanged. */
export const MorseBoard = memo(function MorseBoard({ activeCode, error }: MorseBoardProps) {
  return (
    <div className="morse-board-fit" style={fitStyle}>
      <div className="morse-board" style={boardStyle} data-error={error}>
        <div
          className="morse-board__surface"
          style={surfaceStyle}
          role="group"
          aria-label="Morse code circuit board"
        >
          {MOUNTING_HOLES.map((corner) => (
            <span key={corner} className={`morse-board__hole morse-board__hole--${corner}`} aria-hidden="true" />
          ))}

          <div className="morse-board__silk morse-board__silk--title" aria-hidden="true">
            <span>MORSE</span>
            <span>CODE</span>
          </div>
          <div className="morse-board__silk morse-board__silk--legend" aria-hidden="true">
            {LEGEND.map((shape) => (
              <span key={shape} className="morse-board__legend-row">
                <i className={`morse-board__legend-${shape}`} /> {shape.toUpperCase()}
              </span>
            ))}
          </div>

          {segments.map((segment) => (
            <CircuitLine key={segment.id} {...segment} lit={isSegmentLit(segment, activeCode)} />
          ))}

          {nodes.map((node) => (
            <MorseNode key={node.code} {...node} state={nodeStateFor(node.code, activeCode)} stage={NODE_STAGE} />
          ))}
        </div>
      </div>
    </div>
  )
})
