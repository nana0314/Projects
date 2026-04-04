import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import * as path from 'path'
import { store, getTodayStats, updateTodayStats, applyDailyGrowth, getToday, applyGrowthNow } from './store'
import { startGitWatcher, stopGitWatcher, refreshAllRepos } from './gitWatcher'
import { startWindowTracker, stopWindowTracker } from './windowTracker'
import type { PetState, WorkLogEntry, AnimalType } from '../shared/types'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

const isDev = !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 680,
    minWidth: 380,
    minHeight: 600,
    resizable: true,
    frame: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Close button → quit entirely. Minimize (hide) → tray.
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()  // just hides — use X button in custom title bar to quit
    }
  })
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  const menu = Menu.buildFromTemplate([
    { label: 'Open Vibe Pet', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit() } }
  ])
  tray.setToolTip('Vibe Pet — click to open')
  tray.setContextMenu(menu)
  tray.on('double-click', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show()
  })
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

// Window controls
ipcMain.handle('window-minimize', () => mainWindow?.hide())
ipcMain.handle('window-close', () => { isQuitting = true; app.quit() })

// Pet
ipcMain.handle('get-pet', () => store.get('pet'))
ipcMain.handle('get-today-stats', () => getTodayStats())
ipcMain.handle('get-all-stats', () => store.get('dailyStats'))
ipcMain.handle('get-tracked-repos', () => store.get('trackedRepos'))
ipcMain.handle('get-work-log', () => store.get('workLog'))

ipcMain.handle('feed-pet', () => {
  const pet = store.get('pet') as PetState
  const updated = { ...pet, hunger: Math.min(100, pet.hunger + 30), happiness: Math.min(100, pet.happiness + 10), lastFed: new Date().toISOString(), lastActive: new Date().toISOString() }
  store.set('pet', updated)
  broadcast('pet-update', updated)
  return updated
})

ipcMain.handle('play-with-pet', () => {
  const pet = store.get('pet') as PetState
  const updated = { ...pet, happiness: Math.min(100, pet.happiness + 20), lastPlayed: new Date().toISOString(), lastActive: new Date().toISOString() }
  store.set('pet', updated)
  broadcast('pet-update', updated)
  return updated
})

ipcMain.handle('pet-the-pet', () => {
  const pet = store.get('pet') as PetState
  const updated = { ...pet, happiness: Math.min(100, pet.happiness + 5), lastActive: new Date().toISOString() }
  store.set('pet', updated)
  broadcast('pet-update', updated)
  return updated
})

ipcMain.handle('rename-pet', (_e, name: string) => {
  const pet = store.get('pet') as PetState
  const updated = { ...pet, name }
  store.set('pet', updated)
  return updated
})

ipcMain.handle('set-animal', (_e, animalType: AnimalType) => {
  const pet = store.get('pet') as PetState
  const updated = { ...pet, animalType }
  store.set('pet', updated)
  broadcast('pet-update', updated)
  return updated
})

ipcMain.handle('add-job-application', () => {
  const today = getTodayStats()
  updateTodayStats({ jobApplications: today.jobApplications + 1 })
  const updated = applyGrowthNow()
  broadcast('pet-update', updated)
  broadcast('stats-update', getTodayStats())
  return { pet: updated, stats: getTodayStats() }
})

ipcMain.handle('add-work-log', (_e, entry: { category: string; description: string; minutes: number }) => {
  const logs = store.get('workLog') as WorkLogEntry[]
  const newEntry: WorkLogEntry = {
    id: Date.now().toString(), date: getToday(),
    category: entry.category as WorkLogEntry['category'],
    description: entry.description, minutes: entry.minutes
  }
  store.set('workLog', [...logs, newEntry])
  const today = getTodayStats()
  updateTodayStats({ manualWorkMinutes: today.manualWorkMinutes + entry.minutes })
  const updated = applyGrowthNow()
  broadcast('pet-update', updated)
  broadcast('stats-update', getTodayStats())
  return { pet: updated, stats: getTodayStats() }
})

ipcMain.handle('refresh-git', async () => {
  const lines = await refreshAllRepos()
  const updated = applyGrowthNow()
  broadcast('pet-update', updated)
  broadcast('stats-update', getTodayStats())
  return { lines, stats: getTodayStats() }
})

// ─── Broadcast helper ────────────────────────────────────────────────────────
function broadcast(channel: string, data: unknown) {
  mainWindow?.webContents.send(channel, data)
}

// ─── Periodic growth refresh (every 30s) ─────────────────────────────────────
function startGrowthTimer() {
  setInterval(() => {
    const updated = applyGrowthNow()
    broadcast('pet-update', updated)
    broadcast('stats-update', getTodayStats())
  }, 30_000)
}

// ─── Midnight reset ───────────────────────────────────────────────────────────
let lastDate = getToday()
function startMidnightChecker() {
  setInterval(() => {
    const today = getToday()
    if (today !== lastDate) {
      applyDailyGrowth()
      lastDate = today
      broadcast('pet-update', store.get('pet'))
      broadcast('stats-update', getTodayStats())
    }
  }, 60_000)
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()
  applyGrowthNow()   // recalculate immediately on start
  startGitWatcher()
  startWindowTracker()
  startGrowthTimer()
  startMidnightChecker()
})

app.on('window-all-closed', () => { /* keep tray alive */ })

app.on('before-quit', () => {
  stopGitWatcher()
  stopWindowTracker()
  applyDailyGrowth()
})

app.on('activate', () => mainWindow?.show())
