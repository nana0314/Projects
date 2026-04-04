import { useEffect, useState, useCallback } from 'react'
import { AnimalPet } from './components/AnimalPet'
import { StatsPanel } from './components/StatsPanel'
import { ActionBar } from './components/ActionBar'
import { WorkLogModal } from './components/WorkLog'
import type { PetState, DailyStats, PetMood, GrowthStage, AnimalType } from '../shared/types'
import { ANIMAL_NAMES, ANIMAL_EMOJIS } from '../shared/types'

declare global {
  interface Window {
    api: {
      getPet: () => Promise<PetState>
      feedPet: () => Promise<PetState>
      playWithPet: () => Promise<PetState>
      petThePet: () => Promise<PetState>
      renamePet: (name: string) => Promise<PetState>
      setAnimal: (type: AnimalType) => Promise<PetState>
      getTodayStats: () => Promise<DailyStats>
      getAllStats: () => Promise<DailyStats[]>
      addJobApplication: () => Promise<{ pet: PetState; stats: DailyStats }>
      addWorkLog: (e: { category: string; description: string; minutes: number }) => Promise<{ pet: PetState; stats: DailyStats }>
      getWorkLog: () => Promise<unknown[]>
      getTrackedRepos: () => Promise<unknown[]>
      refreshGit: () => Promise<{ lines: number; stats: DailyStats }>
      onStatsUpdate: (cb: (s: unknown) => void) => () => void
      onPetUpdate: (cb: (p: unknown) => void) => () => void
      windowMinimize: () => void
      windowClose: () => void
    }
  }
}

const MOOD_DURATION = 2500
const ALL_ANIMALS: AnimalType[] = ['cat', 'dog', 'dragon', 'bunny', 'panda', 'koala', 'penguin', 'seal']

