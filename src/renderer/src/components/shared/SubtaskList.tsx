import { useState } from 'react'
import { useStore } from '../../store'
import type { Task, Subtask } from '../../types'

interface Props {
  task: Task
  defaultOpen?: boolean
}

export default function SubtaskList({ task, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [addingNew, setAddingNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const { toggleSubtask, addSubtask } = useStore()

  const done = task.subtasks.filter((s) => s.completed).length
  const total = task.subtasks.length

  const handleAdd = () => {
    const trimmed = newTitle.trim()
    if (trimmed) {
      addSubtask(task.id, trimmed)
      setNewTitle('')
    }
    setAddingNew(false)
  }

  return (
    <div style={{ marginTop: 6 }}>
      {/* Subtask header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          padding: '2px 0'
        }}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        {/* Circle progress indicator */}
        <SubtaskCircle done={done} total={total} />

        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {done}/{total} Subtasks
        </span>

        {/* Add subtask button */}
        <button
          style={{
            fontSize: 13,
            color: 'var(--text-tertiary)',
            padding: '0 2px',
            lineHeight: 1
          }}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
            setAddingNew(true)
          }}
        >
          +
        </button>

        {/* Chevron */}
        {total > 0 && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              color: 'var(--text-tertiary)',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 150ms ease',
              display: 'block'
            }}
          >
            ▼
          </span>
        )}
      </div>

      {/* Expanded subtask list */}
      {open && (
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            paddingLeft: 4
          }}
        >
          {task.subtasks.map((sub) => (
            <SubtaskRow
              key={sub.id}
              subtask={sub}
              onToggle={() => toggleSubtask(task.id, sub.id)}
            />
          ))}

          {/* New subtask input */}
          {addingNew && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 2 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '1.5px solid var(--border-hover)',
                  flexShrink: 0
                }}
              />
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') { setAddingNew(false); setNewTitle('') }
                }}
                onBlur={handleAdd}
                placeholder="Subtask name..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  padding: 0
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SubtaskRow({ subtask, onToggle }: { subtask: Subtask; onToggle: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        padding: '1px 0'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: subtask.completed
            ? '1.5px solid var(--accent-teal)'
            : '1.5px solid var(--border-hover)',
          background: subtask.completed ? 'var(--accent-teal)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 150ms ease'
        }}
      >
        {subtask.completed && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <span
        style={{
          fontSize: 12,
          color: subtask.completed ? 'var(--text-tertiary)' : 'var(--text-secondary)',
          textDecoration: subtask.completed ? 'line-through' : 'none',
          transition: 'all 150ms ease'
        }}
      >
        {subtask.title}
      </span>
    </div>
  )
}

// SVG circle that shows subtask completion ratio
function SubtaskCircle({ done, total }: { done: number; total: number }) {
  const size = 16
  const r = 6
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  const dash = pct * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Background circle */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--border-hover)"
        strokeWidth="1.5"
      />
      {/* Progress arc */}
      {pct > 0 && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--accent-teal)"
          strokeWidth="1.5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 300ms ease' }}
        />
      )}
      {/* Checkmark when all done */}
      {total > 0 && done === total && (
        <path
          d={`M ${cx - 3} ${cy} L ${cx - 1} ${cy + 2} L ${cx + 3} ${cy - 2}`}
          stroke="var(--accent-teal)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </svg>
  )
}
