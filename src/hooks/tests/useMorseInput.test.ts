import { describe, expect, it } from 'vitest'
import { ITU_TABLE } from '../../morse/tests/ituTable'
import { INITIAL_STATE, keyToAction, reducer, type Action, type State } from '../useMorseInput'

/** '.' dot, '-' dash, 'E' = Enter (confirm), 'B' = Backspace. */
function press(keys: string, from: State = INITIAL_STATE): State {
  let state = from
  for (const key of keys) {
    const action: Action =
      key === '.'
        ? { type: 'symbol', symbol: '.' }
        : key === '-'
          ? { type: 'symbol', symbol: '-' }
          : key === 'E'
            ? { type: 'confirm' }
            : { type: 'delete' }
    state = reducer(state, action)
  }
  return state
}

describe('keyboard mapping', () => {
  it('maps Alt → dot, Space → dash, Enter → confirm, Backspace → delete', () => {
    expect(keyToAction('Alt')).toEqual({ type: 'symbol', symbol: '.' })
    expect(keyToAction(' ')).toEqual({ type: 'symbol', symbol: '-' })
    expect(keyToAction('Enter')).toEqual({ type: 'confirm' })
    expect(keyToAction('Backspace')).toEqual({ type: 'delete' })
  })

  it('ignores every other key, including Shift, Control and letters', () => {
    for (const key of ['Shift', 'Control', 'AltGraph', 'a', 'A', '.', '-', 'Tab', 'Escape', 'ArrowLeft']) {
      expect(keyToAction(key), key).toBeNull()
    }
  })
})

describe('confirming characters', () => {
  it.each(Object.entries(ITU_TABLE))('%s: entering %s then Enter saves it and clears the circuit', (character, code) => {
    const composing = press(code)
    expect(composing.sequence.join('')).toBe(code) // path stays lit until Enter
    expect(composing.text).toBe('')
    const saved = reducer(composing, { type: 'confirm' })
    expect(saved.text).toBe(character)
    expect(saved.sequence).toEqual([]) // circuit reset for the next character
    expect(saved.error).toBeNull()
  })

  it('never confirms by itself: only input actions change the text', () => {
    const state = press('....')
    expect(reducer(state, { type: 'clearError' })).toBe(state)
    expect(state.text).toBe('')
  })

  it('builds HELLO, keeping earlier characters and resetting the circuit each time', () => {
    let state = INITIAL_STATE
    const steps: [string, string][] = [
      ['....E', 'H'],
      ['.E', 'HE'],
      ['.-..E', 'HEL'],
      ['.-..E', 'HELL'],
      ['---E', 'HELLO'],
    ]
    for (const [keys, text] of steps) {
      state = press(keys, state)
      expect(state.text).toBe(text)
      expect(state.sequence).toEqual([])
    }
  })

  it('handles letters and digits together in one sentence', () => {
    expect(press('....E' + '.E' + 'E' + '.----E' + '-----E').text).toBe('HE 10')
  })

  it('rejects Enter on a valid prefix that is not a character, keeping sequence and text', () => {
    for (const prefix of ['..--', '---.', '----']) {
      const state = press(prefix + 'E', press('.E'))
      expect(state.text, prefix).toBe('E')
      expect(state.sequence.join(''), prefix).toBe(prefix)
      expect(state.error, prefix).not.toBeNull()
    }
  })
})

describe('invalid paths', () => {
  it('rejects a symbol that leads nowhere, keeps the valid sequence, and flags an error', () => {
    const before = press('.....') // 5
    const after = reducer(before, { type: 'symbol', symbol: '.' })
    expect(after.sequence).toEqual(before.sequence)
    expect(after.error).not.toBeNull()
    expect(reducer(after, { type: 'confirm' }).text).toBe('5') // original sequence still confirms
  })

  it('rejects every extension of every complete five-symbol code', () => {
    for (const code of Object.values(ITU_TABLE).filter((c) => c.length === 5)) {
      for (const symbol of ['.', '-'] as const) {
        const state = reducer(press(code), { type: 'symbol', symbol })
        expect(state.sequence.join('')).toBe(code)
        expect(state.error).not.toBeNull()
      }
    }
  })

  it('numbers repeated errors so the flash restarts, and clears on delete or clearError', () => {
    const once = reducer(press('.....'), { type: 'symbol', symbol: '.' })
    const twice = reducer(once, { type: 'symbol', symbol: '.' })
    expect(twice.error!.id).toBeGreaterThan(once.error!.id)
    expect(reducer(twice, { type: 'clearError' }).error).toBeNull()
    expect(reducer(once, { type: 'delete' }).error).toBeNull()
  })

  it('does not flag valid paths, including unlabeled intermediate nodes', () => {
    for (const code of ['.', '..--', '---.', '----', '-----', '.----']) {
      expect(press(code).error, code).toBeNull()
    }
  })
})

describe('word spacing', () => {
  it('Enter with no sequence adds one space after text', () => {
    expect(press('.EE').text).toBe('E ')
  })

  it('never adds a space first or twice in a row', () => {
    expect(press('E').text).toBe('')
    expect(press('EEE').text).toBe('')
    expect(press('.EEEE').text).toBe('E ')
  })

  it('allows a new word after a space', () => {
    expect(press('.EE-E').text).toBe('E T')
    expect(press('.EE-EE.E').text).toBe('E T E')
  })
})

describe('deleting', () => {
  it('Backspace removes the last symbol while composing, leaving saved text alone', () => {
    const state = press('.E' + '.-.B')
    expect(state.sequence.join('')).toBe('.-')
    expect(state.text).toBe('E')
  })

  it('Backspace with no sequence removes the last saved character, including a space', () => {
    expect(press('.E-EB').text).toBe('E')
    expect(press('.EEB').text).toBe('E')
    expect(press('.EEBB').text).toBe('')
  })

  it('Backspace on empty input does nothing', () => {
    expect(press('B')).toEqual(INITIAL_STATE)
    expect(press('BBB')).toEqual(INITIAL_STATE)
  })

  it('deleting down to empty turns the circuit off; further Backspace then eats text', () => {
    const composing = press('..B', press('.E'))
    expect(composing.sequence.join('')).toBe('.')
    const empty = press('B', composing)
    expect(empty.sequence).toEqual([])
    expect(empty.text).toBe('E')
    expect(press('B', empty).text).toBe('')
  })

  it('a corrected sequence confirms as the corrected character', () => {
    // .... (H) → Backspace → ... (S) → dash → ...- (V)
    expect(press('....B-E').text).toBe('V')
  })
})
