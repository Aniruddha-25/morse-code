export type Theme = 'light' | 'dark'

/** Local hour at which Light Mode starts (6:00 AM) and Dark Mode starts (6:00 PM). */
export const LIGHT_STARTS_AT = 6
export const DARK_STARTS_AT = 18

/**
 * Automatic theme for a moment in the device's local time:
 * 6:00 AM – 5:59 PM → light, 6:00 PM – 5:59 AM → dark.
 * (Keep in sync with the inline script in index.html.)
 */
export function themeForDate(date: Date): Theme {
  const hour = date.getHours()
  return hour >= LIGHT_STARTS_AT && hour < DARK_STARTS_AT ? 'light' : 'dark'
}

/**
 * Milliseconds until the next automatic switch (the next local 6:00 AM or
 * 6:00 PM). Built from local calendar fields, so it stays right across
 * daylight-saving changes.
 */
export function msUntilNextSwitch(now: Date): number {
  const at = (dayOffset: number, hour: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, 0, 0, 0)
  const next = [at(0, LIGHT_STARTS_AT), at(0, DARK_STARTS_AT), at(1, LIGHT_STARTS_AT)].find(
    (boundary) => boundary.getTime() > now.getTime(),
  )!
  return next.getTime() - now.getTime()
}
