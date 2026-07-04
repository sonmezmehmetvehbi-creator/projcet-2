'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, RotateCcw, Download } from 'lucide-react'
import type { MCQuestion, FRQuestion, Question } from '@/types'
import MathText from '@/components/ui/MathText'
import XPModal from '@/components/ui/XPModal'

interface Props { session: any; isPremium?: boolean }

interface FloatingXP {
  id: number
  amount: number
  x: number
  y: number
}

export default function QuestionsClient({ session, isPremium = false }: Props) {
  const questions: Question[] = session.content?.questions ?? []
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, { answer: string; correct: boolean | null; topic?: string; frScore?: string }>>({})
  const [frInputs, setFrInputs] = useState<Record<number, string>>({})
  const [frFeedback, setFrFeedback] = useState<Record<number, { score: string; feedback: string }>>({})
  const [frLoading, setFrLoading] = useState<Record<number, boolean>>({})
  const [showSummary, setShowSummary] = useState(false)
  const [xpResult, setXpResult] = useState<any>(null)
  const [floatingXPs, setFloatingXPs] = useState<FloatingXP[]>([])
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)
  const [showFireBanner, setShowFireBanner] = useState(false)
  const [xpLoading, setXpLoading] = useState(false)
  const [topicAlreadyEarned, setTopicAlreadyEarned] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left')
  const [animating, setAnimating] = useState(false)
  const floatingIdRef = useRef(0)
  const router = useRouter()

  useEffect(() => {
    if (!session.subject || !session.topic) return
    const params = new URLSearchParams({ subject: session.subject, topic: session.topic })
    fetch(`/api/xp?${params.toString()}`)
      .then(res => res.json())
      .then(data => { if (data.alreadyEarned) setTopicAlreadyEarned(true) })
      .catch(() => {})
  }, [session.subject, session.topic])

  const q = questions[current]
  const total = questions.length
  const score = Object.values(answers).filter(a =>
    a.correct === true || a.frScore === '4/4' || a.frScore === '3/4'
  ).length

  function spawnFloatingXP(amount: number) {
    // No XP is awarded for a topic already completed — skip the animation.
    if (topicAlreadyEarned) return
    const id = floatingIdRef.current++
    const x = 40 + Math.random() * 20
    const y = 30 + Math.random() * 20
    setFloatingXPs(prev => [...prev, { id, amount, x, y }])
    setTimeout(() => setFloatingXPs(prev => prev.filter(f => f.id !== id)), 1500)
  }

  function selectMC(question: MCQuestion, choice: string) {
    if (answers[current]) return
    const correct = choice === question.correctAnswer
    setAnswers(prev => ({ ...prev, [current]: { answer: choice, correct, topic: (question as any).topic } }))

    if (correct) {
      spawnFloatingXP(5)
      const newConsec = consecutiveCorrect + 1
      setConsecutiveCorrect(newConsec)
      if (newConsec >= 3) {
        setShowFireBanner(true)
        setTimeout(() => setShowFireBanner(false), 2500)
      }
    } else {
      spawnFloatingXP(1)
      setConsecutiveCorrect(0)
    }
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
      setAnswers(prev => ({ ...prev, [current]: { answer: studentAnswer, correct: null, topic: (question as any).topic, frScore: data.score } }))

      const score = data.score
if (score === '4/4') spawnFloatingXP(8)
else if (score === '3/4') spawnFloatingXP(5)
else if (score === '2/4') spawnFloatingXP(3)
else if (score === '1/4') spawnFloatingXP(2)
else spawnFloatingXP(1)
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

  async function handleFinish(finalAnswers: typeof answers) {
    setXpLoading(true)
    try {
      const correctAnswers = Object.values(finalAnswers).filter(a => a.correct === true).length
      const frScores = Object.values(finalAnswers)
        .filter(a => a.correct === null && a.frScore)
        .map(a => a.frScore!)

      const today = new Date().toISOString().split('T')[0]
      const lastStudy = localStorage.getItem('lastStudyDate')
      const isFirstSessionToday = lastStudy !== today
      if (isFirstSessionToday) localStorage.setItem('lastStudyDate', today)

      const res = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correctAnswers,
          totalAnswers: Object.keys(finalAnswers).length,
          frScores,
          outputType: 'questions',
          isFirstSessionToday,
          sessionId: session.id,
          subject: session.subject,
          topic: session.topic,
        }),
      })
      const data = await res.json()
      if (data.alreadyEarned) {
        // Already earned XP for this topic — no animation, no modal.
        setXpLoading(false)
        setShowSummary(true)
        return
      }
      if (!data.error) {
        setXpResult(data)
        router.refresh()
      }
    } catch {}
    setXpLoading(false)
    setShowSummary(true)
  }

  function next() {
    if (current < total - 1) {
      setSlideDir('left')
      setAnimating(true)
      setTimeout(() => { setCurrent(c => c + 1); setAnimating(false) }, 200)
    } else {
      handleFinish(answers)
    }
  }

  function prev() {
    if (current > 0) {
      setSlideDir('right')
      setAnimating(true)
      setTimeout(() => { setCurrent(c => c - 1); setAnimating(false) }, 200)
    }
  }

  if (xpResult && showSummary) return (
    <>
      <Summary
        questions={questions}
        answers={answers}
        score={score}
        total={total}
        session={session}
        xpResult={xpResult}
        topicAlreadyEarned={topicAlreadyEarned}
        frFeedback={frFeedback}
        onRestart={() => { setAnswers({}); setFrInputs({}); setFrFeedback({}); setCurrent(0); setShowSummary(false); setXpResult(null); setConsecutiveCorrect(0) }}
      />
      <XPModal result={xpResult} onClose={() => setXpResult(null)} />
    </>
  )

  if (showSummary && !xpResult) return (
    <Summary
      questions={questions}
      answers={answers}
      score={score}
      total={total}
      session={session}
      xpResult={xpResult}
      topicAlreadyEarned={topicAlreadyEarned}
      frFeedback={frFeedback}
      onRestart={() => { setAnswers({}); setFrInputs({}); setFrFeedback({}); setCurrent(0); setShowSummary(false); setConsecutiveCorrect(0) }}
    />
  )

  if (!q) return <div style={{ paddingTop:'6rem', textAlign:'center', color:'var(--af-text-muted)' }}>No questions found.</div>

  return (
    <div className="animate-fade-in" style={{ paddingTop:'5rem', minHeight:'100vh', position:'relative', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>

      {/* Floating XP animations */}
      {floatingXPs.map(f => (
        <div key={f.id} style={{
          position:'fixed',
          left:`${f.x}%`,
          top:`${f.y}%`,
          zIndex:9999,
          pointerEvents:'none',
          fontFamily:'Syne, sans-serif',
          fontWeight:800,
          fontSize: f.amount >= 15 ? '2rem' : '1.75rem',
          color: f.amount >= 15 ? 'rgb(232,160,32)' : f.amount >= 5 ? 'rgb(34,85,14)' : 'rgb(74,122,40)',
          animation:'floatXP 2.2s ease-out forwards',
          textShadow:'0 2px 12px rgba(232,160,32,0.4)',
        }}>
          +{f.amount} XP
        </div>
      ))}

      {/* On fire banner + emoji rain */}
      {showFireBanner && (
        <>
          <div style={{
            position:'fixed', top:'5rem', left:'50%', transform:'translateX(-50%)',
            zIndex:9998, background:'linear-gradient(135deg, rgb(245,158,11), rgb(234,88,12), rgb(220,38,38))',
            color:'white', padding:'0.875rem 2rem', borderRadius:'9999px',
            fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.25rem',
            boxShadow:'0 8px 30px rgba(234,88,12,0.5)',
            animation:'fireBanner 0.5s cubic-bezier(0.16,1,0.3,1), firePulse 1s ease-in-out infinite',
            display:'flex', alignItems:'center', gap:'0.5rem',
            whiteSpace:'nowrap',
          }}>
            🔥 On fire! {consecutiveCorrect} in a row! 🔥
          </div>
          <div aria-hidden style={{ position:'fixed', inset:0, zIndex:9997, pointerEvents:'none', overflow:'hidden' }}>
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ position:'absolute', top:'-2rem', left:`${(i * 7 + 3) % 100}%`, fontSize:`${1 + (i % 3) * 0.5}rem`, animation:`fireRain ${2 + (i % 4) * 0.4}s linear ${(i % 7) * 0.12}s infinite` }}>
                {['🔥', '⭐', '✨'][i % 3]}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Loading overlay */}
      {xpLoading && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:9990, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(2px)' }}>
          <div style={{ background:'var(--af-card)', borderRadius:'1rem', padding:'2rem', textAlign:'center' }}>
            <div style={{ width:'2rem', height:'2rem', border:'3px solid rgba(34,85,14,0.2)', borderTop:'3px solid rgb(34,85,14)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 1rem' }} />
            <p style={{ fontFamily:'Syne, sans-serif', fontWeight:600, color:'var(--af-text)' }}>Calculating your XP...</p>
          </div>
        </div>
      )}

      <div className="container-base" style={{ padding:'2rem 1.5rem', maxWidth:'48rem' }}>

        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem', flexWrap:'wrap', gap:'0.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
              <span className="badge badge-primary">{session.subject}</span>
              <span style={{ fontSize:'0.875rem', color:'var(--af-text-muted)' }}>{session.topic}</span>
              {session.difficulty && (
                <span className="badge" style={{
                  background: session.difficulty === 'easy' ? 'var(--af-border)' :
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
            <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--af-text)' }}>
              {Object.keys(answers).length}/{total} answered
            </span>
          </div>
          <div style={{ width:'100%', height:'6px', background:'rgba(34,85,14,0.1)', borderRadius:'9999px', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'rgb(34,85,14)', borderRadius:'9999px', width:`${(Object.keys(answers).length / total) * 100}%`, transition:'width 0.3s' }} />
          </div>
        </div>

        <div key={current} className={`card ${animating ? (slideDir === 'left' ? 'q-out-left' : 'q-out-right') : (slideDir === 'left' ? 'q-slide-right' : 'q-slide-left')}`} style={{ padding:'2.5rem', marginBottom:'1.5rem', boxShadow:'0 8px 32px rgba(34,85,14,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', padding:'0.35rem 0.875rem', borderRadius:'9999px', background:'rgba(34,85,14,0.08)', color:'rgb(34,85,14)', fontWeight:700, fontSize:'0.8125rem', fontFamily:'Syne, sans-serif' }}>
              Question {current + 1} of {total}
            </span>
            <span style={{ fontSize:'0.8125rem', color:'var(--af-text-muted)', fontWeight:600 }}>{q.type === 'mc' ? 'Multiple Choice' : 'Free Response'}</span>
          </div>
          <div style={{ width:'100%', height:'5px', background:'rgba(34,85,14,0.1)', borderRadius:'9999px', overflow:'hidden', marginBottom:'1.75rem' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg, rgb(34,85,14), rgb(74,122,40))', borderRadius:'9999px', width:`${((current + 1) / total) * 100}%`, transition:'width 0.3s' }} />
          </div>
         {(q as any).passage && (
            <div style={{ padding:'1rem 1.25rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.1)', marginBottom:'1.25rem', borderLeft:'3px solid rgb(34,85,14)' }}>
              <p style={{ fontSize:'0.6875rem', fontWeight:700, color:'rgb(34,85,14)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.5rem' }}>Passage</p>
              <p style={{ fontSize:'0.9375rem', color:'var(--af-text)', lineHeight:1.8 }}>{(q as any).passage}</p>
            </div>
          )}
          <MathText text={q.question} style={{ fontSize:'1.25rem', fontWeight:600, color:'var(--af-text)', lineHeight:1.8, marginBottom:'1.75rem', display:'block' }} />

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
          <button onClick={prev} disabled={current === 0} className="btn-secondary" style={{ padding:'0.875rem 1.5rem', fontSize:'0.9375rem' }}>
            <ArrowLeft style={{ width:'1.125rem', height:'1.125rem' }} /> Previous
          </button>
          <button onClick={downloadPDF} className="btn-ghost" style={{ fontSize:'0.875rem' }}>
            <Download style={{ width:'1rem', height:'1rem' }} /> Save PDF
          </button>
          <button onClick={next} disabled={!answers[current]} className={`btn-primary ${answers[current] ? 'q-next-pulse' : ''}`} style={{ padding:'0.875rem 1.75rem', fontSize:'0.9375rem' }}>
            {current === total - 1 ? 'See Results' : 'Next'} <ArrowRight style={{ width:'1.125rem', height:'1.125rem' }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes floatXP {
          0% { opacity:0; transform:translateY(0) scale(0.8); }
          15% { opacity:1; transform:translateY(-10px) scale(1.15); }
          80% { opacity:1; transform:translateY(-70px) scale(1); }
          100% { opacity:0; transform:translateY(-110px) scale(0.9); }
        }
        @keyframes fireBanner {
          from { opacity:0; transform:translateX(-50%) translateY(-10px) scale(0.9); }
          to { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes firePulse { 0%,100% { box-shadow:0 8px 30px rgba(234,88,12,0.5); } 50% { box-shadow:0 8px 44px rgba(234,88,12,0.8); } }
        @keyframes fireRain { 0% { transform:translateY(0) rotate(0deg); opacity:0; } 10% { opacity:1; } 100% { transform:translateY(105vh) rotate(360deg); opacity:0; } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInLeft { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideOutLeft { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(-40px); } }
        @keyframes slideOutRight { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(40px); } }
        .q-slide-right { animation: slideInRight 0.25s ease both; }
        .q-slide-left { animation: slideInLeft 0.25s ease both; }
        .q-out-left { animation: slideOutLeft 0.2s ease both; }
        .q-out-right { animation: slideOutRight 0.2s ease both; }
        @keyframes qNextPulse { 0%,100% { box-shadow:0 4px 16px rgba(34,85,14,0.25); } 50% { box-shadow:0 6px 26px rgba(34,85,14,0.5); } }
        .q-next-pulse { animation: qNextPulse 1.6s ease-in-out infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
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

        let border = '2px solid rgba(34,85,14,0.18)'
        let bg = 'var(--af-card)'
        let letterBg = 'transparent'
        let letterColor = 'rgb(34,85,14)'
        let letterBorder = '2px solid rgba(34,85,14,0.3)'
        let textColor = 'var(--af-text)'
        if (answered) {
          if (isSelected && isCorrect) { border = '2px solid rgb(59,109,17)'; bg = 'rgb(34,85,14)'; letterBg = 'white'; letterColor = 'rgb(34,85,14)'; letterBorder = '2px solid white'; textColor = 'white' }
          else if (isSelected && !isCorrect) { border = '2px solid rgb(163,45,45)'; bg = 'rgb(252,235,235)'; letterColor = 'rgb(163,45,45)'; letterBorder = '2px solid rgb(163,45,45)' }
          else if (isCorrect) { border = '2px solid rgb(59,109,17)'; bg = 'rgb(234,243,222)'; letterColor = 'rgb(59,109,17)'; letterBorder = '2px solid rgb(59,109,17)' }
          else { bg = 'var(--af-card)'; textColor = 'var(--af-text-muted)'; border = '2px solid var(--af-border)'; letterColor = 'var(--af-text-muted)'; letterBorder = '2px solid var(--af-border)' }
        }

        return (
          <button key={letter} onClick={() => onSelect(letter)} disabled={!!answered} className={!answered ? 'q-mc-opt' : ''}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.875rem', padding:'1rem 1.25rem', borderRadius:'0.875rem', border, background:bg, cursor: answered ? 'default' : 'pointer', textAlign:'left', transition:'all 0.15s ease' }}>
            <span style={{ width:'2rem', height:'2rem', borderRadius:'50%', flexShrink:0, border:letterBorder, background:letterBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9375rem', fontWeight:800, color:letterColor }}>
              {letter}
            </span>
            <MathText text={option.substring(3)} style={{ fontSize:'1rem', color:textColor, lineHeight:1.5, flex:1 }} />
            {answered && isCorrect && <CheckCircle style={{ width:'1.25rem', height:'1.25rem', color: isSelected ? 'white' : 'rgb(59,109,17)', flexShrink:0 }} />}
            {answered && isSelected && !isCorrect && <XCircle style={{ width:'1.25rem', height:'1.25rem', color:'rgb(163,45,45)', flexShrink:0 }} />}
          </button>
        )
      })}

      <style>{`.q-mc-opt:hover { background: rgba(34,85,14,0.05) !important; border-color: rgba(34,85,14,0.45) !important; transform: translateX(3px); }`}</style>

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

function getFRColors(score: string) {
  switch (score) {
    case '4/4': return { bg:'rgb(234,243,222)', border:'rgba(59,109,17,0.2)', title:'rgb(59,109,17)', text:'rgba(59,109,17,0.85)', emoji:'🎉', label:'Excellent!' }
    case '3/4': return { bg:'rgba(34,85,14,0.06)', border:'rgba(34,85,14,0.18)', title:'rgb(34,85,14)', text:'rgba(34,85,14,0.8)', emoji:'👍', label:'Good work!' }
    case '2/4': return { bg:'rgba(232,160,32,0.08)', border:'rgba(232,160,32,0.3)', title:'rgb(180,120,10)', text:'rgba(180,120,10,0.9)', emoji:'📚', label:'Halfway there' }
    case '1/4': return { bg:'rgba(220,80,20,0.07)', border:'rgba(220,80,20,0.22)', title:'rgb(200,75,20)', text:'rgba(200,75,20,0.85)', emoji:'💪', label:'Keep practicing' }
    default: return { bg:'rgb(252,235,235)', border:'rgba(163,45,45,0.2)', title:'rgb(163,45,45)', text:'rgba(163,45,45,0.85)', emoji:'❌', label:'Needs review' }
  }
}

function getFRSummaryStyle(score: string): { bg: string; color: string; label: string } {
  switch (score) {
    case '4/4': return { bg:'rgb(234,243,222)', color:'rgb(59,109,17)', label:`✓ ${score}` }
    case '3/4': return { bg:'var(--af-border)', color:'rgb(34,85,14)', label:`✓ ${score}` }
    case '2/4': return { bg:'rgba(232,160,32,0.12)', color:'rgb(180,120,10)', label:`~ ${score}` }
    case '1/4': return { bg:'rgba(220,80,20,0.09)', color:'rgb(200,75,20)', label:`✗ ${score}` }
    default: return { bg:'rgb(252,235,235)', color:'rgb(163,45,45)', label:'Review' }
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
      <div>
        <textarea value={value} onChange={e => onChange(e.target.value)} disabled={answered}
          placeholder="Write your answer here..." rows={6}
          style={{ width:'100%', boxSizing:'border-box', resize:'vertical', padding:'0.5rem 1rem', fontSize:'1rem', color:'var(--af-text)', lineHeight:'2rem', border:'1.5px solid rgba(34,85,14,0.2)', borderRadius:'0.875rem', outline:'none', background:'repeating-linear-gradient(var(--af-card), var(--af-card) calc(2rem - 1px), rgba(34,85,14,0.15) calc(2rem - 1px), rgba(34,85,14,0.15) 2rem)', backgroundAttachment:'local' }} />
        <p style={{ fontSize:'0.75rem', color:'var(--af-text-muted)', marginTop:'0.375rem', textAlign:'right' }}>
          {value.trim() ? value.trim().split(/\s+/).length : 0} words
        </p>
      </div>
      {!answered && (
        <button onClick={onSubmit} disabled={loading || !value.trim()} className={`btn-primary ${value.trim() && !loading ? 'q-next-pulse' : ''}`} style={{ width:'100%', justifyContent:'center', padding:'0.875rem' }}>
          {loading ? 'Checking...' : 'Submit Answer'}
        </button>
      )}
      {feedback && colors && (
        <div style={{ padding:'1.25rem', borderRadius:'0.875rem', background:colors.bg, border:`1px solid ${colors.border}` }}>
          <p style={{ fontWeight:700, color:colors.title, marginBottom:'0.5rem', fontSize:'1rem' }}>
            {colors.emoji} {colors.label} — Score: {feedback.score}
          </p>
          <p style={{ fontSize:'0.9375rem', color:colors.text, lineHeight:1.7 }}>{feedback.feedback}</p>
        </div>
      )}
    </div>
  )
}

function Summary({ questions, answers, score, total, session, onRestart, xpResult, topicAlreadyEarned, frFeedback }: {
  questions: Question[]; answers: any; score: number; total: number; session: any; onRestart: () => void
  xpResult?: any; topicAlreadyEarned?: boolean; frFeedback?: Record<number, { score: string; feedback: string }>
}) {
  const router = useRouter()
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
  const [expandedQ, setExpandedQ] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)

  async function downloadPDF() {
    setDownloading(true)
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      })
      const html = await res.text()
      const w = window.open('', '_blank')
      if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close() }, 500) }
    } catch {}
    setDownloading(false)
  }

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
    } else if (a.correct === null && (a.frScore === '4/4' || a.frScore === '3/4')) {
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
          focus: `Focus ONLY on these weak areas: ${wrongTopicNames}.`,
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
    } catch (err) { console.error('Retry error:', err) }
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
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'var(--af-text)', marginBottom:'0.5rem' }}>
              {retryScore === retryQuestions.length ? 'Perfect on the retry! 🔥' : 'Nice work on the practice!'}
            </h2>
            <p style={{ color:'var(--af-text-muted)', marginBottom:'1.5rem' }}>
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
              <span style={{ fontSize:'0.875rem', color:'var(--af-text-muted)' }}>{Object.keys(retryAnswers).length}/{retryQuestions.length} answered</span>
            </div>
            <div style={{ width:'100%', height:'6px', background:'rgba(34,85,14,0.1)', borderRadius:'9999px', overflow:'hidden' }}>
              <div style={{ height:'100%', background:'rgb(232,160,32)', borderRadius:'9999px', width:`${(Object.keys(retryAnswers).length / retryQuestions.length) * 100}%`, transition:'width 0.3s' }} />
            </div>
          </div>
          <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
            <p style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--af-text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.75rem' }}>
              Question {retryCurrent + 1} of {retryQuestions.length}
            </p>
            <MathText text={rq.question} style={{ fontSize:'1.125rem', fontWeight:600, color:'var(--af-text)', lineHeight:1.6, marginBottom:'1.5rem', display:'block' }} />
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

  const grade = pct > 90 ? { label: 'Excellent!', emoji: '🏆' } : pct > 70 ? { label: 'Great Job!', emoji: '⭐' } : pct > 50 ? { label: 'Good Work!', emoji: '👍' } : { label: 'Keep Practicing!', emoji: '💪' }
  const answeredCount = Object.keys(answers).length
  const xpEarned = xpResult?.xpEarned ?? 0
  const showXp = !topicAlreadyEarned && xpEarned > 0
  const RING_C = 440 // 2π·70
  const ringOffset = RING_C * (1 - pct / 100)
  const isCorrectQ = (i: number) => {
    const a = answers[i]
    if (!a) return false
    if (questions[i].type === 'mc') return a.correct === true
    return a.frScore === '4/4' || a.frScore === '3/4'
  }
  const reviewList = questions
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => reviewFilter === 'all' ? true : reviewFilter === 'correct' ? isCorrectQ(i) : !isCorrectQ(i))

  const statCards = [
    { label: 'Score', value: `${pct}%`, color: grade === null ? 'rgb(34,85,14)' : 'rgb(34,85,14)' },
    { label: 'Correct', value: `${score}`, color: 'rgb(59,109,17)' },
    { label: 'Answered', value: `${answeredCount}/${total}`, color: 'rgb(37,99,235)' },
    ...(showXp ? [{ label: 'XP Earned', value: `+${xpEarned}`, color: 'rgb(124,58,237)' }] : []),
  ]

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh' }}>
      {pct > 80 && (
        <div aria-hidden style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:5 }}>
          {Array.from({ length: 28 }, (_, i) => {
            const colors = ['rgb(34,85,14)', 'rgb(232,160,32)', 'rgb(37,99,235)', 'rgb(124,58,237)', 'rgb(122,182,72)']
            const left = (i * 37) % 100
            return <span key={i} style={{ position:'absolute', top:'-24px', left:`${left}%`, width:'10px', height:'14px', background:colors[i % colors.length], borderRadius:'2px', animation:`qsumConfetti ${3 + (i % 4)}s linear ${(i % 10) * 0.15}s infinite` }} />
          })}
        </div>
      )}
      <div className="qsum-enter" style={{ maxWidth:'64rem', margin:'0 auto', padding:'2rem 1.5rem', position:'relative', zIndex:10 }}>

        {/* Hero */}
        <div className="card" style={{ padding:'2.5rem', textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ width:'180px', height:'180px', margin:'0 auto 1rem', position:'relative' }}>
            <svg viewBox="0 0 180 180" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
              <circle cx="90" cy="90" r="70" fill="none" stroke="var(--af-border)" strokeWidth="14" />
              <circle cx="90" cy="90" r="70" fill="none" stroke={pct >= 70 ? 'rgb(34,85,14)' : pct >= 50 ? 'rgb(232,160,32)' : 'rgb(163,45,45)'} strokeWidth="14" strokeLinecap="round"
                strokeDasharray={RING_C} strokeDashoffset={ringOffset} style={{ animation:'qsumRing 1.2s cubic-bezier(0.16,1,0.3,1) both' }} />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:'Syne, sans-serif', fontSize:'2.25rem', fontWeight:800, color:'var(--af-text)', lineHeight:1 }}>{score}/{total}</span>
              <span style={{ fontSize:'0.875rem', color:'var(--af-text-muted)', fontWeight:600, marginTop:'0.25rem' }}>{pct}%</span>
            </div>
          </div>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:'var(--af-text)' }}>{grade.label} {grade.emoji}</h1>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${statCards.length}, 1fr)`, gap:'1rem', marginBottom:'1.5rem' }} className="qsum-stats">
          {statCards.map((s, i) => (
            <div key={s.label} className="card" style={{ padding:'1.25rem', textAlign:'center', animation:'qsumRise 0.5s ease both', animationDelay:`${0.1 * (i + 1)}s` }}>
              <div style={{ fontFamily:'Syne, sans-serif', fontSize:'1.75rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--af-text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:'0.375rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {(wrongTopics.length > 0 || correctTopics.length > 0) && (
          <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'var(--af-text)', marginBottom:'1.5rem' }}>📊 Performance Breakdown</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem', marginBottom:'1.5rem' }}>
              {Object.entries(
                questions.reduce((acc: Record<string, { correct: number; total: number }>, q, i) => {
                  const topic = (q as any).topic || session.topic
                  if (!acc[topic]) acc[topic] = { correct: 0, total: 0 }
                  acc[topic].total++
                  if (answers[i]?.correct === true) acc[topic].correct++
                  else if (answers[i]?.frScore === '4/4' || answers[i]?.frScore === '3/4') acc[topic].correct++
                  return acc
                }, {})
              ).map(([topic, data]) => {
                const topicPct = Math.round((data.correct / data.total) * 100)
                const barColor = topicPct === 100 ? 'rgb(59,109,17)' : topicPct >= 75 ? 'rgb(34,85,14)' : topicPct >= 50 ? 'rgb(122,182,72)' : topicPct >= 25 ? 'rgb(232,160,32)' : topicPct > 0 ? 'rgb(200,75,20)' : 'rgb(163,45,45)'
                return (
                  <div key={topic}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.375rem' }}>
                      <span style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--af-text)' }}>{topic}</span>
                      <span style={{ fontSize:'0.8125rem', fontWeight:600, color: topicPct >= 50 ? barColor : 'rgb(163,45,45)' }}>
                        {data.correct}/{data.total} {topicPct >= 50 ? '✓' : '✗'}
                      </span>
                    </div>
                    <div style={{ width:'100%', height:'8px', background:'var(--af-border)', borderRadius:'9999px', overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:'9999px', background:barColor, width:`${topicPct}%`, transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {correctTopics.length > 0 && (
                <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'rgb(234,243,222)', border:'1px solid rgba(59,109,17,0.2)' }}>
                  <p style={{ fontSize:'0.8125rem', fontWeight:700, color:'rgb(59,109,17)', marginBottom:'0.5rem' }}>💪 Strong areas</p>
                  {correctTopics.map(t => <p key={t} style={{ fontSize:'0.8125rem', color:'rgb(59,109,17)', lineHeight:1.6 }}>• {t}</p>)}
                </div>
              )}
              {wrongTopics.length > 0 && (
                <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'rgb(252,235,235)', border:'1px solid rgba(163,45,45,0.2)' }}>
                  <p style={{ fontSize:'0.8125rem', fontWeight:700, color:'rgb(163,45,45)', marginBottom:'0.5rem' }}>📖 Needs work</p>
                  {wrongTopics.map(([t]) => <p key={t} style={{ fontSize:'0.8125rem', color:'rgb(163,45,45)', lineHeight:1.6 }}>• {t}</p>)}
                </div>
              )}
            </div>
          </div>
        )}

        {wrongTopics.length > 0 && (
          <div className="card" style={{ padding:'1.5rem', marginBottom:'1.5rem', background:'linear-gradient(135deg, rgba(34,85,14,0.03), rgba(232,160,32,0.05))', border:'1px solid rgba(34,85,14,0.12)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700, color:'var(--af-text)', marginBottom:'0.25rem', fontSize:'1rem' }}>
                  {totalWrong <= 3 ? "You're almost perfect! 🎯 Let's nail those last few" : "Let's strengthen those weak spots! 💪 You've got this"}
                </p>
                <p style={{ fontSize:'0.875rem', color:'var(--af-text-muted)' }}>
                  {totalWrong <= 3 ? `Practice ${Math.min(5, totalWrong + 2)} targeted questions` : `Practice ${wrongTopics.length * 2} questions — 2 per topic`}
                </p>
              </div>
              <button onClick={handlePracticeWeakSpots} disabled={retryLoading} className="btn-primary" style={{ flexShrink:0 }}>
                {retryLoading ? <><div style={{ width:'1rem', height:'1rem', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', borderRadius:'50%', animation:'spin 1s linear infinite' }} /> Generating...</> : '🎯 Practice weak spots'}
              </button>
            </div>
          </div>
        )}

        {/* Question Review */}
        <div className="card" style={{ padding:'1.75rem', marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem', marginBottom:'1.25rem' }}>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'var(--af-text)' }}>Question Review</h2>
            <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
              {([
                { id:'all', label:'All' },
                { id:'correct', label:'Correct ✅' },
                { id:'incorrect', label:'Incorrect ❌' },
              ] as const).map(f => {
                const active = reviewFilter === f.id
                return (
                  <button key={f.id} onClick={() => setReviewFilter(f.id)}
                    style={{ padding:'0.4rem 0.875rem', borderRadius:'9999px', fontSize:'0.8125rem', fontWeight:600, cursor:'pointer', transition:'all 0.2s', background: active ? 'rgb(34,85,14)' : 'var(--af-card)', color: active ? 'white' : 'var(--af-text-muted)', border:`1px solid ${active ? 'rgb(34,85,14)' : 'var(--af-border)'}` }}>
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
            {reviewList.length === 0 && <p style={{ color:'var(--af-text-muted)', fontSize:'0.9375rem', textAlign:'center', padding:'1rem' }}>No {reviewFilter} questions.</p>}
            {reviewList.map(({ q, i }) => {
              const a = answers[i]
              const correct = isCorrectQ(i)
              const open = expandedQ === i
              const accent = correct ? 'rgb(59,109,17)' : a ? 'rgb(163,45,45)' : 'rgb(107,107,88)'
              const badge = correct ? 'Correct' : a ? (q.type === 'mc' ? 'Incorrect' : getFRSummaryStyle(a.frScore ?? '').label) : 'Skipped'
              return (
                <div key={i} style={{ borderRadius:'0.875rem', border:'1px solid var(--af-border)', borderLeft:`4px solid ${accent}`, background:'var(--af-card)', overflow:'hidden' }}>
                  <button onClick={() => setExpandedQ(open ? null : i)}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.875rem 1rem', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
                    <span style={{ width:'1.75rem', height:'1.75rem', borderRadius:'0.5rem', flexShrink:0, background:`${accent}18`, color:accent, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.8125rem', fontFamily:'Syne, sans-serif' }}>{i + 1}</span>
                    <span style={{ flex:1, minWidth:0, fontSize:'0.9rem', color:'var(--af-text)', overflow: open ? 'visible' : 'hidden', textOverflow:'ellipsis', whiteSpace: open ? 'normal' : 'nowrap' }}>{q.question}</span>
                    {correct ? <CheckCircle style={{ width:'1.125rem', height:'1.125rem', color:accent, flexShrink:0 }} /> : <XCircle style={{ width:'1.125rem', height:'1.125rem', color:accent, flexShrink:0 }} />}
                    <ArrowRight style={{ width:'1rem', height:'1rem', color:'var(--af-text-muted)', flexShrink:0, transform: open ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }} />
                  </button>

                  {open && (
                    <div className="qsum-detail" style={{ padding:'0 1rem 1rem', borderTop:'1px solid var(--af-border)' }}>
                      <div style={{ paddingTop:'0.875rem' }}>
                        <MathText text={q.question} style={{ fontSize:'0.9375rem', fontWeight:600, color:'var(--af-text)', lineHeight:1.6, display:'block', marginBottom:'0.875rem' }} />
                        {q.type === 'mc' ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                            {(q as MCQuestion).options.map(option => {
                              const letter = option.charAt(0)
                              const isCorrectOpt = letter === (q as MCQuestion).correctAnswer
                              const isUser = a?.answer === letter
                              const bg = isCorrectOpt ? 'rgb(234,243,222)' : isUser ? 'rgb(252,235,235)' : 'transparent'
                              const bc = isCorrectOpt ? 'rgba(59,109,17,0.3)' : isUser ? 'rgba(163,45,45,0.3)' : 'var(--af-border)'
                              return (
                                <div key={letter} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.75rem', borderRadius:'0.625rem', background:bg, border:`1px solid ${bc}` }}>
                                  <span style={{ width:'1.5rem', height:'1.5rem', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color: isCorrectOpt ? 'rgb(59,109,17)' : isUser ? 'rgb(163,45,45)' : 'var(--af-text-muted)', border:`2px solid ${isCorrectOpt ? 'rgb(59,109,17)' : isUser ? 'rgb(163,45,45)' : 'var(--af-border)'}` }}>{letter}</span>
                                  <MathText text={option.substring(3)} style={{ fontSize:'0.875rem', color:'var(--af-text)', lineHeight:1.5 }} />
                                  {isCorrectOpt && <CheckCircle style={{ width:'1rem', height:'1rem', color:'rgb(59,109,17)', marginLeft:'auto', flexShrink:0 }} />}
                                  {isUser && !isCorrectOpt && <XCircle style={{ width:'1rem', height:'1rem', color:'rgb(163,45,45)', marginLeft:'auto', flexShrink:0 }} />}
                                </div>
                              )
                            })}
                            {(q as MCQuestion).explanation && (
                              <MathText text={(q as MCQuestion).explanation} style={{ fontSize:'0.875rem', color:'var(--af-text-muted)', lineHeight:1.65, display:'block', marginTop:'0.5rem' }} />
                            )}
                          </div>
                        ) : (
                          <div>
                            {a?.frScore && (
                              <span className="badge" style={{ ...(() => { const s = getFRSummaryStyle(a.frScore); return { background:s.bg, color:s.color } })(), marginBottom:'0.625rem', display:'inline-block' }}>Score: {a.frScore}</span>
                            )}
                            {frFeedback?.[i]?.feedback && (
                              <p style={{ fontSize:'0.875rem', color:'var(--af-text)', lineHeight:1.65, marginBottom:'0.625rem' }}>{frFeedback[i].feedback}</p>
                            )}
                            {(q as FRQuestion).modelAnswer && (
                              <div style={{ padding:'0.75rem', borderRadius:'0.625rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.12)' }}>
                                <p style={{ fontSize:'0.6875rem', fontWeight:700, color:'rgb(34,85,14)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.375rem' }}>Model answer</p>
                                <MathText text={(q as FRQuestion).modelAnswer} style={{ fontSize:'0.875rem', color:'var(--af-text)', lineHeight:1.65, display:'block' }} />
                              </div>
                            )}
                            {!a && <p style={{ fontSize:'0.875rem', color:'var(--af-text-muted)' }}>You skipped this question.</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'0.75rem' }}>
          <button onClick={onRestart} className="btn-secondary" style={{ justifyContent:'center', padding:'0.875rem' }}>
            <RotateCcw style={{ width:'1rem', height:'1rem' }} /> Try Again 🔄
          </button>
          <button onClick={() => router.push('/generate')} className="btn-primary" style={{ justifyContent:'center', padding:'0.875rem' }}>
            Generate New 📝
          </button>
          <button onClick={downloadPDF} disabled={downloading} className="btn-secondary" style={{ justifyContent:'center', padding:'0.875rem' }}>
            <Download style={{ width:'1rem', height:'1rem' }} /> {downloading ? 'Opening…' : 'Download PDF ⬇️'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes qsumEnter { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes qsumRing { from { stroke-dashoffset: 440; } }
        @keyframes qsumRise { from { opacity: 0; transform: translateY(16px); } }
        @keyframes qsumDetail { from { opacity: 0; transform: translateY(-6px); } }
        @keyframes qsumConfetti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(105vh) rotate(540deg); opacity: 0.9; } }
        .qsum-enter { animation: qsumEnter 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .qsum-detail { animation: qsumDetail 0.25s ease both; }
        @media (max-width: 560px) { .qsum-stats { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </div>
  )
}