import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatTab from './components/ChatTab'
import QuizTab from './components/QuizTab'

const API = 'http://127.0.0.1:8000'

function SetupScreen({ onSubmit }) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!key.trim().startsWith('sk-')) { setError('Key should start with sk-'); return }
    setLoading(true)
    setError('')
    const ready = await window.electronAPI.saveApiKey(key.trim())
    if (ready) onSubmit()
    else setError('Backend failed to start. Check your API key and try again.')
    setLoading(false)
  }

  return (
    <div className="center-screen">
      <div className="setup-card">
        <h1>📚 Lecture RAG</h1>
        <p>Enter your OpenAI API key to get started. It will be saved locally on your machine.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label>OpenAI API Key</label>
            <input
              type="password" placeholder="sk-proj-..."
              value={key} onChange={e => setKey(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading || !key}>
            {loading ? 'Starting…' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="center-screen">
      <div className="spinner" />
      <p style={{ color: 'var(--muted)' }}>Starting backend…</p>
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState('init') // init | setup | loading | ready
  const [activeTab, setActiveTab] = useState('chat')
  const [chapters, setChapters] = useState([])

  useEffect(() => {
    window.electronAPI.getApiKey().then(key => {
      if (!key) { setPhase('setup'); return }
      setPhase('loading')
      pollBackend()
    })
  }, [])

  async function pollBackend() {
    for (let i = 0; i < 60; i++) {
      const ready = await window.electronAPI.isBackendReady()
      if (ready) { await fetchChapters(); setPhase('ready'); return }
      await new Promise(r => setTimeout(r, 500))
    }
    setPhase('setup') // timed out, ask for key again
  }

  async function fetchChapters() {
    try {
      const r = await fetch(`${API}/chapters`)
      setChapters(await r.json())
    } catch {}
  }

  if (phase === 'init' || phase === 'loading') return <LoadingScreen />
  if (phase === 'setup') return <SetupScreen onSubmit={() => { setPhase('loading'); pollBackend() }} />

  return (
    <div className="app">
      <Sidebar chapters={chapters} onIngested={fetchChapters} api={API} />
      <div className="main">
        <div className="tabs">
          <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
            💬 Chat
          </button>
          <button className={activeTab === 'quiz' ? 'active' : ''} onClick={() => setActiveTab('quiz')}>
            🧠 Quiz
          </button>
        </div>
        <div className="tab-content">
          {activeTab === 'chat'
            ? <ChatTab chapters={chapters} api={API} />
            : <QuizTab chapters={chapters} api={API} />}
        </div>
      </div>
    </div>
  )
}
