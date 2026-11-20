import { LuMoon, LuSun } from 'react-icons/lu'
import type { Theme } from '../theme/schedule'
import './ThemeToggle.css'

export interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
}

/**
 * Sliding Light/Dark switch: a pill track with a white circular thumb that
 * carries the icon of the active theme (Sun in Light Mode, on the left; Moon in
 * Dark Mode, on the right). A native <button> gives Tab focus plus Space and
 * Enter activation (data-native-keys keeps those keys out of the Morse input
 * while it has focus).
 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      className="theme-switch"
      data-native-keys
      onClick={onToggle}
      // Mouse/touch presses must not leave focus here, or Space/Enter would keep toggling
      // the theme instead of typing Morse. Keyboard focus (Tab) is unaffected.
      onMouseDown={(event) => event.preventDefault()}
    >
      <span className="theme-switch__thumb" aria-hidden="true">
        {dark ? (
          <LuMoon className="theme-switch__icon theme-switch__icon--moon" />
        ) : (
          <LuSun className="theme-switch__icon theme-switch__icon--sun" />
        )}
      </span>
    </button>
  )
}
