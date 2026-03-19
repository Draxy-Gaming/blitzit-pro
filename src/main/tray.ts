import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow): Tray | null {
  try {
    const iconPath = join(__dirname, '../../resources/tray-icon.png')
    const icon = nativeImage.createFromPath(iconPath)

    // On macOS, template images auto-invert for dark/light mode
    if (process.platform === 'darwin') {
      icon.setTemplateImage(true)
    }

    tray = new Tray(icon)
    tray.setToolTip('Blitzit')
    tray.setContextMenu(buildMenu(mainWindow))

    tray.on('click', () => {
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    })

    return tray
  } catch (e) {
    console.warn('Tray creation failed:', e)
    return null
  }
}

function buildMenu(mainWindow: BrowserWindow, taskName?: string, elapsed?: string) {
  const taskLabel = taskName
    ? `▶  ${taskName.slice(0, 30)}${taskName.length > 30 ? '…' : ''}   ${elapsed ?? ''}`
    : 'No active task'

  return Menu.buildFromTemplate([
    { label: 'Blitzit', enabled: false },
    { type: 'separator' },
    { label: taskLabel, enabled: false },
    { type: 'separator' },
    {
      label: 'Show window',
      click: () => { mainWindow.show(); mainWindow.focus() }
    },
    {
      label: mainWindow.isVisible() ? 'Hide window' : 'Show window',
      click: () => {
        if (mainWindow.isVisible()) mainWindow.hide()
        else { mainWindow.show(); mainWindow.focus() }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Blitzit',
      click: () => { app.quit() }
    }
  ])
}

export function updateTray(mainWindow: BrowserWindow, taskName?: string, elapsed?: string) {
  if (!tray) return
  const tooltip = taskName ? `Blitzit — ${taskName} ${elapsed ?? ''}` : 'Blitzit'
  tray.setToolTip(tooltip)
  tray.setContextMenu(buildMenu(mainWindow, taskName, elapsed))
}
