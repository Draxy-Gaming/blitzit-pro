import { useState } from 'react'
import { useStore } from '../../store'
import type { TaskList, Task } from '../../types'

interface Props {
  list: TaskList
  tasks: Task[]
  onOpen: () => void
}

export default function ListCard({ list, tasks, onOpen }: Props) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { archiveList, deleteList, updateList } = useStore()

  const pendingTasks = tasks.filter((t) => t.status !== 'done')
  const totalEst     = pendingTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)
  const estHr        = Math.floor(totalEst / 60)
  const estMin       = totalEst % 60
  const estStr       = totalEst > 0
    ? (estHr > 0 ? `${estHr}hr${estMin > 0 ? ` ${estMin}min` : ''}` : `${estMin}min`)
    : null

  const previewTasks = pendingTasks.slice(0, 4)
  const allClear     = pendingTasks.length === 0

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      onClick={onOpen}
      style={{
        background:    hovered ? '#1e1e1e' : '#191919',
        border:        `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius:  12,
        padding:       '14px 16px',
        cursor:        'pointer',
        transition:    'all 0.15s ease',
        position:      'relative',
        display:       'flex',
        flexDirection: 'column',
        gap:           10,
        minHeight:     160
      }}
    >
      {/* Header: badge + name + menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: list.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
          flexShrink: 0
        }}>
          {list.iconChar}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8', flex: 1 }}>
          {list.name}
        </span>

        {/* ··· menu button */}
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
          style={{
            width: 24, height: 24, borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: hovered ? '#666' : 'transparent',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#aaa')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = hovered ? '#666' : 'transparent')}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="2.5" cy="6.5" r="1.2" fill="currentColor"/>
            <circle cx="6.5" cy="6.5" r="1.2" fill="currentColor"/>
            <circle cx="10.5" cy="6.5" r="1.2" fill="currentColor"/>
          </svg>
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div
            style={{
              position: 'absolute', top: 36, right: 12,
              background: '#252525',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: 4, zIndex: 50,
              minWidth: 130,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { label: 'Rename',  action: () => { const n = prompt('List name:', list.name); if (n?.trim()) updateList(list.id, { name: n.trim() }) } },
              { label: 'Archive', action: () => archiveList(list.id) },
              { label: 'Delete',  action: () => { if (confirm('Delete this list and all its tasks?')) deleteList(list.id) }, danger: true }
            ].map(({ label, action, danger }) => (
              <button
                key={label}
                onClick={() => { action(); setMenuOpen(false) }}
                style={{
                  display: 'block', width: '100%', padding: '7px 10px',
                  fontSize: 12, color: danger ? '#ef4444' : '#ccc',
                  borderRadius: 5, textAlign: 'left', transition: 'background 0.12s'
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task previews */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {allClear ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 8
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="rgba(29,158,117,0.3)" strokeWidth="1.5"/>
              <path d="M8.5 14L12 17.5L19.5 10.5" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>ALL CLEAR</span>
          </div>
        ) : (
          previewTasks.map((task, i) => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '3px 0',
              borderBottom: i < previewTasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
            }}>
              <span style={{
                fontSize: 12, color: '#888',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1, paddingRight: 8
              }}>
                {task.title}
              </span>
              <span style={{ fontSize: 11, color: '#444', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {task.estimatedMinutes ? `${task.estimatedMinutes}min` : '–'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer: count + est */}
      {!allClear && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8
        }}>
          <span style={{ fontSize: 11, color: '#555' }}>
            {pendingTasks.length} pending task{pendingTasks.length !== 1 ? 's' : ''}
          </span>
          {estStr && (
            <span style={{ fontSize: 11, color: '#555' }}>
              Est: {estStr}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
