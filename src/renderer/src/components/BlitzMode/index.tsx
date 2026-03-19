import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../../store'
import { usePomodoro } from '../../hooks/usePomodoro'
import { useTaskAlerts } from '../../hooks/useAlerts'
import { playSound } from '../../hooks/useSounds'
import ControlBar from './ControlBar'
import NotesPanel from './NotesPanel'
import CelebrationScreen from '../TodayPanel/CelebrationScreen'
import ActiveTaskCard from '../TodayPanel/ActiveTaskCard'
import type { Task } from '../../types'

type BlitzPhase = 'working' | 'celebrating' | 'break'

interface Props {
  /** The first task to start with */
  initialTaskId: string
  showTaskCard?: boolean
  onExpand?: () => void
  onExit: () => void
}

/**
 * Full Blitz mode session controller.
 * Manages the working → celebration → break → working loop.
 * Handles pomodoro, notes, auto-open links, sounds.
 */
export default function BlitzMode({ initialTaskId, showTaskCard = false, onExpand, onExit }: Props) {
  const {
    tasks, settings,
    startTimer, pauseTimer, stopTimer,
    completeTask, activeTaskId
  } = useStore()

  const [phase, setPhase]                   = useState<BlitzPhase>('working')
  const [showNotes, setShowNotes]           = useState(false)
  const [justDoneTask, setJustDoneTask]     = useState<Task | null>(null)
  const [currentTaskId, setCurrentTaskId]   = useState(initialTaskId)

  const currentTask = tasks.find((t) => t.id === currentTaskId) ?? null
  const isRunning   = activeTaskId === currentTaskId

  // ── Pomodoro ──────────────────────────────
  const {
    pomodoro, pomodoroEnabled,
    start: pomStart, pause: pomPause,
    skipToBreak, skipBreak
  } = usePomodoro({
    onWorkEnd:  () => handleBreak(),
    onBreakEnd: () => {
      setPhase('working')
      if (currentTaskId) startTimer(currentTaskId)
    }
  })

  // ── Alerts ────────────────────────────────
  useTaskAlerts(isRunning ? currentTask : null)

  // ── Start on mount ────────────────────────
  useEffect(() => {
    startTimer(initialTaskId)
    playSound('task-start')
    if (pomodoroEnabled) pomStart()
    autoOpenLinks(tasks.find((t) => t.id === initialTaskId))
  }, [])

  // ── Auto-open links ───────────────────────
  const autoOpenLinks = (task?: Task | null) => {
    if (!task?.note?.links?.length) return
    task.note.links.forEach((url) => {
      window.electron?.openExternal(url)
    })
  }

  // ── Handlers ──────────────────────────────
  const handleTogglePause = useCallback(() => {
    if (isRunning) {
      pauseTimer(currentTaskId)
      if (pomodoroEnabled) pomPause()
    } else {
      startTimer(currentTaskId)
      if (pomodoroEnabled) pomStart()
    }
  }, [isRunning, currentTaskId, pomodoroEnabled])

  const handleDone = useCallback(() => {
    if (!currentTask) return
    const snapshot = { ...currentTask }

    // Play sound
    playSound('celebration')

    // Complete in store
    completeTask(currentTaskId)
    if (pomodoroEnabled) skipToBreak()

    if (settings.celebration.showSuccessScreen) {
      setJustDoneTask(snapshot)
      setPhase('celebrating')
    } else {
      // Skip celebration, go straight to next
      goToNextTask()
    }
  }, [currentTask, currentTaskId, settings])

  const handleBreak = useCallback(() => {
    if (currentTaskId) pauseTimer(currentTaskId)
    playSound('break-start')
    setPhase('break')
  }, [currentTaskId])

  const handleSkipTask = useCallback(() => {
    // Move current task back to today (didn't complete)
    pauseTimer(currentTaskId)
    goToNextTask()
  }, [currentTaskId])

  const goToNextTask = useCallback(() => {
    // Find next 'today' task that isn't done
    const nextTask = tasks.find(
      (t) => t.status === 'today' && t.id !== currentTaskId
    )

    if (nextTask) {
      setCurrentTaskId(nextTask.id)
      setPhase('working')
      setShowNotes(false)
      startTimer(nextTask.id)
      autoOpenLinks(nextTask)
      if (pomodoroEnabled) pomStart()
    } else {
      // All done!
      onExit()
    }
  }, [tasks, currentTaskId, pomodoroEnabled])

  const handleEndBreak = useCallback(() => {
    playSound('break-end')
    setPhase('working')
    if (currentTaskId) startTimer(currentTaskId)
    if (pomodoroEnabled) skipBreak()
  }, [currentTaskId, pomodoroEnabled])

  // ── Render ────────────────────────────────
  if (!currentTask && phase === 'working') {
    return <AllDoneState onExit={onExit} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Control bar — always visible during working */}
      {phase === 'working' && currentTask && (
        <>
          <ControlBar
            isRunning={isRunning}
            showNotes={showNotes}
            pomodoroEnabled={pomodoroEnabled}
            pomodoro={pomodoro}
            estimatedMinutes={currentTask.estimatedMinutes}
            onBreak={handleBreak}
            onToggleNotes={() => setShowNotes((v) => !v)}
            onPause={handleTogglePause}
            onSkip={handleSkipTask}
            onDone={handleDone}
            onExpand={onExpand ?? onExit}
          />

          {showTaskCard && (
            <ActiveTaskCard
              task={currentTask}
              onPause={handleTogglePause}
              onDone={handleDone}
            />
          )}

          {/* Notes panel — slides in below control bar */}
          {showNotes && (
            <NotesPanel
              task={currentTask}
              onClose={() => setShowNotes(false)}
            />
          )}
        </>
      )}

      {/* Celebration screen */}
      {phase === 'celebrating' && justDoneTask && (
        <CelebrationScreen
          task={justDoneTask}
          onNextTask={goToNextTask}
          onBreak={handleBreak}
        />
      )}

      {/* Break screen */}
      {phase === 'break' && (
        <BreakScreen
          pomodoro={pomodoro}
          pomodoroEnabled={pomodoroEnabled}
          onDone={handleEndBreak}
        />
      )}
    </div>
  )
}

