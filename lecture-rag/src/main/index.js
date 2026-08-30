import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { spawn } from 'child_process'
import Store from 'electron-store'

const store = new Store()
let backendProcess = null
const BACKEND_PORT = 8000

function getBackendExe() {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'backend', 'backend.exe')
  }
  return join(app.getAppPath(), '../../dist_backend/backend/backend.exe')
}

function startBackend(apiKey) {
  if (backendProcess) return
  const exe = getBackendExe()
  backendProcess = spawn(exe, [], {
    env: {
      ...process.env,
      OPENAI_API_KEY: apiKey,
      CHROMA_PATH: join(app.getPath('userData'), 'chroma_db'),
      BACKEND_PORT: String(BACKEND_PORT),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  })
  backendProcess.stdout?.on('data', (d) => console.log('[backend]', d.toString().trim()))
  backendProcess.stderr?.on('data', (d) => console.error('[backend]', d.toString().trim()))
  backendProcess.on('error', (err) => console.error('Backend process error:', err))
  backendProcess.on('exit', (code) => console.log('Backend exited with code', code))
}

async function waitForBackend(maxMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    try {
      const resp = await fetch(`http://127.0.0.1:${BACKEND_PORT}/health`)
      if (resp.ok) return true
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0f1117',
    title: 'Lecture RAG',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('get-api-key', () => store.get('apiKey', ''))

ipcMain.handle('save-api-key', async (_, apiKey) => {
  store.set('apiKey', apiKey.trim())
  startBackend(apiKey.trim())
  return await waitForBackend()
})

ipcMain.handle('backend-ready', async () => {
  try {
    const resp = await fetch(`http://127.0.0.1:${BACKEND_PORT}/health`)
    return resp.ok
  } catch {
    return false
  }
})

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  const apiKey = store.get('apiKey', '')
  if (apiKey) startBackend(apiKey)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
  app.quit()
})
