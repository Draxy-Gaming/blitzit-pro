import { useTaskTimer, formatTime } from '../../hooks/useTimer'
import type { Task } from '../../types'

interface Props {
  task: Task
  onExpand: () => void
}

export default function MiniBlitzWidget({ task, onExpand }: Props) {
  const liveSeconds = useTaskTimer(task)
  const done = task.subtasks.filter((subtask) => subtask.completed).length

  return (
    <div
      className="titlebar-drag"
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12
      }}
    >
      <div
        style={{
          width: '100%',
          background: '#202020',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          padding: '12px 14px',
          animation: 'miniWidgetIn 180ms ease-out both'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {task.title}
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.03em',
              flexShrink: 0
            }}
          >
            {formatTime(liveSeconds)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: '1.5px solid rgba(93,202,165,0.7)'
            }}
          />
          <span style={{ fontSize: 12, color: '#a9b3bf' }}>
            {done}/{task.subtasks.length} Subtasks
          </span>
          <button
            className="titlebar-no-drag"
            title="Expand focus panel"
            onClick={onExpand}
            style={{
              marginLeft: 'auto',
              width: 22,
              height: 22,
              borderRadius: 6,
              color: '#9aa3ad',
              cursor: 'pointer'
            }}
          >
            ▾
          </button>
        </div>
      </div>

      <style>{`
        @keyframes miniWidgetIn {
          from { transform: translateY(-8px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
