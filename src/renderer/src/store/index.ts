import { create } from 'zustand'
import { persist, type StateStorage } from 'zustand/middleware'
import type {
  AppState, Task, TaskList, TaskStatus,
  AppSettings, TimerSession
} from '../types'

// ─────────────────────────────────────────────
// electron-store storage adapter for Zustand
// Falls back to localStorage in browser/dev context
// ─────────────────────────────────────────────
const electronStorage: StateStorage = {
  getItem: async (name: string) => {
    if (window.electron?.store) {
      const val = await window.electron.store.get(name)
      return typeof val === 'string' ? val : val ? JSON.stringify(val) : null
    }
    return localStorage.getItem(name)
  },
  setItem: async (name: string, value: string) => {
    if (window.electron?.store) {
      await window.electron.store.set(name, value)
    } else {
      localStorage.setItem(name, value)
    }
  },
  removeItem: async (name: string) => {
    if (window.electron?.store) {
      await window.electron.store.delete(name)
    } else {
      localStorage.removeItem(name)
    }
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

// Track onboarding state separately
let _onboarded: boolean | null = null

const defaultSettings: AppSettings = {
  theme: 'dark',
  defaultTaskLengthMinutes: 30,
  userName: '',
  blitzMode: {
    pomodoroEnabled: false,
    workSprintMinutes: 25,
    breakMinutes: 5,
    defaultBreakMinutes: 15
  },
  celebration: {
    showSuccessScreen: true,
    showFunGif: true,
    successSound: 'ding'
  },
  alerts: {
    timedAlertsEnabled: true,
    alertIntervalMinutes: 30,
    alertSound: 'ping'
  }
}

const sampleListId = 'list-sample-001'
const sampleList: TaskList = {
  id: sampleListId,
  name: 'My Tasks',
  color: '#7F77DD',
  iconChar: 'M',
  archived: false,
  createdAt: Date.now(),
  sortOrder: 0
}

const sampleTasks: Task[] = [
  {
    id: 'task-sample-001',
    title: 'Try Blitzit — click a task to start the timer',
    status: 'today',
    listId: sampleListId,
    estimatedMinutes: 5,
    trackedSeconds: 0,
    timerStartedAt: null,
    subtasks: [],
    note: null,
    integrations: [],
    scheduledAt: null,
    scheduledDuration: null,
    recurrence: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completedAt: null,
    sortOrder: 0
  },
  {
    id: 'task-sample-002',
    title: 'Add your first real task',
    status: 'today',
    listId: sampleListId,
    estimatedMinutes: 10,
    trackedSeconds: 0,
    timerStartedAt: null,
    subtasks: [
      { id: 'st-001', title: 'Decide what to work on', completed: false, createdAt: Date.now() },
      { id: 'st-002', title: 'Click + ADD TASK below',  completed: false, createdAt: Date.now() }
    ],
    note: null,
    integrations: [],
    scheduledAt: null,
    scheduledDuration: null,
    recurrence: null,
    createdAt: Date.now() - 1000,
    updatedAt: Date.now(),
    completedAt: null,
    sortOrder: 1
  }
]

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      lists: [sampleList],
      tasks: sampleTasks,
      sessions: [],
      settings: defaultSettings,
      activeTaskId: null,
      activeListId: null,
      view: 'home' as const,
      searchOpen: false,
      settingsOpen: false,

      // ── Tasks ──────────────────────────────
      addTask: (taskData) => {
        const task: Task = { ...taskData, id: uid(), createdAt: Date.now(), updatedAt: Date.now() }
        set((s) => ({ tasks: [...s.tasks, task] }))
      },

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t)
        })),

      deleteTask: (id) => {
        if (get().activeTaskId === id) set({ activeTaskId: null })
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
      },

      moveTask: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === id ? { ...t, status, updatedAt: Date.now() } : t)
        })),

      completeTask: (id) => {
        get().stopTimer(id)
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'done', completedAt: Date.now(), updatedAt: Date.now() }
              : t
          )
        }))
      },

      // ── Timer ──────────────────────────────
      startTimer: (taskId) => {
        const { activeTaskId, pauseTimer } = get()
        if (activeTaskId && activeTaskId !== taskId) pauseTimer(activeTaskId)
        set((s) => ({
          activeTaskId: taskId,
          tasks: s.tasks.map((t) => t.id === taskId ? { ...t, timerStartedAt: Date.now() } : t)
        }))
      },

      pauseTimer: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId)
        if (!task?.timerStartedAt) return
        const elapsed = Math.floor((Date.now() - task.timerStartedAt) / 1000)
        set((s) => ({
          activeTaskId: null,
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, trackedSeconds: t.trackedSeconds + elapsed, timerStartedAt: null, updatedAt: Date.now() }
              : t
          )
        }))
      },

      stopTimer: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId)
        if (!task) return
        if (task.timerStartedAt) {
          const dur = Math.floor((Date.now() - task.timerStartedAt) / 1000)
          if (dur > 0) {
            const session: TimerSession = {
              id: uid(), taskId, listId: task.listId,
              startedAt: task.timerStartedAt, endedAt: Date.now(), durationSeconds: dur
            }
            set((s) => ({ sessions: [...s.sessions, session] }))
          }
        }
        const elapsed = task.timerStartedAt ? Math.floor((Date.now() - task.timerStartedAt) / 1000) : 0
        set((s) => ({
          activeTaskId: null,
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, trackedSeconds: t.trackedSeconds + elapsed, timerStartedAt: null, updatedAt: Date.now() }
              : t
          )
        }))
      },

      // ── Subtasks ───────────────────────────
      addSubtask: (taskId, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...t.subtasks, { id: uid(), title, completed: false, createdAt: Date.now() }], updatedAt: Date.now() }
              : t
          )
        })),

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.map((st) => st.id === subtaskId ? { ...st, completed: !st.completed } : st), updatedAt: Date.now() }
              : t
          )
        })),

      deleteSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId), updatedAt: Date.now() }
              : t
          )
        })),

      // ── Lists ──────────────────────────────
      addList: (listData) => {
        const list: TaskList = { ...listData, id: uid(), createdAt: Date.now() }
        set((s) => ({ lists: [...s.lists, list] }))
      },

      updateList: (id, updates) =>
        set((s) => ({ lists: s.lists.map((l) => l.id === id ? { ...l, ...updates } : l) })),

      archiveList: (id) =>
        set((s) => ({ lists: s.lists.map((l) => l.id === id ? { ...l, archived: true } : l) })),

      deleteList: (id) =>
        set((s) => ({
          lists: s.lists.filter((l) => l.id !== id),
          tasks: s.tasks.filter((t) => t.listId !== id)
        })),

      // ── Settings ───────────────────────────
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      // ── UI ─────────────────────────────────
      setView:         (view)   => set({ view }),
      openList:        (listId) => set({ activeListId: listId, view: 'board' }),
      setSearchOpen:   (open)   => set({ searchOpen: open }),
      setSettingsOpen: (open)   => set({ settingsOpen: open })
    }),
    {
      name: 'blitzit-storage',
      storage: electronStorage
    }
  )
)

// ─────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────
export const selectActiveLists    = (s: AppState) => s.lists.filter((l) => !l.archived).sort((a, b) => a.sortOrder - b.sortOrder)
export const selectArchivedLists  = (s: AppState) => s.lists.filter((l) => l.archived)
export const selectActiveTask     = (s: AppState) => s.tasks.find((t) => t.id === s.activeTaskId) ?? null
export const selectListById       = (id: string)  => (s: AppState) => s.lists.find((l) => l.id === id) ?? null
export const selectTasksByStatus  = (status: TaskStatus, listId?: string) => (s: AppState) =>
  s.tasks.filter((t) => t.status === status && (!listId || t.listId === listId)).sort((a, b) => a.sortOrder - b.sortOrder)

// ── Format helpers ────────────────────────────
export const formatSeconds = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export const formatMinutes = (minutes: number | null): string => {
  if (!minutes || minutes <= 0) return '0min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}hr ${m}min`
  if (h > 0) return `${h}hr`
  return `${m}min`
}
