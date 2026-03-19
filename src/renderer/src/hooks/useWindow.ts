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

  const setAlwaysOnTop = async (value: boolean) => {
    setAlwaysOnTopState(value)
    await window.electron?.window?.setAlwaysOnTop(value).catch(() => {})
  }

  const toggleAlwaysOnTop = async () => {
    await setAlwaysOnTop(!alwaysOnTop)
  }

  const setCompact = async (value: boolean) => {
    setCompactState(value)
    await window.electron?.window?.setCompact(value).catch(() => {})
  }

  const toggleCompact = async () => {
    await setCompact(!compact)
  }

  const minimize = () => window.electron?.window?.minimize()
  const close    = () => window.electron?.window?.close()

  return {
    alwaysOnTop,
    setAlwaysOnTop,
    toggleAlwaysOnTop,
    compact,
    setCompact,
    toggleCompact,
    minimize,
    close
  }
}
