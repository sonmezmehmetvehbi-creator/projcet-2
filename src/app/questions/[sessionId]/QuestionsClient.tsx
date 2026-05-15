'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, RotateCcw, Download } from 'lucide-react'
import type { MCQuestion, FRQuestion, Question } from '@/types'

interface Props { session: any }

export default function QuestionsClient({ session }: Props) {
  const questions: Question[] = session.content?.questions ?? []
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, { answer: string; correct: boolean | null }>>({})
  const [frInputs, setFrInputs] = useState<Record<number, string>>({})
  const [frFeedback, setFrFeedback] = useState<Record<number, { score: string; feedback: string }>>({})
  const [frLoading, setFrLoading] = useState<Record<number, boolean>>({})
  const [showSummary, setShowSummary] = useState(false)
  const router = useRouter()

  const q = questions[current]
  const total = questions.length
  const score = Object.values(answers).filter(a => a.correct === true).length

  function selectMC(question: MCQuestion, choice: string) {
    if (answers[current]) return
    const correct = choice === question.correctAnswer
    setAnswers(prev => ({ ...prev, [current]: { answer: choice, correct } }))
  }

  async function submitFR(question: FRQuestion) {
    const studentAnswer = frInputs[current] ?? ''
    if (!studentAnswer.trim()) return
    setFrLoading(prev => ({ ...prev, [current]: true }))
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          modelAnswer: question.modelAnswer,
          studentAnswer,
          grade: session.grade,
          subject: session.subject,
        }),
      })
      const data = await res.json()
      setFrFeedback(prev => ({ ...prev, [current]: data }))
      setAnswers(prev => ({ ...prev, [current]: { answer: studentAnswer, correct: null } }))
    } catch {}
    setFrLoading(prev => ({ ...prev, [current]: false }))
  }

  async function downloadPDF() {
    const res = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id }),
    })
    const html = await res.text()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `studyspark-${session.topic.replace(/\s+/g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  function next() {
    if (current < total - 1) setCurrent(c => c + 1)
    else setShowSummary(true)
  }

  function prev() { if (current > 0) setCurrent(c => c - 1) }

  if (showSummary) return (
    <Summary
      questions={questions}
      answers={answers}
      score={score}
      total={total}
      session={session}
      onRestart={() => { setAnswers({}); setFrInputs({}); setFrFeedback({}); setCurrent(0); setShowSummary(false) }}
    />
  )

  if (!q) return <div style={{ paddingTop:'6rem', textAlign:'center', color:'rgb(107,107,88)' }}>No questions found.</div>

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh' }}>
      <div className="container-base" style={{ padding:'2rem 1.5rem', maxWidth:'48rem' }}>

        {/* Header */}
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem', flexWrap:'wrap', gap:'0.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <span className="badge badge-primary">{session.subject}</span>
              <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>{session.topic}</span>
            </div>
            <span style={{ fontSize:'0.875rem', fontWeight:600, color:'rgb(26,26,20)' }}>
              {Object.keys(answers).length}/{total} answered
            </span>
          </div>
          <div style={{ width:'100%', height:'6px', background:'rgba(34,85,14,0.1)', borderRadius:'9999px', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'rgb(34,85,14)', borderRadius:'9999px', width:`${(Object.keys(answers).length / total) * 100}%`, transition:'width 0.3s' }} />
          </div>
        </div>

        {/* Question card */}
        <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
          <p style={{ fontSize:'0.8125rem', fontWeight:600, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.75rem' }}>
            Question {current + 1} of {total} · {q.type === 'mc' ? 'Multiple Choice' : 'Free Response'}
          </p>
          <p style={{ fontSize:'1.125rem', fontWeight:600, color:'rgb(26,26,20)', lineHeight:1.6, marginBottom:'1.5rem' }}>
            {q.question}
          </p>

          {q.type === 'mc' ? (
            <MCOptions
              question={q as MCQuestion}
              answered={answers[current]}
              onSelect={(c) => selectMC(q as MCQuestion, c)}
            />
          ) : (
            <FRInput
              question={q as FRQuestion}
              value={frInputs[current] ?? ''}
              onChange={v => setFrInputs(prev => ({ ...prev, [current]: v }))}
              onSubmit={() => submitFR(q as FRQuestion)}
              loading={frLoading[current] ?? false}
              feedback={frFeedback[current]}
              answered={!!answers[current]}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
          <button onClick={prev} disabled={current === 0} className="btn-secondary" style={{ padding:'0.625rem 1.25rem' }}>
            <ArrowLeft style={{ width:'1rem', height:'1rem' }} /> Previous
          </button>
          <button onClick={downloadPDF} className="btn-ghost" style={{ fontSize:'0.875rem' }}>
            <Download style={{ width:'1rem', height:'1rem' }} /> Save PDF
          </button>
          <button onClick={next} disabled={!answers[current]} className="btn-primary" style={{ padding:'0.625rem 1.25rem' }}>
            {current === total - 1 ? 'See Results' : 'Next'} <ArrowRight style={{ width:'1rem', height:'1rem' }} />
          </button>
        </div>

      </div>
    </div>
  )
}

function MCOptions({ question, answered, onSelect }: {
  question: MCQuestion
  answered?: { answer: string; correct: boolean | null }
  onSelect: (c: string) => void
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      {question.options.map(option => {
        const letter = option.charAt(0)
        const isSelected = answered?.answer === letter
        const isCorrect = letter === question.correctAnswer
        let cls = 'mc-option'
        if (answered) {
          if (isCorrect) cls += ' mc-option-correct'
          else if (isSelected) cls += ' mc-option-wrong'
          else cls += ' mc-option-disabled'
        }
        return (
          <button key={letter} onClick={() => onSelect(letter)} className={cls}
            style={{ width:'100%', background:'none', textAlign:'left' }}>
            <div style={{
              width:'1.75rem', height:'1.75rem', borderRadius:'50%', flexShrink:0,
              border:`2px solid ${answered ? (isCorrect ? 'rgb(59,109,17)' : isSelected ? 'rgb(163,45,45)' : 'rgba(34,85,14,0.2)') : 'rgba(34,85,14,0.3)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'0.8125rem', fontWeight:700,
              color: answered ? (isCorrect ? 'rgb(59,109,17)' : isSelected ? 'rgb(163,45,45)' : 'rgb(107,107,88)') : 'rgb(34,85,14)'
            }}>
              {letter}
            </div>
            <span style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.5 }}>
              {option.substring(3)}
            </span>
            {answered && isCorrect && <CheckCircle style={{ width:'1.25rem', height:'1.25rem', color:'rgb(59,109,17)', marginLeft:'auto', flexShrink:0 }} />}
            {answered && isSelected && !isCorrect && <XCircle style={{ width:'1.25rem', height:'1.25rem', color:'rgb(163,45,45)', marginLeft:'auto', flexShrink:0 }} />}
          </button>
        )
      })}

      {answered && (
        <div style={{
          marginTop:'0.5rem', padding:'1.25rem', borderRadius:'0.875rem',
          background: answered.correct ? 'rgb(234,243,222)' : 'rgb(252,235,235)',
          border:`1px solid ${answered.correct ? 'rgba(59,109,17,0.2)' : 'rgba(163,45,45,0.2)'}`
        }}>
          <p style={{ fontWeight:700, fontSize:'1rem', marginBottom:'0.5rem', color: answered.correct ? 'rgb(59,109,17)' : 'rgb(163,45,45)' }}>
            {answered.correct ? '🎉 Excellent!!! Great job!' : "💡 Not quite — here's how to think about it:"}
          </p>
          <p style={{ fontSize:'0.9375rem', lineHeight:1.7, color: answered.correct ? 'rgba(59,109,17,0.9)' : 'rgba(163,45,45,0.9)' }}>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  )
}

