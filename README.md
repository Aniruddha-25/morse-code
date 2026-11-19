# Morse Code Board

Interactive Morse code decoder: enter dots and dashes and the matching path lights up on a circuit-board decoding tree.

**[Live Demo](https://aniruddha-25.github.io/morse-code/)**

## Features

- International (ITU) Morse code for A–Z and 0–9, decoded through a binary tree.
- Circuit-board UI: the entered path is lit through animated traces and pads.
- Live readout of the current sequence, the candidate character and the decoded text.
- Invalid input (no character continues the path, or `Enter` on a partial code) flashes red for 800 ms and keeps the sequence.
- Keyboard and on-screen touch controls; responsive layout.
- Light/Dark theme: automatic by local time (light 6 AM–6 PM), with a manual override saved in `localStorage` (`morse-theme`).
- Static site with no backend.

## Controls

| Key | Button | Action |
| --- | --- | --- |
| `Alt` | Dot | Add a dot (`·`) |
| `Space` | Dash | Add a dash (`−`) |
| `Enter` | Confirm (↵) | Save the character; with an empty sequence, insert a space |
| `Backspace` | Delete (⌫) | Remove the last symbol, or the last character if no sequence is active |
| n/a | Reset | Clear the sequence and output |

Key repeat and `Ctrl`/`Meta`/`Alt` combinations are ignored. `Space` and `Enter` toggle the theme instead while the theme switch has focus.

## Morse Code Reference

Use `.` for a dot and `-` for a dash. The mapping lives in [src/morse/morseData.ts](src/morse/morseData.ts).

### Letters

| Character | Morse Code |
| --- | --- |
| A | `.-` |
| B | `-...` |
| C | `-.-.` |
| D | `-..` |
| E | `.` |
| F | `..-.` |
| G | `--.` |
| H | `....` |
| I | `..` |
| J | `.---` |
| K | `-.-` |
| L | `.-..` |
| M | `--` |
| N | `-.` |
| O | `---` |
| P | `.--.` |
| Q | `--.-` |
| R | `.-.` |
| S | `...` |
| T | `-` |
| U | `..-` |
| V | `...-` |
| W | `.--` |
| X | `-..-` |
| Y | `-.--` |
| Z | `--..` |

### Digits

| Character | Morse Code |
| --- | --- |
| 0 | `-----` |
| 1 | `.----` |
| 2 | `..---` |
| 3 | `...--` |
| 4 | `....-` |
| 5 | `.....` |
| 6 | `-....` |
| 7 | `--...` |
| 8 | `---..` |
| 9 | `----.` |

## Tech Stack

- React 19, TypeScript, Vite
- Vitest (tests), ESLint with typescript-eslint (lint)
- react-icons (Lucide icons for the theme switch)
- GitHub Actions + GitHub Pages (deployment)

## Getting Started

Requires Node.js 22.12 or newer.

To install Locally
```bash
npm install
```
To run in Local
```bash
npm run dev
```

The dev server serves the app at `/` (usually http://localhost:5173/).

## Development

```bash
npm run build  && npm run deploy
```

| Path | Contents |
| --- | --- |
| `src/morse/` | Morse mapping and tree, decoder, board layout, path illumination |
| `src/hooks/` | `useMorseInput` (input state, keyboard, errors), `useTheme` (theme state and schedule) |
| `src/components/` | `MorseBoard`, `MorseNode`, `CircuitLine`, `MorseDisplay`, `MorseControls`, `ThemeToggle` |
| `src/theme/` | Automatic light/dark schedule |
| `index.html` | Sets the initial theme before first paint (keep in sync with `src/theme/schedule.ts`) |

Tests live in `tests/` folders next to the code they cover.

### Deployment

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) lints, tests, builds and deploys `dist/` to GitHub Pages. It runs daily at 12:00 AM IST (skipped if the latest commit is already deployed) and on manual dispatch, never on push. Production builds use the base path `/morse-code/` ([vite.config.ts](vite.config.ts)), so open `npm run preview` at that path. Pages must be set to the **GitHub Actions** source in the repository settings.
