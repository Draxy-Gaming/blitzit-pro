import { useMemo, useState } from 'react'
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
  const { toggleSubtask, addSubtask, updateSubtask, moveSubtask, deleteSubtask } = useStore()

  const done = task.subtasks.filter((s) => s.completed).length
  const total = task.subtasks.length
  const label = useMemo(() => `${done}/${total} ${total === 1 ? 'Subtask' : 'Subtasks'}`, [done, total])

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

        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>

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
          {task.subtasks.map((sub, index) => (
            <SubtaskRow
              key={sub.id}
              subtask={sub}
              onToggle={() => toggleSubtask(task.id, sub.id)}
              onUpdate={(title) => updateSubtask(task.id, sub.id, title)}
              onMoveUp={() => moveSubtask(task.id, sub.id, 'up')}
              onMoveDown={() => moveSubtask(task.id, sub.id, 'down')}
              onDelete={() => deleteSubtask(task.id, sub.id)}
              canMoveUp={index > 0}
              canMoveDown={index < task.subtasks.length - 1}
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

function SubtaskRow({
  subtask,
  onToggle,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown
}: {
  subtask: Subtask
  onToggle: () => void
  onUpdate: (title: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(subtask.title)

  const submitEdit = () => {
    const trimmed = draftTitle.trim()
    if (trimmed && trimmed !== subtask.title) onUpdate(trimmed)
    setDraftTitle(trimmed || subtask.title)
    setEditing(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '1px 0'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        title={subtask.completed ? 'Mark subtask incomplete' : 'Mark subtask complete'}
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
          transition: 'all 150ms ease',
          cursor: 'pointer'
        }}
        onClick={onToggle}
      >
        {subtask.completed && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {editing ? (
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={submitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitEdit()
            if (e.key === 'Escape') {
              setDraftTitle(subtask.title)
              setEditing(false)
            }
          }}
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
      ) : (
        <button
          title="Edit subtask"
          onClick={() => setEditing(true)}
          style={{
            flex: 1,
            textAlign: 'left',
            fontSize: 12,
            color: subtask.completed ? 'var(--text-tertiary)' : 'var(--text-secondary)',
            textDecoration: subtask.completed ? 'line-through' : 'none',
            transition: 'all 150ms ease',
            cursor: 'text'
          }}
        >
          {subtask.title}
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <MiniIconButton title="Move subtask up" disabled={!canMoveUp} onClick={onMoveUp}>
          ↑
        </MiniIconButton>
        <MiniIconButton title="Move subtask down" disabled={!canMoveDown} onClick={onMoveDown}>
          ↓
        </MiniIconButton>
        <MiniIconButton title="Delete subtask" danger onClick={onDelete}>
          ✕
        </MiniIconButton>
      </div>
    </div>
  )
}

function MiniIconButton({
  children,
  onClick,
  title,
  danger = false,
  disabled = false
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        fontSize: 10,
        color: disabled ? '#444' : danger ? '#ef4444' : 'var(--text-tertiary)',
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 150ms ease'
      }}
    >
      {children}
    </button>
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
