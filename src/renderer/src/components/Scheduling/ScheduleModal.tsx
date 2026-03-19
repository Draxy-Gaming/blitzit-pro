import { useState, useMemo } from 'react'
import { useStore } from '../../store'
import type { Task, RecurrenceRule, RecurrenceFrequency } from '../../types'

interface Props {
  task: Task
  onClose: () => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = getDaysInMonth(year, month)
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

export default function ScheduleModal({ task, onClose }: Props) {
  const { tasks, updateTask } = useStore()

  const now = new Date()
  const [calYear,  setCalYear]  = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selDate,  setSelDate]  = useState<Date | null>(
    task.scheduledAt ? new Date(task.scheduledAt) : null
  )
  const [timeHour,   setTimeHour]   = useState(selDate ? selDate.getHours() % 12 || 12 : 9)
  const [timeMin,    setTimeMin]    = useState(selDate ? selDate.getMinutes() : 0)
  const [timeAmPm,   setTimeAmPm]   = useState<'AM'|'PM'>(selDate ? (selDate.getHours() >= 12 ? 'PM' : 'AM') : 'AM')
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency | 'none'>(
    task.recurrence?.frequency ?? 'none'
  )
  const [showTimePicker, setShowTimePicker] = useState(!!task.scheduledAt)

  const weeks = useMemo(() => buildCalendar(calYear, calMonth), [calYear, calMonth])

  // Conflict detection — find other tasks scheduled within 1hr of our target
  const conflicts = useMemo(() => {
    if (!selDate || !showTimePicker) return []
    const h24 = timeAmPm === 'PM' ? (timeHour === 12 ? 12 : timeHour + 12) : (timeHour === 12 ? 0 : timeHour)
    const target = new Date(selDate)
    target.setHours(h24, timeMin, 0, 0)
    const targetMs = target.getTime()
    return tasks.filter((t) => {
      if (t.id === task.id || !t.scheduledAt || t.status === 'done') return false
      const diff = Math.abs(t.scheduledAt - targetMs)
      return diff < 60 * 60 * 1000 // within 1 hour
    })
  }, [selDate, timeHour, timeMin, timeAmPm, showTimePicker, tasks, task.id])

  const handleSave = () => {
    if (!selDate) {
      // Clear schedule
      updateTask(task.id, { scheduledAt: null, scheduledDuration: null, recurrence: null })
      onClose()
      return
    }

    const h24 = timeAmPm === 'PM'
      ? (timeHour === 12 ? 12 : timeHour + 12)
      : (timeHour === 12 ? 0 : timeHour)

    const scheduled = new Date(selDate)
    scheduled.setHours(showTimePicker ? h24 : 0, showTimePicker ? timeMin : 0, 0, 0)

    const rec: RecurrenceRule | null = recurrence === 'none' ? null : {
      frequency: recurrence as RecurrenceFrequency,
      dayOfWeek:   recurrence === 'weekly'  ? scheduled.getDay()  : undefined,
      dayOfMonth:  recurrence === 'monthly' ? scheduled.getDate() : undefined
    }

    updateTask(task.id, {
      scheduledAt:      scheduled.getTime(),
      scheduledDuration: task.estimatedMinutes ?? null,
      recurrence:        rec,
      status:           'today'
    })
    onClose()
  }

  const handleClear = () => {
    updateTask(task.id, { scheduledAt: null, scheduledDuration: null, recurrence: null })
    onClose()
  }

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const isToday = (d: number) => {
    const t = new Date(); return d === t.getDate() && calMonth === t.getMonth() && calYear === t.getFullYear()
  }
  const isSelected = (d: number) =>
    selDate !== null && d === selDate.getDate() && calMonth === selDate.getMonth() && calYear === selDate.getFullYear()

  const isPast = (d: number) => {
    const dt = new Date(calYear, calMonth, d); dt.setHours(23,59,59)
    return dt < now
  }

