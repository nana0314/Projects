import { useState, useRef, useEffect } from 'react'

export default function ChatTab({ chapters, api }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [course, setCourse] = useState('all')
  const [chapter, setChapter] = useState('all')
  const bottomRef = useRef()

  const courses = [...new Set(chapters.map(c => c.course))].sort()
  const chapterOptions = course === 'all'
    ? [...new Set(chapters.map(c => c.chapter))].sort()
    : chapters.filter(c => c.course === course).map(c => c.chapter).sort()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    const userMsg = { role: 'user', content: q }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const r = await fetch(`${api}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          course: course === 'all' ? null : course,
          chapter: chapter === 'all' ? null : chapter,
        }),
      })
      const data = await r.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        intent: data.intent,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Failed to get a response. Is the backend running?' }])
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (chapters.length === 0) {
    return <div className="empty-state">Upload a lecture PDF from the sidebar to start chatting.</div>
  }

  return (
    <>
      {/* Filters */}
      <div className="chat-filters">
        <div>
          <label>Course</label>
          <select value={course} onChange={e => { setCourse(e.target.value); setChapter('all') }}>
            <option value="all">All courses</option>
            {courses.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Chapter</label>
          <select value={chapter} onChange={e => setChapter(e.target.value)}>
            <option value="all">All chapters</option>
            {chapterOptions.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessages([])}>Clear</button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages" style={{ flex: 1 }}>
        {messages.length === 0 && (
          <div className="empty-state">
            Ask a question, request a chapter summary, or generate practice questions.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <div className={`avatar ${m.role}`}>{m.role === 'user' ? '🧑' : '🤖'}</div>
            <div>
              <div className="bubble">{m.content}</div>
              {m.sources?.length > 0 && (
                <details className="sources">
                  <summary>📄 {m.sources.length} source{m.sources.length > 1 ? 's' : ''}</summary>
                  {m.sources.map((s, j) => (
                    <p key={j}>Page {s.page} · {s.chapter}{s.score ? ` · ${s.score}` : ''}</p>
                  ))}
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="avatar assistant">🤖</div>
            <div className="bubble" style={{ color: 'var(--muted)' }}>Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <textarea
          rows={1} placeholder="Ask a question or request a summary… (Enter to send, Shift+Enter for newline)"
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
        />
        <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>Send</button>
      </div>
    </>
  )
}
