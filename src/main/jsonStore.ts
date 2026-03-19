/**
 * Simple JSON file store for Electron main process.
 * Replaces electron-store to avoid ESM/CJS conflicts.
 * Saves to: userData/blitzit-data.json
 */
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

class JsonStore {
  private filePath: string
  private data: Record<string, unknown> = {}

  constructor(name: string) {
    const dir = app.getPath('userData')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    this.filePath = join(dir, `${name}.json`)
    this.load()
  }

  private load() {
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, 'utf-8')
        this.data = JSON.parse(raw)
      }
    } catch {
      this.data = {}
    }
  }

  private save() {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch { /* silent */ }
  }

  get(key: string, defaultValue?: unknown): unknown {
    return key in this.data ? this.data[key] : defaultValue
  }

  set(keyOrObject: string | Record<string, unknown>, value?: unknown) {
    if (typeof keyOrObject === 'string') {
      this.data[keyOrObject] = value
    } else {
      Object.assign(this.data, keyOrObject)
    }
    this.save()
  }

  delete(key: string) {
    delete this.data[key]
    this.save()
  }

  clear() {
    this.data = {}
    this.save()
  }

  get store(): Record<string, unknown> {
    return { ...this.data }
  }
}

export default JsonStore