  return (
    <div
      style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ width:340,background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,0.8)',animation:'fadeIn 150ms ease both' }}
        onClick={(e)=>e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'16px 18px 12px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:14,fontWeight:600,color:'#fff' }}>Schedule task</div>
            <div style={{ fontSize:11,color:'#555',marginTop:2,maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{task.title}</div>
          </div>
          <CloseBtn onClick={onClose}/>
        </div>

        <div style={{ padding:'14px 18px' }}>
          {/* Calendar nav */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <button onClick={prevMonth} style={{ color:'#666',fontSize:16,padding:'2px 6px',borderRadius:5,transition:'all 0.12s' }} onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color='#ccc'} onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='#666'}>‹</button>
            <span style={{ fontSize:13,fontWeight:600,color:'#d0d0d0' }}>{MONTHS_SHORT[calMonth]} {calYear}</span>
            <button onClick={nextMonth} style={{ color:'#666',fontSize:16,padding:'2px 6px',borderRadius:5,transition:'all 0.12s' }} onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color='#ccc'} onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='#666'}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4 }}>
            {DAYS.map(d=>(
              <div key={d} style={{ textAlign:'center',fontSize:10,color:'#555',fontWeight:600,padding:'2px 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display:'flex',flexDirection:'column',gap:2,marginBottom:14 }}>
            {weeks.map((week,wi)=>(
              <div key={wi} style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2 }}>
                {week.map((day,di)=>{
                  if (!day) return <div key={di}/>
                  const past = isPast(day)
                  const sel  = isSelected(day)
                  const tod  = isToday(day)
                  return (
                    <button
                      key={di}
                      disabled={past}
                      onClick={()=>{ const d=new Date(calYear,calMonth,day); setSelDate(d); if(!showTimePicker) setShowTimePicker(false) }}
                      style={{
                        height:30,borderRadius:7,fontSize:12,fontWeight:sel?600:400,
                        background: sel?'#1D9E75':tod?'rgba(29,158,117,0.15)':'transparent',
                        color: sel?'#fff':past?'#333':tod?'#1D9E75':'#ccc',
                        border: tod&&!sel?'1px solid rgba(29,158,117,0.3)':'1px solid transparent',
                        cursor:past?'default':'pointer',
                        transition:'all 0.12s'
                      }}
                      onMouseEnter={e=>{ if(!past&&!sel)(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.07)' }}
                      onMouseLeave={e=>{ if(!past&&!sel)(e.currentTarget as HTMLButtonElement).style.background='transparent' }}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Time picker toggle */}
          {selDate && (
            <div style={{ marginBottom:12 }}>
              <button
                onClick={()=>setShowTimePicker(v=>!v)}
                style={{
                  display:'flex',alignItems:'center',gap:7,
                  fontSize:12,color:showTimePicker?'#1D9E75':'#777',
                  padding:'6px 10px',borderRadius:7,width:'100%',
                  background:showTimePicker?'rgba(29,158,117,0.1)':'rgba(255,255,255,0.04)',
                  border:`1px solid ${showTimePicker?'rgba(29,158,117,0.3)':'rgba(255,255,255,0.08)'}`,
                  transition:'all 0.15s'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/>
                  <line x1="6" y1="3" x2="6" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="8.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {showTimePicker ? 'Set specific time' : 'Add time'}
              </button>

              {showTimePicker && (
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:8,padding:'8px 10px',background:'#141414',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)' }}>
                  <NumInput value={timeHour} min={1} max={12} onChange={setTimeHour}/>
                  <span style={{ color:'#555',fontSize:16,fontWeight:300 }}>:</span>
                  <NumInput value={timeMin} min={0} max={59} pad onChange={setTimeMin}/>
                  <div style={{ display:'flex',gap:3,marginLeft:4 }}>
                    {(['AM','PM'] as const).map(ap=>(
                      <button
                        key={ap}
                        onClick={()=>setTimeAmPm(ap)}
                        style={{
                          padding:'4px 8px',borderRadius:5,fontSize:11,fontWeight:500,
                          background:timeAmPm===ap?'rgba(255,255,255,0.12)':'transparent',
                          color:timeAmPm===ap?'#fff':'#666',
                          border:`1px solid ${timeAmPm===ap?'rgba(255,255,255,0.15)':'transparent'}`,
                          transition:'all 0.12s'
                        }}
                      >{ap}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recurrence */}
          {selDate && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11,color:'#666',marginBottom:6 }}>Recurring schedule</div>
              <div style={{ display:'flex',flexDirection:'column',gap:1 }}>
                {([
                  { value:'none',    label:'No repeat' },
                  { value:'daily',   label:'Every day' },
                  { value:'weekdays',label:'Every weekday' },
                  { value:'weekly',  label:`Every ${DAYS[selDate.getDay()]}` },
                  { value:'monthly', label:`Every month on ${selDate.getDate()}` },
                ] as { value: RecurrenceFrequency|'none'; label:string }[]).map(opt=>(
                  <button
                    key={opt.value}
                    onClick={()=>setRecurrence(opt.value)}
                    style={{
                      display:'flex',alignItems:'center',justifyContent:'space-between',
                      padding:'7px 10px',borderRadius:6,fontSize:12,
                      color:recurrence===opt.value?'#fff':'#888',
                      background:recurrence===opt.value?'rgba(255,255,255,0.07)':'transparent',
                      textAlign:'left',transition:'all 0.1s'
                    }}
                    onMouseEnter={e=>{ if(recurrence!==opt.value)(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.04)' }}
                    onMouseLeave={e=>{ if(recurrence!==opt.value)(e.currentTarget as HTMLButtonElement).style.background='transparent' }}
                  >
                    {recurrence===opt.value && <span style={{ color:'#1D9E75',marginRight:6 }}>✓</span>}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conflict warning */}
          {conflicts.length > 0 && (
            <div style={{ padding:'8px 10px',background:'rgba(249,115,22,0.1)',border:'1px solid rgba(249,115,22,0.25)',borderRadius:8,marginBottom:12 }}>
              <div style={{ fontSize:11,color:'#f97316',fontWeight:600,marginBottom:4 }}>
                Tasks clashing!
              </div>
              <div style={{ fontSize:11,color:'#c2591a' }}>
                You have {conflicts.length} task{conflicts.length>1?'s':''} scheduled nearby:
              </div>
              {conflicts.slice(0,2).map(c=>(
                <div key={c.id} style={{ fontSize:11,color:'#c2591a',marginTop:2 }}>
                  · {c.title.slice(0,32)}{c.title.length>32?'…':''}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display:'flex',gap:6 }}>
            {task.scheduledAt && (
              <button
                onClick={handleClear}
                style={{ padding:'8px 12px',borderRadius:8,fontSize:12,color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)',transition:'all 0.15s',flex:1 }}
                onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(239,68,68,0.07)'}
                onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='transparent'}
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              style={{ padding:'8px 14px',borderRadius:8,fontSize:12,color:'#888',border:'1px solid rgba(255,255,255,0.1)',transition:'all 0.15s',flex:1 }}
              onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='transparent'}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selDate}
              style={{
                padding:'8px 18px',borderRadius:8,fontSize:12,fontWeight:600,flex:2,
                background:selDate?'#1D9E75':'rgba(255,255,255,0.06)',
                color:selDate?'#fff':'#444',
                cursor:selDate?'pointer':'default',
                transition:'all 0.15s'
              }}
              onMouseEnter={e=>{ if(selDate)(e.currentTarget as HTMLButtonElement).style.opacity='0.88' }}
              onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.opacity='1'}
            >
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CloseBtn({ onClick }: { onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ width:26,height:26,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',color:'#666',fontSize:15,transition:'all 0.15s' }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.07)';(e.currentTarget as HTMLButtonElement).style.color='#aaa' }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.background='transparent';(e.currentTarget as HTMLButtonElement).style.color='#666' }}
    >✕</button>
  )
}

function NumInput({ value, min, max, pad=false, onChange }: {
  value:number; min:number; max:number; pad?:boolean; onChange:(n:number)=>void
}) {
  return (
    <input
      type="number" min={min} max={max} value={pad ? String(value).padStart(2,'0') : value}
      onChange={e => {
        const n = parseInt(e.target.value)
        if (!isNaN(n) && n >= min && n <= max) onChange(n)
      }}
      style={{
        width:44, padding:'5px 8px', borderRadius:6,
        background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
        color:'#e8e8e8', fontSize:14, fontWeight:500, textAlign:'center',
        outline:'none', fontVariantNumeric:'tabular-nums'
      }}
    />
  )
}
