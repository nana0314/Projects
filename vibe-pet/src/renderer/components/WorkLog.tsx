import { useState } from 'react'

interface Props {
  onSubmit: (entry: { category: string; description: string; minutes: number }) => void
  onClose: () => void
}

const CATEGORIES = [
  { value: 'study', label: '📖 Study', color: '#3b82f6' },
  { value: 'assignment', label: '✏️ Assignment', color: '#8b5cf6' },
  { value: 'research', label: '🔍 Research', color: '#06b6d4' },
  { value: 'other', label: '💼 Other work', color: '#64748b' }
]

export function WorkLogModal({ onSubmit, onClose }: Props) {
  const [category, setCategory] = useState('study')
  const [description, setDescription] = useState('')
  const [minutes, setMinutes] = useState(30)

  function handleSubmit() {
    if (!description.trim()) return
    onSubmit({ category, description: description.trim(), minutes })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{
        background: '#1a0a3c', borderRadius: 14, padding: 24, width: 320,
        border: '1px solid #2d1b69', color: '#e9d5ff'
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#ddd6fe' }}>
          📚 Log Work Session
        </div>

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#a78bfa', marginBottom: 8 }}>Category</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                style={{
                  background: category === cat.value ? cat.color : '#16082e',
                  border: `1px solid ${category === cat.value ? cat.color : '#2d1b69'}`,
                  borderRadius: 8, padding: '7px 4px',
                  color: '#e9d5ff', fontSize: 12, cursor: 'pointer', fontWeight: 600
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#a78bfa', marginBottom: 6 }}>What did you work on?</div>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. React lecture, ML assignment..."
            style={{
              width: '100%', background: '#16082e', border: '1px solid #2d1b69',
              borderRadius: 8, padding: '8px 10px', color: '#e9d5ff',
              fontSize: 13, outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Duration */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: '#a78bfa', marginBottom: 6 }}>
            Duration: <strong style={{ color: '#c4b5fd' }}>{minutes} min</strong>
          </div>
          <input
            type="range" min={15} max={480} step={15}
            value={minutes}
            onChange={e => setMinutes(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#7c3aed' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280' }}>
            <span>15m</span><span>2h</span><span>4h</span><span>8h</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, background: 'transparent', border: '1px solid #2d1b69',
              borderRadius: 8, padding: '9px 0', color: '#a78bfa',
              fontSize: 13, cursor: 'pointer', fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!description.trim()}
            style={{
              flex: 2, background: '#7c3aed', border: 'none',
              borderRadius: 8, padding: '9px 0', color: '#fff',
              fontSize: 13, cursor: 'pointer', fontWeight: 700,
              opacity: !description.trim() ? 0.5 : 1
            }}
          >
            +XP Log it!
          </button>
        </div>
      </div>
    </div>
  )
}