export default function App() {
  const [pet, setPet] = useState<PetState | null>(null)
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null)
  const [mood, setMood] = useState<PetMood>('idle')
  const [showWorkLog, setShowWorkLog] = useState(false)
  const [showAnimalSelect, setShowAnimalSelect] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [activeTab, setActiveTab] = useState<'pet' | 'stats'>('pet')

  const setMoodTemporary = useCallback((m: PetMood) => {
    setMood(m)
    setTimeout(() => setMood('idle'), MOOD_DURATION)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    async function init() {
      const [p, s] = await Promise.all([window.api.getPet(), window.api.getTodayStats()])
      setPet(p)
      setTodayStats(s)
      setNameInput(p.name)
      if (p.hunger < 20 || p.happiness < 20) setMood('sad')
    }
    init()

    const unsubStats = window.api.onStatsUpdate((s) => setTodayStats(s as DailyStats))
    const unsubPet = window.api.onPetUpdate((p) => {
      const pet = p as PetState
      setPet(pet)
      setNameInput(pet.name)
    })

    // Poll every 10s to keep XP live (backup to push updates)
    const poll = setInterval(async () => {
      const [p, s] = await Promise.all([window.api.getPet(), window.api.getTodayStats()])
      setPet(p)
      setTodayStats(s)
    }, 10_000)

    return () => { unsubStats(); unsubPet(); clearInterval(poll) }
  }, [])

  async function handleFeed() {
    const updated = await window.api.feedPet()
    setPet(updated)
    setMoodTemporary('eating')
    showToast('Nom nom! 🍖 +10 happiness')
  }

  async function handlePlay() {
    const updated = await window.api.playWithPet()
    setPet(updated)
    setMoodTemporary('playing')
    showToast('Yay! 🎮 +20 happiness')
  }

  async function handlePet() {
    const updated = await window.api.petThePet()
    setPet(updated)
    setMoodTemporary('happy')
  }

  async function handleJobApply() {
    const { pet: p, stats: s } = await window.api.addJobApplication()
    setPet(p)
    setTodayStats(s)
    setMoodTemporary('happy')
    showToast(`📝 Job app logged! Total today: ${s.jobApplications}`)
  }

  async function handleWorkLog(entry: { category: string; description: string; minutes: number }) {
    const { pet: p, stats: s } = await window.api.addWorkLog(entry)
    setPet(p)
    setTodayStats(s)
    setMoodTemporary('happy')
    showToast(`📚 +${entry.minutes}min logged! ⚡ XP added`)
  }

  async function handleRefreshGit() {
    setIsRefreshing(true)
    const result = await window.api.refreshGit()
    setTodayStats(result.stats)
    setIsRefreshing(false)
    showToast(`🔄 Found ${result.lines} lines coded today`)
  }

  async function handleRename() {
    if (!nameInput.trim()) return
    const updated = await window.api.renamePet(nameInput.trim())
    setPet(updated)
    setEditingName(false)
    showToast(`Say hi to ${updated.name} 👋`)
  }

  async function handleSelectAnimal(type: AnimalType) {
    const updated = await window.api.setAnimal(type)
    setPet(updated)
    setShowAnimalSelect(false)
    showToast(`${ANIMAL_EMOJIS[type]} You picked a ${ANIMAL_NAMES[type]}!`)
  }

  if (!pet) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a0a3c', color: '#a78bfa' }}>
        Loading your pet...
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: 'linear-gradient(180deg, #0f0720 0%, #1a0a3c 50%, #0f172a 100%)',
      color: '#e9d5ff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      userSelect: 'none', overflow: 'hidden', position: 'relative'
    }}>

      {/* ── Custom title bar ── */}
      <div style={{
        height: 34, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: 14, paddingRight: 8, flexShrink: 0,
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}>
        <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, letterSpacing: 1 }}>✦ VIBE PET</span>
        <div style={{ display: 'flex', gap: 6, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Minimize → tray */}
          <button onClick={() => window.api.windowMinimize()} title="Minimise to tray"
            style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#fbbf24', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3800', fontWeight: 900, lineHeight: 1 }}>
            –
          </button>
          {/* Close → quit */}
          <button onClick={() => window.api.windowClose()} title="Quit"
            style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#f87171', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c0000', fontWeight: 900, lineHeight: 1 }}>
            ×
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', top: 42, left: '50%', transform: 'translateX(-50%)',
          background: '#2d1b69', borderRadius: 20, padding: '6px 16px',
          fontSize: 12, color: '#ddd6fe', zIndex: 200, whiteSpace: 'nowrap',
          border: '1px solid #4c1d95', boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
          pointerEvents: 'none'
        }}>
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2d1b69', flexShrink: 0 }}>
        {(['pet', 'stats'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '7px 0', background: 'transparent', border: 'none',
            borderBottom: activeTab === tab ? '2px solid #7c3aed' : '2px solid transparent',
            color: activeTab === tab ? '#ddd6fe' : '#6b4fa0',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'color 0.2s'
          }}>
            {tab === 'pet' ? '🐾 Pet' : '📊 Stats'}
          </button>
        ))}
      </div>

      {activeTab === 'pet' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Pet display */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '12px 0 4px',
            background: 'radial-gradient(ellipse at 50% 80%, rgba(124,58,237,0.12) 0%, transparent 70%)'
          }}>
            <AnimalPet
              animalType={pet.animalType ?? 'cat'}
              stage={pet.stage as GrowthStage}
              mood={mood}
              onClick={handlePet}
            />

            {/* Name row */}
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              {editingName ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRename()} autoFocus maxLength={16}
                    style={{ background: '#16082e', border: '1px solid #4c1d95', borderRadius: 6, padding: '3px 8px', color: '#ddd6fe', fontSize: 14, fontWeight: 700, width: 120, outline: 'none' }}
                  />
                  <button onClick={handleRename} style={{ background: '#7c3aed', border: 'none', borderRadius: 6, padding: '3px 8px', color: '#fff', cursor: 'pointer', fontSize: 12 }}>✓</button>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#ddd6fe' }}>{pet.name}</span>
                  <button onClick={() => setEditingName(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b4fa0', fontSize: 12, padding: 0 }}>✏️</button>
                  <button onClick={() => setShowAnimalSelect(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b4fa0', fontSize: 12, padding: 0 }} title="Change animal">🔄</button>
                </>
              )}
            </div>

            {/* Mood face */}
            <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>
              {mood === 'idle' && pet.happiness > 70 ? '( ´ ▽ ` )' :
               mood === 'idle' && pet.happiness > 40 ? '( • ω • )' :
               mood === 'idle' ? '( ; _ ; )' :
               mood === 'happy' ? '( ≧∇≦ )' :
               mood === 'eating' ? '( ᵔ ᴥ ᵔ )' :
               mood === 'playing' ? '( ＊ ω ＊ )' : '( ; ω ; )'}
            </div>
          </div>

          <StatsPanel pet={pet} todayStats={todayStats} />
        </div>
      )}

      {activeTab === 'stats' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 10 }}>OVERVIEW</div>
          <div style={{ background: '#16082e', borderRadius: 8, padding: 14, color: '#a78bfa', fontSize: 13, lineHeight: 1.8 }}>
            <span style={{ color: '#ddd6fe', fontWeight: 700, fontSize: 16 }}>{pet.name}</span><br />
            <span style={{ color: '#a78bfa' }}>Total growth: </span><strong style={{ color: '#ddd6fe' }}>{pet.growthPercent.toFixed(1)}%</strong><br />
            <span style={{ color: '#a78bfa' }}>Days active: </span><strong style={{ color: '#ddd6fe' }}>{pet.totalDaysActive}</strong><br />
            <span style={{ color: '#a78bfa' }}>Animal: </span><strong style={{ color: '#ddd6fe' }}>{ANIMAL_EMOJIS[pet.animalType ?? 'cat']} {ANIMAL_NAMES[pet.animalType ?? 'cat']}</strong>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div style={{ borderTop: '1px solid #2d1b69', flexShrink: 0 }}>
        <ActionBar
          onFeed={handleFeed} onPlay={handlePlay}
          onJobApply={handleJobApply} onLogWork={() => setShowWorkLog(true)}
          onRefreshGit={handleRefreshGit} isRefreshing={isRefreshing}
        />
      </div>

      {/* Work log modal */}
      {showWorkLog && <WorkLogModal onSubmit={handleWorkLog} onClose={() => setShowWorkLog(false)} />}

      {/* Animal selector */}
      {showAnimalSelect && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ background: '#1a0a3c', borderRadius: 16, padding: 22, width: 340, border: '1px solid #2d1b69' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#ddd6fe', marginBottom: 14, textAlign: 'center' }}>
              Choose your companion 🐾
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {ALL_ANIMALS.map(type => (
                <button key={type} onClick={() => handleSelectAnimal(type)}
                  style={{
                    background: (pet.animalType ?? 'cat') === type ? '#4c1d95' : '#16082e',
                    border: `2px solid ${(pet.animalType ?? 'cat') === type ? '#7c3aed' : '#2d1b69'}`,
                    borderRadius: 10, padding: '10px 4px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'background 0.15s, border-color 0.15s'
                  }}>
                  <span style={{ fontSize: 24 }}>{ANIMAL_EMOJIS[type]}</span>
                  <span style={{ fontSize: 11, color: '#c4b5fd', fontWeight: 600 }}>{ANIMAL_NAMES[type]}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowAnimalSelect(false)}
              style={{ marginTop: 14, width: '100%', background: 'transparent', border: '1px solid #2d1b69', borderRadius: 8, padding: '8px 0', color: '#a78bfa', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
