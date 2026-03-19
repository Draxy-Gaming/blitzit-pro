import { useState, useMemo } from 'react'
import { useStore } from '../../store'
import type { TimerSession, Task } from '../../types'

type Range = '7d' | '30d' | '90d'
type Granularity = 'daily' | 'weekly' | 'monthly'

// ── helpers ───────────────────────────────────
function fmtMin(min: number): string {
  if (min <= 0) return '0min'
  const h = Math.floor(min / 60), m = min % 60
  if (h > 0 && m > 0) return `${h}hr ${m}min`
  if (h > 0) return `${h}hr`
  return `${m}min`
}
function fmtSec(sec: number): string { return fmtMin(Math.round(sec / 60)) }
function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function shortDay(key: string): string {
  const [,m,d] = key.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

export default function ReportsView() {
  const { tasks, sessions, setView } = useStore()
  const [range, setRange]           = useState<Range>('7d')
  const [gran, setGran]             = useState<Granularity>('daily')

  const cutoff = useMemo(() => {
    const ms = range === '7d' ? 7 : range === '30d' ? 30 : 90
    return Date.now() - ms * 24 * 60 * 60 * 1000
  }, [range])

  // Filter sessions within range
  const filteredSessions = useMemo(() =>
    sessions.filter((s) => s.startedAt >= cutoff),
    [sessions, cutoff]
  )

  // Filter completed tasks within range
  const completedTasks = useMemo(() =>
    tasks.filter((t) => t.completedAt && t.completedAt >= cutoff),
    [tasks, cutoff]
  )

  // ── Metric cards ──────────────────────────
  const totalTrackedSec = filteredSessions.reduce((s, x) => s + x.durationSeconds, 0)
  const totalEstMin     = completedTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)
  const avgAccuracy     = completedTasks.length > 0
    ? Math.round(completedTasks.reduce((s, t) => {
        if (!t.estimatedMinutes || t.trackedSeconds === 0) return s
        return s + Math.min(t.trackedSeconds / (t.estimatedMinutes * 60), 2)
      }, 0) / completedTasks.filter(t => t.estimatedMinutes && t.trackedSeconds > 0).length * 100)
    : 0
  const overtimeTasks   = completedTasks.filter(
    (t) => t.estimatedMinutes && t.trackedSeconds > t.estimatedMinutes * 60
  ).length

  // ── Daily chart data ──────────────────────
  const chartData = useMemo(() => {
    // Build date range
    const days: string[] = []
    const now = new Date(); now.setHours(23,59,59,999)
    const start = new Date(cutoff); start.setHours(0,0,0,0)
    const cur = new Date(start)
    while (cur <= now) {
      days.push(dayKey(cur.getTime()))
      cur.setDate(cur.getDate() + 1)
    }

    // Map sessions to days
    const trackedByDay: Record<string, number> = {}
    const estByDay: Record<string, number> = {}
    days.forEach((d) => { trackedByDay[d] = 0; estByDay[d] = 0 })

    filteredSessions.forEach((s) => {
      const k = dayKey(s.startedAt)
      if (k in trackedByDay) trackedByDay[k] += s.durationSeconds
    })
    completedTasks.forEach((t) => {
      if (!t.completedAt) return
      const k = dayKey(t.completedAt)
      if (k in estByDay) estByDay[k] += (t.estimatedMinutes ?? 0) * 60
    })

    // If monthly, aggregate
    if (gran === 'monthly') {
      const months: Record<string, { tracked: number; est: number; label: string }> = {}
      days.forEach((d) => {
        const [y, m] = d.split('-')
        const mk = `${y}-${m}`
        const label = new Date(parseInt(y), parseInt(m)-1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        if (!months[mk]) months[mk] = { tracked: 0, est: 0, label }
        months[mk].tracked += trackedByDay[d] ?? 0
        months[mk].est     += estByDay[d]     ?? 0
      })
      return Object.entries(months).map(([k, v]) => ({
        key: k, label: v.label, tracked: v.tracked, est: v.est
      }))
    }

    // If weekly, aggregate
    if (gran === 'weekly') {
      const weeks: Record<string, { tracked: number; est: number; label: string }> = {}
      days.forEach((d) => {
        const dt = new Date(d)
        // Week starting Monday
        const dow = (dt.getDay() + 6) % 7
        const mon = new Date(dt); mon.setDate(dt.getDate() - dow)
        const wk = dayKey(mon.getTime())
        if (!weeks[wk]) weeks[wk] = { tracked: 0, est: 0, label: `W ${shortDay(wk)}` }
        weeks[wk].tracked += trackedByDay[d] ?? 0
        weeks[wk].est     += estByDay[d]     ?? 0
      })
      return Object.entries(weeks).map(([k, v]) => ({
        key: k, label: v.label, tracked: v.tracked, est: v.est
      }))
    }

    return days.map((d) => ({
      key: d, label: shortDay(d),
      tracked: trackedByDay[d], est: estByDay[d]
    }))
  }, [filteredSessions, completedTasks, cutoff, gran])

  const maxSec = Math.max(...chartData.map((d) => Math.max(d.tracked, d.est)), 1)

  // ── Per-list breakdown ────────────────────
  const { lists } = useStore()
  const listBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSessions.forEach((s) => {
      map[s.listId] = (map[s.listId] ?? 0) + s.durationSeconds
    })
    return Object.entries(map)
      .map(([id, sec]) => ({
        list: lists.find((l) => l.id === id),
        sec
      }))
      .filter((x) => x.list)
      .sort((a, b) => b.sec - a.sec)
  }, [filteredSessions, lists])

  const totalListSec = listBreakdown.reduce((s, x) => s + x.sec, 0) || 1

  // ── Overtime breakdown ────────────────────
  const overtimeList = useMemo(() =>
    completedTasks
      .filter((t) => t.estimatedMinutes && t.trackedSeconds > t.estimatedMinutes * 60)
      .sort((a, b) => {
        const aOver = a.trackedSeconds - (a.estimatedMinutes! * 60)
        const bOver = b.trackedSeconds - (b.estimatedMinutes! * 60)
        return bOver - aOver
      })
      .slice(0, 5),
    [completedTasks]
  )

  return (
    <div style={{ width:'100%', height:'100%', background:'#111', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Titlebar */}
      <div className="titlebar-drag" style={{ height:44, background:'#141414', display:'flex', alignItems:'center', padding:'0 16px', gap:10, borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        {process.platform === 'darwin' && <div style={{ width:52 }}/>}
        <button
          className="titlebar-no-drag"
          onClick={() => setView('home')}
          style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#888', padding:'4px 8px', borderRadius:6, transition:'all 0.15s' }}
          onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color='#ccc' }}
          onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.background='transparent'; (e.currentTarget as HTMLButtonElement).style.color='#888' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          BACK
        </button>
        <span style={{ fontSize:14, fontWeight:600, color:'#fff' }}>Reports</span>

        {/* Range selector */}
        <div className="titlebar-no-drag" style={{ marginLeft:'auto', display:'flex', gap:3 }}>
          {(['7d','30d','90d'] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding:'4px 10px', borderRadius:6, fontSize:12,
              color: range===r ? '#fff' : '#666',
              background: range===r ? 'rgba(255,255,255,0.1)' : 'transparent',
              fontWeight: range===r ? 500 : 400,
              transition:'all 0.12s'
            }}>
              {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 40px' }}>

        {/* Metric cards row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
          {[
            { label:'Time tracked',     value: fmtSec(totalTrackedSec),    sub: `${range}` },
            { label:'Tasks completed',  value: String(completedTasks.length), sub: `${range}` },
            { label:'Estimated vs done',value: fmtMin(totalEstMin),         sub: 'total estimated' },
            { label:'Overtime tasks',   value: String(overtimeTasks),       sub: 'went over estimate', warn: overtimeTasks > 0 },
          ].map(({ label, value, sub, warn }) => (
            <div key={label} style={{
              background:'#191919', border:`1px solid ${warn && overtimeTasks > 0 ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius:10, padding:'14px 16px'
            }}>
              <div style={{ fontSize:11, color:'#555', marginBottom:6 }}>{label}</div>
              <div style={{ fontSize:22, fontWeight:700, color: warn && overtimeTasks > 0 ? '#f97316' : '#fff', letterSpacing:'-0.02em' }}>{value}</div>
              <div style={{ fontSize:10, color:'#444', marginTop:3 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Chart header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#888' }}>Time tracked vs estimated</span>
          <div style={{ display:'flex', gap:3 }}>
            {(['daily','weekly','monthly'] as Granularity[]).map((g) => (
              <button key={g} onClick={() => setGran(g)} style={{
                padding:'4px 10px', borderRadius:6, fontSize:11,
                color: gran===g ? '#fff' : '#555',
                background: gran===g ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition:'all 0.12s'
              }}>
                {g.charAt(0).toUpperCase()+g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ background:'#191919', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'16px', marginBottom:20 }}>
          {filteredSessions.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              {/* Legend */}
              <div style={{ display:'flex', gap:16, marginBottom:14 }}>
                <LegendDot color="#1D9E75" label="Tracked"/>
                <LegendDot color="rgba(255,255,255,0.12)" label="Estimated"/>
              </div>

              {/* Bars */}
              <div style={{ display:'flex', alignItems:'flex-end', gap: chartData.length > 20 ? 2 : 4, height:140, overflowX:'auto' }}>
                {chartData.map((d) => {
                  const trackedH = maxSec > 0 ? (d.tracked / maxSec) * 120 : 0
                  const estH     = maxSec > 0 ? (d.est     / maxSec) * 120 : 0
                  return (
                    <div key={d.key} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flex: chartData.length <= 14 ? 1 : undefined, minWidth: chartData.length > 14 ? 20 : undefined }}>
                      <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:120 }}>
                        <div title={`Tracked: ${fmtSec(d.tracked)}`} style={{ width: chartData.length <= 14 ? '100%' : 8, minWidth:6, height:Math.max(trackedH,1), background:'#1D9E75', borderRadius:'3px 3px 0 0', transition:'height 0.4s ease', opacity:0.9 }}/>
                        {d.est > 0 && <div title={`Est: ${fmtSec(d.est)}`} style={{ width: chartData.length <= 14 ? '100%' : 8, minWidth:6, height:Math.max(estH,1), background:'rgba(255,255,255,0.12)', borderRadius:'3px 3px 0 0', transition:'height 0.4s ease' }}/>}
                      </div>
                      <span style={{ fontSize:9, color:'#444', textAlign:'center', whiteSpace:'nowrap' }}>{d.label}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>


        {/* Completed tasks over time — line chart */}
        <div style={{ fontSize:13, fontWeight:600, color:'#888', marginBottom:12, marginTop:4 }}>
          Tasks completed over time
        </div>
        <div style={{ background:'#191919', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'16px', marginBottom:20 }}>
          {completedTasks.length === 0 ? (
            <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#444' }}>
              No completed tasks in this period
            </div>
          ) : (
            <LineChart data={chartData} />
          )}
        </div>

        {/* Bottom row: list breakdown + overtime */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          {/* Per-list breakdown */}
          <div style={{ background:'#191919', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'16px' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#888', marginBottom:14 }}>Time by list</div>
            {listBreakdown.length === 0 ? (
              <div style={{ fontSize:12, color:'#444', textAlign:'center', padding:'16px 0' }}>No data yet</div>
            ) : (
              listBreakdown.map(({ list, sec }) => {
                const pct = Math.round(sec / totalListSec * 100)
                return (
                  <div key={list!.id} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:12, height:12, borderRadius:3, background:list!.color }}/>
                        <span style={{ fontSize:12, color:'#d0d0d0' }}>{list!.name}</span>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{ fontSize:11, color:'#555' }}>{pct}%</span>
                        <span style={{ fontSize:11, color:'#888' }}>{fmtSec(sec)}</span>
                      </div>
                    </div>
                    <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:list!.color, borderRadius:2, opacity:0.7, transition:'width 0.4s ease' }}/>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Overtime list */}
          <div style={{ background:'#191919', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'16px' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#888', marginBottom:14 }}>Most overtime tasks</div>
            {overtimeList.length === 0 ? (
              <div style={{ fontSize:12, color:'#444', textAlign:'center', padding:'16px 0' }}>No overtime — great work!</div>
            ) : (
              overtimeList.map((t) => {
                const overSec  = t.trackedSeconds - (t.estimatedMinutes! * 60)
                const overPct  = Math.round(overSec / (t.estimatedMinutes! * 60) * 100)
                return (
                  <div key={t.id} style={{ marginBottom:10, paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize:12, color:'#d0d0d0', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {t.title}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:11, color:'#555' }}>Est: {fmtMin(t.estimatedMinutes!)}</span>
                      <span style={{ fontSize:11, color:'#f97316' }}>+{fmtSec(overSec)} ({overPct}%)</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div>
      </div>
    </div>
  )
}


function LineChart({ data }: { data: { key: string; label: string; tracked: number; est: number }[] }) {
  // Count completions per day from tasks (approximated from tracked sessions)
  const maxVal = Math.max(...data.map(d => d.tracked > 0 ? 1 : 0), 1)
  const W = 100 / (data.length || 1)
  const H = 80
  
  // Build SVG polyline points
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100
    const y = d.tracked > 0 ? 10 : H - 10
    return `${x},${y}`
  }).join(' ')

  const nonZero = data.filter(d => d.tracked > 0).length

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: H }}>
        {data.map((d, i) => {
          const h = d.tracked > 0 ? Math.max(6, (d.tracked / Math.max(...data.map(x => x.tracked), 1)) * (H - 20)) : 0
          return (
            <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: H, justifyContent: 'flex-end' }}>
              {h > 0 && (
                <div style={{
                  width: '100%', height: h,
                  background: 'linear-gradient(180deg, #5DCAA5, #1D9E75)',
                  borderRadius: '3px 3px 0 0',
                  opacity: 0.8,
                  transition: 'height 0.4s ease'
                }}/>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 9, color: '#444' }}>{data[0]?.label}</span>
        <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{nonZero} active days</span>
        <span style={{ fontSize: 9, color: '#444' }}>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color:string; label:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <div style={{ width:8, height:8, borderRadius:2, background:color }}/>
      <span style={{ fontSize:11, color:'#555' }}>{label}</span>
    </div>
  )
}

function EmptyChart() {
  return (
    <div style={{ height:140, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="2" y="14" width="5" height="12" rx="1.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3"/>
        <rect x="10" y="9"  width="5" height="17" rx="1.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3"/>
        <rect x="18" y="4"  width="5" height="22" rx="1.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3"/>
      </svg>
      <span style={{ fontSize:12, color:'#444' }}>No sessions tracked yet</span>
      <span style={{ fontSize:11, color:'#333' }}>Start a timer to see data here</span>
    </div>
  )
}
