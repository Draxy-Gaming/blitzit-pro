import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store'
import type { Task } from '../../types'

interface Props {
  task: Task
  onClose: () => void
}

/**
 * Inline notes editor that appears during Blitz mode.
 * Supports: bold, italic, underline, strikethrough, links, bullet list, numbered list.
 */
export default function NotesPanel({ task, onClose }: Props) {
  const { updateTask } = useStore()
  const editorRef = useRef<HTMLDivElement>(null)
  const [wordCount, setWordCount] = useState(0)

  // Load existing note content
  useEffect(() => {
    if (editorRef.current && task.note?.content) {
      editorRef.current.innerHTML = task.note.content
      countWords()
    }
  }, [])

  const countWords = () => {
    const text = editorRef.current?.innerText ?? ''
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length)
  }

  const save = () => {
    if (!editorRef.current) return
    const html  = editorRef.current.innerHTML
    const text  = editorRef.current.innerText ?? ''

    // Extract URLs from the content
    const urlRegex = /https?:\/\/[^\s<>"]+/g
    const links = Array.from(html.matchAll(urlRegex)).map((m) => m[0])

    updateTask(task.id, {
      note: {
        content: html,
        links: [...new Set(links)],
        updatedAt: Date.now()
      }
    })
  }

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    editorRef.current?.focus()
    save()
  }

  const handleInput = () => {
    countWords()
    save()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Bold: ⌘B, Italic: ⌘I, Underline: ⌘U — these are already handled by execCommand
    // Save on any change
    if (e.key === 'Escape') {
      save()
      onClose()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        animation: 'fadeIn 200ms ease both'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
          Notes
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => { save(); onClose() }}
            style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '2px 6px' }}
          >
            Done
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '6px 10px',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <ToolBtn title="Bold (⌘B)"          onClick={() => exec('bold')}>          <b style={{fontSize:12}}>B</b> </ToolBtn>
        <ToolBtn title="Italic (⌘I)"        onClick={() => exec('italic')}>        <i style={{fontSize:12}}>I</i> </ToolBtn>
        <ToolBtn title="Link"               onClick={() => {
          const url = prompt('Enter URL:')
          if (url) exec('createLink', url)
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 7.5L7.5 4.5M5 3.5L5.5 3A2.5 2.5 0 0 1 9 6.5L8.5 7M7 8.5L6.5 9A2.5 2.5 0 0 1 3 5.5L3.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Underline (⌘U)"     onClick={() => exec('underline')}>     <u style={{fontSize:12}}>U</u> </ToolBtn>
        <ToolBtn title="Strikethrough"      onClick={() => exec('strikeThrough')}> <s style={{fontSize:12}}>S</s> </ToolBtn>

        <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 4px' }} />

        <ToolBtn title="Bullet list"        onClick={() => exec('insertUnorderedList')}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="2" cy="4" r="1" fill="currentColor"/>
            <circle cx="2" cy="8" r="1" fill="currentColor"/>
            <line x1="5" y1="4" x2="11" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Numbered list"      onClick={() => exec('insertOrderedList')}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <text x="1" y="5" style={{fontSize:'6px'}} fill="currentColor">1.</text>
            <text x="1" y="10" style={{fontSize:'6px'}} fill="currentColor">2.</text>
            <line x1="5" y1="4" x2="11" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </ToolBtn>

        <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 4px' }} />

        {/* Mic placeholder — Phase 10 */}
        <ToolBtn title="Voice note (coming soon)" onClick={() => {}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="1" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M2 6a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            <line x1="6" y1="10" x2="6" y2="11.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </ToolBtn>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder="Enter your notes..."
        style={{
          minHeight: 100,
          maxHeight: 200,
          overflowY: 'auto',
          padding: '10px 12px',
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          outline: 'none'
        }}
      />

      <style>{`
        [contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: var(--text-tertiary);
          pointer-events: none;
        }
        [contenteditable] a { color: var(--accent-teal); text-decoration: underline; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 18px; }
        [contenteditable] li { margin: 2px 0; }
      `}</style>
    </div>
  )
}

function ToolBtn({
  children, onClick, title
}: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      style={{
        width: 24,
        height: 24,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        fontSize: 12,
        transition: 'all 120ms'
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
      }}
    >
      {children}
    </button>
  )
}
