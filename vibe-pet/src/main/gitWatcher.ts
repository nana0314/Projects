import chokidar from 'chokidar'
import { simpleGit } from 'simple-git'
import * as path from 'path'
import * as fs from 'fs'
import { store, getToday, updateTodayStats, getTodayStats } from './store'
import type { TrackedRepo } from '../../renderer/types'

let watcher: ReturnType<typeof chokidar.watch> | null = null
const trackedPaths = new Set<string>()

function getProjectsDir(): string {
  return (store.get('settings') as { projectsDir: string }).projectsDir
}

async function countTodayLines(repoPath: string): Promise<number> {
  try {
    const git = simpleGit(repoPath)
    const today = getToday()
    // Get log for today with stat
    const log = await git.log([
      '--since', `${today}T00:00:00`,
      '--until', `${today}T23:59:59`,
      '--numstat',
      '--format=%H'
    ])

    let added = 0
    if (log.all.length === 0) return 0

    // Use diff-stat approach: count lines added in today's commits
    const todayCommits = await git.raw([
      'log',
      '--since', `${today} 00:00:00`,
      '--until', `${today} 23:59:59`,
      '--format=%H'
    ])

    const hashes = todayCommits.trim().split('\n').filter(Boolean)
    for (const hash of hashes) {
      try {
        const stat = await git.raw(['diff', '--numstat', `${hash}^`, hash])
        const lines = stat.trim().split('\n').filter(Boolean)
        for (const line of lines) {
          const parts = line.split('\t')
          if (parts[0] && parts[0] !== '-') {
            added += parseInt(parts[0], 10) || 0
          }
        }
      } catch {
        // first commit has no parent, use diff against empty tree
        try {
          const stat = await git.raw(['diff', '--numstat', '4b825dc642cb6eb9a060e54bf8d69288fbee4904', hash])
          const lines = stat.trim().split('\n').filter(Boolean)
          for (const line of lines) {
            const parts = line.split('\t')
            if (parts[0] && parts[0] !== '-') {
              added += parseInt(parts[0], 10) || 0
            }
          }
        } catch { /* ignore */ }
      }
    }
    return added
  } catch {
    return 0
  }
}

async function refreshAllRepos() {
  const repos = store.get('trackedRepos') as TrackedRepo[]
  let totalLines = 0

  for (const repo of repos) {
    if (fs.existsSync(repo.path)) {
      const lines = await countTodayLines(repo.path)
      totalLines += lines
    }
  }

  updateTodayStats({ linesAdded: totalLines })
  return totalLines
}

function registerRepo(gitDir: string) {
  const repoPath = path.dirname(gitDir)
  if (trackedPaths.has(repoPath)) return

  trackedPaths.add(repoPath)
  const repos = store.get('trackedRepos') as TrackedRepo[]
  const name = path.basename(repoPath)

  if (!repos.find(r => r.path === repoPath)) {
    repos.push({ path: repoPath, name, lastChecked: new Date().toISOString() })
    store.set('trackedRepos', repos)
    console.log(`[GitWatcher] Registered repo: ${name}`)
  }
}

export function startGitWatcher() {
  const projectsDir = getProjectsDir()
  if (!fs.existsSync(projectsDir)) {
    console.warn(`[GitWatcher] Projects dir not found: ${projectsDir}`)
    return
  }

  // Register any existing repos
  const entries = fs.readdirSync(projectsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const gitPath = path.join(projectsDir, entry.name, '.git')
      if (fs.existsSync(gitPath)) {
        registerRepo(gitPath)
      }
    }
  }

  // Watch for new repos being created
  watcher = chokidar.watch(projectsDir, {
    depth: 2,
    ignoreInitial: true,
    persistent: true,
    ignorePermissionErrors: true
  })

  watcher.on('addDir', (dirPath) => {
    if (path.basename(dirPath) === '.git') {
      registerRepo(dirPath)
    }
  })

  // Refresh line counts every 30 minutes
  setInterval(refreshAllRepos, 30 * 60 * 1000)
  // Initial scan
  setTimeout(refreshAllRepos, 3000)

  console.log(`[GitWatcher] Watching ${projectsDir} for git repos`)
}

export function stopGitWatcher() {
  watcher?.close()
}

export { refreshAllRepos }
