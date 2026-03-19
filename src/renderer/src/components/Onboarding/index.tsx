import { useState } from 'react'
import { useStore } from '../../store'

const STEPS = [
  {
    emoji: '⚡',
    title: 'Welcome to Blitzit',
    body: 'The focus-first task manager. Add your tasks, hit Blitzit now, and get into flow.',
    cta: 'Get started'
  },
  {
    emoji: '📋',
    title: 'Organise with Lists',
    body: 'Create lists for different areas of your life — Work, Personal, Side projects. Each list has its own Backlog → This Week → Today → Done board.',
    cta: 'Got it'
  },
  {
    emoji: '⏱',
    title: 'Track time as you work',
    body: 'Click any task to start the timer. Blitzit tracks how long you actually spend vs how long you estimated. No more guessing.',
    cta: 'Nice'
  },
  {
    emoji: '🚀',
    title: 'Blitz through your day',
    body: 'Hit "Blitzit now" to enter focus mode. Work through your Today list one task at a time. Celebrate every win.',
    cta: "Let's blitz"
  }
]

interface Props { onDone: () => void }

export default function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const { updateSettings, addList } = useStore()
  const [name, setName] = useState('')

  const isLast  = step === STEPS.length - 1
  const isFirst = step === 0

  const handleNext = () => {
    if (isLast) {
      // Save name, mark onboarded
      if (name.trim()) updateSettings({ userName: name.trim() })
      updateSettings({ theme: 'dark' })
      // Create a sample list
      addList({ name: 'Work', color: '#7F77DD', iconChar: 'W', archived: false, sortOrder: 0 })
      addList({ name: 'Personal', color: '#1D9E75', iconChar: 'P', archived: false, sortOrder: 1 })
      onDone()
    } else {
      setStep((s) => s + 1)
    }
  }

  const cur = STEPS[step]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0e0e0e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        width: 420, padding: '48px 40px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        animation: 'fadeIn 250ms ease both'
      }}>
        {/* Logo */}
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: 'linear-gradient(135deg, #7F77DD, #1D9E75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 4
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2C14 2 9 8 8 15L13 16L14 23C17 21.5 20.5 18 22 14C24 9 21 2 14 2Z" fill="white" fillOpacity="0.95"/>
            <circle cx="13" cy="14" r="2.5" fill="white" fillOpacity="0.5"/>
            <path d="M8 15L4.5 19.5L9.5 21L8 15Z" fill="white" fillOpacity="0.65"/>
          </svg>
        </div>

        {/* Emoji */}
        <div style={{ fontSize: 48, lineHeight: 1, animation: 'popIn 350ms cubic-bezier(0.16,1,0.3,1) both' }}>
          {cur.emoji}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>
          {cur.title}
        </h1>

        {/* Body */}
        <p style={{ fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 1.65, maxWidth: 320 }}>
          {cur.body}
        </p>

        {/* Name input on first step */}
        {isFirst && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
            placeholder="What's your name? (optional)"
            style={{
              width: '100%', padding: '11px 16px',
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, fontSize: 14, color: '#e8e8e8', outline: 'none',
              textAlign: 'center'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        )}

        {/* CTA button */}
        <button
          onClick={handleNext}
          style={{
            width: '100%', padding: '13px 0',
            borderRadius: 999,
            background: isLast
              ? 'linear-gradient(135deg, #EC4899 0%, #A855F7 50%, #22c55e 100%)'
              : '#1D9E75',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', transition: 'opacity 150ms',
            border: 'none'
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.9')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
        >
          {cur.cta}
        </button>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                width:  i === step ? 20 : 7,
                height: 7,
                borderRadius: 999,
                background: i === step ? '#1D9E75' : 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)'
              }}
            />
          ))}
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={onDone}
            style={{ fontSize: 12, color: '#444', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#777')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#444')}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  )
}
