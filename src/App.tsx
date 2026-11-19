import { MorseBoard } from './components/MorseBoard'
import { MorseControls } from './components/MorseControls'
import { MorseDisplay } from './components/MorseDisplay'
import { ThemeToggle } from './components/ThemeToggle'
import { useMorseInput } from './hooks/useMorseInput'
import { useTheme } from './hooks/useTheme'
import { sequenceToCode } from './morse/morseDecoder'
import './App.css'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { sequence, text, error, addDot, addDash, confirm, deleteLast, reset } = useMorseInput()

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">Morse Code Board</h1>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <MorseDisplay
        sequence={sequence}
        text={text}
        notice={error}
        onReset={reset}
      />

      <MorseBoard activeCode={sequenceToCode(sequence)} error={error !== null} />

      <MorseControls onDot={addDot} onDash={addDash} onDelete={deleteLast} onConfirm={confirm} />
    </main>
  )
}

export default App
