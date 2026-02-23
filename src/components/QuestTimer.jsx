import { useMemo, useState } from 'react'
import { useTimer } from '../context/TimerContext'

const PRESET_MINUTES = [1, 5, 10, 20, 25, 45, 60, 90]

function formatMMSS(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const secs = (totalSeconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

export function QuestTimer({
  taskId,
  taskName,
  taskType,
  onComplete,
  mode = 'full',
  hideInactive = false,
  buttonClassName = '',
}) {
  const {
    activeTimerId,
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = useTimer()

  const normalizedTaskId = String(taskId)
  const isActiveTask = activeTimerId === normalizedTaskId

  const [showPicker, setShowPicker] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [customMinutes, setCustomMinutes] = useState('')
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)

  const customValue = Number(customMinutes)
  const hasValidCustom = customMinutes !== '' && Number.isFinite(customValue) && customValue >= 1 && customValue <= 480
  const selectedMinutes = selectedPreset || (hasValidCustom ? customValue : null)

  const remaining = timerState.remaining || 0
  const duration = timerState.duration || 0
  const status = timerState.status
  const percentRemaining = duration > 0 ? remaining / duration : 0

  const toneClass = percentRemaining > 0.6
    ? 'text-[#C9A84C]'
    : percentRemaining >= 0.3
      ? 'text-orange-400'
      : 'text-red-400'

  const barClass = percentRemaining > 0.6
    ? 'bg-[#C9A84C]'
    : percentRemaining >= 0.3
      ? 'bg-orange-400'
      : 'bg-red-400'

  const shouldPulseUrgent = percentRemaining < 0.3
  const progressWidth = `${Math.max(0, Math.min(100, percentRemaining * 100))}%`

  const questName = useMemo(() => {
    return (timerState.taskName || taskName || 'QUEST').trim()
  }, [taskName, timerState.taskName])

  async function handleMarkComplete() {
    if (markingComplete) return
    setMarkingComplete(true)
    try {
      if (typeof onComplete === 'function') {
        await Promise.resolve(onComplete())
      }
    } finally {
      resetTimer()
      setMarkingComplete(false)
    }
  }

  function handleStartHunt() {
    if (!selectedMinutes) return
    startTimer(normalizedTaskId, taskName, taskType, selectedMinutes * 60, musicEnabled)
    setShowPicker(false)
  }

  if (!isActiveTask) {
    if (hideInactive) return null
    return (
      <>
        <button
          onClick={() => setShowPicker(true)}
          className={`border border-gray-700 rounded-md px-2 py-1 font-mono text-[10px] text-gray-500 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors ${buttonClassName}`.trim()}
        >
          ⏱ HUNT
        </button>

        {showPicker && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowPicker(false)}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0D1117] border border-[#C9A84C] rounded-xl p-5 w-80 max-w-[90vw] z-50">
              <button
                onClick={() => setShowPicker(false)}
                className="absolute top-3 right-3 text-gray-500 text-sm hover:text-[#C9A84C]"
                aria-label="Close duration picker"
              >
                ✕
              </button>

              <p className="text-[#C9A84C] font-mono text-sm font-bold mb-1">
                HOW LONG WILL YOU HUNT?
              </p>
              <p className="text-gray-500 font-mono text-xs truncate mb-4">
                {taskName}
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {PRESET_MINUTES.map((minutes) => {
                  const isSelected = selectedPreset === minutes
                  return (
                    <button
                      key={minutes}
                      onClick={() => {
                        setSelectedPreset(minutes)
                        setCustomMinutes('')
                      }}
                      className={`border rounded py-2 font-mono text-xs font-bold transition-colors ${isSelected
                        ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                        : 'border-gray-700 text-gray-500 hover:border-gray-500'
                        }`}
                    >
                      {minutes} MIN
                    </button>
                  )
                })}
              </div>

              <div className="mb-4">
                <p className="text-gray-500 font-mono text-xs mb-2">CUSTOM</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={customMinutes}
                    onChange={(e) => {
                      const next = e.target.value
                      setCustomMinutes(next)
                      setSelectedPreset(null)
                    }}
                    className="bg-[#080810] border border-gray-700 rounded px-2 py-1 w-16 text-center font-mono text-xs text-[#E8E8E8] focus:border-[#C9A84C] focus:outline-none"
                  />
                  <span className="text-gray-500 font-mono text-xs">MIN</span>
                </div>
              </div>

              <div className="flex items-center justify-between border border-gray-800 rounded-lg px-3 py-2 mb-4">
                <div>
                  <p className="text-gray-400 font-mono text-xs">FOCUS MUSIC</p>
                  <p className="text-gray-700 font-mono text-[10px]">Ambient binaural tone</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMusicEnabled(v => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${musicEnabled ? 'bg-[#C9A84C]' : 'bg-gray-700'
                    }`}
                  aria-pressed={musicEnabled}
                  aria-label="Toggle focus music"
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#080810] transition-transform ${musicEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                  />
                </button>
              </div>

              <button
                onClick={handleStartHunt}
                disabled={!selectedMinutes}
                className={`w-full font-bold font-mono py-3 rounded text-sm transition-colors ${selectedMinutes
                  ? 'bg-[#C9A84C] text-black'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
              >
                START HUNT — {selectedMinutes || 0} MIN
              </button>
            </div>
          </>
        )}
      </>
    )
  }

  if (mode === 'button') return null

  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isCompleted = status === 'completed'

  return (
    <div
      className={`border-2 rounded-lg p-4 bg-[#0D1117] mt-1 transition-all duration-300 ${isRunning
        ? 'border-[#C9A84C] shadow-[0_0_24px_#C9A84C44] animate-[questGlowPulse_2s_ease-in-out_infinite]'
        : isPaused
          ? 'border-orange-400 shadow-[0_0_22px_rgba(251,146,60,0.35)]'
          : 'border-green-500/60'
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[#C9A84C] text-[10px] font-mono">⚔ DUNGEON INSTANCE</p>
        <button
          onClick={resetTimer}
          className="text-gray-500 text-xs hover:text-red-400 transition-colors"
          aria-label="Reset timer"
        >
          ✕
        </button>
      </div>

      <p className="text-xs font-mono text-gray-400 truncate mb-2">
        {questName}
      </p>

      {isCompleted ? (
        <div className="relative text-center py-3">
          <div className="absolute left-1/2 -translate-x-1/2 top-2 text-[#C9A84C] text-2xl font-bold font-mono animate-[questXpFloat_2s_ease-out_forwards] pointer-events-none">
            +XP
          </div>
          <p className="text-green-400 text-2xl font-bold font-mono animate-pulse mb-4">
            ✓ QUEST SUCCESS
          </p>
          <button
            onClick={handleMarkComplete}
            disabled={markingComplete}
            className="w-full bg-green-500/20 border border-green-500 text-green-400 font-mono font-bold py-3 rounded text-sm disabled:opacity-70"
          >
            ✓ MARK QUEST COMPLETE
          </button>
        </div>
      ) : (
        <>
          <p className={`text-6xl font-mono font-bold text-center tracking-wider ${toneClass} ${shouldPulseUrgent ? 'animate-pulse' : ''}`}>
            {formatMMSS(remaining)}
          </p>

          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${barClass}`}
              style={{ width: progressWidth }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 mt-3 mb-3">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#C9A84C] animate-pulse' : isPaused ? 'bg-orange-400' : 'bg-green-400'}`} />
            <p className={`font-mono text-[10px] ${isRunning ? 'text-[#C9A84C]' : isPaused ? 'text-orange-400' : 'text-green-400'}`}>
              {isRunning ? 'HUNTING...' : isPaused ? 'PAUSED — RESUME TO CONTINUE' : 'QUEST COMPLETE'}
            </p>
          </div>

          <div className="flex gap-2">
            {isRunning ? (
              <button
                onClick={pauseTimer}
                className="flex-1 py-2 rounded font-mono text-xs font-bold transition-all duration-200 border border-gray-600 text-gray-400 hover:border-orange-400 hover:text-orange-400"
              >
                ⏸ PAUSE
              </button>
            ) : (
              <button
                onClick={resumeTimer}
                className="flex-1 py-2 rounded font-mono text-xs font-bold transition-all duration-200 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-black"
              >
                ▶ RESUME
              </button>
            )}

            <button
              onClick={resetTimer}
              className="flex-1 py-2 rounded font-mono text-xs font-bold transition-all duration-200 border border-gray-800 text-gray-600 hover:border-red-500/50 hover:text-red-400"
            >
              ↺ RESET
            </button>
          </div>
        </>
      )}
    </div>
  )
}
