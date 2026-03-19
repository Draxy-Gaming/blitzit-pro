import type { PomodoroState } from '../../hooks/usePomodoro'
import { formatMinutes } from '../../hooks/useTimer'

interface Props {
  isRunning: boolean
  showNotes: boolean
  pomodoroEnabled: boolean
  pomodoro: PomodoroState
  estimatedMinutes: number | null
  onBreak: () => void
  onToggleNotes: () => void
  onPause: () => void
  onSkip: () => void
  onDone: () => void
  onExpand: () => void
}

/**
 * The control bar that appears above the active task during Blitz mode.
 * 🎮 Break | 📄 Notes | ⏸/▶ | ⏭ Skip | ✓ Done | ↗ Expand
 * Also shows pomodoro ring when enabled.
 */
export default function ControlBar({
  isRunning,
  showNotes,
  pomodoroEnabled,
  pomodoro,
  estimatedMinutes,
  onBreak,
  onToggleNotes,
  onPause,
  onSkip,
  onDone,
  onExpand
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '6px 10px',
        marginBottom: 8,
        border: '1px solid var(--border)',
        gap: 4
      }}
    >
      {/* Left: Break + Notes */}
      <div style={{ display: 'flex', gap: 2 }}>
        <CtrlBtn title="Take a break" onClick={onBreak}>
          🎮
        </CtrlBtn>
        <CtrlBtn
          title="Notes"
          onClick={onToggleNotes}
          active={showNotes}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="4" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="4" y1="7.5" x2="8" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </CtrlBtn>
      </div>

      {/* Center: Pomodoro ring or play/pause + skip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {pomodoroEnabled && pomodoro.phase !== 'idle' ? (
          <PomodoroRing pomodoro={pomodoro} onPause={onPause} />
        ) : (
          <CtrlBtn
            title={isRunning ? 'Pause timer' : 'Resume timer'}
            onClick={onPause}
            large
          >
            {isRunning
              ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="2" y="1.5" width="3" height="9" rx="1" fill="currentColor"/>
                  <rect x="7" y="1.5" width="3" height="9" rx="1" fill="currentColor"/>
                </svg>
              : <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 1.5L10.5 6L3 10.5V1.5Z" fill="currentColor"/>
                </svg>
            }
          </CtrlBtn>
        )}

        <CtrlBtn title="Skip to next task" onClick={onSkip}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 2.5L9.5 7L2.5 11.5V2.5Z" fill="currentColor"/>
            <line x1="11" y1="2.5" x2="11" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </CtrlBtn>
      </div>

      {/* Right: Done + Expand */}
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          title="Mark task done"
          onClick={onDone}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 20,
            border: '1.5px solid var(--accent-teal)',
            background: 'transparent',
            color: 'var(--accent-teal)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-teal-bg)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="var(--accent-teal)" strokeWidth="1.3"/>
            <path d="M3.5 6L5 7.5L8.5 4" stroke="var(--accent-teal)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Done
        </button>

        <CtrlBtn title="Expand to full view" onClick={onExpand}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M8 1.5H11.5V5M5 11.5H1.5V8M11.5 1.5L7.5 5.5M1.5 11.5L5.5 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </CtrlBtn>
      </div>
    </div>
  )
}

// ── Pomodoro ring ─────────────────────────────
function PomodoroRing({ pomodoro, onPause }: { pomodoro: PomodoroState; onPause: () => void }) {
  const size   = 32
  const r      = 12
  const cx     = size / 2
  const cy     = size / 2
  const circ   = 2 * Math.PI * r
  const dash   = pomodoro.progress * circ
  const isWork = pomodoro.phase === 'work'

  const mins = Math.floor(pomodoro.secondsLeft / 60)
  const secs = pomodoro.secondsLeft % 60

  return (
    <button
      onClick={onPause}
      title={`Pomodoro — ${isWork ? 'work sprint' : 'break'} ${mins}:${String(secs).padStart(2,'0')} left`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'transparent',
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: 6
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="2.5"/>
        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={isWork ? 'var(--accent-teal)' : 'var(--accent-purple)'}
          strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
        {/* Center label */}
        <text
          x={cx} y={cy + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="7"
          fontWeight="600"
          fill="var(--text-primary)"
          fontFamily="var(--font-mono)"
        >
          {mins}:{String(secs).padStart(2,'0')}
        </text>
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
        {isWork ? `sprint ${pomodoro.sprint}` : 'break'}
      </span>
    </button>
  )
}

// ── Button primitive ──────────────────────────
function CtrlBtn({
  children, onClick, title, active = false, large = false
}: {
  children: React.ReactNode; onClick: () => void;
  title?: string; active?: boolean; large?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width:  large ? 32 : 28,
        height: large ? 32 : 28,
        borderRadius: large ? '50%' : 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color:      active ? 'var(--accent-teal)'    : 'var(--text-secondary)',
        background: active ? 'var(--accent-teal-bg)' : 'transparent',
        border: large ? '1.5px solid var(--border)' : 'none',
        cursor: 'pointer',
        transition: 'all 150ms',
        flexShrink: 0
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
        }
      }}
    >
      {children}
    </button>
  )
}
