import { useEffect } from 'react'
import { useStore } from '../store'

/**
 * Global keyboard shortcuts:
 * ⌘F / Ctrl+F  — open search
 * ⌘N / Ctrl+N  — new task (focuses add task input)
 * Space         — pause/resume active timer (when not in input)
 * Escape        — close modals / go back
 * ⌘1            — go to Today panel
 * ⌘2            — go to Board
 * ⌘3            — go to Reports
 */
export function useKeyboard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const inInput = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable

      if (inInput && e.key !== 'Escape') return

      const meta = e.metaKey || e.ctrlKey

      // ⌘F — search
      if (meta && e.key === 'f') {
        e.preventDefault()
        useStore.getState().setSearchOpen(true)
        return
      }

      // ⌘N — new task (just open search with add task intent)
      if (meta && e.key === 'n') {
        e.preventDefault()
        useStore.getState().setSearchOpen(true)
        return
      }

      // ⌘, — settings
      if (meta && e.key === ',') {
        e.preventDefault()
        useStore.getState().setSettingsOpen(true)
        return
      }

      // ⌘1/2/3 — view switching
      if (meta && e.key === '1') { e.preventDefault(); useStore.getState().setView('today');   return }
      if (meta && e.key === '2') { e.preventDefault(); useStore.getState().setView('board');   return }
      if (meta && e.key === '3') { e.preventDefault(); useStore.getState().setView('reports'); return }

      // Space — pause/resume timer (only outside inputs)
      if (e.key === ' ' && !inInput) {
        e.preventDefault()
        const state = useStore.getState()
        const { activeTaskId, pauseTimer, tasks } = state
        if (activeTaskId) {
          const task = tasks.find((t) => t.id === activeTaskId)
          if (task?.timerStartedAt) {
            pauseTimer(activeTaskId)
          } else if (task) {
            state.startTimer(activeTaskId)
          }
        }
        return
      }

      // Escape — close modals in order
      if (e.key === 'Escape') {
        const state = useStore.getState()
        if (state.searchOpen)   { state.setSearchOpen(false);   return }
        if (state.settingsOpen) { state.setSettingsOpen(false); return }
        // Go back from board/reports to today
        if (state.view === 'board' || state.view === 'reports') {
          state.setView('today')
          return
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
