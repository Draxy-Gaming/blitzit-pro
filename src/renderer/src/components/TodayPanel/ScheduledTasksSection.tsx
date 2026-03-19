import { useState, useMemo } from 'react'
import { useStore } from '../../store'
import IntegrationBadge from '../shared/IntegrationBadge'
import type { Task } from '../../types'

interface Props {
  listId?: string   // 'all' or a specific list ID
}

/**
 * Shows tasks that are scheduled for today (scheduledAt within today's date range).
 * Also shows tasks that have a scheduledAt in the past but are still pending.
 */
export default function ScheduledTasksSection({ listId }: Props) {
  const { tasks, startTimer } = useStore()
  const [expanded, setExpanded] = useState(true)

  const scheduledToday = useMemo(() => {
    const now    = Date.now()
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

    return tasks.filter((t) => {
      if (!t.scheduledAt) return false
      if (t.status === 'done') return false
      if (listId && listId !== 'all' && t.listId !== listId) return false
      // Show if scheduled today or overdue (past + not done)
      return t.scheduledAt <= todayEnd.getTime()
    }).sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0))
  }, [tasks, listId])

  if (scheduledToday.length === 0) return null

  return (
    <div style={{ marginTop: 12 }}>
      {/* Section header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '6px 0',
          marginBottom: expanded ? 6 : 0,
          borderTop: '1px solid var(--border)',
          paddingTop: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="var(--text-tertiary)" strokeWidth="1"/>
            <line x1="4" y1="1" x2="4" y2="3" stroke="var(--text-tertiary)" strokeWidth="1" strokeLinecap="round"/>
            <line x1="8" y1="1" x2="8" y2="3" stroke="var(--text-tertiary)" strokeWidth="1" strokeLinecap="round"/>
            <line x1="1" y1="5" x2="11" y2="5" stroke="var(--text-tertiary)" strokeWidth="1"/>
          </svg>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {scheduledToday.length} Scheduled task{scheduledToday.length !== 1 ? 's' : ''} today
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Add scheduled task button */}
          <span
            style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1, padding: '0 2px' }}
            onClick={(e) => e.stopPropagation()}
            title="Schedule a task"
          >
            +
          </span>

          {/* Chevron */}
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-tertiary)',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 150ms ease',
              display: 'block'
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Scheduled task cards */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {scheduledToday.map((task) => (
            <ScheduledTaskCard
              key={task.id}
              task={task}
              onStart={() => startTimer(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Individual scheduled task card ────────────
function ScheduledTaskCard({ task, onStart }: { task: Task; onStart: () => void }) {
  const [hovered, setHovered] = useState(false)
  const isOverdue = task.scheduledAt ? task.scheduledAt < Date.now() : false

  const timeLabel = task.scheduledAt
    ? formatScheduledTime(task.scheduledAt)
    : ''

  const durationLabel = task.scheduledDuration
    ? `${task.scheduledDuration}min`
    : task.estimatedMinutes
    ? `${task.estimatedMinutes}min`
    : null

  const trackedMin = Math.floor(task.trackedSeconds / 60)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onStart}
      style={{
        background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${isOverdue ? 'rgba(249,115,22,0.3)' : 'var(--border)'}`,
        padding: '9px 12px',
        cursor: 'pointer',
        transition: 'background 150ms ease'
      }}
    >
      {/* Top row: name + time + badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Calendar dot */}
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isOverdue ? 'var(--accent-orange)' : 'var(--accent-teal)',
            flexShrink: 0
          }}
        />

        {/* Task name */}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {task.title}
        </span>

        {/* Scheduled time */}
        {timeLabel && (
          <span
            style={{
              fontSize: 11,
              color: isOverdue ? 'var(--accent-orange)' : 'var(--text-tertiary)',
              flexShrink: 0,
              fontWeight: isOverdue ? 500 : 400
            }}
          >
            {isOverdue ? '⚠ ' : ''}{timeLabel}
          </span>
        )}

        {/* Integration badges */}
        {task.integrations.length > 0 && (
          <div style={{ display: 'flex', gap: 3 }}>
            {task.integrations.map((b, i) => (
              <IntegrationBadge key={i} badge={b} size={16} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom row: note preview + duration + tracked */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 5,
          marginLeft: 14
        }}
      >
        {/* Note/link preview */}
        {task.note?.links[0] ? (
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-tertiary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 150,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="10" height="10" rx="2" stroke="var(--text-tertiary)" strokeWidth="1"/>
              <line x1="3" y1="4" x2="9" y2="4" stroke="var(--text-tertiary)" strokeWidth="1"/>
              <line x1="3" y1="6.5" x2="7" y2="6.5" stroke="var(--text-tertiary)" strokeWidth="1"/>
            </svg>
            {task.note.links[0]}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {durationLabel ?? ''}
          </span>
        )}

        {/* Tracked time */}
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {trackedMin > 0 ? `${trackedMin}min` : '0min'}
        </span>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────
function formatScheduledTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now  = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const isYesterday = (() => {
    const y = new Date(now); y.setDate(y.getDate() - 1)
    return date.getDate() === y.getDate() &&
           date.getMonth() === y.getMonth() &&
           date.getFullYear() === y.getFullYear()
  })()

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (isToday)     return `Today ${timeStr}`
  if (isYesterday) return `Yesterday ${timeStr}`

  const dayName = date.toLocaleDateString([], { weekday: 'short' })
  return `${dayName} ${timeStr}`
}
