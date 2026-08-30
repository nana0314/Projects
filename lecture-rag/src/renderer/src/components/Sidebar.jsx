import { useState, useRef } from 'react'

export default function Sidebar({ chapters, onIngested, api }) {
  const [file, setFile] = useState(null)
  const [course, setCourse] = useState('')
  const [chapter, setChapter] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'ok'|'err', text }
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  // Group chapters by course
  const grouped = chapters.reduce((acc, c) => {
    acc[c.course] = acc[c.course] || []
    acc[c.course].push(c.chapter)
    return acc
  }, {})

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setFile(f)
  }

  async function handleIngest() {
    if (!file || !course.trim() || !chapter.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('course', course.trim())
      form.append('chapter', chapter.trim())
      const r = await fetch(`${api}/ingest`, { method: 'POST', body: form })
      if (!r.ok) throw new Error((await r.json()).detail || 'Ingest failed')
      const data = await r.json()
      setMessage({ type: 'ok', text: `Done — ${data.chunks} chunks stored` })
      setFile(null); setCourse(''); setChapter('')
      onIngested()
    } catch (e) {
      setMessage({ type: 'err', text: e.message })
    }
    setLoading(false)
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">📚 Lecture <span>RAG</span></div>
      <hr className="divider" />

      <div>
        <div className="sidebar-label">Upload PDF</div>

        <div
          className={`dropzone ${dragging ? 'active' : ''} ${file ? 'has-file' : ''}`}
          onClick={() => inputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {file ? `📄 ${file.name}` : 'Drop PDF here or click to browse'}
          <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])} />
        </div>

        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label>Course</label>
            <input type="text" placeholder="e.g. Business Analytics"
              value={course} onChange={e => setCourse(e.target.value)} />
          </div>
          <div>
            <label>Chapter</label>
            <input type="text" placeholder="e.g. Chapter 1"
              value={chapter} onChange={e => setChapter(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleIngest}
            disabled={loading || !file || !course.trim() || !chapter.trim()}>
            {loading ? 'Ingesting…' : 'Ingest PDF'}
          </button>
          {message && (
            <span className={`tag ${message.type === 'ok' ? 'tag-green' : 'tag-red'}`}>
              {message.text}
            </span>
          )}
        </div>
      </div>

      <hr className="divider" />

      <div>
        <div className="sidebar-label">Ingested Chapters</div>
        {Object.keys(grouped).length === 0
          ? <p style={{ color: 'var(--muted)', fontSize: 12 }}>No chapters yet.</p>
          : Object.entries(grouped).sort().map(([c, chs]) => (
            <div key={c} className="chapter-group">
              <div className="chapter-course">{c}</div>
              {chs.sort().map(ch => <div key={ch} className="chapter-item">• {ch}</div>)}
            </div>
          ))
        }
      </div>
    </div>
  )
}
