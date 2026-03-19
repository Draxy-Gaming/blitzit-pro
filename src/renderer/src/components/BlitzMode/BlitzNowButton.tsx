interface Props {
  onClick: () => void
  disabled?: boolean
  label?: string
}

/**
 * The signature gradient pill CTA button.
 * Pink → Purple → Green gradient, glows on hover.
 */
export default function BlitzNowButton({ onClick, disabled = false, label = 'Blitzit now' }: Props) {
  return (
    <div style={{ padding: '8px 0 2px', position: 'relative' }}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 999,
          background: disabled
            ? 'var(--bg-card)'
            : 'linear-gradient(135deg, #EC4899 0%, #A855F7 45%, #22c55e 100%)',
          color: disabled ? 'var(--text-tertiary)' : '#fff',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.01em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          cursor: disabled ? 'default' : 'pointer',
          border: 'none',
          transition: 'opacity 200ms, transform 100ms',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = '0.92'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '1'
        }}
        onMouseDown={(e) => {
          if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
        }}
      >
        {/* Rocket icon */}
        {!disabled && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C8 2 5 5 4 9L7 10L8 13C10 12 12 10 13 8C14 5 12 2 8 2Z" fill="white" fillOpacity="0.9"/>
            <circle cx="7.5" cy="8.5" r="1.5" fill="white" fillOpacity="0.6"/>
            <path d="M4 9L2 11L5 12L4 9Z" fill="white" fillOpacity="0.7"/>
          </svg>
        )}
        {label}
      </button>
    </div>
  )
}
