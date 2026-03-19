import { useState } from 'react'
import { useStore } from '../../store'
import { formatMinutes } from '../../hooks/useTimer'
import IntegrationBadge from '../shared/IntegrationBadge'
import SubtaskList from '../shared/SubtaskList'
import type { Task } from '../../types'

interface Props {
  task: Task
  index: number
  onStart: () => void
}

export default function TaskCard({ task, index, onStart }: Props) {
  const [hovered, setHovered] = useState(false)
  const { deleteTask, moveTask } = useStore()

  const trackedMin = Math.floor(task.trackedSeconds / 60)
  const trackedDisplay = task.trackedSeconds > 0
    ? (trackedMin > 0 ? `${trackedMin}min` : `${task.trackedSeconds}s`)
    : '0min'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        marginBottom: 4,
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background 150ms ease',
        position: 'relative'
      }}
      onClick={onStart}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Index number */}
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            minWidth: 14,
            paddingTop: 1,
            flexShrink: 0
          }}
        >
          {index}
        </span>

        {/* Task name */}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {task.title}
        </span>

        {/* Integration badges */}
        {task.integrations.length > 0 && (
          <div style={{ display: 'flex', gap: 3, flexShrink: 0, paddingTop: 1 }}>
            {task.integrations.map((b, i) => (
              <IntegrationBadge key={i} badge={b} size={18} />
            ))}
          </div>
        )}
      </div>

      {/* Note preview */}
      {task.note && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 4,
            marginLeft: 22
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="10" height="10" rx="2" stroke="var(--text-tertiary)" strokeWidth="1"/>
            <line x1="3" y1="4" x2="9" y2="4" stroke="var(--text-tertiary)" strokeWidth="1"/>
            <line x1="3" y1="6.5" x2="7" y2="6.5" stroke="var(--text-tertiary)" strokeWidth="1"/>
          </svg>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-tertiary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 160
            }}
          >
            {task.note.links[0] || 'Notes'}
          </span>
        </div>
      )}

      {/* Time row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 6,
          marginLeft: 22
        }}
      >
        {/* Estimate */}
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {task.estimatedMinutes
            ? formatMinutes(task.estimatedMinutes)
            : (
              <span style={{ color: 'var(--accent-teal)', opacity: 0.7 }}>+ EST</span>
            )}
        </span>

        {/* Tracked time */}
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {trackedDisplay}
        </span>
      </div>

      {/* Subtasks */}
      {task.subtasks.length > 0 && (
        <div
          style={{ marginLeft: 22, marginTop: 4 }}
          onClick={(e) => e.stopPropagation()}
        >
          <SubtaskList task={task} />
        </div>
      )}

      {/* Hover action buttons */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            display: 'flex',
            gap: 4,
            background: 'var(--bg-card-hover)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 4px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ActionBtn
            title="Move to done"
            onClick={() => moveTask(task.id, 'done')}
          >
            ✓
          </ActionBtn>
          <ActionBtn
            title="Delete task"
            onClick={() => deleteTask(task.id)}
            danger
          >
            ✕
          </ActionBtn>
        </div>
      )}
    </div>
  )
}

function ActionBtn({
  children,
  onClick,
  title,
  danger = false
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        fontSize: 11,
        color: danger ? '#ef4444' : 'var(--text-secondary)',
        padding: '1px 4px',
        borderRadius: 4,
        transition: 'background 150ms'
      }}
    >
      {children}
    </button>
  )
}
