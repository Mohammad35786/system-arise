import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const INITIAL_TIMER_STATE = {
  taskId: null,
  taskName: null,
  taskType: null,
  duration: 0,
  remaining: 0,
  status: 'idle',
  musicEnabled: false,
}

const TimerContext = createContext(null)

function createFocusMusic() {
  try {
    if (typeof window === 'undefined') return null
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null

    const audioCtx = new AudioCtx()
    const gainNode = audioCtx.createGain()
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
    gainNode.connect(audioCtx.destination)

    const leftOsc = audioCtx.createOscillator()
    const rightOsc = audioCtx.createOscillator()
    leftOsc.type = 'sine'
    rightOsc.type = 'sine'
    leftOsc.frequency.setValueAtTime(200, audioCtx.currentTime)
    rightOsc.frequency.setValueAtTime(205, audioCtx.currentTime)

    leftOsc.connect(gainNode)
    rightOsc.connect(gainNode)
    leftOsc.start()
    rightOsc.start()

    return { audioCtx, gainNode, leftOsc, rightOsc }
  } catch (err) {
    console.error('Focus music init failed:', err)
    return null
  }
}

export function TimerProvider({ children }) {
  const [activeTimerId, setActiveTimerId] = useState(null)
  const [timerState, setTimerState] = useState(INITIAL_TIMER_STATE)
  const intervalRef = useRef(null)
  const focusMusicRef = useRef(null)

  const clearTimerInterval = useCallback(() => {
    if (!intervalRef.current) return
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  const ensureFocusMusic = useCallback(() => {
    if (!focusMusicRef.current) {
      focusMusicRef.current = createFocusMusic()
    }
    return focusMusicRef.current
  }, [])

  const fadeInMusic = useCallback(() => {
    try {
      const focusMusic = ensureFocusMusic()
      if (!focusMusic) return

      const { audioCtx, gainNode } = focusMusic
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {})
      }

      gainNode.gain.cancelScheduledValues(audioCtx.currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 2)
    } catch (err) {
      console.error('fadeInMusic failed:', err)
    }
  }, [ensureFocusMusic])

  const fadeOutMusic = useCallback(() => {
    try {
      const focusMusic = focusMusicRef.current
      if (!focusMusic) return
      const { audioCtx, gainNode } = focusMusic

      gainNode.gain.cancelScheduledValues(audioCtx.currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5)
    } catch (err) {
      console.error('fadeOutMusic failed:', err)
    }
  }, [])

  const playCompletionSound = useCallback(() => {
    try {
      if (typeof window === 'undefined') return
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return

      const completionCtx = new AudioCtx()
      if (completionCtx.state === 'suspended') {
        completionCtx.resume().catch(() => {})
      }

      const frequencies = [523, 659, 784]
      const now = completionCtx.currentTime

      frequencies.forEach((freq, index) => {
        const startTime = now + (index * 0.18)
        const attackEnd = startTime + 0.05
        const releaseStart = attackEnd + 0.3
        const endTime = releaseStart + 0.15

        const osc = completionCtx.createOscillator()
        const gain = completionCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.22, attackEnd)
        gain.gain.setValueAtTime(0.22, releaseStart)
        gain.gain.linearRampToValueAtTime(0, endTime)

        osc.connect(gain)
        gain.connect(completionCtx.destination)

        osc.start(startTime)
        osc.stop(endTime + 0.01)
      })

      window.setTimeout(() => {
        completionCtx.close().catch(() => {})
      }, 1200)
    } catch (err) {
      console.error('playCompletionSound failed:', err)
    }
  }, [])

  const beginTicking = useCallback(() => {
    clearTimerInterval()
    intervalRef.current = setInterval(() => {
      let didComplete = false

      setTimerState(prev => {
        if (prev.status !== 'running') return prev
        if (prev.remaining <= 1) {
          didComplete = true
          return { ...prev, remaining: 0, status: 'completed' }
        }
        return { ...prev, remaining: prev.remaining - 1 }
      })

      if (didComplete) {
        clearTimerInterval()
        fadeOutMusic()
        playCompletionSound()
      }
    }, 1000)
  }, [clearTimerInterval, fadeOutMusic, playCompletionSound])

  const startTimer = useCallback((taskId, taskName, taskType, durationSeconds, musicEnabled) => {
    const duration = Number(durationSeconds) || 0
    if (duration <= 0) return

    clearTimerInterval()
    fadeOutMusic()

    const normalizedTaskId = String(taskId)
    const nextMusicEnabled = Boolean(musicEnabled)

    setActiveTimerId(normalizedTaskId)
    setTimerState({
      taskId: normalizedTaskId,
      taskName: taskName || null,
      taskType: taskType || null,
      duration,
      remaining: duration,
      status: 'running',
      musicEnabled: nextMusicEnabled,
    })

    if (nextMusicEnabled) {
      fadeInMusic()
    }

    beginTicking()
  }, [beginTicking, clearTimerInterval, fadeInMusic, fadeOutMusic])

  const pauseTimer = useCallback(() => {
    clearTimerInterval()
    setTimerState(prev => (prev.status === 'running' ? { ...prev, status: 'paused' } : prev))
    fadeOutMusic()
  }, [clearTimerInterval, fadeOutMusic])

  const resumeTimer = useCallback(() => {
    let shouldResume = false
    let shouldPlayMusic = false

    setTimerState(prev => {
      if (prev.status !== 'paused' || prev.remaining <= 0) return prev
      shouldResume = true
      shouldPlayMusic = prev.musicEnabled
      return { ...prev, status: 'running' }
    })

    if (!shouldResume) return
    beginTicking()
    if (shouldPlayMusic) {
      fadeInMusic()
    }
  }, [beginTicking, fadeInMusic])

  const resetTimer = useCallback(() => {
    clearTimerInterval()
    fadeOutMusic()
    setActiveTimerId(null)
    setTimerState(INITIAL_TIMER_STATE)
  }, [clearTimerInterval, fadeOutMusic])

  useEffect(() => {
    return () => {
      clearTimerInterval()
      const focusMusic = focusMusicRef.current
      if (!focusMusic) return

      try {
        focusMusic.leftOsc.stop()
      } catch (_) { }
      try {
        focusMusic.rightOsc.stop()
      } catch (_) { }
      try {
        focusMusic.audioCtx.close().catch(() => {})
      } catch (_) { }

      focusMusicRef.current = null
    }
  }, [clearTimerInterval])

  const value = useMemo(() => ({
    activeTimerId,
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  }), [activeTimerId, timerState, startTimer, pauseTimer, resumeTimer, resetTimer])

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return context
}
