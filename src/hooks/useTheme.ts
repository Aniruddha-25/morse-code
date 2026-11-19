import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { msUntilNextSwitch, themeForDate, type Theme } from '../theme/schedule'

/** 'auto' follows the local time of day; 'light' / 'dark' is a saved manual choice. */
type ThemeMode = 'auto' | Theme

// Keep in sync with the inline script in index.html.
const STORAGE_KEY = 'morse-theme'

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'auto'
  } catch {
    return 'auto' // storage blocked (private mode, etc.)
  }
}

function writeStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Not persisted; the choice still applies for this visit.
  }
}

export interface UseTheme {
  /** The theme currently shown. */
  theme: Theme
  /** Switch to the opposite theme and keep it (a manual override). */
  toggleTheme: () => void
}

/**
 * Theme state, written to <html data-theme>. A saved manual choice (made with the
 * switch) always wins. Otherwise the theme follows the device's local time (light 6 AM – 6 PM):
 * one timer is aimed at the next switch, and the time is re-checked when the
 * tab becomes visible again, since timers can lag while a tab is hidden or the
 * device sleeps. Theme state is separate from, and never touches, Morse input.
 */
export function useTheme(): UseTheme {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode)
  const [autoTheme, setAutoTheme] = useState<Theme>(() => themeForDate(new Date()))
  const theme = mode === 'auto' ? autoTheme : mode

  // Automatic mode only: wake at each 6 AM / 6 PM, and on returning to the tab.
  useEffect(() => {
    if (mode !== 'auto') return
    let timer: number
    const sync = () => {
      const now = new Date()
      setAutoTheme(themeForDate(now)) // no re-render if unchanged
      window.clearTimeout(timer)
      timer = window.setTimeout(sync, msUntilNextSwitch(now))
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }
    timer = window.setTimeout(sync, msUntilNextSwitch(new Date()))
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [mode])

  // Apply to the page before the browser paints, in the same frame as the switch
  // itself. The inline script in index.html already set the first value, so
  // nothing animates on load. The colour fade is pure CSS (see index.css).
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    writeStoredTheme(next)
    setMode(next)
  }, [theme])

  return { theme, toggleTheme }
}
