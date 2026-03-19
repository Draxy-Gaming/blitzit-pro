import { useState, useEffect, useRef, useMemo } from 'react'
import { useStore } from '../../store'
import type { Task, TaskList } from '../../types'

export default function GlobalSearch() {
  const { tasks, lists, setSearchOpen, openList, addTask, setView, setCreateListOpen } = useStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return tasks
      .filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.note?.content.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 8)
  }, [tasks, query])

  const getList = (task: Task) => lists.find((l) => l.id === task.listId)

  const handleTaskClick = (task: Task) => {
    openList(task.listId)
    setSearchOpen(false)
  }

  const handleAddTask = () => {
    const trimmed = query.trim()
    if (!trimmed) return
    const defaultList = lists.find((l) => !l.archived)
    if (!defaultList) return
    addTask({
      title: trimmed, status: 'today', listId: defaultList.id,
      estimatedMinutes: null, trackedSeconds: 0, timerStartedAt: null,
      subtasks: [], note: null, integrations: [],
      scheduledAt: null, scheduledDuration: null, recurrence: null,
      completedAt: null, sortOrder: Date.now()
    })
    setSearchOpen(false)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80, zIndex: 999,
        backdropFilter: 'blur(4px)'
      }}
      onClick={() => setSearchOpen(false)}
    >
      <div
        style={{
          width: 560, maxWidth: '90vw',
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          animation: 'fadeIn 120ms ease both'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5.5" stroke="#666" strokeWidth="1.4"/>
            <line x1="11" y1="11" x2="15" y2="15" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchOpen(false)
              if (e.key === 'Enter' && !results.length && query.trim()) handleAddTask()
            }}
            placeholder="Search tasks..."
            style={{
              flex: 1, background: 'transparent', border: 'none',
              outline: 'none', fontSize: 15, color: '#e8e8e8'
            }}
          />
          <kbd style={{
            fontSize: 11, color: '#555',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, padding: '2px 6px'
          }}>ESC</kbd>
        </div>

        {/* Quick actions */}
        <div style={{
          display: 'flex', gap: 6, padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap'
        }}>
          <QA label="Add new task" hint={query.trim() ? `"${query.trim().slice(0,20)}"` : ''} onClick={handleAddTask}/>
          <QA label="Add new list" onClick={() => {
            setView('home')
            setCreateListOpen(true)
            setSearchOpen(false)
          }}/>
          <QA label="Go to Reports" onClick={() => { setView('reports'); setSearchOpen(false) }}/>
        </div>

        {/* Results / recent */}
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {query.trim() ? (
            results.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: '#555' }}>
                No results for "{query}"
                <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>Press Enter to create as new task</div>
              </div>
            ) : (
              <>
                <SectionLabel>Tasks</SectionLabel>
                {results.map((t) => (
                  <ResultRow key={t.id} task={t} list={getList(t)} query={query} onClick={() => handleTaskClick(t)}/>
                ))}
              </>
            )
          ) : (
            <div style={{ padding: '4px 0 8px' }}>
              <SectionLabel>Recent</SectionLabel>
              {tasks
                .filter((t) => t.status !== 'done')
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(0, 5)
                .map((t) => (
                  <ResultRow key={t.id} task={t} list={getList(t)} query="" onClick={() => handleTaskClick(t)}/>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QA({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 11px', borderRadius: 7,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        fontSize: 12, color: '#aaa', cursor: 'pointer', transition: 'all 0.12s'
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLButtonElement).style.color = '#ddd' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa' }}
    >
      + {label}
      {hint && <span style={{ color: '#666', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hint}</span>}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, color: '#555', fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '10px 16px 5px'
    }}>
      {children}
    </div>
  )
}

function ResultRow({ task, list, query, onClick }: {
  task: Task; list: TaskList | undefined; query: string; onClick: () => void
}) {
  const [hov, setHov] = useState(false)

  const hl = (text: string) => {
    const q = query.toLowerCase()
    if (!q) return <span>{text}</span>
    const i = text.toLowerCase().indexOf(q)
    if (i === -1) return <span>{text}</span>
    return <span>{text.slice(0, i)}<mark style={{ background: 'rgba(29,158,117,0.3)', color: '#fff', borderRadius: 2, padding: '0 1px' }}>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</span>
  }

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 16px',
        background: hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        cursor: 'pointer', transition: 'background 0.12s'
      }}
    >
      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: task.status === 'today' ? '#1D9E75' : task.status === 'done' ? '#444' : 'rgba(255,255,255,0.2)'
      }}/>
      <span style={{
        flex: 1, fontSize: 13,
        color: task.status === 'done' ? '#555' : '#e8e8e8',
        textDecoration: task.status === 'done' ? 'line-through' : 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}>
        {hl(task.title)}
      </span>
      {list && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{
            width: 15, height: 15, borderRadius: 4, background: list.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 700, color: '#fff'
          }}>{list.iconChar}</div>
          <span style={{ fontSize: 11, color: '#555' }}>{list.name}</span>
        </div>
      )}
      <span style={{ fontSize: 10, color: '#444', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
        Task
      </span>
    </div>
  )
}
