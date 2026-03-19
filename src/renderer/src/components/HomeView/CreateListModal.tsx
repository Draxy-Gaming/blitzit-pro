import { useState } from 'react'
import { useStore } from '../../store'

const PRESET_COLORS = [
  '#7F77DD', '#1D9E75', '#EC4899', '#F97316',
  '#378ADD', '#EF9F27', '#D85A30', '#4ade80'
]

interface Props { onClose: () => void }

export default function CreateListModal({ onClose }: Props) {
  const { addList, lists } = useStore()
  const [name,  setName]  = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon,  setIcon]  = useState('')

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addList({
      name: trimmed,
      color,
      iconChar: icon.trim().slice(0, 2) || trimmed[0].toUpperCase(),
      archived: false,
      sortOrder: lists.length
    })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200
      }}
      onClick={onClose}
    >
      <div
        className="titlebar-no-drag"
        style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '24px',
          width: 340,
          animation: 'fadeIn 150ms ease both'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 20 }}>
          New list
        </h3>

        {/* Name input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>
            Name
          </label>
          <input
            className="titlebar-no-drag"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose() }}
            placeholder="e.g. Work, Personal, Side project..."
            style={{
              width: '100%', padding: '9px 12px',
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, fontSize: 13, color: '#e8e8e8', outline: 'none'
            }}
            onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(29,158,117,0.5)')}
            onBlur={(e)  => ((e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Icon letter */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>
            Icon (1-2 characters, optional)
          </label>
          <input
            className="titlebar-no-drag"
            value={icon}
            maxLength={2}
            onChange={(e) => setIcon(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={name ? name[0]?.toUpperCase() : 'A'}
            style={{
              width: 60, padding: '9px 12px',
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, fontSize: 13, color: '#e8e8e8', outline: 'none',
              textAlign: 'center'
            }}
          />
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 8 }}>
            Color
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: c,
                  border: color === c ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.1s'
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
              />
            ))}
          </div>
        </div>

        {/* Preview badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff'
          }}>
            {icon.trim().slice(0, 2) || (name ? name[0]?.toUpperCase() : '?')}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8' }}>
            {name || 'List name'}
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8,
              fontSize: 13, color: '#888',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            style={{
              padding: '8px 20px', borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              background: name.trim() ? '#1D9E75' : 'rgba(255,255,255,0.08)',
              color: name.trim() ? '#fff' : '#555',
              transition: 'all 0.15s', cursor: name.trim() ? 'pointer' : 'default'
            }}
          >
            Create list
          </button>
        </div>
      </div>
    </div>
  )
}
