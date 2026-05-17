'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, RotateCcw, Download } from 'lucide-react'
import type { MCQuestion, FRQuestion, Question } from '@/types'
import MathText from '@/components/ui/MathText'

interface Props { session: any; isPremium?: boolean }

export default function QuestionsClient({ session, isPremium = false }: Props) {
  const questions: Question[] = session.content?.questions ?? []
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, { answer: string; correct: boolean | null; topic?: string; frScore?: string }>>({})
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
    setAnswers(prev => ({ ...prev, [current]: { answer: choice, correct, topic: (question as any).topic } }))
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
      // Store frScore so summary can use it for color/label
      setAnswers(prev => ({ ...prev, [current]: { answer: studentAnswer, correct: null, topic: (question as any).topic, frScore: data.score } }))
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
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
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

        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem', flexWrap:'wrap', gap:'0.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
              <span className="badge badge-primary">{session.subject}</span>
              <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>{session.topic}</span>
              {session.difficulty && (
                <span className="badge" style={{
                  background: session.difficulty === 'easy' ? 'rgba(34,85,14,0.08)' :
                    session.difficulty === 'medium' ? 'rgba(59,130,246,0.1)' :
                    session.difficulty === 'hard' ? 'rgba(245,158,11,0.12)' :
                    'rgba(239,68,68,0.1)',
                  color: session.difficulty === 'easy' ? 'rgb(34,85,14)' :
                    session.difficulty === 'medium' ? 'rgb(37,99,235)' :
                    session.difficulty === 'hard' ? 'rgb(180,120,10)' :
                    'rgb(185,28,28)',
                }}>
                  {session.difficulty === 'easy' ? '🌱 Easy' :
                   session.difficulty === 'medium' ? '📚 Medium' :
                   session.difficulty === 'hard' ? '🔥 Hard' : '⚡ Expert'}
                </span>
              )}
            </div>
            <span style={{ fontSize:'0.875rem', fontWeight:600, color:'rgb(26,26,20)' }}>
              {Object.keys(answers).length}/{total} answered
            </span>
          </div>
          <div style={{ width:'100%', height:'6px', background:'rgba(34,85,14,0.1)', borderRadius:'9999px', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'rgb(34,85,14)', borderRadius:'9999px', width:`${(Object.keys(answers).length / total) * 100}%`, transition:'width 0.3s' }} />
          </div>
        </div>

        <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
          <p style={{ fontSize:'0.8125rem', fontWeight:600, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.75rem' }}>
            Question {current + 1} of {total} · {q.type === 'mc' ? 'Multiple Choice' : 'Free Response'}
          </p>
          <MathText text={q.question} style={{ fontSize:'1.125rem', fontWeight:600, color:'rgb(26,26,20)', lineHeight:1.6, marginBottom:'1.5rem', display:'block' }} />

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
            <MathText text={option.substring(3)} style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.5 }} />
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
          <MathText text={question.explanation} style={{ fontSize:'0.9375rem', lineHeight:1.7, color: answered.correct ? 'rgba(59,109,17,0.9)' : 'rgba(163,45,45,0.9)', display:'block' }} />
        </div>
      )}
    </div>
  )
}

// Returns colors/label based on FR score string e.g. "3/4"
function getFRColors(score: string) {
  switch (score) {
    case '4/4': return { bg:'rgb(234,243,222)',          border:'rgba(59,109,17,0.2)',    title:'rgb(59,109,17)',    text:'rgba(59,109,17,0.85)',   emoji:'🎉', label:'Excellent!' }
    case '3/4': return { bg:'rgba(34,85,14,0.06)',       border:'rgba(34,85,14,0.18)',    title:'rgb(34,85,14)',     text:'rgba(34,85,14,0.8)',     emoji:'👍', label:'Good work!' }
    case '2/4': return { bg:'rgba(232,160,32,0.08)',     border:'rgba(232,160,32,0.3)',   title:'rgb(180,120,10)',   text:'rgba(180,120,10,0.9)',   emoji:'📚', label:'Halfway there' }
    case '1/4': return { bg:'rgba(220,80,20,0.07)',      border:'rgba(220,80,20,0.22)',   title:'rgb(200,75,20)',    text:'rgba(200,75,20,0.85)',   emoji:'💪', label:'Keep practicing' }
    default:    return { bg:'rgb(252,235,235)',           border:'rgba(163,45,45,0.2)',    title:'rgb(163,45,45)',    text:'rgba(163,45,45,0.85)',   emoji:'❌', label:'Needs review' }
  }
}

