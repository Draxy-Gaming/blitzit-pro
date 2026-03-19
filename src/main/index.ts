import { app, shell, BrowserWindow, ipcMain, nativeTheme, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from './jsonStore'
import { createTray, updateTray } from './tray'
import { setupAutoUpdater } from './updater'

const store = new Store('blitzit-data')

// Windows: disable GPU acceleration if it causes black screen
// This is safe — Electron falls back to software rendering
if (process.platform === 'win32') {
  app.disableHardwareAcceleration()
}

let mainWindow: BrowserWindow | null = null
const shouldOpenDevTools = is.dev || process.env['BLITZIT_OPEN_DEVTOOLS'] === '1'

function createMainWindow(): BrowserWindow {
  const savedBounds = store.get('windowBounds') as {
    x?: number; y?: number; width?: number; height?: number
  } | undefined

  const win = new BrowserWindow({
    width:     savedBounds?.width  ?? 440,
    height:    savedBounds?.height ?? 720,
    x:         savedBounds?.x,
    y:         savedBounds?.y,
    minWidth:  360,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    // macOS: hide traffic lights area, keep native feel
    // Windows: keep frame, just hide menu bar
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#141414',
    // Never use frameless on Windows — causes black screen
    frame: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // On Windows, hide the default menu bar entirely
  if (process.platform === 'win32') {
    win.setMenuBarVisibility(false)
  }

  // Show window reliably on all platforms
  // ready-to-show fires after first paint — safest approach
  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })

  // Belt-and-suspenders: force show after 2s if ready-to-show never fires
  // (can happen if renderer crashes silently)
  const fallback = setTimeout(() => {
    if (!win.isVisible()) {
      win.show()
      win.focus()
    }
  }, 2000)
  win.once('ready-to-show', () => clearTimeout(fallback))

  // Log renderer errors to help diagnose black screen
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('Renderer failed to load:', code, desc, url)
    // Try reloading once
    setTimeout(() => win.webContents.reload(), 500)
  })

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levels = ['debug', 'info', 'warn', 'error']
    const label = levels[level] ?? `level-${level}`
    console.error(`[renderer:${label}] ${message} (${sourceId}:${line})`)
  })

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details)
  })

  win.on('unresponsive', () => {
    console.error('Main window became unresponsive')
  })

  win.webContents.on('crashed' as any, () => {
    console.error('Renderer crashed — relaunching')
    win.webContents.reload()
  })

  const saveBounds = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      store.set('windowBounds', win.getBounds())
    }
  }
  win.on('resize', saveBounds)
  win.on('move',   saveBounds)

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (shouldOpenDevTools) {
    win.webContents.openDevTools({ mode: 'detach' })
  }

  return win
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.blitzit.app')

  app.on('browser-window-created', (_, win) => {
    optimizer.watchWindowShortcuts(win)
  })

  mainWindow = createMainWindow()

  // ── electron-store IPC ──
  ipcMain.handle('store:get',    (_e, key: string)                  => store.get(key))
  ipcMain.handle('store:set',    (_e, key: string, val: unknown)    => { store.set(key, val as any) })
  ipcMain.handle('store:delete', (_e, key: string)                  => store.delete(key))
  ipcMain.handle('store:getAll', ()                                 => store.store)
  ipcMain.handle('store:setAll', (_e, data: Record<string,unknown>) => { store.set(data as any) })
  ipcMain.handle('store:clear',  ()                                 => store.clear())

  // ── Theme ──
  ipcMain.handle('get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light')

  // ── External links ──
  ipcMain.on('open-external', (_e, url: string) => shell.openExternal(url))
  ipcMain.on('renderer:error', (_e, payload: unknown) => {
    console.error('Renderer reported error:', payload)
  })

  // ── Window controls ──
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:close',    () => mainWindow?.close())

  ipcMain.handle('window:setAlwaysOnTop', (_e, value: boolean) => {
    if (!mainWindow) return
    mainWindow.setAlwaysOnTop(value, 'floating')
    mainWindow.setVisibleOnAllWorkspaces(value)
    store.set('alwaysOnTop', value)
  })
  ipcMain.handle('window:getAlwaysOnTop', () => store.get('alwaysOnTop', false))

  ipcMain.handle('window:setCompact', (_e, compact: boolean) => {
    if (!mainWindow) return

    if (compact) {
      const display = screen.getDisplayMatching(mainWindow.getBounds())
      const { x, y } = display.workArea

      mainWindow.setResizable(false)
      mainWindow.setBounds({ x, y, width: 380, height: 620 }, true)
    } else {
      const savedBounds = store.get('windowBounds') as {
        x?: number; y?: number; width?: number; height?: number
      } | undefined

      mainWindow.setResizable(true)
      mainWindow.setBounds({
        x: savedBounds?.x,
        y: savedBounds?.y,
        width: savedBounds?.width ?? 1100,
        height: savedBounds?.height ?? 720
      }, true)
    }

    store.set('compactMode', compact)
  })
  ipcMain.handle('window:getCompact', () => store.get('compactMode', false))

  if (store.get('alwaysOnTop', false)) {
    mainWindow.setAlwaysOnTop(true, 'floating')
    mainWindow.setVisibleOnAllWorkspaces(true)
  }

  // Tray
  try { createTray(mainWindow) } catch {}

  // Auto-updater
  try { setupAutoUpdater(mainWindow) } catch {}

  // IPC: update tray with active task info
  ipcMain.on('tray:update', (_e, taskName?: string, elapsed?: string) => {
    try { if (mainWindow) updateTray(mainWindow, taskName, elapsed) } catch {}
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
