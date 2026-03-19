import { useEffect, useState } from 'react'
import type { Task } from '../../types'

// Rotating pool of celebration GIFs (royalty-free / Giphy)
const CELEBRATION_GIFS = [
  'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', // Simon Cowell clapping
  'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', // thumbs up
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', // celebrating
  'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif',     // happy dance
  'https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/giphy.gif', // yes!
]

interface Props {
  task: Task
  onNextTask: () => void
  onBreak: () => void
}

export default function CelebrationScreen({ task, onNextTask, onBreak }: Props) {
  const [gif] = useState(
    () => CELEBRATION_GIFS[Math.floor(Math.random() * CELEBRATION_GIFS.length)]
  )

  // Auto-advance after 8 seconds if user doesn't click
  useEffect(() => {
    const timer = setTimeout(onNextTask, 8000)
    return () => clearTimeout(timer)
  }, [onNextTask])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 14px',
        animation: 'popIn 350ms cubic-bezier(0.16,1,0.3,1) both'
      }}
    >
      {/* Task name with strikethrough */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-tertiary)',
          textDecoration: 'line-through',
          marginBottom: 8,
          textAlign: 'center',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {task.title}
      </div>

      {/* Well done! */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 12
        }}
      >
        Well done! 💥
      </div>

      {/* GIF */}
      <div
        style={{
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          marginBottom: 12
        }}
      >
        <img
          src={gif}
          alt="celebration"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* You finished! */}
      <div
        style={{
          fontSize: 13,
          color: 'var(--accent-teal)',
          marginBottom: 16,
          fontWeight: 500
        }}
      >
        You finished the task!
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: 14,
          fontSize: 11,
          color: 'var(--text-tertiary)'
        }}
      >
        <span>
          Est:{' '}
          {task.estimatedMinutes
            ? `${task.estimatedMinutes}min`
            : 'None'}
        </span>
        <span style={{ color: 'var(--accent-teal)' }}>
          Taken: {Math.floor(task.trackedSeconds / 60)}min
        </span>
      </div>

      {/* Next Task button */}
      <button
        onClick={onNextTask}
        style={{
          width: '100%',
          padding: '11px 0',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--next-task-gradient)',
          color: '#111',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 10,
          transition: 'opacity 150ms',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <span style={{ fontSize: 13 }}>▶|</span>
        Next Task
      </button>

      {/* Take a Break */}
      <button
        onClick={onBreak}
        style={{
          color: 'var(--text-secondary)',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px'
        }}
      >
        <span>🎮</span>
        Take a Break
      </button>
    </div>
  )
}
