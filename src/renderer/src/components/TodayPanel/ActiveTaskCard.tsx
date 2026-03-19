import { useTaskTimer, formatTime, isOvertime } from '../../hooks/useTimer'
import SubtaskList from '../shared/SubtaskList'
import type { Task } from '../../types'

interface Props {
  task: Task
  onPause: () => void
  onDone: () => void
}

export default function ActiveTaskCard({ task, onPause, onDone }: Props) {
  const liveSeconds = useTaskTimer(task)
  const overtime = isOvertime(task, liveSeconds)

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5px', // space for gradient border
        background: 'linear-gradient(135deg, #1D9E75, #5DCAA5, #9FE1CB, #1D9E75)',
        backgroundSize: '300% 300%',
        animation: 'borderPulse 3s ease infinite',
        marginBottom: 6,
        cursor: 'pointer'
      }}
      onClick={onPause}
    >
      {/* Inner card */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'calc(var(--radius-lg) - 1.5px)',
          padding: '12px 14px',
          position: 'relative'
        }}
      >
        {/* Top row: task name + timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: task.subtasks.length > 0 ? 8 : 0
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {task.title}
          </span>

          {/* Live timer */}
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
              color: overtime ? 'var(--accent-orange)' : 'var(--text-primary)',
              flexShrink: 0,
              fontFamily: 'var(--font-mono)',
              animation: 'timerTick 1s step-start infinite'
            }}
          >
            {overtime && '+'}
            {formatTime(
              overtime
                ? liveSeconds - (task.estimatedMinutes! * 60)
                : liveSeconds
            )}
          </span>
        </div>

        {/* Subtasks */}
        <div onClick={(e) => e.stopPropagation()}>
          <SubtaskList task={task} defaultOpen={task.subtasks.length > 0} />
        </div>

        {/* Pause hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            fontSize: 10,
            color: 'var(--text-tertiary)',
            opacity: 0,
            transition: 'opacity 150ms'
          }}
          className="pause-hint"
        >
          click to pause
        </div>
      </div>

      <style>{`
        @keyframes borderPulse {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