// Maps a score string to a summary badge style (used in question list at end)
function getFRSummaryStyle(score: string): { bg: string; color: string; label: string } {
  switch (score) {
    case '4/4': return { bg:'rgb(234,243,222)',      color:'rgb(59,109,17)',   label:`✓ ${score}` }
    case '3/4': return { bg:'rgba(34,85,14,0.08)',   color:'rgb(34,85,14)',    label:`✓ ${score}` }
    case '2/4': return { bg:'rgba(232,160,32,0.12)', color:'rgb(180,120,10)', label:`~ ${score}` }
    case '1/4': return { bg:'rgba(220,80,20,0.09)',  color:'rgb(200,75,20)',   label:`✗ ${score}` }
    default:    return { bg:'rgb(252,235,235)',       color:'rgb(163,45,45)',   label:'Review' }
  }
}

function FRInput({ question, value, onChange, onSubmit, loading, feedback, answered }: {
  question: FRQuestion; value: string; onChange: (v: string) => void
  onSubmit: () => void; loading: boolean
  feedback?: { score: string; feedback: string }; answered: boolean
}) {
  const colors = feedback ? getFRColors(feedback.score) : null

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
      {feedback && colors && (
        <div style={{
          padding:'1.25rem', borderRadius:'0.875rem',
          background: colors.bg,
          border: `1px solid ${colors.border}`,
        }}>
          <p style={{ fontWeight:700, color: colors.title, marginBottom:'0.5rem', fontSize:'1rem' }}>
            {colors.emoji} {colors.label} — Score: {feedback.score}
          </p>
          <p style={{ fontSize:'0.9375rem', color: colors.text, lineHeight:1.7 }}>{feedback.feedback}</p>
        </div>
      )}
    </div>
  )
}

