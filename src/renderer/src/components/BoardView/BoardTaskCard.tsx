import { useState, useRef } from 'react'
import ScheduleModal from '../Scheduling/ScheduleModal'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../../store'
import { useTaskTimer, formatTime, formatMinutes, isOvertime } from '../../hooks/useTimer'
import SubtaskList from '../shared/SubtaskList'
import IntegrationBadge from '../shared/IntegrationBadge'
import type { Task } from '../../types'

interface Props {
  task: Task
  isActive: boolean
  onContextMenu: (task: Task, x: number, y: number) => void
  onStart: () => void
}

export default function BoardTaskCard({ task, isActive, onContextMenu, onStart }: Props) {
  const [hovered, setHovered] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const { completeTask } = useStore()
  const isDone = task.status === 'done'

  const liveSeconds = useTaskTimer(task)
  const overtime    = isOvertime(task, liveSeconds)

  // dnd-kit sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, disabled: isDone })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1
  }

  const trackedDisplay = task.trackedSeconds > 0
    ? (overtime
        ? `+${formatTime(liveSeconds - (task.estimatedMinutes ?? 0) * 60)}`
        : formatTime(liveSeconds))
    : '0min'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          background: isActive
            ? 'rgba(29,158,117,0.08)'
            : isDone ? 'transparent' : hovered ? '#222' : '#1e1e1e',
          border: `${isActive ? '1.5px' : '1px'} solid ${
            isActive ? 'rgba(29,158,117,0.4)'
            : isDone ? 'rgba(255,255,255,0.04)'
            : hovered ? 'rgba(255,255,255,0.12)'
            : 'rgba(255,255,255,0.07)'
          }`,
          borderLeft: isDone ? '2px solid rgba(29,158,117,0.25)' : undefined,
          borderRadius: 9,
          padding: '9px 11px',
          cursor: isDone ? 'default' : 'pointer',
          transition: 'all 0.15s ease',
          opacity: isDone ? 0.45 : 1,
          position: 'relative'
        }}
        onClick={!isDone ? onStart : undefined}
      >
        {/* Drag handle — visible on hover */}
        {!isDone && hovered && (
          <div
            {...listeners}
            style={{
              position: 'absolute',
              left: 3,
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'grab',
              color: 'rgba(255,255,255,0.2)',
              padding: '4px 2px',
              lineHeight: 1
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
              <circle cx="2" cy="2.5" r="1.3"/><circle cx="6" cy="2.5" r="1.3"/>
              <circle cx="2" cy="7"   r="1.3"/><circle cx="6" cy="7"   r="1.3"/>
              <circle cx="2" cy="11.5" r="1.3"/><circle cx="6" cy="11.5" r="1.3"/>
            </svg>
          </div>
        )}

        {/* Top row: title + badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
          <span style={{
            flex: 1,
            fontSize: 12.5,
            fontWeight: 500,
            color: isDone ? '#555' : '#e8e8e8',
            lineHeight: 1.35,
            textDecoration: isDone ? 'line-through' : 'none',
            transition: 'color 0.15s'
          }}>
            {task.title}
          </span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="1" y="1" width="8" height="8" rx="1.5" stroke={isDone ? '#444' : '#555'} strokeWidth="0.9"/>
              <line x1="2.5" y1="3.5" x2="7.5" y2="3.5" stroke={isDone ? '#444' : '#555'} strokeWidth="0.9"/>
              <line x1="2.5" y1="5.5" x2="5.5" y2="5.5" stroke={isDone ? '#444' : '#555'} strokeWidth="0.9"/>
            </svg>
            <span style={{
              fontSize: 11,
              color: isDone ? '#444' : '#555',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 150
            }}>
              {task.note.links[0] || 'Notes'}
            </span>
          </div>
        )}

        {/* Subtasks */}
        {task.subtasks.length > 0 && !isDone && (
          <div style={{ marginBottom: 5 }} onClick={(e) => e.stopPropagation()}>
            <SubtaskList task={task} />
          </div>
        )}

        {/* Bottom row: est + tracked */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: isDone ? '#444' : task.estimatedMinutes ? '#555' : 'rgba(29,158,117,0.7)' }}>
            {task.estimatedMinutes ? formatMinutes(task.estimatedMinutes) : '+ EST'}
          </span>
          <span style={{
            fontSize: 11,
            color: isDone ? '#444' : overtime && isActive ? '#f97316' : '#888',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: isActive ? 'var(--font-mono)' : 'inherit',
            fontWeight: isActive ? 500 : 400
          }}>
            {isActive ? (overtime ? `+${formatTime(liveSeconds - (task.estimatedMinutes ?? 0) * 60)}` : formatTime(liveSeconds))
              : task.trackedSeconds > 0 ? `${Math.floor(task.trackedSeconds / 60)}min` : '0min'}
          </span>
        </div>

        {/* Hover action bar */}
        {hovered && !isDone && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 8,
              display: 'flex',
              gap: 2,
              background: '#1e1e1e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '2px 3px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <HoverBtn title="Move left"  onClick={() => {}}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M6.5 2L3 5.5L6.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </HoverBtn>
            <HoverBtn title="Move right" onClick={() => {}}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M4.5 2L8 5.5L4.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </HoverBtn>
            <HoverBtn title="Schedule" onClick={(e) => { e.stopPropagation(); setScheduleOpen(true) }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="1.5" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1"/><line x1="3.5" y1="0.5" x2="3.5" y2="2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="7.5" y1="0.5" x2="7.5" y2="2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="1" y1="4.5" x2="10" y2="4.5" stroke="currentColor" strokeWidth="1"/></svg>
            </HoverBtn>
            <HoverBtn title="Notes" onClick={() => {}}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="1" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1"/><line x1="3" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="3" y1="6.5" x2="6" y2="6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
            </HoverBtn>
            <HoverBtn title="More options" onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              onContextMenu(task, rect.right, rect.bottom)
            }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="2" cy="5.5" r="1" fill="currentColor"/>
                <circle cx="5.5" cy="5.5" r="1" fill="currentColor"/>
                <circle cx="9" cy="5.5" r="1" fill="currentColor"/>
              </svg>
            </HoverBtn>
          </div>
        )}
      </div>
      {scheduleOpen && <ScheduleModal task={task} onClose={() => setScheduleOpen(false)}/>}
    </div>
  )
}

function HoverBtn({
  children, onClick, title
}: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title?: string }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 22, height: 22,
        borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#777',
        transition: 'all 0.12s'
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#ccc'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#777'
      }}
    >
      {children}
    </button>
  )
}
