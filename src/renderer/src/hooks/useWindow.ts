import { useState, useEffect } from 'react'

/**
 * Hook to control Electron window features from the renderer.
 * Falls back gracefully in browser/dev mode.
 */
export function useWindowControls() {
  const [alwaysOnTop, setAlwaysOnTopState] = useState(false)
  const [compact,     setCompactState]     = useState(false)

  // Load persisted values on mount
  useEffect(() => {
    window.electron?.window?.getAlwaysOnTop().then(setAlwaysOnTopState).catch(() => {})
    window.electron?.window?.getCompact().then(setCompactState).catch(() => {})
  }, [])

  const toggleAlwaysOnTop = async () => {
    const next = !alwaysOnTop
    setAlwaysOnTopState(next)
    await window.electron?.window?.setAlwaysOnTop(next).catch(() => {})
  }

  const toggleCompact = async () => {
    const next = !compact
    setCompactState(next)
    await window.electron?.window?.setCompact(next).catch(() => {})
  }

  const minimize = () => window.electron?.window?.minimize()
  const close    = () => window.electron?.window?.close()

  return { alwaysOnTop, toggleAlwaysOnTop, compact, toggleCompact, minimize, close }
}
