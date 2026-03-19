// ─────────────────────────────────────────────
// Core data types for Blitzit
// ─────────────────────────────────────────────

export type TaskStatus = 'backlog' | 'this-week' | 'today' | 'done'

export interface Subtask {
  id: string
  title: string
  completed: boolean
  createdAt: number
}

export interface TaskNote {
  content: string          // rich text (we'll use a simple JSON format)
  links: string[]          // extracted URLs for auto-open
  updatedAt: number
}

export interface IntegrationBadge {
  type: 'notion' | 'youtube' | 'figma' | 'framer' | 'google' | 'custom'
  url?: string
  label?: string
  color: string            // hex color for the badge
  iconChar: string         // letter shown in badge
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  listId: string

  // Time
  estimatedMinutes: number | null   // null = no estimate set
  trackedSeconds: number            // total time tracked (sum of all sessions)
  timerStartedAt: number | null     // epoch ms — null if not running

  // Content
  subtasks: Subtask[]
  note: TaskNote | null
  integrations: IntegrationBadge[]

  // Scheduling
  scheduledAt: number | null        // epoch ms
  scheduledDuration: number | null  // minutes
  recurrence: RecurrenceRule | null

  // Meta
  createdAt: number
  updatedAt: number
  completedAt: number | null
  sortOrder: number                 // for manual ordering within a column
}

export type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  dayOfWeek?: number               // 0-6 for weekly
  dayOfMonth?: number              // 1-31 for monthly
}

// ─────────────────────────────────────────────
// List (project/workspace)
// ─────────────────────────────────────────────

export interface TaskList {
  id: string
  name: string
  color: string            // hex
  iconChar: string         // emoji or single letter shown as badge
  archived: boolean
  createdAt: number
  sortOrder: number
}

// ─────────────────────────────────────────────
// Timer session (for reports)
// ─────────────────────────────────────────────

export interface TimerSession {
  id: string
  taskId: string
  listId: string
  startedAt: number        // epoch ms
  endedAt: number          // epoch ms
  durationSeconds: number
}

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

export interface BlitzModeSettings {
  pomodoroEnabled: boolean
  workSprintMinutes: number    // default 25
  breakMinutes: number         // default 5
  defaultBreakMinutes: number  // default 15
}

export interface CelebrationSettings {
  showSuccessScreen: boolean
  showFunGif: boolean
  successSound: 'ding' | 'chime' | 'pop' | 'none'
}

export interface AlertSettings {
  timedAlertsEnabled: boolean
  alertIntervalMinutes: number  // every X minutes during a task
  alertSound: 'ding' | 'ping' | 'bell' | 'none'
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  defaultTaskLengthMinutes: number   // fallback estimate
  blitzMode: BlitzModeSettings
  celebration: CelebrationSettings
  alerts: AlertSettings
  userName: string
}

// ─────────────────────────────────────────────
// App state shape (Zustand store)
// ─────────────────────────────────────────────

export interface AppState {
  // Data
  lists: TaskList[]
  tasks: Task[]
  sessions: TimerSession[]
  settings: AppSettings

  // UI state
  activeTaskId: string | null       // currently running timer
  activeListId: string | null       // which list board is open
  view: 'home' | 'board' | 'reports' | 'today'
  searchOpen: boolean
  settingsOpen: boolean

  // Actions — tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  completeTask: (id: string) => void

  // Actions — timer
  startTimer: (taskId: string) => void
  pauseTimer: (taskId: string) => void
  stopTimer: (taskId: string) => void

  // Actions — subtasks
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void

  // Actions — lists
  addList: (list: Omit<TaskList, 'id' | 'createdAt'>) => void
  updateList: (id: string, updates: Partial<TaskList>) => void
  archiveList: (id: string) => void
  deleteList: (id: string) => void

  // Actions — settings
  updateSettings: (updates: Partial<AppSettings>) => void

  // Actions — UI
  setView: (view: AppState['view']) => void
  openList: (listId: string) => void
  setSearchOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
}

// ─────────────────────────────────────────────
// Electron window API (injected by preload)
// ─────────────────────────────────────────────

export interface ElectronAPI {
  getTheme: () => Promise<'dark' | 'light'>
  openExternal: (url: string) => void
  store: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<void>
    delete: (key: string) => Promise<void>
  }
}

// ─────────────────────────────────────────────
// Electron window API (matches preload/index.ts)
// ─────────────────────────────────────────────
export interface ElectronAPI {
  store: {
    get:    (key: string) => Promise<unknown>
    set:    (key: string, value: unknown) => Promise<void>
    delete: (key: string) => Promise<void>
    getAll: () => Promise<Record<string, unknown>>
    setAll: (data: Record<string, unknown>) => Promise<void>
    clear:  () => Promise<void>
  }
  getTheme: () => Promise<'dark' | 'light'>
  openExternal: (url: string) => void
  window: {
    minimize:       () => void
    close:          () => void
    setAlwaysOnTop: (v: boolean) => Promise<void>
    getAlwaysOnTop: () => Promise<boolean>
    setCompact:     (v: boolean) => Promise<void>
    getCompact:     () => Promise<boolean>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
