import { useState } from 'react'

export default function QuizTab({ chapters, api }) {
  const [course, setCourse] = useState('')
  const [chapter, setChapter] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [numQ, setNumQ] = useState(5)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState(null)
  const [selected, setSelected] = useState({})   // { index: optionText }
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const courses = [...new Set(chapters.map(c => c.course))].sort()
  const chapterOptions = course
    ? chapters.filter(c => c.course === course).map(c => c.chapter).sort()
    : []

  async function generate() {
    if (!course || !chapter) return
    setLoading(true); setError(''); setQuestions(null); setSelected({}); setSubmitted(false)
    try {
      const r = await fetch(`${api}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course, chapter, difficulty, num_questions: numQ }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Failed')
      setQuestions(data.questions)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  function submit() {
    if (Object.keys(selected).length < questions.length) {
      setError('Answer all questions before submitting.')
      return
    }
    setError(''); setSubmitted(true)
  }

  function reset() { setQuestions(null); setSelected({}); setSubmitted(false); setError('') }

  const score = submitted
    ? questions.filter((q, i) => (selected[i] || '')[0] === q.answer).length
    : 0
  const pct = submitted ? Math.round(score / questions.length * 100) : 0
  const grade = pct >= 80 ? '🏆 Excellent!' : pct >= 50 ? '👍 Good effort!' : '📖 Keep studying!'

  if (chapters.length === 0) {
    return <div className="empty-state">Upload a lecture PDF from the sidebar to start a quiz.</div>
  }

  return (
    <>
      {/* Filters */}
      <div className="quiz-filters">
        <div>
          <label>Course</label>
          <select value={course} onChange={e => { setCourse(e.target.value); setChapter('') }}>
            <option value="">Select course…</option>
            {courses.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Chapter</label>
          <select value={chapter} onChange={e => setChapter(e.target.value)} disabled={!course}>
            <option value="">Select chapter…</option>
            {chapterOptions.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Difficulty</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label>Questions</label>
          <select value={numQ} onChange={e => setNumQ(Number(e.target.value))}>
            {[3,5,7,10].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={generate}
            disabled={loading || !course || !chapter} style={{ whiteSpace: 'nowrap' }}>
            {loading ? 'Generating…' : 'Generate Quiz'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      {/* Score banner */}
      {submitted && (
        <div className="score-banner">
          <h2>{score}/{questions.length}</h2>
          <p>{pct}% · {grade}</p>
        </div>
      )}

      {/* Questions */}
      {questions && questions.map((q, i) => {
        const userAns = selected[i] || ''
        const correct = submitted && userAns[0] === q.answer
        const wrong = submitted && userAns[0] !== q.answer

        return (
          <div key={i} className={`quiz-card ${submitted ? (correct ? 'correct' : 'wrong') : ''}`}>
            <div className="quiz-question">Q{i+1}. {q.question}</div>
            <div className="quiz-options">
              {q.options.map((opt, j) => {
                let cls = 'quiz-option'
                if (selected[i] === opt) cls += ' selected'
                if (submitted) {
                  if (opt[0] === q.answer) cls = 'quiz-option correct-opt'
                  else if (selected[i] === opt) cls = 'quiz-option wrong-opt'
                }
                return (
                  <div key={j} className={cls}
                    onClick={() => !submitted && setSelected(s => ({ ...s, [i]: opt }))}>
                    <span>{opt}</span>
                  </div>
                )
              })}
            </div>
            {submitted && (
              <div className="quiz-explanation">💡 {q.explanation}</div>
            )}
          </div>
        )
      })}

      {/* Actions */}
      {questions && !submitted && (
        <button className="btn btn-primary" onClick={submit}>Submit Answers</button>
      )}
      {submitted && (
        <button className="btn btn-ghost" onClick={reset}>Retake Quiz</button>
      )}
    </>
  )
}
