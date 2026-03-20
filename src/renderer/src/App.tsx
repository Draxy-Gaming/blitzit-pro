import { useEffect, useState } from 'react'
import { useStore } from './store'
import HomeView      from './components/HomeView'
import TodayPanel    from './components/TodayPanel'
import BoardView     from './components/BoardView'
import GlobalSearch  from './components/Search'
import SettingsPanel  from './components/Settings'
import AlertsPopup   from './components/Scheduling/AlertsPopup'
import ReportsView   from './components/Reports'
import Onboarding    from './components/Onboarding'
import { useKeyboard } from './hooks/useKeyboard'
import { useActiveTask, useTraySync } from './hooks/useTimer'

export default function App() {
  const { settings, view, searchOpen, settingsOpen, blitz } = useStore()
  const [onboarded, setOnboarded] = useState(() => {
    try { return localStorage.getItem('blitzit-onboarded') === '1' } catch { return false }
  })
  const activeTask = useActiveTask()

  useKeyboard()
  useTraySync(activeTask)

  useEffect(() => {
    const root   = document.documentElement
    const apply  = (dark: boolean) => root.classList.toggle('light', !dark)
    if (settings.theme === 'light')       { apply(false); return }
    if (settings.theme === 'dark')        { apply(true);  return }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(mq.matches)
    const h = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [settings.theme])

  useEffect(() => {
    const compact = onboarded && view === 'today'

    window.electron?.window?.setCompact(compact).catch(() => {})
    window.electron?.window?.setAlwaysOnTop(compact).catch(() => {})
    window.electron?.window?.setMiniWidget(compact && blitz.active).catch(() => {})
    window.dispatchEvent(new Event('blitzit:window-sync'))
  }, [onboarded, view, blitz.active])

  const finishOnboarding = () => {
    try { localStorage.setItem('blitzit-onboarded', '1') } catch {}
    setOnboarded(true)
    useStore.getState().setView('today')
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {!onboarded ? (
        <Onboarding onDone={finishOnboarding} />
      ) : view === 'board' ? <BoardView />
        : view === 'home' ? <HomeView />
        : view === 'reports' ? <ReportsView />
        : <TodayPanel />}

      {/* Global overlays */}
      {searchOpen   && <GlobalSearch />}
      {settingsOpen && <SettingsPanel />}
      <AlertsPopup />
    </div>
  )
}
