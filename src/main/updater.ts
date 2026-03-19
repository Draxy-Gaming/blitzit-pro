import { autoUpdater } from 'electron'
import { app, dialog, BrowserWindow } from 'electron'

const FEED_URL = `https://github.com/Draxy-Gaming/blitzit-pro/releases/latest/download`

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  // Only run in packaged app, not in dev
  if (!app.isPackaged) return

  try {
    // electron's built-in autoUpdater uses Squirrel on Windows
    // For cross-platform, electron-updater from electron-builder is better
    // We implement a simple GitHub releases check instead
    checkForUpdates(mainWindow)

    // Check every 4 hours
    setInterval(() => checkForUpdates(mainWindow), 4 * 60 * 60 * 1000)
  } catch { /* silent in unsupported environments */ }
}

async function checkForUpdates(mainWindow: BrowserWindow) {
  try {
    const res = await fetch(
      'https://api.github.com/repos/Draxy-Gaming/blitzit-pro/releases/latest',
      { headers: { 'User-Agent': `Blitzit/${app.getVersion()}` } }
    )
    if (!res.ok) return

    const release = await res.json() as { tag_name: string; html_url: string; body: string }
    const latest  = release.tag_name.replace(/^v/, '')
    const current = app.getVersion()

    if (latest !== current && isNewer(latest, current)) {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type:    'info',
        title:   'Update available',
        message: `Blitzit ${release.tag_name} is available`,
        detail:  `You have version ${current}. Would you like to download the update?\n\n${(release.body ?? '').slice(0, 300)}`,
        buttons: ['Download update', 'Later'],
        defaultId: 0
      })
      if (response === 0) {
        const { shell } = await import('electron')
        shell.openExternal(release.html_url)
      }
    }
  } catch { /* network unavailable — silent */ }
}

function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.split('.').map(Number)
  const [lMaj, lMin, lPat] = parse(latest)
  const [cMaj, cMin, cPat] = parse(current)
  if (lMaj !== cMaj) return lMaj > cMaj
  if (lMin !== cMin) return lMin > cMin
  return lPat > cPat
}