// ── Break screen ──────────────────────────────
function BreakScreen({
  pomodoro,
  pomodoroEnabled,
  onDone
}: {
  pomodoro: ReturnType<typeof usePomodoro>['pomodoro']
  pomodoroEnabled: boolean
  onDone: () => void
}) {
  const mins = Math.floor(pomodoro.secondsLeft / 60)
  const secs = pomodoro.secondsLeft % 60

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        gap: 14,
        animation: 'fadeIn 200ms ease both'
      }}
    >
      <span style={{ fontSize: 36 }}>🎮</span>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
        Break time
      </div>

      {pomodoroEnabled && pomodoro.phase === 'break' && (
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--accent-purple)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.05em'
          }}
        >
          {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
        </div>
      )}

      <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
        Step away, stretch, breathe.<br/>You earned it.
      </div>

      <button
        onClick={onDone}
        style={{
          marginTop: 8,
          padding: '10px 28px',
          borderRadius: 999,
          background: 'linear-gradient(135deg, #4ade80, #facc15)',
          color: '#111',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          border: 'none',
          transition: 'opacity 150ms'
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.9')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
      >
        ▶| Back to work
      </button>
    </div>
  )
}

// ── All tasks done ────────────────────────────
function AllDoneState({ onExit }: { onExit: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px',
        gap: 12,
        animation: 'fadeIn 300ms ease both'
      }}
    >
      <span style={{ fontSize: 40 }}>🏆</span>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
        All done!
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
        You've blitzed through everything for today.
      </div>
      <button
        onClick={onExit}
        style={{
          marginTop: 8,
          padding: '9px 24px',
          borderRadius: 999,
          background: 'var(--accent-teal-bg)',
          color: 'var(--accent-teal)',
          fontSize: 13,
          fontWeight: 600,
          border: '1px solid var(--accent-teal)',
          cursor: 'pointer'
        }}
      >
        Back to list
      </button>
    </div>
  )
}
