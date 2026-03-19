import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'

export type PomodoroPhase = 'work' | 'break' | 'idle'

export interface PomodoroState {
  phase: PomodoroPhase
  secondsLeft: number
  totalSeconds: number
  sprint: number          // which sprint number we're on
  progress: number        // 0–1
  isRunning: boolean
}

interface UsePomodoroOptions {
  onWorkEnd?: () => void
  onBreakEnd?: () => void
}

export function usePomodoro({ onWorkEnd, onBreakEnd }: UsePomodoroOptions = {}) {
  const { settings } = useStore()
  const { pomodoroEnabled, workSprintMinutes, breakMinutes } = settings.blitzMode

  const workSecs  = workSprintMinutes * 60
  const breakSecs = breakMinutes * 60

  const [state, setState] = useState<PomodoroState>({
    phase: 'idle',
    secondsLeft: workSecs,
    totalSeconds: workSecs,
    sprint: 1,
    progress: 0,
    isRunning: false
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onWorkEndRef  = useRef(onWorkEnd)
  const onBreakEndRef = useRef(onBreakEnd)
  onWorkEndRef.current  = onWorkEnd
  onBreakEndRef.current = onBreakEnd

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const tick = useCallback(() => {
    setState((prev) => {
      if (!prev.isRunning) return prev

      const next = prev.secondsLeft - 1

      if (next <= 0) {
        // Phase ended
        if (prev.phase === 'work') {
          onWorkEndRef.current?.()
          // Switch to break
          return {
            phase: 'break',
            secondsLeft: breakSecs,
            totalSeconds: breakSecs,
            sprint: prev.sprint,
            progress: 0,
            isRunning: true
          }
        } else {
          // Break ended
          onBreakEndRef.current?.()
          return {
            phase: 'work',
            secondsLeft: workSecs,
            totalSeconds: workSecs,
            sprint: prev.sprint + 1,
            progress: 0,
            isRunning: false   // pause between sprints, user clicks to start next
          }
        }
      }

      const total = prev.phase === 'work' ? workSecs : breakSecs
      return {
        ...prev,
        secondsLeft: next,
        progress: 1 - next / total
      }
    })
  }, [workSecs, breakSecs])

  // Start/restart timer when isRunning flips to true
  useEffect(() => {
    if (state.isRunning) {
      clear()
      intervalRef.current = setInterval(tick, 1000)
    } else {
      clear()
    }
    return clear
  }, [state.isRunning, tick])

  const start = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: prev.phase === 'idle' ? 'work' : prev.phase,
      secondsLeft: prev.phase === 'idle' ? workSecs : prev.secondsLeft,
      totalSeconds: prev.phase === 'idle' ? workSecs : prev.totalSeconds,
      isRunning: true
    }))
  }, [workSecs])

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }))
  }, [])

  const skipToBreak = useCallback(() => {
    clear()
    setState({
      phase: 'break',
      secondsLeft: breakSecs,
      totalSeconds: breakSecs,
      sprint: state.sprint,
      progress: 0,
      isRunning: true
    })
  }, [breakSecs, state.sprint])

  const skipBreak = useCallback(() => {
    clear()
    setState({
      phase: 'work',
      secondsLeft: workSecs,
      totalSeconds: workSecs,
      sprint: state.sprint + 1,
      progress: 0,
      isRunning: false
    })
  }, [workSecs, state.sprint])

  const reset = useCallback(() => {
    clear()
    setState({
      phase: 'idle',
      secondsLeft: workSecs,
      totalSeconds: workSecs,
      sprint: 1,
      progress: 0,
      isRunning: false
    })
  }, [workSecs])

  return {
    pomodoro: state,
    pomodoroEnabled,
    start,
    pause,
    skipToBreak,
    skipBreak,
    reset
  }
}
