import { useState, useMemo } from 'react'
import { useStore, selectActiveLists, selectArchivedLists } from '../../store'
import { useWindowControls } from '../../hooks/useWindow'
import ListCard from './ListCard'
import CreateListModal from './CreateListModal'

export default function HomeView() {
  const { tasks, settings, openList, setView, setSearchOpen, setSettingsOpen } = useStore()
  const activeLists   = useStore(selectActiveLists)
  const archivedLists = useStore(selectArchivedLists)
  const { setCompact, setAlwaysOnTop } = useWindowControls()
  const [showCreateModal,   setShowCreateModal]   = useState(false)
  const [showArchived,      setShowArchived]      = useState(false)

  // Greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])
  const name = settings.userName || 'there'

  // Upcoming tasks (scheduled within next 24h)
  const upcomingCount = useMemo(() => {
    const now    = Date.now()
    const cutoff = now + 24 * 60 * 60 * 1000
    return tasks.filter((t) => t.scheduledAt && t.scheduledAt > now && t.scheduledAt < cutoff && t.status !== 'done').length
  }, [tasks])

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#111',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* ── Titlebar ── */}
      <div
        className="titlebar-drag"
        style={{
          height: 44,
          background: '#141414',
          display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0
        }}
      >
        {process.platform === 'darwin' && <div style={{ width: 52 }} />}

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg, #7F77DD, #1D9E75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5C6.5 1.5 4 4 3.5 7L6 7.5L6.5 11C8 10.5 9.5 9 10.5 7C11.5 5 10 1.5 6.5 1.5Z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Blitzit</span>
          <span style={{
            fontSize: 9, fontWeight: 600, color: '#7F77DD',
            background: 'rgba(127,119,221,0.15)',
            padding: '1px 5px', borderRadius: 4, letterSpacing: '0.04em'
          }}>
            BETA
          </span>
        </div>

        {/* Right controls */}
        <div className="titlebar-no-drag" style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <NavBtn title="Search (⌘F)" onClick={() => setSearchOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </NavBtn>
          <NavBtn title="Settings" onClick={() => setSettingsOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7 1v1.3M7 11.7V13M1 7h1.3M11.7 7H13M2.7 2.7l.9.9M10.4 10.4l.9.9M2.7 11.3l.9-.9M10.4 3.6l.9-.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </NavBtn>
          <NavBtn title="Today panel" onClick={async () => {
            await setCompact(true)
            await setAlwaysOnTop(true)
            setView('today')
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="1.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="1.5" y1="5.5" x2="12.5" y2="5.5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </NavBtn>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 80px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {greeting}, {name}
          </h1>
          <p style={{ fontSize: 13, color: '#555' }}>
            {upcomingCount > 0
              ? `You have ${upcomingCount} task${upcomingCount !== 1 ? 's' : ''} scheduled in the next 24 hours.`
              : 'Ready to blitz through your day?'}
          </p>
        </div>

        {/* Lists header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 14
        }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#888', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Your Lists
          </h2>
          {upcomingCount > 0 && (
            <span style={{ fontSize: 11, color: '#555' }}>
              Lists with upcoming tasks
            </span>
          )}
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 10,
          marginBottom: 20
        }}>
          {/* Create new list card */}
          <CreateCard onClick={() => setShowCreateModal(true)} />

          {/* List cards */}
          {activeLists.map((list) => {
            const listTasks = tasks.filter((t) => t.listId === list.id)
            return (
              <ListCard
                key={list.id}
                list={list}
                tasks={listTasks}
                onOpen={() => openList(list.id)}
              />
            )
          })}
        </div>

        {/* Archived lists */}
        {archivedLists.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => setShowArchived((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: '#555',
                padding: '4px 0', marginBottom: showArchived ? 12 : 0,
                transition: 'color 0.15s'
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#888')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#555')}
            >
              <span style={{
                transform: showArchived ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.15s', display: 'inline-block', fontSize: 10
              }}>▶</span>
              Archived lists ({archivedLists.length})
            </button>

            {showArchived && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 10
              }}>
                {archivedLists.map((list) => {
                  const listTasks = tasks.filter((t) => t.listId === list.id)
                  return (
                    <div key={list.id} style={{ opacity: 0.5 }}>
                      <ListCard list={list} tasks={listTasks} onOpen={() => openList(list.id)} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{
        height: 56,
        background: '#141414',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 8,
        flexShrink: 0
      }}>
        <NavPill active label="Home" onClick={() => {}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 5.5L7 2L12 5.5V12H9V9H5V12H2V5.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </NavPill>
        <NavPill label="Reports" onClick={() => setView('reports')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="7" width="2.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
            <rect x="5.5" y="4.5" width="2.5" height="8" rx="1" stroke="currentColor" strokeWidth="1.1"/>
            <rect x="9.5" y="1.5" width="2.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.1"/>
          </svg>
        </NavPill>

        <div style={{ flex: 1 }} />

        {/* Add new task CTA */}
        <button
          onClick={() => {
            void setCompact(true)
            void setAlwaysOnTop(true)
            setView('today')
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 999,
            background: '#1D9E75',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 0.15s'
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.88')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="7" y1="2" x2="7" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="2" y1="7" x2="12" y2="7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Add new task
        </button>

        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#666', fontSize: 13,
            cursor: 'pointer', transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#999'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#666'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.1"/>
            <line x1="6.5" y1="5.5" x2="6.5" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="6.5" cy="4" r="0.7" fill="currentColor"/>
          </svg>
          Help
        </button>
      </div>

      {/* Create list modal */}
      {showCreateModal && <CreateListModal onClose={() => setShowCreateModal(false)} />}
    </div>
  )
}

// ── Sub-components ──────────────────────────────

function CreateCard({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        background: hov ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: `1px dashed ${hov ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 8, cursor: 'pointer',
        minHeight: 160,
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        border: `1.5px dashed ${hov ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? '#888' : '#555', fontSize: 20, lineHeight: 1
      }}>
        +
      </div>
      <span style={{ fontSize: 13, color: hov ? '#888' : '#555', fontWeight: 500 }}>
        Create new list
      </span>
    </div>
  )
}

function NavBtn({ children, onClick, title }: {
  children: React.ReactNode; onClick: () => void; title?: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="titlebar-no-drag"
      style={{
        width: 28, height: 28, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#666', transition: 'all 0.15s'
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#aaa'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#666'
      }}
    >
      {children}
    </button>
  )
}

function NavPill({ children, label, onClick, active = false }: {
  children: React.ReactNode; label: string; onClick: () => void; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 8,
        fontSize: 13,
        color:      active ? '#fff'                      : '#666',
        background: active ? 'rgba(255,255,255,0.08)'   : 'transparent',
        fontWeight: active ? 500 : 400,
        transition: 'all 0.15s'
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#999'
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#666'
      }}
    >
      {children}
      {label}
    </button>
  )
}
