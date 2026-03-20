import { useState, useMemo, useEffect } from 'react'
import { useStore, selectActiveLists } from '../../store'
import { formatMinutes } from '../../hooks/useTimer'
import ActiveTaskCard from './ActiveTaskCard'
import TaskCard from './TaskCard'
import AddTaskInput from './AddTaskInput'
import CelebrationScreen from './CelebrationScreen'
import ScheduledTasksSection from './ScheduledTasksSection'
import BlitzMode from '../BlitzMode'
import BlitzNowButton from '../BlitzMode/BlitzNowButton'
import MiniBlitzWidget from './MiniBlitzWidget'
import { useWindowControls } from '../../hooks/useWindow'
import type { Task } from '../../types'

type PanelMode = 'list' | 'celebrating' | 'break' | 'blitz'

export default function TodayPanel() {
  const {
    tasks,
    settings,
    activeTaskId,
    startTimer,
    pauseTimer,
    completeTask,
    setView,
    setSettingsOpen,
    openList,
    blitz,
    startBlitz,
    stopBlitz
  } = useStore()

  const allLists = useStore(selectActiveLists)
  const { alwaysOnTop, toggleAlwaysOnTop, compact, miniWidget, setMiniWidget } = useWindowControls()

  const [panelMode, setPanelMode] = useState<PanelMode>('list')
  const [justCompletedTask, setJustCompletedTask] = useState<Task | null>(null)
  const [selectedListId, setSelectedListId] = useState<string | 'all'>('all')
  const [showListDropdown, setShowListDropdown] = useState(false)

  // Determine which list is "current"
  const currentList = allLists.find((l) => l.id === selectedListId)

  // Filter today's tasks
  const todayTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.status !== 'today') return false
        if (selectedListId !== 'all' && t.listId !== selectedListId) return false
        return true
      })
      .sort((a, b) => {
        // Active task always first
        if (a.id === activeTaskId) return -1
        if (b.id === activeTaskId) return 1
        return a.sortOrder - b.sortOrder
      })
  }, [tasks, selectedListId, activeTaskId])

  const doneTasks = useMemo(() =>
    tasks.filter((t) => {
      if (t.status !== 'done') return false
      if (selectedListId !== 'all' && t.listId !== selectedListId) return false
      // Only show today's completions
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return t.completedAt && t.completedAt >= today.getTime()
    }),
    [tasks, selectedListId]
  )

  // Progress stats
  const totalEst = todayTasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? settings.defaultTaskLengthMinutes), 0)
  const totalTasks = todayTasks.length + doneTasks.length
  const doneCount = doneTasks.length
  const progress = totalTasks > 0 ? doneCount / totalTasks : 0

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null

  useEffect(() => {
    if (blitz.active && blitz.taskId) {
      setPanelMode('blitz')
    } else if (panelMode === 'blitz') {
      setPanelMode('list')
    }
  }, [blitz.active, blitz.taskId])

  // ── Handlers ──────────────────────────────

  const handleStartTask = (taskId: string) => {
    startTimer(taskId)
    setPanelMode('list')
  }

  const handlePauseActive = () => {
    if (activeTaskId) pauseTimer(activeTaskId)
  }

  const handleDoneActive = () => {
    if (!activeTaskId || !activeTask) return
    const snapshot = { ...activeTask }
    completeTask(activeTaskId)
    if (settings.celebration.showSuccessScreen) {
      setJustCompletedTask(snapshot)
      setPanelMode('celebrating')
    }
  }

  const handleNextTask = () => {
    setPanelMode('list')
    setJustCompletedTask(null)
    // Auto-start the next pending task if any
    const next = todayTasks.find((t) => t.id !== activeTaskId && t.status === 'today')
    if (next) startTimer(next.id)
  }

  const handleBreak = () => {
    setPanelMode('break')
  }

  const exitBlitz = () => {
    setPanelMode('list')
    stopBlitz()
  }

  const expandBlitz = () => {
    const currentTaskId = blitz.taskId ?? activeTask?.id
    if (currentTaskId) startBlitz(currentTaskId)
    setMiniWidget(false)
    if (selectedListId !== 'all') openList(selectedListId)
    else setView('board')
  }

  const isBlitzing = panelMode === 'blitz' && blitz.active && blitz.taskId

  if (compact && miniWidget && isBlitzing && activeTask) {
    return (
      <MiniBlitzWidget
        task={activeTask}
        onExpand={() => {
          setMiniWidget(false)
          setView('board')
        }}
      />
    )
  }

  // ── Render ─────────────────────────────────

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: compact ? 0 : 'var(--radius-xl)',
        border: '1px solid var(--border)',
        animation: compact ? 'widgetSlideIn 220ms ease-out' : undefined
      }}
    >
      {/* ── Header ── */}
      <div
        className="titlebar-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 14px 10px',
          gap: 8,
          flexShrink: 0
        }}
      >
        {/* List badge + dropdown */}
        <div
          className="titlebar-no-drag"
          style={{ position: 'relative' }}
        >
          <button
            onClick={() => setShowListDropdown((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 8px',
              borderRadius: 8,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              fontSize: 12,
              color: 'var(--text-secondary)'
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: currentList?.color ?? 'var(--accent-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0
              }}
            >
              {currentList?.iconChar ?? 'A'}
            </span>
            <span>{selectedListId === 'all' ? 'All' : currentList?.name ?? 'All'}</span>
            <span style={{ fontSize: 9 }}>▼</span>
          </button>

          {/* Dropdown */}
          {showListDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                zIndex: 100,
                minWidth: 140,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}
            >
              <DropdownItem
                active={selectedListId === 'all'}
                label="All"
                color="var(--accent-teal)"
                char="A"
                onClick={() => { setSelectedListId('all'); setShowListDropdown(false) }}
              />
              {allLists.map((list) => (
                <DropdownItem
                  key={list.id}
                  active={selectedListId === list.id}
                  label={list.name}
                  color={list.color}
                  char={list.iconChar}
                  onClick={() => { setSelectedListId(list.id); setShowListDropdown(false) }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            flex: 1
          }}
        >
          Today
        </span>

        {/* Right icons */}
        <div className="titlebar-no-drag" style={{ display: 'flex', gap: 4 }}>
          {/* Pin / always-on-top */}
          <IconBtn
            title={alwaysOnTop ? "Unpin window" : "Pin on top"}
            onClick={toggleAlwaysOnTop}
            active={alwaysOnTop}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 2L14 6L9 8L8 14L6 9L2 8L8 6L10 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
          </IconBtn>
          <IconBtn title="Settings" onClick={() => setSettingsOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </IconBtn>
          <IconBtn title="Go home" onClick={() => {
            setView('home')
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="5.5" y1="1" x2="5.5" y2="15" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="10.5" y1="1" x2="10.5" y2="15" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
          </IconBtn>
          <IconBtn title="Expand" onClick={() => {
            if (selectedListId !== 'all') openList(selectedListId)
            else setView('board')
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M9.5 2.5H13.5V6.5M6.5 13.5H2.5V9.5M13.5 2.5L9 8M2.5 13.5L7 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Est: {formatMinutes(totalEst)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {doneCount}/{totalTasks} Done
          </span>
        </div>
        <div
          style={{
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'var(--progress-gradient)',
              borderRadius: 2,
              transition: 'width 500ms ease'
            }}
          />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 14px 14px'
        }}
        onClick={() => setShowListDropdown(false)}
      >
        {/* ── Compact widget content ── */}
        {isBlitzing ? (
          <BlitzMode
            initialTaskId={blitz.taskId}
            showTaskCard
            onExpand={expandBlitz}
            onExit={exitBlitz}
          />
        ) : panelMode === 'celebrating' && justCompletedTask ? (
          <CelebrationScreen
            task={justCompletedTask}
            onNextTask={handleNextTask}
            onBreak={handleBreak}
          />
        ) : panelMode === 'break' ? (
          <BreakCard onDone={handleNextTask} />
        ) : (
          activeTask && activeTask.status === 'today' && (
            <ActiveTaskCard
              task={activeTask}
              onPause={handlePauseActive}
              onDone={handleDoneActive}
            />
          )
        )}

        {/* Regular task cards stay visible in the compact widget, even during Blitz */}
        {todayTasks
          .filter((t) => t.id !== activeTaskId)
          .map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              index={i + ((activeTask && activeTask.status === 'today') || isBlitzing ? 2 : 1)}
              onStart={() => handleStartTask(task.id)}
            />
          ))}

        {/* Add task */}
        <AddTaskInput
          listId={selectedListId !== 'all' ? selectedListId : (allLists[0]?.id ?? '')}
        />

        {/* Scheduled tasks for today */}
        <ScheduledTasksSection
          listId={selectedListId !== 'all' ? selectedListId : 'all'}
        />

        {/* Done section */}
        {doneTasks.length > 0 && (
          <DoneSection tasks={doneTasks} />
        )}

        {/* Empty state */}
        {todayTasks.length === 0 && doneTasks.length === 0 && (
          <EmptyState />
        )}

      </div>

      {/* Sticky bottom CTA so Blitz mode is always easy to start */}
      {!isBlitzing && todayTasks.length > 0 && (
        <div
          style={{
            padding: '0 14px 12px',
            flexShrink: 0,
            background: 'linear-gradient(180deg, rgba(20,20,20,0) 0%, rgba(20,20,20,0.96) 20%, rgba(20,20,20,1) 100%)'
          }}
        >
          <BlitzNowButton
            onClick={() => {
              const firstTask = activeTask ?? todayTasks[0]
              if (!firstTask) return
              startBlitz(firstTask.id)
              setPanelMode('blitz')
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes widgetSlideIn {
          from { transform: translateX(-24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────

function DropdownItem({
  active, label, color, char, onClick
}: {
  active: boolean; label: string; color: string; char: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        width: '100%',
        fontSize: 13,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: active ? 'var(--bg-card-hover)' : 'transparent',
        textAlign: 'left',
        borderBottom: '1px solid var(--border)'
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0
        }}
      >
        {char}
      </span>
      {label}
    </button>
  )
}

function IconBtn({ children, onClick, title, active = false }: {
  children: React.ReactNode; onClick: () => void; title?: string; active?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? 'var(--accent-teal)' : 'var(--text-tertiary)',
        background: active ? 'var(--accent-teal-bg)' : 'transparent',
        transition: 'all 150ms'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
        }
      }}
    >
      {children}
    </button>
  )
}

function DoneSection({ tasks }: { tasks: Task[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '6px 0',
          fontSize: 12,
          color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--border)',
          marginTop: 4
        }}
      >
        <span
          style={{
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 150ms',
            fontSize: 10
          }}
        >
          ▶
        </span>
        {tasks.length} Done
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill="var(--accent-teal)" />
                <path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-tertiary)',
                  textDecoration: 'line-through',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {task.title}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                {Math.floor(task.trackedSeconds / 60)}min
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BreakCard({ onDone }: { onDone: () => void }) {
  return (
    <div
      style={{
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16
      }}
    >
      <span style={{ fontSize: 32 }}>🎮</span>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Take a break</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
        Step away, stretch, breathe.
      </div>
      <button
        onClick={onDone}
        style={{
          padding: '10px 28px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--next-task-gradient)',
          color: '#111',
          fontSize: 13,
          fontWeight: 600,
          marginTop: 8
        }}
      >
        ▶| Back to work
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 0 16px',
        gap: 8
      }}
    >
      <span style={{ fontSize: 28 }}>✅</span>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
        All clear!
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        Add a task to start your session
      </div>
    </div>
  )
}
