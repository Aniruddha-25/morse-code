import { memo } from 'react'
import './MorseControls.css'

export interface MorseControlsProps {
  onDot: () => void
  onDash: () => void
  onDelete: () => void
  onConfirm: () => void
}

interface Control {
  action: keyof MorseControlsProps
  label: string
  /** Keyboard key shown under the symbol where a keyboard exists. */
  caption: string
  symbol: string
  /** Dot and dash carry the same pad shapes as the board: round = dot, rectangular = dash. */
  shape?: 'dot' | 'dash'
  variant?: 'delete' | 'confirm'
}

const CONTROLS: readonly Control[] = [
  { action: 'onDot', label: 'Dot', caption: 'Alt', symbol: '·', shape: 'dot' },
  { action: 'onDash', label: 'Dash', caption: 'Space', symbol: '−', shape: 'dash' },
  { action: 'onDelete', label: 'Delete last symbol', caption: 'Backspace', symbol: '⌫', variant: 'delete' },
  { action: 'onConfirm', label: 'Confirm character', caption: 'Enter', symbol: '↵', variant: 'confirm' },
]

/** Touch buttons that mirror the keyboard controls. */
export const MorseControls = memo(function MorseControls(handlers: MorseControlsProps) {
  return (
    <div className="morse-controls" role="group" aria-label="Morse input">
      {CONTROLS.map(({ action, label, caption, symbol, shape, variant }) => (
        <button
          key={action}
          type="button"
          className={`morse-controls__button${variant ? ` morse-controls__button--${variant}` : ''}`}
          onClick={handlers[action]}
          aria-label={label}
        >
          <span
            className={shape ? `morse-controls__shape morse-controls__shape--${shape}` : 'morse-controls__glyph'}
            aria-hidden="true"
          >
            {symbol}
          </span>
          <span className="morse-controls__key" aria-hidden="true">
            {caption}
          </span>
        </button>
      ))}
    </div>
  )
})
