import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import type { Task } from '../types'

/**
 * Returns the current live elapsed seconds for a task.
 * Ticks every second if the task is actively running.
 */
export function useTaskTimer(task: Task): number {
  const [, forceUpdate] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastSecRef = useRef<number>(-1)

  useEffect(() => {
    if (!task.timerStartedAt) {
      // Not running — just return stored value, no loop needed
      rafRef.current && cancelAnimationFrame(rafRef.current)
      return
    }

    const tick = () => {
      const nowSec = Math.floor((Date.now() - task.timerStartedAt!) / 1000)
      if (nowSec !== lastSecRef.current) {
        lastSecRef.current = nowSec
        forceUpdate((n) => n + 1)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      rafRef.current && cancelAnimationFrame(rafRef.current)
    }
  }, [task.timerStartedAt])

  if (!task.timerStartedAt) return task.trackedSeconds

  const liveElapsed = Math.floor((Date.now() - task.timerStartedAt) / 1000)
  return task.trackedSeconds + liveElapsed
}

/**
 * Format total seconds → "HH:MM:SS"
 */
export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].join(':')
}

/**
 * Format minutes → "Xhr Xmin"
 */
export function formatMinutes(minutes: number | null): string {
  if (!minutes || minutes <= 0) return '0min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}hr ${m}min`
  if (h > 0) return `${h}hr`
  return `${m}min`
}

/**
 * Is this task over its estimate?
 */
export function isOvertime(task: Task, liveSeconds: number): boolean {
  if (!task.estimatedMinutes) return false
  return liveSeconds > task.estimatedMinutes * 60
}

/**
 * Hook that gives the active task from the store
 */
export function useActiveTask(): Task | null {
  return useStore((s) => {
    if (!s.activeTaskId) return null
    return s.tasks.find((t) => t.id === s.activeTaskId) ?? null
  })
}


/**
 * Syncs the active timer state to the system tray icon via IPC.
 * Call once at the app level with the active task.
 */
export function useTraySync(activeTask: import('../types').Task | null) {
  const liveSeconds = useTaskTimer(activeTask ?? {
    id: '', title: '', status: 'today', listId: '',
    estimatedMinutes: null, trackedSeconds: 0, timerStartedAt: null,
    subtasks: [], note: null, integrations: [],
    scheduledAt: null, scheduledDuration: null, recurrence: null,
    createdAt: 0, updatedAt: 0, completedAt: null, sortOrder: 0
  } as import('../types').Task)

  useEffect(() => {
    if (!window.electron?.tray) return
    try {
      if (activeTask?.timerStartedAt) {
        window.electron.tray.update(activeTask.title, formatTime(liveSeconds))
      } else {
        window.electron.tray.update(undefined, undefined)
      }
    } catch {}
  }, [activeTask?.id, activeTask?.timerStartedAt, liveSeconds])
}
