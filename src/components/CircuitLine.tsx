import { memo, type CSSProperties } from 'react'
import type { CircuitSegment } from '../morse/types'
import './CircuitLine.css'

export interface CircuitLineProps extends Omit<CircuitSegment, 'id' | 'litBy'> {
  lit: boolean
}

/** One copper trace. The lit "signal" grows along it from the source end. */
export const CircuitLine = memo(function CircuitLine({
  orientation,
  x,
  y,
  length,
  reverse,
  stage,
  lit,
}: CircuitLineProps) {
  const className = [
    'circuit-line',
    `circuit-line--${orientation}`,
    reverse && 'circuit-line--reverse',
    lit && 'circuit-line--lit',
  ]
    .filter(Boolean)
    .join(' ')

  const style = { '--x': x, '--y': y, '--len': length, '--stage': stage } as CSSProperties

  return (
    <div className={className} style={style} aria-hidden="true">
      <span className="circuit-line__signal" />
    </div>
  )
})
