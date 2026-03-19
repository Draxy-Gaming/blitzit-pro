import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useStore } from '../../store'
import { formatMinutes } from '../../hooks/useTimer'
import BoardTaskCard from './BoardTaskCard'
import BlitzNowButton from '../BlitzMode/BlitzNowButton'
import type { Task, TaskStatus } from '../../types'

interface Props {
  status: TaskStatus
  label: string
  tasks: Task[]
  doneTasks?: Task[]
  activeTaskId: string | null
  onCardStart: (taskId: string) => void
  onContextMenu: (task: Task, x: number, y: number) => void
  onBlitzNow?: () => void
  showBlitzBtn?: boolean
}

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  backlog:     'transparent',
  'this-week': 'transparent',
  today:       'rgba(29,158,117,0.18)',
  done:        'transparent'
}
const TITLE_COLOR: Record<TaskStatus, string> = {
  backlog:     '#fff',
  'this-week': '#fff',
  today:       '#5DCAA5',
  done:        '#fff'
}

export default function BoardColumn({
  status, label, tasks, doneTasks = [],
  activeTaskId, onCardStart, onContextMenu, onBlitzNow, showBlitzBtn
}: Props) {
  const { addTask, activeListId, lists } = useStore()
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const { setNodeRef, isOver } = useDroppable({ id: status })

  // Total estimated minutes
  const totalEst = tasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)

  // Done column: group by day
  const groupedDone = doneTasks.reduce<Record<string, Task[]>>((acc, t) => {
    const day = t.completedAt
      ? new Date(t.completedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'Unknown'
    if (!acc[day]) acc[day] = []
    acc[day].push(t)
    return acc
  }, {})

  // Count for header
  const doneCount  = tasks.filter((t) => t.status === 'done').length
  const totalCount = tasks.length + (doneTasks?.length ?? 0)
  const progress   = totalCount > 0 ? (doneCount / totalCount) : 0

  // Scheduled tasks within this column's timeframe
  const scheduledInColumn = tasks.filter((t) => t.scheduledAt && t.scheduledAt > 0)

  const submitNewTask = () => {
    const trimmed = newTaskTitle.trim()
    if (trimmed) {
      const listId = activeListId ?? lists.find(l => !l.archived)?.id ?? ''
      addTask({
        title: trimmed, status,
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
    setNewTaskTitle('')
    setAddingTask(false)
  }

  const isDoneCol = status === 'done'
  const isTodayCol = status === 'today'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        background: isOver ? 'rgba(29,158,117,0.04)' : '#161616',
        borderRadius: 10,
        border: `1px solid ${isOver ? 'rgba(29,158,117,0.3)' : isTodayCol ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.06)'}`,
        overflow: 'hidden',
        transition: 'border-color 0.2s ease'
      }}
    >
      {/* Column header */}
      <div style={{ padding: '12px 12px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: TITLE_COLOR[status] }}>
            {label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isDoneCol && (
              <span style={{ fontSize: 11, color: '#555' }}>
                {totalEst > 0 ? formatMinutes(totalEst) : ''}
              </span>
            )}
            {isDoneCol && (
              <span style={{ fontSize: 11, color: '#555' }}>
                {doneTasks.length} this month
              </span>
            )}
            {!isDoneCol && (
              <button
                onClick={() => setAddingTask(true)}
                style={{
                  width: 20, height: 20,
                  borderRadius: 5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#555', fontSize: 16, lineHeight: 1,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#999'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#555'
                }}
              >
                +
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isDoneCol && (
          <>
            <div style={{
              height: 3, background: 'rgba(255,255,255,0.07)',
              borderRadius: 2, marginBottom: 5, overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progress * 100}%`,
                background: 'linear-gradient(90deg, #1D9E75, #5DCAA5)',
                borderRadius: 2,
                transition: 'width 600ms ease'
              }} />
            </div>
            <span style={{ fontSize: 11, color: '#555' }}>
              {doneCount > 0 ? `${doneCount}/${totalCount} Done` : `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
            </span>
          </>
        )}

        {/* Done col header */}
        {isDoneCol && doneTasks.length > 0 && (
          <span style={{ fontSize: 11, color: '#555' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Scrollable task list */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 8px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 5
        }}
      >
        {!isDoneCol ? (
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <BoardTaskCard
                key={task.id}
                task={task}
                isActive={task.id === activeTaskId}
                onContextMenu={onContextMenu}
                onStart={() => onCardStart(task.id)}
              />
            ))}
          </SortableContext>
        ) : (
          // Done column: grouped by day
          Object.entries(groupedDone).map(([day, dayTasks]) => (
            <div key={day}>
              <div style={{
                fontSize: 10,
                color: '#444',
                fontWeight: 600,
                letterSpacing: '0.06em',
                padding: '4px 3px 3px',
                textTransform: 'uppercase'
              }}>
                {day}
              </div>
              {dayTasks.map((task) => (
                <div key={task.id} style={{ marginBottom: 4 }}>
                  <BoardTaskCard
                    task={task}
                    isActive={false}
                    onContextMenu={onContextMenu}
                    onStart={() => {}}
                  />
                </div>
              ))}
            </div>
          ))
        )}

        {/* Scheduled tasks section */}
        {scheduledInColumn.length > 0 && !isDoneCol && (
          <ScheduledInColumn tasks={scheduledInColumn} />
        )}

        {/* Inline add task input */}
        {addingTask ? (
          <div style={{
            background: '#1e1e1e',
            border: '1px solid rgba(29,158,117,0.5)',
            borderRadius: 9,
            padding: '8px 10px'
          }}>
            <input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewTask()
                if (e.key === 'Escape') { setNewTaskTitle(''); setAddingTask(false) }
              }}
              onBlur={submitNewTask}
              placeholder="Task name..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 12.5,
                color: '#e8e8e8'
              }}
            />
            <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
              Enter to save · Esc to cancel
            </div>
          </div>
        ) : !isDoneCol && (
          <button
            onClick={() => setAddingTask(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 3px',
              color: '#444', fontSize: 11,
              fontWeight: 600, letterSpacing: '0.05em',
              transition: 'color 0.15s',
              width: '100%'
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#777')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#444')}
          >
            + ADD TASK
          </button>
        )}
      </div>

      {/* Blitzit now button — Today column only */}
      {isTodayCol && showBlitzBtn && tasks.length > 0 && onBlitzNow && (
        <div style={{ padding: '6px 8px 8px', flexShrink: 0 }}>
          <BlitzNowButton onClick={onBlitzNow} />
        </div>
      )}
    </div>
  )
}

function ScheduledInColumn({ tasks }: { tasks: Task[] }) {
  return (
    <div style={{
      marginTop: 4,
      borderTop: '1px solid rgba(255,255,255,0.05)',
      paddingTop: 8
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 11, color: '#555',
        marginBottom: 6
      }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <rect x="1" y="1.5" width="9" height="8" rx="1.5" stroke="#555" strokeWidth="1"/>
          <line x1="3.5" y1="0.5" x2="3.5" y2="2.5" stroke="#555" strokeWidth="1" strokeLinecap="round"/>
          <line x1="7.5" y1="0.5" x2="7.5" y2="2.5" stroke="#555" strokeWidth="1" strokeLinecap="round"/>
          <line x1="1" y1="4.5" x2="10" y2="4.5" stroke="#555" strokeWidth="1"/>
        </svg>
        {tasks.length} scheduled
      </div>
      {tasks.map((task) => {
        const timeStr = task.scheduledAt
          ? new Date(task.scheduledAt).toLocaleTimeString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })
          : ''
        return (
          <div key={task.id} style={{
            background: '#191919',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 7,
            padding: '7px 9px',
            marginBottom: 4
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#ccc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.title}
              </span>
              <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>{timeStr}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 10 }}>
              <span style={{ fontSize: 10, color: '#444' }}>
                {task.estimatedMinutes ? `${task.estimatedMinutes}min` : ''}
              </span>
              <span style={{ fontSize: 10, color: '#555' }}>
                {task.trackedSeconds > 0 ? `${Math.floor(task.trackedSeconds / 60)}min` : '0min'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
