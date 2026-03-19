import { useState, useEffect } from 'react'

/**
 * Hook to control Electron window features from the renderer.
 * Falls back gracefully in browser/dev mode.
 */
export function useWindowControls() {
  const [alwaysOnTop, setAlwaysOnTopState] = useState(false)
  const [compact,     setCompactState]     = useState(false)

  const refreshState = () => {
    window.electron?.window?.getAlwaysOnTop().then(setAlwaysOnTopState).catch(() => {})
    window.electron?.window?.getCompact().then(setCompactState).catch(() => {})
  }

  // Load persisted values on mount
  useEffect(() => {
    refreshState()

    const handleSync = () => refreshState()
    window.addEventListener('blitzit:window-sync', handleSync)
    return () => window.removeEventListener('blitzit:window-sync', handleSync)
  }, [])

  const toggleAlwaysOnTop = async () => {
    const next = !alwaysOnTop
    setAlwaysOnTopState(next)
    await window.electron?.window?.setAlwaysOnTop(next).catch(() => {})
  }

  const setAlwaysOnTop = async (value: boolean) => {
    setAlwaysOnTopState(value)
    await window.electron?.window?.setAlwaysOnTop(value).catch(() => {})
  }

  const toggleCompact = async () => {
    const next = !compact
    setCompactState(next)
    await window.electron?.window?.setCompact(next).catch(() => {})
  }

  const setCompact = async (value: boolean) => {
    setCompactState(value)
    await window.electron?.window?.setCompact(value).catch(() => {})
  }

  const minimize = () => window.electron?.window?.minimize()
  const close    = () => window.electron?.window?.close()

  return {
    alwaysOnTop,
    toggleAlwaysOnTop,
    setAlwaysOnTop,
    compact,
    toggleCompact,
    setCompact,
    refreshState,
    minimize,
    close
  }
}
