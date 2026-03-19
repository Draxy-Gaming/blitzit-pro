import { useState } from 'react'
import { useStore } from '../../store'

type Tab = 'general' | 'blitz' | 'alerts' | 'about'

export default function SettingsPanel() {
  const { settings, updateSettings, setSettingsOpen } = useStore()
  const [tab, setTab] = useState<Tab>('general')

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 998, backdropFilter: 'blur(4px)'
      }}
      onClick={() => setSettingsOpen(false)}
    >
      <div
        style={{
          width: 520, maxHeight: '80vh',
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          animation: 'fadeIn 150ms ease both'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Settings</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            style={{
              width: 26, height: 26, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#666', fontSize: 16, transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#666' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar tabs */}
          <div style={{
            width: 140, borderRight: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0
          }}>
            {([
              { id: 'general', label: 'General'   },
              { id: 'blitz',   label: 'Blitz mode' },
              { id: 'alerts',  label: 'Alerts'     },
              { id: 'about',   label: 'About'      }
            ] as { id: Tab; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  padding: '8px 12px', borderRadius: 7, textAlign: 'left',
                  fontSize: 13,
                  color:      tab === id ? '#fff'                    : '#666',
                  background: tab === id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  fontWeight: tab === id ? 500 : 400,
                  transition: 'all 0.12s'
                }}
                onMouseEnter={(e) => { if (tab !== id) (e.currentTarget as HTMLButtonElement).style.color = '#999' }}
                onMouseLeave={(e) => { if (tab !== id) (e.currentTarget as HTMLButtonElement).style.color = '#666' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {tab === 'general' && (
              <GeneralTab settings={settings} updateSettings={updateSettings} />
            )}
            {tab === 'blitz' && (
              <BlitzTab settings={settings} updateSettings={updateSettings} />
            )}
            {tab === 'alerts' && (
              <AlertsTab settings={settings} updateSettings={updateSettings} />
            )}
            {tab === 'about' && <AboutTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────

function GeneralTab({ settings, updateSettings }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Section label="Appearance">
        <Row label="Theme">
          <SegmentedControl
            options={[
              { value: 'dark',   label: 'Dark'   },
              { value: 'light',  label: 'Light'  },
              { value: 'system', label: 'System' }
            ]}
            value={settings.theme}
            onChange={(v: string) => updateSettings({ theme: v })}
          />
        </Row>
      </Section>

      <Section label="Profile">
        <Row label="Your name">
          <input
            value={settings.userName}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            placeholder="Used in greeting"
            style={{
              padding: '6px 10px', borderRadius: 7, fontSize: 13,
              background: '#141414', border: '1px solid rgba(255,255,255,0.1)',
              color: '#e8e8e8', outline: 'none', width: 160
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </Row>
      </Section>

      <Section label="Tasks">
        <Row label="Default task length">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              min={5} max={480} step={5}
              value={settings.defaultTaskLengthMinutes}
              onChange={(e) => updateSettings({ defaultTaskLengthMinutes: Number(e.target.value) })}
              style={{
                width: 64, padding: '6px 10px', borderRadius: 7, fontSize: 13,
                background: '#141414', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e8e8e8', outline: 'none', textAlign: 'center'
              }}
            />
            <span style={{ fontSize: 12, color: '#666' }}>min</span>
          </div>
        </Row>
      </Section>

      <Section label="Celebration">
        <Row label="Show success screen">
          <Toggle
            value={settings.celebration.showSuccessScreen}
            onChange={(v) => updateSettings({ celebration: { ...settings.celebration, showSuccessScreen: v } })}
          />
        </Row>
        <Row label="Fun gif on completion">
          <Toggle
            value={settings.celebration.showFunGif}
            onChange={(v) => updateSettings({ celebration: { ...settings.celebration, showFunGif: v } })}
          />
        </Row>
        <Row label="Success sound">
          <Select
            value={settings.celebration.successSound}
            onChange={(v) => updateSettings({ celebration: { ...settings.celebration, successSound: v } })}
            options={[
              { value: 'ding',  label: 'Ding'  },
              { value: 'chime', label: 'Chime' },
              { value: 'pop',   label: 'Pop'   },
              { value: 'none',  label: 'None'  }
            ]}
          />
        </Row>
      </Section>
    </div>
  )
}

function BlitzTab({ settings, updateSettings }: any) {
  const bm = settings.blitzMode
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Section label="Blitz mode">
        <Row label="Pomodoros" hint="Work in fixed sprints with breaks">
          <Toggle
            value={bm.pomodoroEnabled}
            onChange={(v) => updateSettings({ blitzMode: { ...bm, pomodoroEnabled: v } })}
          />
        </Row>
        {bm.pomodoroEnabled && (
          <>
            <Row label="Work sprint">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select
                  value={String(bm.workSprintMinutes)}
                  onChange={(v) => updateSettings({ blitzMode: { ...bm, workSprintMinutes: Number(v) } })}
                  options={[15,20,25,30,45,60].map((n) => ({ value: String(n), label: `${n} min` }))}
                />
              </div>
            </Row>
            <Row label="Break time">
              <Select
                value={String(bm.breakMinutes)}
                onChange={(v) => updateSettings({ blitzMode: { ...bm, breakMinutes: Number(v) } })}
                options={[5,10,15,20].map((n) => ({ value: String(n), label: `${n} min` }))}
              />
            </Row>
          </>
        )}
        <Row label="Default break length">
          <Select
            value={String(bm.defaultBreakMinutes)}
            onChange={(v) => updateSettings({ blitzMode: { ...bm, defaultBreakMinutes: Number(v) } })}
            options={[5,10,15,20,30].map((n) => ({ value: String(n), label: `${n} min` }))}
          />
        </Row>
      </Section>
    </div>
  )
}

function AlertsTab({ settings, updateSettings }: any) {
  const al = settings.alerts
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Section label="Alerts">
        <Row label="Timed alerts during task" hint="Remind you how long you've been working">
          <Toggle
            value={al.timedAlertsEnabled}
            onChange={(v) => updateSettings({ alerts: { ...al, timedAlertsEnabled: v } })}
          />
        </Row>
        {al.timedAlertsEnabled && (
          <>
            <Row label="Alert every">
              <Select
                value={String(al.alertIntervalMinutes)}
                onChange={(v) => updateSettings({ alerts: { ...al, alertIntervalMinutes: Number(v) } })}
                options={[10,15,20,30,45,60].map((n) => ({ value: String(n), label: `${n} minutes` }))}
              />
            </Row>
            <Row label="Alert sound">
              <Select
                value={al.alertSound}
                onChange={(v) => updateSettings({ alerts: { ...al, alertSound: v } })}
                options={[
                  { value: 'ding', label: 'Ding' },
                  { value: 'ping', label: 'Ping' },
                  { value: 'bell', label: 'Bell' },
                  { value: 'none', label: 'None' }
                ]}
              />
            </Row>
          </>
        )}
      </Section>
    </div>
  )
}

function AboutTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 12 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'linear-gradient(135deg, #7F77DD, #1D9E75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M13 2C13 2 8 8 7 15L12 16L13 23C16 21.5 19.5 18 21 14C23 9 20 2 13 2Z" fill="white" fillOpacity="0.9"/>
          <circle cx="12" cy="14" r="2.5" fill="white" fillOpacity="0.5"/>
          <path d="M7 15L3.5 19.5L8.5 21L7 15Z" fill="white" fillOpacity="0.6"/>
        </svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Blitzit</div>
      <div style={{ fontSize: 12, color: '#555' }}>Version 0.1.0 — Beta</div>
      <div style={{ fontSize: 12, color: '#444', textAlign: 'center', maxWidth: 280, lineHeight: 1.7 }}>
        Focus-first task manager. Built with Electron, React, and TypeScript.
      </div>
    </div>
  )
}

// ── Primitives ────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, color: '#555', fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        marginBottom: 10
      }}>
        {label}
      </div>
      <div style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, overflow: 'hidden'
      }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div>
        <div style={{ fontSize: 13, color: '#d0d0d0' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 999,
        background: value ? '#1D9E75' : 'rgba(255,255,255,0.12)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
      }}/>
    </div>
  )
}

function Select({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '5px 10px', borderRadius: 7,
        background: '#1e1e1e',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#d0d0d0', fontSize: 12,
        outline: 'none', cursor: 'pointer'
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function SegmentedControl({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{
      display: 'flex',
      background: '#111',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: 2, gap: 2
    }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12,
            color:      value === o.value ? '#fff'                    : '#666',
            background: value === o.value ? 'rgba(255,255,255,0.12)' : 'transparent',
            fontWeight: value === o.value ? 500 : 400,
            transition: 'all 0.15s', cursor: 'pointer'
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
