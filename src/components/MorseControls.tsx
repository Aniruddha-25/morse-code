import { memo } from 'react'
import './MorseControls.css'

export interface MorseControlsProps {
  onDot: () => void
  onDash: () => void
  onDelete: () => void
  onConfirm: () => void
}

/**
 * Touch buttons that mirror the keyboard controls. The dot and dash buttons
 * carry the same pad shapes as the board: round = dot, rectangular = dash.
 */
export const MorseControls = memo(function MorseControls({ onDot, onDash, onDelete, onConfirm }: MorseControlsProps) {
  return (
    <div className="morse-controls" role="group" aria-label="Morse input">
      <button type="button" className="morse-controls__button" onClick={onDot} aria-label="Dot">
        <span className="morse-controls__shape morse-controls__shape--dot" aria-hidden="true">·</span>
        <span className="morse-controls__key" aria-hidden="true">Alt</span>
      </button>
      <button type="button" className="morse-controls__button" onClick={onDash} aria-label="Dash">
        <span className="morse-controls__shape morse-controls__shape--dash" aria-hidden="true">−</span>
        <span className="morse-controls__key" aria-hidden="true">Space</span>
      </button>
      <button
        type="button"
        className="morse-controls__button morse-controls__button--delete"
        onClick={onDelete}
        aria-label="Delete last symbol"
      >
        <span className="morse-controls__glyph" aria-hidden="true">⌫</span>
        <span className="morse-controls__key" aria-hidden="true">Backspace</span>
      </button>
      <button
        type="button"
        className="morse-controls__button morse-controls__button--confirm"
        onClick={onConfirm}
        aria-label="Confirm character"
      >
        <span className="morse-controls__glyph" aria-hidden="true">↵</span>
        <span className="morse-controls__key" aria-hidden="true">Enter</span>
      </button>
    </div>
  )
})
