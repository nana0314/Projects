import Store from 'electron-store'
import type { AppStore, DailyStats, PetState, GrowthStage } from '../shared/types'
import { calculateXPFromStats, xpToGrowthPercent } from '../shared/types'

const defaultPet: PetState = {
  name: 'Vibi',
  animalType: 'cat',
  stage: 0,
  growthPercent: 0,
  growthAtDayStart: 0,
  happiness: 70,
  hunger: 80,
  lastFed: new Date().toISOString(),
  lastPlayed: new Date().toISOString(),
  lastActive: new Date().toISOString(),
  totalDaysActive: 0
}

export const store = new Store<AppStore>({
  name: 'vibe-pet-data',
  defaults: {
    pet: defaultPet,
    dailyStats: [],
    trackedRepos: [],
    workLog: [],
    settings: { projectsDir: 'C:\\Users\\songz\\projects', petName: 'Vibi' }
  }
})

export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getTodayStats(): DailyStats {
  const today = getToday()
  const all = store.get('dailyStats') as DailyStats[]
  const existing = all.find(d => d.date === today)
  if (existing) return existing
  const fresh: DailyStats = {
    date: today, linesAdded: 0, productiveMinutes: 0,
    jobApplications: 0, manualWorkMinutes: 0, xpEarned: 0, growthEarned: 0
  }
  store.set('dailyStats', [...all, fresh])
  return fresh
}

export function updateTodayStats(partial: Partial<DailyStats>) {
  const today = getToday()
  const all = store.get('dailyStats') as DailyStats[]
  const idx = all.findIndex(d => d.date === today)
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...partial }
  } else {
    all.push({ date: today, linesAdded: 0, productiveMinutes: 0, jobApplications: 0, manualWorkMinutes: 0, xpEarned: 0, growthEarned: 0, ...partial })
  }
  store.set('dailyStats', all)
}

function stageFromGrowth(g: number): GrowthStage {
  if (g >= 90) return 5
  if (g >= 70) return 4
  if (g >= 50) return 3
  if (g >= 30) return 2
  if (g >= 15) return 1
  return 0
}

// ─── Real-time idempotent growth update ──────────────────────────────────────
// Can be called any time — recalculates growth from today's XP on top of the
// locked-in base (growthAtDayStart). Safe to call every second.
export function applyGrowthNow(): PetState {
  const stats = getTodayStats()
  const xp = calculateXPFromStats(stats)
  const growthFromToday = xpToGrowthPercent(xp)

  const pet = store.get('pet') as PetState
  // Migrate legacy records that don't have growthAtDayStart
  const base = pet.growthAtDayStart ?? pet.growthPercent ?? 0
  const newGrowth = Math.min(100, Math.max(0, base + growthFromToday))
  const newStage = stageFromGrowth(newGrowth)

  const updated: PetState = { ...pet, growthAtDayStart: base, growthPercent: newGrowth, stage: newStage }
  store.set('pet', updated)
  updateTodayStats({ xpEarned: xp, growthEarned: growthFromToday })
  return updated
}

// ─── Midnight: lock in growth, reset day base, apply hunger/happiness decay ──
export function applyDailyGrowth() {
  const updated = applyGrowthNow()
  const now = new Date()
  const lastActive = new Date(updated.lastActive)
  const hoursSinceActive = (now.getTime() - lastActive.getTime()) / 3600000
  const happinessDecay = hoursSinceActive > 12 ? 15 : hoursSinceActive > 6 ? 8 : 0

  store.set('pet', {
    ...updated,
    growthAtDayStart: updated.growthPercent,  // lock in for next day's base
    hunger: Math.max(0, updated.hunger - 20),
    happiness: Math.max(0, updated.happiness - happinessDecay),
    totalDaysActive: updated.totalDaysActive + 1
  })
}
