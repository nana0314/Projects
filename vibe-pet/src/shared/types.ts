export type GrowthStage = 0 | 1 | 2 | 3 | 4 | 5
export type PetMood = 'idle' | 'happy' | 'sad' | 'eating' | 'playing' | 'sleeping'
export type AnimalType = 'cat' | 'dog' | 'dragon' | 'bunny' | 'panda' | 'koala' | 'penguin' | 'seal'

export interface PetState {
  name: string
  animalType: AnimalType
  stage: GrowthStage
  growthPercent: number
  growthAtDayStart: number
  happiness: number
  hunger: number
  lastFed: string
  lastPlayed: string
  lastActive: string
  totalDaysActive: number
}

export interface DailyStats {
  date: string
  linesAdded: number
  productiveMinutes: number
  jobApplications: number
  manualWorkMinutes: number
  xpEarned: number
  growthEarned: number
}

export interface TrackedRepo { path: string; name: string; lastChecked: string }

export interface WorkLogEntry {
  id: string; date: string
  category: 'study' | 'assignment' | 'research' | 'other'
  description: string; minutes: number
}

export interface AppStore {
  pet: PetState; dailyStats: DailyStats[]
  trackedRepos: TrackedRepo[]; workLog: WorkLogEntry[]
  settings: { projectsDir: string; petName: string }
}

export const STAGE_NAMES: Record<GrowthStage, string> = {
  0: 'Egg', 1: 'Baby', 2: 'Child', 3: 'Teen', 4: 'Adult', 5: 'Legend'
}

export const ANIMAL_NAMES: Record<AnimalType, string> = {
  cat: 'Cat', dog: 'Dog', dragon: 'Dragon', bunny: 'Bunny',
  panda: 'Panda', koala: 'Koala', penguin: 'Penguin', seal: 'Seal'
}

export const ANIMAL_EMOJIS: Record<AnimalType, string> = {
  cat: '🐱', dog: '🐶', dragon: '🐲', bunny: '🐰',
  panda: '🐼', koala: '🐨', penguin: '🐧', seal: '🦭'
}

export function calculateXPFromStats(stats: DailyStats): number {
  const fromCode = Math.floor(stats.linesAdded / 100) * 8
  const fromProd = Math.floor(stats.productiveMinutes / 30) * 5
  const fromJobs = stats.jobApplications * 15
  const fromManual = Math.floor(stats.manualWorkMinutes / 30) * 6
  return Math.min(fromCode + fromProd + fromJobs + fromManual, 120)
}

export function xpToGrowthPercent(xp: number): number {
  if (xp <= 0) return 0
  if (xp <= 20) return 0.3
  if (xp <= 40) return 0.6
  if (xp <= 70) return 1.0
  if (xp <= 100) return 1.8
  return 2.5
}
