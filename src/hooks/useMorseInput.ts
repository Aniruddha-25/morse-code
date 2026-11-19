import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { DEFAULT_TIMING } from '../morse/config'
import { findNode } from '../morse/morseDecoder'
import type { MorseSymbol, MorseTiming } from '../morse/types'

interface InputError {
  readonly id: number
  readonly text: string
}

export interface State {
  readonly sequence: readonly MorseSymbol[]
  /** Confirmed characters. */
  readonly text: string
  readonly error: InputError | null
}

export type Action =
  | { type: 'symbol'; symbol: MorseSymbol }
  | { type: 'delete' }
  | { type: 'confirm' }
  | { type: 'clearError' }
  | { type: 'reset' }

export const INITIAL_STATE: State = { sequence: [], text: '', error: null }

const GLYPH: Record<MorseSymbol, string> = { '.': '·', '-': '−' }

function withError(state: State, text: string): State {
  return { ...state, error: { id: (state.error?.id ?? 0) + 1, text } }
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'symbol': {
      const sequence = [...state.sequence, action.symbol]
      if (!findNode(sequence)) {
        // Nothing continues this way (e.g. ·−−−−−): flash red, keep the valid sequence.
        return withError(state, `No character continues with ${GLYPH[action.symbol]}`)
      }
      return { ...state, sequence, error: null }
    }
    case 'delete': {
      if (state.sequence.length > 0) {
        // Composing: remove the last symbol.
        return { ...state, sequence: state.sequence.slice(0, -1), error: null }
      }
      if (state.text.length > 0) {
        // Nothing being composed: remove the last saved character.
        return { ...state, text: state.text.slice(0, -1), error: null }
      }
      return state
    }
    case 'confirm': {
      if (state.sequence.length === 0) {
        // Empty sequence: insert a word space, but never first or doubled.
        if (state.text === '' || state.text.endsWith(' ')) return state
        return { ...state, text: state.text + ' ', error: null }
      }
      const character = findNode(state.sequence)?.letter
      if (!character) {
        // A valid prefix, but not a character yet (e.g. ··−−): keep it and flash.
        return withError(state, `${state.sequence.map((s) => GLYPH[s]).join(' ')} is not a character`)
      }
      // Save it, clear the sequence (which turns the circuit off) for the next character.
      return { sequence: [], text: state.text + character, error: null }
    }
    case 'clearError':
      return state.error ? { ...state, error: null } : state
    case 'reset':
      return INITIAL_STATE
  }
}

/** Keyboard controls: Alt = dot, Space = dash, Enter = confirm, Backspace = delete. */
export function keyToAction(key: string): Action | null {
  switch (key) {
    case 'Alt':
      return { type: 'symbol', symbol: '.' }
    case ' ':
      return { type: 'symbol', symbol: '-' }
    case 'Enter':
      return { type: 'confirm' }
    case 'Backspace':
      return { type: 'delete' }
    default:
      return null
  }
}

/**
 * True when Space/Enter should keep their normal meaning because a control marked
 * data-native-keys (the theme switch) has focus. That control never takes focus
 * from a mouse or touch press (see ThemeToggle), so focus there means the keyboard.
 */
function usesNativeKeys(event: KeyboardEvent): boolean {
  if (event.key !== ' ' && event.key !== 'Enter') return false
  const target = event.target
  return target instanceof Element && target.closest('[data-native-keys]') !== null
}

export interface UseMorseInputOptions {
  timing?: Partial<MorseTiming>
  /** Listen for Alt (dot), Space (dash), Enter (confirm) and Backspace (delete). Default true. */
  keyboard?: boolean
}

export interface UseMorseInput {
  sequence: readonly MorseSymbol[]
  /** Characters confirmed so far. */
  text: string
  /** Message for the most recent invalid input, while it is flashing. */
  error: string | null
  addDot: () => void
  addDash: () => void
  confirm: () => void
  deleteLast: () => void
  reset: () => void
}

export function useMorseInput(options: UseMorseInputOptions = {}): UseMorseInput {
  const { keyboard = true } = options
  const { errorFlashMs } = { ...DEFAULT_TIMING, ...options.timing }
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const addDot = useCallback(() => dispatch({ type: 'symbol', symbol: '.' }), [])
  const addDash = useCallback(() => dispatch({ type: 'symbol', symbol: '-' }), [])
  const confirm = useCallback(() => dispatch({ type: 'confirm' }), [])
  const deleteLast = useCallback(() => dispatch({ type: 'delete' }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  // The only timer: ends the red flash. A new error replaces the object, which
  // clears and restarts it; it is also cleared on unmount.
  const { sequence, error } = state
  useEffect(() => {
    if (!error) return
    const id = window.setTimeout(() => dispatch({ type: 'clearError' }), errorFlashMs)
    return () => window.clearTimeout(id)
  }, [error, errorFlashMs])

  useEffect(() => {
    if (!keyboard) return
    // Ctrl/Alt/Meta combinations are browser or OS shortcuts, not Morse input.
    // Alt on its own is the dot key, so its own event (altKey is true) is allowed.
    const ignored = (event: KeyboardEvent) =>
      event.ctrlKey ||
      event.metaKey ||
      event.isComposing ||
      (event.altKey && event.key !== 'Alt') ||
      usesNativeKeys(event)

    const onKeyDown = (event: KeyboardEvent) => {
      if (ignored(event)) return
      const action = keyToAction(event.key)
      if (!action) return
      // Stops Enter/Space from "clicking" a focused button, Space from scrolling
      // and Backspace from navigating back.
      event.preventDefault()
      if (event.repeat) return
      dispatch(action)
    }
    // Some browsers click a focused button on Space keyup even if keydown was
    // cancelled, and focus the browser menu bar when Alt is released on its own.
    const onKeyUp = (event: KeyboardEvent) => {
      if ((event.key === ' ' || event.key === 'Alt') && !ignored(event)) event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [keyboard])

  return useMemo(
    () => ({
      sequence,
      text: state.text,
      error: error?.text ?? null,
      addDot,
      addDash,
      confirm,
      deleteLast,
      reset,
    }),
    [sequence, state.text, error, addDot, addDash, confirm, deleteLast, reset],
  )
}
