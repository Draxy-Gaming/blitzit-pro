import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import type { Task } from '../types'

/**
 * Fires a timed alert notification every X minutes while a task is running.
 * Uses the Web Notifications API + optional sound.
 */
export function useTaskAlerts(activeTask: Task | null) {
  const { settings } = useStore()
  const { timedAlertsEnabled, alertIntervalMinutes, alertSound } = settings.alerts
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef    = useRef<HTMLAudioElement | null>(null)

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!timedAlertsEnabled || !activeTask?.timerStartedAt) return

    const ms = alertIntervalMinutes * 60 * 1000

    intervalRef.current = setInterval(() => {
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Blitzit — time check', {
          body: `Still working on: ${activeTask.title}`,
          silent: true
        })
      }

      // Sound
      playAlertSound(alertSound)
    }, ms)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeTask?.timerStartedAt, activeTask?.title, timedAlertsEnabled, alertIntervalMinutes, alertSound])

  return null
}

/**
 * Play a short alert sound using the Web Audio API (no file needed)
 */
export function playAlertSound(type: 'ding' | 'ping' | 'bell' | 'none') {
  if (type === 'none') return

  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    const configs = {
      ding: { freq: 880, type: 'sine'     as OscillatorType, duration: 0.4, decay: 0.3 },
      ping: { freq: 1200, type: 'sine'    as OscillatorType, duration: 0.2, decay: 0.15 },
      bell: { freq: 660,  type: 'triangle'as OscillatorType, duration: 0.6, decay: 0.5 },
    }

    const config = configs[type] ?? configs.ding
    osc.type = config.type
    osc.frequency.setValueAtTime(config.freq, ctx.currentTime)

    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.decay)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + config.duration)

    osc.onended = () => ctx.close()
  } catch {
    // AudioContext not available — silent fail
  }
}

/**
 * Play task-done sound
 */
export function playSuccessSound(type: 'ding' | 'chime' | 'pop' | 'none') {
  if (type === 'none') return

  try {
    const ctx = new AudioContext()

    if (type === 'chime') {
      // Play a short ascending arpeggio
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3)
        osc.start(ctx.currentTime + i * 0.1)
        osc.stop(ctx.currentTime + i * 0.1 + 0.35)
      })
      setTimeout(() => ctx.close(), 800)
      return
    }

    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'pop') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } else {
      // ding
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1047, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.6)
    }

    osc.onended = () => ctx.close()
  } catch { /* silent fail */ }
}