function FRInput({ question, value, onChange, onSubmit, loading, feedback, answered }: {
  question: FRQuestion; value: string; onChange: (v: string) => void
  onSubmit: () => void; loading: boolean
  feedback?: { score: string; feedback: string }; answered: boolean
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <textarea value={value} onChange={e => onChange(e.target.value)} disabled={answered}
        placeholder="Write your answer here..." rows={5}
        className="input" style={{ resize:'vertical', lineHeight:1.6 }} />
      {!answered && (
        <button onClick={onSubmit} disabled={loading || !value.trim()} className="btn-primary" style={{ alignSelf:'flex-start' }}>
          {loading ? 'Checking...' : 'Check My Answer'}
        </button>
      )}
      {feedback && (
        <div style={{ padding:'1.25rem', borderRadius:'0.875rem', background:'rgb(234,243,222)', border:'1px solid rgba(59,109,17,0.2)' }}>
          <p style={{ fontWeight:700, color:'rgb(59,109,17)', marginBottom:'0.5rem' }}>Score: {feedback.score}</p>
          <p style={{ fontSize:'0.9375rem', color:'rgba(59,109,17,0.9)', lineHeight:1.7 }}>{feedback.feedback}</p>
        </div>
      )}
    </div>
  )
}

function Summary({ questions, answers, score, total, session, onRestart }: {
  questions: Question[]; answers: any; score: number; total: number; session: any; onRestart: () => void
}) {
  const router = useRouter()
  const pct = Math.round((score / total) * 100)
  const getMessage = () => {
    if (pct >= 90) return { text:'Outstanding! 🏆', sub:'You absolutely nailed it!' }
    if (pct >= 70) return { text:'Great work! 🎉', sub:'You have a solid understanding.' }
    if (pct >= 50) return { text:'Good effort! 💪', sub:"Keep practicing and you'll get there." }
    return { text:'Keep going! 📚', sub:'Review the material and try again.' }
  }
  const msg = getMessage()

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh' }}>
      <div className="container-base" style={{ padding:'2rem 1.5rem', maxWidth:'40rem' }}>
        <div className="card" style={{ padding:'2.5rem', textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ width:'6rem', height:'6rem', borderRadius:'50%', background:'rgba(34,85,14,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', fontSize:'2.5rem' }}>
            {pct >= 70 ? '🎉' : '📚'}
          </div>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>{msg.text}</h1>
          <p style={{ color:'rgb(107,107,88)', marginBottom:'1.5rem' }}>{msg.sub}</p>
          <div style={{ fontSize:'3rem', fontWeight:700, color:'rgb(34,85,14)', marginBottom:'0.5rem' }}>{score}/{total}</div>
          <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>{pct}% correct</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1.5rem' }}>
          {questions.map((q, i) => {
            const a = answers[i]
            const correct = a?.correct === true
            const wasAnswered = !!a
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'white', border:'1px solid rgba(34,85,14,0.08)' }}>
                {wasAnswered
                  ? correct
                    ? <CheckCircle style={{ width:'1.25rem', height:'1.25rem', color:'rgb(59,109,17)', flexShrink:0 }} />
                    : <XCircle style={{ width:'1.25rem', height:'1.25rem', color:'rgb(163,45,45)', flexShrink:0 }} />
                  : <div style={{ width:'1.25rem', height:'1.25rem', borderRadius:'50%', border:'2px solid rgba(34,85,14,0.2)', flexShrink:0 }} />
                }
                <span style={{ fontSize:'0.875rem', color:'rgb(26,26,20)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  Q{i + 1}: {q.question}
                </span>
                <span className="badge" style={{ background: !wasAnswered ? 'rgba(34,85,14,0.05)' : correct ? 'rgb(234,243,222)' : 'rgb(252,235,235)', color: !wasAnswered ? 'rgb(107,107,88)' : correct ? 'rgb(59,109,17)' : 'rgb(163,45,45)', flexShrink:0 }}>
                  {!wasAnswered ? 'Skipped' : correct ? 'Correct' : 'Review'}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <button onClick={onRestart} className="btn-secondary" style={{ flex:1 }}>
            <RotateCcw style={{ width:'1rem', height:'1rem' }} /> Try Again
          </button>
          <button onClick={() => router.push('/generate')} className="btn-primary" style={{ flex:1 }}>
            New Topic
          </button>
        </div>
      </div>
    </div>
  )
}