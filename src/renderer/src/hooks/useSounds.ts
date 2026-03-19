/**
 * Centralized Web Audio API sound engine.
 * Zero external files — all synthesized in-browser.
 */

type SoundId = 'task-done' | 'break-start' | 'break-end' | 'alert' | 'task-start' | 'error' | 'celebration'

function ctx(): AudioContext | null {
  try { return new AudioContext() } catch { return null }
}

function osc(ac: AudioContext, type: OscillatorType, freq: number, start: number, end: number, vol = 0.25) {
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.connect(g); g.connect(ac.destination)
  o.type = type
  o.frequency.setValueAtTime(freq, ac.currentTime + start)
  g.gain.setValueAtTime(vol, ac.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + end)
  o.start(ac.currentTime + start)
  o.stop(ac.currentTime + end + 0.01)
  o.onended = () => { try { ac.close() } catch {} }
}

const SOUNDS: Record<SoundId, () => void> = {
  'task-done': () => {
    // Ascending 3-note chime
    const ac = ctx(); if (!ac) return
    const notes = [523, 659, 784]
    notes.forEach((f, i) => osc(ac, 'sine', f, i * 0.12, i * 0.12 + 0.35, 0.22))
    setTimeout(() => { try { ac.close() } catch {} }, 800)
  },
  'celebration': () => {
    // 5-note happy arpeggio
    const ac = ctx(); if (!ac) return
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((f, i) => osc(ac, 'sine', f, i * 0.09, i * 0.09 + 0.3, 0.2))
    setTimeout(() => { try { ac.close() } catch {} }, 1000)
  },
  'break-start': () => {
    // Soft descending sigh
    const ac = ctx(); if (!ac) return
    osc(ac, 'sine', 440, 0,    0.3, 0.18)
    osc(ac, 'sine', 330, 0.15, 0.5, 0.14)
  },
  'break-end': () => {
    // Two-tone wake-up
    const ac = ctx(); if (!ac) return
    osc(ac, 'triangle', 660, 0,    0.2, 0.2)
    osc(ac, 'triangle', 880, 0.22, 0.45, 0.2)
  },
  'alert': () => {
    // Short ping
    const ac = ctx(); if (!ac) return
    osc(ac, 'sine', 1200, 0, 0.18, 0.2)
  },
  'task-start': () => {
    // Soft pop
    const ac = ctx(); if (!ac) return
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.connect(g); g.connect(ac.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(300, ac.currentTime)
    o.frequency.exponentialRampToValueAtTime(700, ac.currentTime + 0.06)
    g.gain.setValueAtTime(0.3, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15)
    o.start(ac.currentTime)
    o.stop(ac.currentTime + 0.2)
    o.onended = () => { try { ac.close() } catch {} }
  },
  'error': () => {
    // Low buzz
    const ac = ctx(); if (!ac) return
    osc(ac, 'square', 100, 0, 0.2, 0.1)
  }
}

export function playSound(id: SoundId) {
  try { SOUNDS[id]?.() } catch { /* silent fail in env without AudioContext */ }
}

export function useSounds() {
  return { playSound }
}
