import { useEffect, useRef, useState } from 'react'
import ScheduleModal from '../Scheduling/ScheduleModal'
import { useStore } from '../../store'
import type { Task, TaskStatus } from '../../types'

interface Props {
  task: Task
  x: number
  y: number
  onClose: () => void
}

const STATUS_ORDER: TaskStatus[] = ['backlog', 'this-week', 'today', 'done']

export default function TaskContextMenu({ task, x, y, onClose }: Props) {
  const { moveTask, deleteTask, addTask } = useStore()
  const ref = useRef<HTMLDivElement>(null)
  const [showSchedule, setShowSchedule] = useState(false)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [onClose])

  // Adjust position so menu doesn't go off screen
  const menuWidth  = 160
  const menuHeight = 180
  const adjX = Math.min(x, window.innerWidth  - menuWidth  - 8)
  const adjY = Math.min(y, window.innerHeight - menuHeight - 8)

  const canMoveLeft  = STATUS_ORDER.indexOf(task.status) > 0
  const canMoveRight = STATUS_ORDER.indexOf(task.status) < STATUS_ORDER.length - 1

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: adjX,
        top: adjY,
        background: '#252525',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 9,
        padding: 4,
        zIndex: 9999,
        minWidth: menuWidth,
        boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
        animation: 'fadeIn 120ms ease both'
      }}
    >
      {/* Move to column */}
      {canMoveLeft && (
        <MenuItem onClick={() => {
          const prev = STATUS_ORDER[STATUS_ORDER.indexOf(task.status) - 1]
          moveTask(task.id, prev)
          onClose()
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Move back
        </MenuItem>
      )}
      {canMoveRight && (
        <MenuItem onClick={() => {
          const next = STATUS_ORDER[STATUS_ORDER.indexOf(task.status) + 1]
          moveTask(task.id, next)
          onClose()
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Move forward
        </MenuItem>
      )}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '3px 0' }} />

      <MenuItem onClick={() => {
        addTask({
          title: task.title + ' (copy)',
          status: task.status,
          listId: task.listId,
          estimatedMinutes: task.estimatedMinutes,
          trackedSeconds: 0,
          timerStartedAt: null,
          subtasks: task.subtasks.map(s => ({ ...s, completed: false })),
          note: task.note,
          integrations: task.integrations,
          scheduledAt: null,
          scheduledDuration: null,
          recurrence: null,
          completedAt: null,
          sortOrder: task.sortOrder + 1
        })
        onClose()
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="3" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1"/><rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1" fill="rgba(255,255,255,0.05)"/></svg>
        Duplicate
      </MenuItem>

      <MenuItem onClick={() => {
        setShowSchedule(true)
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/><line x1="4" y1="0.5" x2="4" y2="2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="8" y1="0.5" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="1" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1"/></svg>
        Schedule
      </MenuItem>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '3px 0' }} />

      <MenuItem danger onClick={() => { deleteTask(task.id); onClose() }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 3V2h2v1M4.5 3l.5 7M7.5 3l-.5 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
        Delete
      </MenuItem>
      {showSchedule && (
        <ScheduleModal task={task} onClose={() => { setShowSchedule(false); onClose() }}/>
      )}
    </div>
  )
}

function MenuItem({ children, onClick, danger = false }: {
  children: React.ReactNode; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 9px',
        fontSize: 12, color: danger ? '#ef4444' : '#ccc',
        borderRadius: 6,
        textAlign: 'left',
        transition: 'background 0.12s'
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = danger
          ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
