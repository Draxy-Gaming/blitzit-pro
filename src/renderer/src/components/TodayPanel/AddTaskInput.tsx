import { useState } from 'react'
import { useStore } from '../../store'

interface Props {
  listId: string
  status?: 'today' | 'backlog' | 'this-week'
}

export default function AddTaskInput({ listId, status = 'today' }: Props) {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const { addTask, setCreateListOpen, setView } = useStore()

  const hasList = Boolean(listId)

  const submit = () => {
    const trimmed = title.trim()
    if (trimmed) {
      addTask({
        title: trimmed,
        status,
        listId,
        estimatedMinutes: null,
        trackedSeconds: 0,
        timerStartedAt: null,
        subtasks: [],
        note: null,
        integrations: [],
        scheduledAt: null,
        scheduledDuration: null,
        recurrence: null,
        completedAt: null,
        sortOrder: Date.now()
      })
    }
    setTitle('')
    setActive(false)
  }

  if (!active) {
    return (
      <button
        onClick={() => {
          if (!hasList) {
            setView('home')
            setCreateListOpen(true)
            return
          }
          setActive(true)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 4px',
          width: '100%',
          textAlign: 'left',
          color: 'var(--text-tertiary)',
          fontSize: 12,
          letterSpacing: '0.04em',
          fontWeight: 500,
          transition: 'color 150ms ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
        {hasList ? 'ADD TASK' : 'CREATE A LIST FIRST'}
      </button>
    )
  }

  return (
    <div
      className="titlebar-no-drag"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--accent-teal)',
        padding: '10px 12px',
        marginBottom: 4
      }}
    >
      <input
        className="titlebar-no-drag"
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') { setTitle(''); setActive(false) }
        }}
        onBlur={submit}
        placeholder="Task name..."
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 13,
          color: 'var(--text-primary)'
        }}
      />
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
        Enter to save · Esc to cancel
      </div>
    </div>
  )
}