function Summary({ questions, answers, score, total, session, onRestart }: {
  questions: Question[]; answers: any; score: number; total: number; session: any; onRestart: () => void
}) {
  const router = useRouter()
  const [retryQuestions, setRetryQuestions] = useState<Question[] | null>(null)
  const [retryAnswers, setRetryAnswers] = useState<Record<number, any>>({})
  const [retryFrInputs, setRetryFrInputs] = useState<Record<number, string>>({})
  const [retryFrFeedback, setRetryFrFeedback] = useState<Record<number, any>>({})
  const [retryFrLoading, setRetryFrLoading] = useState<Record<number, boolean>>({})
  const [retryCurrent, setRetryCurrent] = useState(0)
  const [retryLoading, setRetryLoading] = useState(false)

  const pct = Math.round((score / total) * 100)

  const wrongByTopic: Record<string, { count: number; questions: Question[] }> = {}
  const correctTopics: string[] = []

  questions.forEach((q, i) => {
    const a = answers[i]
    const topic = (q as any).topic || session.topic
    if (!a) return
    if (a.correct === false) {
      if (!wrongByTopic[topic]) wrongByTopic[topic] = { count: 0, questions: [] }
      wrongByTopic[topic].count++
      wrongByTopic[topic].questions.push(q)
    } else if (a.correct === true) {
      if (!correctTopics.includes(topic)) correctTopics.push(topic)
    }
    // FR with score 3/4 or 4/4 counts as a strong area
    else if (a.correct === null && (a.frScore === '4/4' || a.frScore === '3/4')) {
      if (!correctTopics.includes(topic)) correctTopics.push(topic)
    }
  })

  const wrongTopics = Object.entries(wrongByTopic)
  const totalWrong = wrongTopics.reduce((sum, [, v]) => sum + v.count, 0)

  const getMessage = () => {
    if (pct >= 90) return { emoji:'🏆', title:'Outstanding!', sub:'You absolutely nailed it! Your hard work is paying off.', color:'rgb(34,85,14)' }
    if (pct >= 70) return { emoji:'🎉', title:'Great work!', sub:"You're almost there! A little more practice and you'll be perfect.", color:'rgb(34,85,14)' }
    if (pct >= 50) return { emoji:'💪', title:'Good effort!', sub:"You've got the basics down. Let's strengthen those weak spots!", color:'rgb(180,120,10)' }
    return { emoji:'📚', title:"Let's get it!", sub:"Every expert was once a beginner. Let's tackle those tricky topics together!", color:'rgb(163,45,45)' }
  }
  const msg = getMessage()

  async function handlePracticeWeakSpots() {
    setRetryLoading(true)
    try {
      const wrongTopicNames = wrongTopics.map(([t]) => t).join(', ')
      const retryCount = totalWrong <= 3 ? 5 : wrongTopics.length * 2
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: session.subject,
          grade: session.grade,
          topic: session.topic,
          focus: `Focus ONLY on these weak areas: ${wrongTopicNames}. Mix in some questions similar to the ones the student got wrong.`,
          outputType: 'questions',
          questionCount: retryCount,
          questionTypes: ['mc'],
          isRetry: true,
        }),
      })
      const data = await res.json()
      if (data.content?.questions) {
        setRetryQuestions(data.content.questions)
        setRetryCurrent(0)
        setRetryAnswers({})
      }
    } catch (err) {
      console.error('Retry error:', err)
    }
    setRetryLoading(false)
  }

  if (retryQuestions) {
    const rq = retryQuestions[retryCurrent]
    const retryScore = Object.values(retryAnswers).filter((a: any) => a.correct === true).length
    const retryDone = Object.keys(retryAnswers).length === retryQuestions.length

    if (retryDone) return (
      <div style={{ paddingTop:'5rem', minHeight:'100vh' }}>
        <div className="container-base" style={{ padding:'2rem 1.5rem', maxWidth:'40rem' }}>
          <div className="card" style={{ padding:'2.5rem', textAlign:'center', marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>
              {retryScore === retryQuestions.length ? '🏆' : retryScore >= retryQuestions.length * 0.7 ? '🎉' : '💪'}
            </div>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
              {retryScore === retryQuestions.length ? 'Perfect on the retry! 🔥' : 'Nice work on the practice!'}
            </h2>
            <p style={{ color:'rgb(107,107,88)', marginBottom:'1.5rem' }}>
              You got {retryScore}/{retryQuestions.length} on your weak spot practice.
            </p>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={onRestart} className="btn-secondary">Try full session again</button>
              <button onClick={() => router.push('/generate')} className="btn-primary">New topic</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <div style={{ paddingTop:'5rem', minHeight:'100vh' }}>
        <div className="container-base" style={{ padding:'2rem 1.5rem', maxWidth:'48rem' }}>
          <div style={{ marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
              <span className="badge" style={{ background:'rgba(232,160,32,0.12)', color:'rgb(180,120,10)' }}>🎯 Weak Spot Practice</span>
              <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>{Object.keys(retryAnswers).length}/{retryQuestions.length} answered</span>
            </div>
            <div style={{ width:'100%', height:'6px', background:'rgba(34,85,14,0.1)', borderRadius:'9999px', overflow:'hidden' }}>
              <div style={{ height:'100%', background:'rgb(232,160,32)', borderRadius:'9999px', width:`${(Object.keys(retryAnswers).length / retryQuestions.length) * 100}%`, transition:'width 0.3s' }} />
            </div>
          </div>

          <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
            <p style={{ fontSize:'0.8125rem', fontWeight:600, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.75rem' }}>
              Question {retryCurrent + 1} of {retryQuestions.length}
            </p>
            <MathText text={rq.question} style={{ fontSize:'1.125rem', fontWeight:600, color:'rgb(26,26,20)', lineHeight:1.6, marginBottom:'1.5rem', display:'block' }} />
            {rq.type === 'mc' && (
              <MCOptions
                question={rq as MCQuestion}
                answered={retryAnswers[retryCurrent]}
                onSelect={choice => {
                  if (retryAnswers[retryCurrent]) return
                  const correct = choice === (rq as MCQuestion).correctAnswer
                  setRetryAnswers((prev: any) => ({ ...prev, [retryCurrent]: { answer: choice, correct } }))
                }}
              />
            )}
            {rq.type === 'fr' && (
              <FRInput
                question={rq as FRQuestion}
                value={retryFrInputs[retryCurrent] ?? ''}
                onChange={v => setRetryFrInputs(prev => ({ ...prev, [retryCurrent]: v }))}
                onSubmit={async () => {
                  const studentAnswer = retryFrInputs[retryCurrent] ?? ''
                  if (!studentAnswer.trim()) return
                  setRetryFrLoading(prev => ({ ...prev, [retryCurrent]: true }))
                  try {
                    const res = await fetch('/api/evaluate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ question: rq.question, modelAnswer: (rq as FRQuestion).modelAnswer, studentAnswer, grade: session.grade, subject: session.subject }),
                    })
                    const data = await res.json()
                    setRetryFrFeedback((prev: any) => ({ ...prev, [retryCurrent]: data }))
                    setRetryAnswers((prev: any) => ({ ...prev, [retryCurrent]: { answer: studentAnswer, correct: null, frScore: data.score } }))
                  } catch {}
                  setRetryFrLoading(prev => ({ ...prev, [retryCurrent]: false }))
                }}
                loading={retryFrLoading[retryCurrent] ?? false}
                feedback={retryFrFeedback[retryCurrent]}
                answered={!!retryAnswers[retryCurrent]}
              />
            )}
          </div>

          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <button onClick={() => setRetryCurrent(c => Math.max(0, c - 1))} disabled={retryCurrent === 0} className="btn-secondary" style={{ padding:'0.625rem 1.25rem' }}>
              <ArrowLeft style={{ width:'1rem', height:'1rem' }} /> Previous
            </button>
            <button onClick={() => setRetryCurrent(c => Math.min(retryQuestions.length - 1, c + 1))} disabled={!retryAnswers[retryCurrent]} className="btn-primary" style={{ padding:'0.625rem 1.25rem' }}>
              {retryCurrent === retryQuestions.length - 1 ? 'Finish' : 'Next'} <ArrowRight style={{ width:'1rem', height:'1rem' }} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh' }}>
      <div className="container-base" style={{ padding:'2rem 1.5rem', maxWidth:'44rem' }}>

        <div className="card" style={{ padding:'2.5rem', textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>{msg.emoji}</div>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>{msg.title}</h1>
          <p style={{ color:'rgb(107,107,88)', marginBottom:'1.5rem', maxWidth:'28rem', margin:'0 auto 1.5rem' }}>{msg.sub}</p>
          <div style={{ fontSize:'3.5rem', fontWeight:700, color:msg.color, marginBottom:'0.25rem' }}>{score}/{total}</div>
          <p style={{ color:'rgb(107,107,88)' }}>{pct}% correct</p>
        </div>

        {(wrongTopics.length > 0 || correctTopics.length > 0) && (
          <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1.5rem' }}>📊 Performance Breakdown</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem', marginBottom:'1.5rem' }}>
              {Object.entries(
                questions.reduce((acc: Record<string, { correct: number; total: number }>, q, i) => {
                  const topic = (q as any).topic || session.topic
                  if (!acc[topic]) acc[topic] = { correct: 0, total: 0 }
                  acc[topic].total++
                  if (answers[i]?.correct === true) acc[topic].correct++
                  // Count FR 3/4 and 4/4 as correct in the breakdown bar
                  else if (answers[i]?.frScore === '4/4' || answers[i]?.frScore === '3/4') acc[topic].correct++
                  return acc
                }, {})
              ).map(([topic, data]) => {
                const topicPct = Math.round((data.correct / data.total) * 100)
                const isStrong = topicPct >= 70
                return (
                  <div key={topic}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.375rem' }}>
                      <span style={{ fontSize:'0.875rem', fontWeight:500, color:'rgb(26,26,20)' }}>{topic}</span>
                      <span style={{ fontSize:'0.8125rem', fontWeight:600, color: isStrong ? 'rgb(59,109,17)' : 'rgb(163,45,45)' }}>
                        {data.correct}/{data.total} {isStrong ? '✓' : '✗'}
                      </span>
                    </div>
                    <div style={{ width:'100%', height:'8px', background:'rgba(34,85,14,0.08)', borderRadius:'9999px', overflow:'hidden' }}>
                      <div style={{
                        height:'100%', borderRadius:'9999px',
                        background: isStrong ? 'rgb(59,109,17)' : topicPct >= 40 ? 'rgb(232,160,32)' : 'rgb(163,45,45)',
                        width:`${topicPct}%`,
                        transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {correctTopics.length > 0 && (
                <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'rgb(234,243,222)', border:'1px solid rgba(59,109,17,0.2)' }}>
                  <p style={{ fontSize:'0.8125rem', fontWeight:700, color:'rgb(59,109,17)', marginBottom:'0.5rem' }}>💪 Strong areas</p>
                  {correctTopics.map(t => (
                    <p key={t} style={{ fontSize:'0.8125rem', color:'rgb(59,109,17)', lineHeight:1.6 }}>• {t}</p>
                  ))}
                </div>
              )}
              {wrongTopics.length > 0 && (
                <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'rgb(252,235,235)', border:'1px solid rgba(163,45,45,0.2)' }}>
                  <p style={{ fontSize:'0.8125rem', fontWeight:700, color:'rgb(163,45,45)', marginBottom:'0.5rem' }}>📖 Needs work</p>
                  {wrongTopics.map(([t]) => (
                    <p key={t} style={{ fontSize:'0.8125rem', color:'rgb(163,45,45)', lineHeight:1.6 }}>• {t}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {wrongTopics.length > 0 && (
          <div className="card" style={{ padding:'1.5rem', marginBottom:'1.5rem', background:'linear-gradient(135deg, rgba(34,85,14,0.03), rgba(232,160,32,0.05))', border:'1px solid rgba(34,85,14,0.12)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem', fontSize:'1rem' }}>
                  {totalWrong <= 3 ? "You're almost perfect! 🎯 Let's nail those last few" : "Let's strengthen those weak spots! 💪 You've got this"}
                </p>
                <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>
                  {totalWrong <= 3 ? `Practice ${Math.min(5, totalWrong + 2)} targeted questions on your weak areas` : `Practice ${wrongTopics.length * 2} questions — 2 per topic you missed`}
                </p>
              </div>
              <button onClick={handlePracticeWeakSpots} disabled={retryLoading} className="btn-primary" style={{ flexShrink:0, fontSize:'0.9375rem' }}>
                {retryLoading ? (
                  <><div style={{ width:'1rem', height:'1rem', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', borderRadius:'50%', animation:'spin 1s linear infinite' }} /> Generating...</>
                ) : '🎯 Practice weak spots'}
              </button>
            </div>
          </div>
        )}

        {/* Question list — now with proper FR score colors */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1.5rem' }}>
          {questions.map((q, i) => {
            const a = answers[i]
            const isMC = q.type === 'mc'
            const wasAnswered = !!a

            // Determine icon + badge for this row
            let icon: React.ReactNode
            let badgeStyle: { bg: string; color: string; label: string }

            if (!wasAnswered) {
              icon = <div style={{ width:'1.25rem', height:'1.25rem', borderRadius:'50%', border:'2px solid rgba(34,85,14,0.2)', flexShrink:0 }} />
              badgeStyle = { bg:'rgba(34,85,14,0.05)', color:'rgb(107,107,88)', label:'Skipped' }
            } else if (isMC) {
              if (a.correct) {
                icon = <CheckCircle style={{ width:'1.25rem', height:'1.25rem', color:'rgb(59,109,17)', flexShrink:0 }} />
                badgeStyle = { bg:'rgb(234,243,222)', color:'rgb(59,109,17)', label:'Correct' }
              } else {
                icon = <XCircle style={{ width:'1.25rem', height:'1.25rem', color:'rgb(163,45,45)', flexShrink:0 }} />
                badgeStyle = { bg:'rgb(252,235,235)', color:'rgb(163,45,45)', label:'Review' }
              }
            } else {
              // FR question — use score-based colors
              const frStyle = getFRSummaryStyle(a.frScore ?? '')
              badgeStyle = frStyle
              if (a.frScore === '4/4' || a.frScore === '3/4') {
                icon = <CheckCircle style={{ width:'1.25rem', height:'1.25rem', color: a.frScore === '4/4' ? 'rgb(59,109,17)' : 'rgb(34,85,14)', flexShrink:0 }} />
              } else if (a.frScore === '2/4') {
                icon = <div style={{ width:'1.25rem', height:'1.25rem', borderRadius:'50%', background:'rgba(232,160,32,0.2)', border:'2px solid rgb(232,160,32)', flexShrink:0 }} />
              } else if (a.frScore === '1/4') {
                icon = <div style={{ width:'1.25rem', height:'1.25rem', borderRadius:'50%', background:'rgba(220,80,20,0.15)', border:'2px solid rgb(200,75,20)', flexShrink:0 }} />
              } else {
                icon = <XCircle style={{ width:'1.25rem', height:'1.25rem', color:'rgb(163,45,45)', flexShrink:0 }} />
              }
            }

            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'white', border:'1px solid rgba(34,85,14,0.08)' }}>
                {icon}
                <span style={{ fontSize:'0.875rem', color:'rgb(26,26,20)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  Q{i + 1}: {q.question}
                </span>
                <span className="badge" style={{ background: badgeStyle.bg, color: badgeStyle.color, flexShrink:0 }}>
                  {badgeStyle.label}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
