import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import type { Task } from '../../types'

/**
 * "Tasks due now" popup — fires when scheduled tasks are overdue.
 * Shows at most once per task, with Do now / Do later options.
 */
export default function AlertsPopup() {
  const { tasks, startTimer, updateTask } = useStore()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [current, setCurrent] = useState<Task | null>(null)

  // Check every 30 seconds for newly due tasks
  useEffect(() => {
    const check = () => {
      const now = Date.now()
      const due = tasks.find((t) =>
        t.scheduledAt &&
        t.scheduledAt <= now &&
        t.status !== 'done' &&
        !dismissed.has(t.id)
      )
      setCurrent(due ?? null)
    }

    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [tasks, dismissed])

  if (!current) return null

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]))
    setCurrent(null)
  }

  const doNow = () => {
    updateTask(current.id, { status: 'today' })
    startTimer(current.id)
    dismiss(current.id)
  }

  const doLater = () => {
    // Push schedule 1 hour forward
    updateTask(current.id, {
      scheduledAt: (current.scheduledAt ?? Date.now()) + 60 * 60 * 1000
    })
    dismiss(current.id)
  }

  const timeStr = current.scheduledAt
    ? new Date(current.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : ''

  // Count all currently due tasks
  const now = Date.now()
  const allDue = tasks.filter(
    (t) => t.scheduledAt && t.scheduledAt <= now && t.status !== 'done' && !dismissed.has(t.id)
  )

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      width: 300, zIndex: 1100,
      animation: 'fadeIn 200ms ease both'
    }}>
      <div style={{
        background: '#1e1e1e',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.7)'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f97316', marginBottom: 2 }}>
            Tasks due now
          </div>
          <div style={{ fontSize: 11, color: '#666' }}>
            You have {allDue.length} scheduled task{allDue.length !== 1 ? 's' : ''} due now
          </div>
        </div>

        {/* Task list (up to 3) */}
        <div style={{ padding: '8px 14px' }}>
          {allDue.slice(0, 3).map((t) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#e8e8e8' }}>{t.title.slice(0, 28)}{t.title.length > 28 ? '…' : ''}</div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
                  {t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                  {t.estimatedMinutes ? ` · ${t.estimatedMinutes}min` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={doNow}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 999,
              background: 'linear-gradient(135deg, #1D9E75, #5DCAA5)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'opacity 0.15s'
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.9')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
          >
            Do now
          </button>
          <button
            onClick={doLater}
            style={{
              width: '100%', padding: '7px 0',
              color: '#666', fontSize: 12,
              cursor: 'pointer', transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#999')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#666')}
          >
            Do later (+ 1hr)
          </button>
        </div>
      </div>
    </div>
  )
}
