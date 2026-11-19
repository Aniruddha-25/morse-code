import { describe, expect, it } from 'vitest'
import { msUntilNextSwitch, themeForDate } from '../schedule'

// Local-time constructor: the app uses the device's local clock, never UTC.
const at = (h: number, m = 0, s = 0, ms = 0) => new Date(2026, 5, 15, h, m, s, ms)

describe('themeForDate (6 AM – 6 PM light, 6 PM – 6 AM dark)', () => {
  it.each([
    [0, 0, 'dark'],
    [3, 30, 'dark'],
    [5, 59, 'dark'],
    [6, 0, 'light'],
    [6, 1, 'light'],
    [12, 0, 'light'],
    [17, 59, 'light'],
    [18, 0, 'dark'],
    [18, 1, 'dark'],
    [23, 59, 'dark'],
  ] as const)('%i:%i → %s', (h, m, expected) => {
    expect(themeForDate(at(h, m))).toBe(expected)
  })

  it('switches exactly on the boundary seconds', () => {
    expect(themeForDate(at(5, 59, 59, 999))).toBe('dark')
    expect(themeForDate(at(6, 0, 0, 0))).toBe('light')
    expect(themeForDate(at(17, 59, 59, 999))).toBe('light')
    expect(themeForDate(at(18, 0, 0, 0))).toBe('dark')
  })

  it('uses local time, not UTC', () => {
    const date = at(12) // noon local, whatever the offset from UTC is
    expect(date.getHours()).toBe(12)
    expect(themeForDate(date)).toBe('light')
  })
})

describe('msUntilNextSwitch', () => {
  const H = 3_600_000

  it('counts to 6 AM from the small hours', () => {
    expect(msUntilNextSwitch(at(5))).toBe(1 * H)
    expect(msUntilNextSwitch(at(0))).toBe(6 * H)
  })

  it('counts to 6 PM during the day', () => {
    expect(msUntilNextSwitch(at(6, 0, 0, 1))).toBe(12 * H - 1)
    expect(msUntilNextSwitch(at(17, 59, 30))).toBe(30_000)
  })

  it('counts to 6 AM the next day after 6 PM (across midnight)', () => {
    expect(msUntilNextSwitch(at(23))).toBe(7 * H)
    expect(msUntilNextSwitch(at(18, 0, 0, 1))).toBe(12 * H - 1)
  })

  it('moves on to the following boundary when exactly on one', () => {
    expect(msUntilNextSwitch(at(6))).toBe(12 * H)
    expect(msUntilNextSwitch(at(18))).toBe(12 * H)
  })

  it('always points at an instant where the theme actually changes', () => {
    for (let h = 0; h < 24; h++) {
      const now = at(h, 17, 42)
      const later = new Date(now.getTime() + msUntilNextSwitch(now))
      expect(themeForDate(later), `from ${h}:17`).not.toBe(themeForDate(now))
      expect(themeForDate(new Date(later.getTime() - 1)), `from ${h}:17`).toBe(themeForDate(now))
    }
  })
})
