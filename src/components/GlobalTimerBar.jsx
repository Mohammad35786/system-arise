import { useTimer } from '../context/TimerContext'

function formatMMSS(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const secs = (totalSeconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

export function GlobalTimerBar() {
  const { timerState, pauseTimer, resumeTimer, resetTimer } = useTimer()

  const isRunning = timerState.status === 'running'
  const isPaused = timerState.status === 'paused'
  const isVisible = isRunning || isPaused
  if (!isVisible) return null

  const tintClass = isRunning ? 'text-[#C9A84C]' : 'text-orange-400'
  const statusDotClass = isRunning ? 'bg-[#C9A84C]' : 'bg-orange-400'
  const shortName = (timerState.taskName || 'QUEST').slice(0, 20)

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-8 bg-[#080810] border-b border-[#C9A84C]/50">
      <div className={`h-full max-w-lg mx-auto px-3 flex items-center gap-2 font-mono text-xs ${tintClass}`}>
        <span className="truncate">{shortName}</span>
        <span className="ml-auto tabular-nums">{formatMMSS(timerState.remaining || 0)}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
        <button
          onClick={isRunning ? pauseTimer : resumeTimer}
          className="leading-none hover:opacity-80 transition-opacity"
          aria-label={isRunning ? 'Pause timer' : 'Resume timer'}
        >
          {isRunning ? '||' : '>'}
        </button>
        <button
          onClick={resetTimer}
          className="leading-none hover:text-red-400 transition-colors font-bold"
          aria-label="Reset timer"
        >
          X
        </button>
      </div>
    </div>
  )
}
