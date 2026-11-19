import { memo } from 'react'
import { decodeSequence } from '../morse/morseDecoder'
import { symbolGlyph } from '../morse/morseData'
import type { MorseSymbol } from '../morse/types'
import './MorseDisplay.css'

export interface MorseDisplayProps {
  sequence: readonly MorseSymbol[]
  /** Confirmed characters. */
  text: string
  /** Message for an invalid input, while it is flashing. */
  notice: string | null
  onReset: () => void
}

/** Readout above the board: current symbols, the character they point to, and the message. */
export const MorseDisplay = memo(function MorseDisplay({
  sequence,
  text,
  notice,
  onReset,
}: MorseDisplayProps) {
  const candidate = decodeSequence(sequence)
  const hasContent = sequence.length > 0 || text.length > 0

  return (
    <section className="morse-display" aria-label="Morse readout">
      <div className="morse-display__row">
        <div className="morse-display__sequence" aria-label="Current sequence">
          {sequence.length === 0 ? (
            <span className="morse-display__placeholder">Enter · or −</span>
          ) : (
            sequence.map((symbol, index) => (
              <span key={index} className="morse-display__symbol">
                {symbolGlyph(symbol)}
              </span>
            ))
          )}
        </div>
        <div
          className={`morse-display__letter${candidate ? ' morse-display__letter--active' : ''}`}
          aria-hidden={!candidate}
        >
          {candidate ?? ''}
        </div>
      </div>

      <div className="morse-display__row">
        <p className="morse-display__text" aria-live="polite" aria-label="Output text">
          {text || <span className="morse-display__placeholder">Output</span>}
        </p>
        <button
          type="button"
          className="morse-display__reset"
          onClick={onReset}
          disabled={!hasContent}
        >
          Reset
        </button>
      </div>

      <p className="morse-display__notice" role="status">
        {notice}
      </p>
    </section>
  )
})
