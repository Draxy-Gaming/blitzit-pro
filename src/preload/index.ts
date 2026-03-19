import { contextBridge, ipcRenderer } from 'electron'

window.addEventListener('error', (event) => {
  ipcRenderer.send('renderer:error', {
    type: 'error',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error instanceof Error ? event.error.stack : undefined
  })
})

window.addEventListener('unhandledrejection', (event) => {
  const reason =
    event.reason instanceof Error
      ? {
          message: event.reason.message,
          stack: event.reason.stack
        }
      : { message: String(event.reason) }

  ipcRenderer.send('renderer:error', {
    type: 'unhandledrejection',
    ...reason
  })
})

contextBridge.exposeInMainWorld('electron', {
  // ── electron-store ────────────────────────────────
  store: {
    get:    (key: string)                          => ipcRenderer.invoke('store:get', key),
    set:    (key: string, value: unknown)          => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string)                          => ipcRenderer.invoke('store:delete', key),
    getAll: ()                                     => ipcRenderer.invoke('store:getAll'),
    setAll: (data: Record<string, unknown>)        => ipcRenderer.invoke('store:setAll', data),
    clear:  ()                                     => ipcRenderer.invoke('store:clear'),
  },

  // ── Theme ─────────────────────────────────────────
  getTheme: () => ipcRenderer.invoke('get-theme'),

  // ── External links ────────────────────────────────
  openExternal: (url: string) => ipcRenderer.send('open-external', url),

  tray: {
    update: (taskName?: string, elapsed?: string) => ipcRenderer.send('tray:update', taskName, elapsed)
  },

  // ── Window controls ───────────────────────────────
  window: {
    minimize:        ()               => ipcRenderer.send('window:minimize'),
    close:           ()               => ipcRenderer.send('window:close'),
    setAlwaysOnTop:  (v: boolean)     => ipcRenderer.invoke('window:setAlwaysOnTop', v),
    getAlwaysOnTop:  ()               => ipcRenderer.invoke('window:getAlwaysOnTop'),
    setCompact:      (v: boolean)     => ipcRenderer.invoke('window:setCompact', v),
    getCompact:      ()               => ipcRenderer.invoke('window:getCompact'),
  }
})
