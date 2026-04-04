interface Props {
  onFeed: () => void
  onPlay: () => void
  onJobApply: () => void
  onLogWork: () => void
  onRefreshGit: () => void
  isRefreshing: boolean
}

function ActionBtn({
  label, emoji, onClick, color = '#7c3aed', disabled = false
}: {
  label: string; emoji: string; onClick: () => void; color?: string; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#2d1b69' : color,
        border: 'none',
        borderRadius: 10,
        padding: '10px 6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: '#fff',
        fontSize: 11,
        fontWeight: 600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.1s, opacity 0.2s',
        flex: 1
      }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span>{label}</span>
    </button>
  )
}

export function ActionBar({ onFeed, onPlay, onJobApply, onLogWork, onRefreshGit, isRefreshing }: Props) {
  return (
    <div style={{ padding: '8px 16px 16px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <ActionBtn label="Feed" emoji="🍖" onClick={onFeed} color="#059669" />
        <ActionBtn label="Play" emoji="🎮" onClick={onPlay} color="#7c3aed" />
        <ActionBtn label="Applied!" emoji="📝" onClick={onJobApply} color="#dc6a19" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <ActionBtn label="Log Work" emoji="📚" onClick={onLogWork} color="#1d4ed8" />
        <ActionBtn
          label={isRefreshing ? 'Scanning…' : 'Scan Git'}
          emoji="🔄"
          onClick={onRefreshGit}
          color="#475569"
          disabled={isRefreshing}
        />
      </div>
    </div>
  )
}
