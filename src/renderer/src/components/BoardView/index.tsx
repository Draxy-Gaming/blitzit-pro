import { useState, useMemo, useCallback } from 'react'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCorners,
  type DragEndEvent, type DragStartEvent
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useStore, selectActiveLists } from '../../store'
import { useWindowControls } from '../../hooks/useWindow'
import { isMacOS } from '../../utils/platform'
import BlitzMode from '../BlitzMode'
import BoardColumn from './BoardColumn'
import BoardTaskCard from './BoardTaskCard'
import TaskContextMenu from './TaskContextMenu'
import type { Task, TaskStatus } from '../../types'

interface ContextMenuState { task: Task; x: number; y: number }

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'backlog',   label: 'Backlog'    },
  { status: 'this-week', label: 'This Week'  },
  { status: 'today',     label: 'Today'      },
  { status: 'done',      label: 'Done'       }
]

export default function BoardView() {
  const {
    tasks, lists, settings,
    activeTaskId, activeListId,
    startTimer, moveTask, updateTask,
    setView, setSettingsOpen,
    blitz, startBlitz, stopBlitz
  } = useStore()

  const allLists      = useStore(selectActiveLists)
  const { alwaysOnTop, toggleAlwaysOnTop } = useWindowControls()

  const currentList = lists.find((l) => l.id === activeListId)

  const [contextMenu,      setContextMenu]      = useState<ContextMenuState | null>(null)
  const [draggingTask,     setDraggingTask]     = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Filter tasks by current list
  const filteredTasks = useMemo(() =>
    tasks.filter((t) => !activeListId || t.listId === activeListId),
    [tasks, activeListId]
  )

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      backlog: [], 'this-week': [], today: [], done: []
    }
    filteredTasks.forEach((t) => {
      if (map[t.status]) map[t.status].push(t)
    })
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => a.sortOrder - b.sortOrder)
    )
    return map
  }, [filteredTasks])

  // ── Drag handlers ──────────────────────────
  const handleDragStart = useCallback((e: DragStartEvent) => {
    const task = tasks.find((t) => t.id === e.active.id)
    if (task) setDraggingTask(task)
  }, [tasks])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setDraggingTask(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    // Dropped on a column (droppable id = status string)
    const isColumnDrop = COLUMNS.some((c) => c.status === over.id)
    if (isColumnDrop) {
      moveTask(active.id as string, over.id as TaskStatus)
      return
    }

    // Dropped on another task — reorder within same column
    const overTask = tasks.find((t) => t.id === over.id)
    if (!overTask) return

    if (activeTask.status !== overTask.status) {
      // Different column — move to that column and reorder
      moveTask(active.id as string, overTask.status)
    }

    // Reorder sortOrder
    const colTasks = tasksByStatus[overTask.status] ?? []
    const oldIdx   = colTasks.findIndex((t) => t.id === activeTask.id)
    const newIdx   = colTasks.findIndex((t) => t.id === overTask.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = arrayMove(colTasks, oldIdx, newIdx)
    reordered.forEach((t, i) => {
      if (t.sortOrder !== i * 100) updateTask(t.id, { sortOrder: i * 100 })
    })
  }, [tasks, tasksByStatus, moveTask, updateTask])

  // ── Blitz handlers ─────────────────────────
  const handleBlitzStart = () => {
    const first = tasksByStatus.today[0] ?? tasksByStatus['this-week'][0]
    if (!first) return
    startBlitz(first.id)
  }

  // Board task count for header
  const totalPending = filteredTasks.filter((t) => t.status !== 'done').length
  const totalEst     = filteredTasks
    .filter((t) => t.status !== 'done')
    .reduce((s, t) => s + (t.estimatedMinutes ?? settings.defaultTaskLengthMinutes), 0)
  const estHr  = Math.floor(totalEst / 60)
  const estMin = totalEst % 60
  const estStr = estHr > 0 ? `${estHr}hr${estMin > 0 ? ` ${estMin}min` : ''}` : `${estMin}min`

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#111',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* ── Titlebar ── */}
      <div
        className="titlebar-drag"
        style={{
          height: 44,
          background: '#141414',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0
        }}
      >
        {/* macOS traffic lights space */}
        {isMacOS && <div style={{ width: 52 }} />}

        {/* Back button */}
        <button
          className="titlebar-no-drag"
          onClick={() => setView('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: '#888',
            padding: '4px 8px', borderRadius: 6,
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#ccc'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#888'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          BACK
        </button>

        {/* List badge + name */}
        <div className="titlebar-no-drag" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {currentList && (
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: currentList.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff'
            }}>
              {currentList.iconChar}
            </div>
          )}
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
            {currentList?.name ?? 'All Lists'}
          </span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="#666" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Meta: task count + est */}
        <span style={{ fontSize: 12, color: '#555', marginLeft: 4 }}>
          {totalPending > 0 ? `${totalPending} pending · Est: ${estStr}` : 'All clear'}
        </span>

        {/* Right icons */}
        <div className="titlebar-no-drag" style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <TitlebarBtn title="Search (⌘F)" onClick={() => useStore.getState().setSearchOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </TitlebarBtn>
          <TitlebarBtn title={alwaysOnTop ? 'Unpin' : 'Pin on top'} onClick={toggleAlwaysOnTop} active={alwaysOnTop}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L12 5L8 7L7 12L5.5 8L2 7L7 5L9 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
          </TitlebarBtn>
          <TitlebarBtn title="Settings" onClick={() => setSettingsOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7 1v1.3M7 11.7V13M1 7h1.3M11.7 7H13M2.7 2.7l.9.9M10.4 10.4l.9.9M2.7 11.3l.9-.9M10.4 3.6l.9-.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </TitlebarBtn>
          <TitlebarBtn title="Compact view" onClick={() => setView('today')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M8.5 1.5H12.5V5.5M5.5 12.5H1.5V8.5M12.5 1.5L8 6M1.5 12.5L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </TitlebarBtn>
        </div>
      </div>

      {/* ── Board columns ── */}
      {blitz.active && blitz.taskId ? (
        // Blitz overlay over the board
        <div style={{
          position: 'absolute', inset: 44,
          background: 'rgba(4,6,10,0.58)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '56px 24px 24px',
          zIndex: 100
        }}>
          <div style={{
            width: 460,
            maxWidth: '100%',
            background: 'linear-gradient(180deg, rgba(24,24,24,0.98), rgba(15,15,15,0.98))',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 18px 0' }}>
              <div style={{ fontSize: 12, color: 'var(--accent-teal)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Blitz Mode
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 12 }}>
                Stay focused on the current task while the board stays visible in the background.
              </div>
            </div>
            <BlitzMode
              initialTaskId={blitz.taskId}
              showTaskCard
              onExit={stopBlitz}
            />
          </div>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          padding: '0 12px 12px',
          gap: 10
        }}>
          {COLUMNS.map(({ status, label }) => (
            <BoardColumn
              key={status}
              status={status}
              label={label}
              tasks={status === 'done' ? [] : tasksByStatus[status]}
              doneTasks={status === 'done' ? tasksByStatus.done : undefined}
              activeTaskId={activeTaskId}
              onCardStart={(id) => startTimer(id)}
              onContextMenu={(task, x, y) => setContextMenu({ task, x, y })}
              showBlitzBtn={status === 'today'}
              onBlitzNow={handleBlitzStart}
            />
          ))}
        </div>

        {/* Drag overlay — shows ghost card while dragging */}
        <DragOverlay>
          {draggingTask ? (
            <div style={{ opacity: 0.85, transform: 'rotate(2deg)', pointerEvents: 'none' }}>
              <BoardTaskCard
                task={draggingTask}
                isActive={false}
                onContextMenu={() => {}}
                onStart={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Context menu */}
      {contextMenu && (
        <TaskContextMenu
          task={contextMenu.task}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

function TitlebarBtn({ children, onClick, title, active = false }: {
  children: React.ReactNode; onClick: () => void; title?: string; active?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="titlebar-no-drag"
      style={{
        width: 28, height: 28, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? 'var(--accent-teal)' : '#666',
        background: active ? 'var(--accent-teal-bg)' : 'transparent',
        transition: 'all 0.15s'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#aaa'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#666'
        }
      }}
    >
      {children}
    </button>
  )
}
