import { execSync } from 'child_process'
import { updateTodayStats, getTodayStats } from './store'

// Productive apps (process names, lowercase)
const PRODUCTIVE_APPS = new Set([
  // Code editors
  'code', 'code - insiders', 'cursor', 'webstorm64', 'idea64', 'pycharm64',
  'devenv', 'sublime_text', 'notepad++', 'atom', 'vim', 'nvim',
  // Terminals
  'windowsterminal', 'cmd', 'powershell', 'pwsh', 'bash', 'wsl', 'wt',
  'hyper', 'alacritty', 'mintty',
  // Browsers (counted as productive — studying, job search)
  'chrome', 'firefox', 'msedge', 'brave', 'opera',
  // Productivity / study
  'winword', 'excel', 'powerpnt', 'onenote', 'outlook',
  'notion', 'obsidian', 'logseq', 'roam',
  'acrobat', 'acrord32', 'foxitreader', 'sumatrapdf',
  'figma', 'sketch', 'xd',
  'postman', 'insomnia',
  'docker', 'dockerdesktop',
  'dbeaver', 'datagrip64', 'tableplus',
  'zoom', 'teams', 'slack', 'discord' // meetings/comms count
])

// Known gaming / entertainment to explicitly EXCLUDE
const GAMING_APPS = new Set([
  'steam', 'steamwebhelper', 'epicgameslauncher', 'riotclientservices',
  'leagueclient', 'riotclient', 'valorant', 'genshinimpact',
  'minecraft', 'javaw', 'csgo', 'cs2', 'dota2', 'overwatch',
  'battlenet', 'origin', 'eadesktop', 'ubisoft', 'uplay',
  'gta5', 'rdr2', 'eldenring', 'fortnite',
  'vlc', 'mpc-hc64', 'potplayer', // video players = not productive
  'netflix', 'spotify' // entertainment
])

let pollInterval: NodeJS.Timeout | null = null
let sessionProductiveMinutes = 0
let lastPollTime = Date.now()
let lastActiveApp = ''
let consecutiveProductiveSecs = 0

function getForegroundProcess(): string {
  try {
    // Get the process with a visible window and highest CPU — reliable without needing symlink-based Add-Type
    const result = execSync(
      'powershell -NoProfile -NonInteractive -Command "' +
      '(Get-Process | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero -and $_.Responding } ' +
      '| Sort-Object CPU -Descending | Select-Object -First 1).ProcessName' +
      '"',
      { timeout: 4000, windowsHide: true }
    ).toString().trim()
    return result.toLowerCase()
  } catch {
    return ''
  }
}

function isProductive(procName: string): boolean {
  if (!procName) return false
  if (GAMING_APPS.has(procName)) return false
  return PRODUCTIVE_APPS.has(procName)
}

function poll() {
  const now = Date.now()
  const elapsed = (now - lastPollTime) / 1000 // seconds since last poll

  const proc = getForegroundProcess()
  const productive = isProductive(proc)

  if (productive) {
    consecutiveProductiveSecs += elapsed
    // Only count after 2 consecutive minutes to filter out brief switches
    if (consecutiveProductiveSecs >= 120) {
      sessionProductiveMinutes += elapsed / 60
    }
  } else {
    if (consecutiveProductiveSecs < 120) {
      consecutiveProductiveSecs = 0 // reset if switched away too quickly
    }
  }

  lastPollTime = now
  lastActiveApp = proc

  // Flush to store every 5 minutes
  if (Math.floor(sessionProductiveMinutes) % 5 === 0 && sessionProductiveMinutes > 0) {
    const current = getTodayStats()
    updateTodayStats({ productiveMinutes: Math.floor(current.productiveMinutes + sessionProductiveMinutes) })
    sessionProductiveMinutes = 0
  }
}

export function startWindowTracker() {
  if (pollInterval) return
  lastPollTime = Date.now()
  // Poll every 60 seconds
  pollInterval = setInterval(poll, 60 * 1000)
  console.log('[WindowTracker] Started active window tracking')
}

export function stopWindowTracker() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  // Flush remaining
  if (sessionProductiveMinutes > 0) {
    const current = getTodayStats()
    updateTodayStats({ productiveMinutes: Math.floor(current.productiveMinutes + sessionProductiveMinutes) })
    sessionProductiveMinutes = 0
  }
}

export function getCurrentApp(): string {
  return lastActiveApp
}
