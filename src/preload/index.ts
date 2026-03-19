import { contextBridge, ipcRenderer } from 'electron'

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
