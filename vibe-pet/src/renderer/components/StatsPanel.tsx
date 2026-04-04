import type { DailyStats, PetState } from '../../shared/types'
import { STAGE_NAMES, calculateXPFromStats, xpToGrowthPercent } from '../../shared/types'

interface Props { pet: PetState; todayStats: DailyStats | null }

function Bar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ background: '#2d1b69', borderRadius: 4, height: 8, width: '100%', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
    </div>
  )
}

function Row({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ color: '#a78bfa', fontSize: 12 }}>{icon} {label}</span>
      <span style={{ color: '#e9d5ff', fontSize: 12, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

export function StatsPanel({ pet, todayStats }: Props) {
  const stats = todayStats ?? { linesAdded: 0, productiveMinutes: 0, jobApplications: 0, manualWorkMinutes: 0, xpEarned: 0, growthEarned: 0, date: '' }

  const liveXP = calculateXPFromStats(stats)
  const liveGrowthToday = xpToGrowthPercent(liveXP)

  const prevThresholds = [0, 15, 30, 50, 70, 90]
  const nextThresholds = [15, 30, 50, 70, 90, 100]
  const prev = prevThresholds[pet.stage] ?? 0
  const next = nextThresholds[pet.stage] ?? 100
  const stageProgress = Math.min(100, Math.max(0, ((pet.growthPercent - prev) / (next - prev)) * 100))
  const nextName = pet.stage < 5 ? STAGE_NAMES[(pet.stage + 1) as keyof typeof STAGE_NAMES] : 'MAX ✦'

  const xpBreakdown = [
    { label: 'Code', val: Math.floor(stats.linesAdded / 100) * 8, detail: `${stats.linesAdded} lines` },
    { label: 'Prod time', val: Math.floor(stats.productiveMinutes / 30) * 5, detail: `${stats.productiveMinutes}m` },
    { label: 'Job apps', val: stats.jobApplications * 15, detail: `×${stats.jobApplications}` },
    { label: 'Study', val: Math.floor(stats.manualWorkMinutes / 30) * 6, detail: `${stats.manualWorkMinutes}m` },
  ]

  return (
    <div style={{ padding: '10px 16px', color: '#e9d5ff' }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#a78bfa' }}>Stage {pet.stage} · {STAGE_NAMES[pet.stage]}</span>
          <span style={{ fontSize: 11, color: '#c4b5fd' }}>{pet.growthPercent.toFixed(1)}% → {nextName}</span>
        </div>
        <Bar value={stageProgress} color="#7c3aed" />
      </div>

      <div style={{ background: 'rgba(124,58,237,0.12)', borderRadius: 6, padding: '6px 10px', marginBottom: 10, border: '1px solid #2d1b69' }}>
        <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 3 }}>Today's contribution</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#c4b5fd' }}>+{liveGrowthToday.toFixed(2)}%</span>
          <span style={{ fontSize: 11, color: '#7c3aed' }}>({liveXP} XP)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 3 }}>😊 Happy</div>
          <Bar value={pet.happiness} color={pet.happiness > 50 ? '#34d399' : '#f87171'} />
          <div style={{ fontSize: 10, color: '#c4b5fd', marginTop: 2 }}>{pet.happiness}/100</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 3 }}>🍖 Full</div>
          <Bar value={pet.hunger} color={pet.hunger > 50 ? '#60a5fa' : '#fbbf24'} />
          <div style={{ fontSize: 10, color: '#c4b5fd', marginTop: 2 }}>{pet.hunger}/100</div>
        </div>
      </div>

      <div style={{ background: '#16082e', borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, marginBottom: 6 }}>TODAY'S GRIND</div>
        {xpBreakdown.map(({ label, val, detail }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
            <span style={{ color: '#a78bfa', fontSize: 12 }}>{label}</span>
            <span style={{ color: '#6b7280', fontSize: 11 }}>{detail}</span>
            <span style={{ color: val > 0 ? '#c4b5fd' : '#4b3d7a', fontSize: 12, fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
              {val > 0 ? `+${val}` : '–'} XP
            </span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #2d1b69', marginTop: 5, paddingTop: 5 }}>
          <Row label="Total XP today" value={`${liveXP} / 120`} icon="⚡" />
        </div>
      </div>
    </div>
  )
}
