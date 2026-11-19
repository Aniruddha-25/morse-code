/**
 * Reference copy of ITU-R M.1677-1 (10/2009) "International Morse code",
 * sections 1.1.1 (Letters) and 1.1.2 (Figures). Punctuation is deliberately
 * excluded. Kept separate from src/morse/morseData.ts so tests compare the app
 * against an independent copy rather than against itself.
 */
export const ITU_TABLE: Readonly<Record<string, string>> = {
  // 1.1.1 Letters
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
  J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  // 1.1.2 Figures
  '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
}

/** Every proper prefix of every ITU code, plus the codes themselves. */
export const ITU_PATHS: ReadonlySet<string> = new Set(
  Object.values(ITU_TABLE).flatMap((code) =>
    Array.from({ length: code.length }, (_, i) => code.slice(0, i + 1)),
  ),
)

/** Paths that are valid prefixes but not characters in their own right (Ü, Ö and CH slots). */
export const ITU_NON_CHARACTER_PATHS: readonly string[] = [...ITU_PATHS]
  .filter((path) => !Object.values(ITU_TABLE).includes(path))
  .sort()

/** All dot/dash sequences of length 1..maxLength. */
export function allSequences(maxLength: number): string[] {
  const result: string[] = []
  let layer = ['']
  for (let length = 1; length <= maxLength; length++) {
    layer = layer.flatMap((prefix) => [prefix + '.', prefix + '-'])
    result.push(...layer)
  }
  return result
}
