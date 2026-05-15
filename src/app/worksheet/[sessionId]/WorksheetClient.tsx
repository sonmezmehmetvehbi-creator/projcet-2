'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ArrowLeft, BookOpen, Download } from 'lucide-react'
import type { Worksheet, MCQuestion, FRQuestion, Question } from '@/types'

interface Props { session: any }

export default function WorksheetClient({ session }: Props) {
  const worksheet: Worksheet = session.content?.worksheet
  const router = useRouter()

  async function downloadPDF() {
  const res = await fetch('/api/export-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: session.id }),
  })
  const html = await res.text()
  
  // Open in new window and trigger print dialog
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
}

  if (!worksheet) return (
    <div style={{ paddingTop:'6rem', textAlign:'center', color:'rgb(107,107,88)' }}>
      Worksheet not found.
    </div>
  )

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh' }}>
      <div className="container-base" style={{ padding:'2rem 1.5rem', maxWidth:'52rem' }}>

        {/* Header */}
        <div style={{ marginBottom:'2.5rem' }}>
          <button onClick={() => router.push('/dashboard')} style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:'none', border:'none', cursor:'pointer', color:'rgb(107,107,88)', fontSize:'0.875rem', marginBottom:'1.5rem', padding:0 }}>
            <ArrowLeft style={{ width:'1rem', height:'1rem' }} /> Back to dashboard
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
            <span className="badge badge-primary">{session.subject}</span>
            <span className="badge" style={{ background:'rgba(34,85,14,0.06)', color:'rgb(107,107,88)' }}>{session.grade}</span>
          </div>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
            {session.topic}
          </h1>
          <p style={{ color:'rgb(107,107,88)' }}>Study Worksheet</p>
        </div>

        {/* 1. Introduction */}
        <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem', borderLeft:'4px solid rgb(34,85,14)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
            <div style={{ width:'2rem', height:'2rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.875rem', fontWeight:700, flexShrink:0 }}>1</div>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)' }}>Introduction</h2>
          </div>
          <p style={{ color:'rgb(26,26,20)', lineHeight:1.8, marginBottom:'1.5rem', fontSize:'1.0625rem' }}>
            {worksheet.introduction.text}
          </p>
          {worksheet.introduction.vocabulary.length > 0 && (
            <>
              <h3 style={{ fontWeight:600, color:'rgb(26,26,20)', marginBottom:'0.75rem', fontSize:'0.9375rem' }}>Key Vocabulary</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {worksheet.introduction.vocabulary.map((v, i) => (
                  <div key={i} style={{ display:'flex', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.1)' }}>
                    <span style={{ fontWeight:700, color:'rgb(34,85,14)', minWidth:'8rem', fontSize:'0.9375rem' }}>{v.term}</span>
                    <span style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem', lineHeight:1.6 }}>{v.definition}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 2. Step-by-step explanation */}
        <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
            <div style={{ width:'2rem', height:'2rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.875rem', fontWeight:700, flexShrink:0 }}>2</div>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)' }}>Step-by-Step Explanation</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'2rem' }}>
            {worksheet.steps.map((step, i) => (
              <div key={i}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
                  <div style={{ width:'1.75rem', height:'1.75rem', borderRadius:'50%', background:'rgba(34,85,14,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgb(34,85,14)', fontSize:'0.8125rem', fontWeight:700, flexShrink:0 }}>
                    {i + 1}
                  </div>
                  <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.125rem', fontWeight:700, color:'rgb(26,26,20)' }}>{step.title}</h3>
                </div>
                <p style={{ color:'rgb(26,26,20)', lineHeight:1.8, marginBottom:'1rem', fontSize:'1rem', paddingLeft:'2.5rem' }}>
                  {step.explanation}
                </p>
                {/* Visual */}
                <div style={{ marginLeft:'2.5rem', padding:'1.25rem', borderRadius:'0.875rem', background:'linear-gradient(135deg, rgba(34,85,14,0.04), rgba(232,160,32,0.04))', border:'1px dashed rgba(34,85,14,0.2)', marginBottom:'1rem' }}>
                  <p style={{ fontSize:'0.8125rem', fontWeight:600, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>📊 Visual Aid</p>
                  <p style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.7, fontStyle:'italic' }}>{step.visualDescription}</p>
                </div>
                {/* Key takeaway */}
                <div style={{ marginLeft:'2.5rem', padding:'0.875rem 1rem', borderRadius:'0.75rem', background:'rgba(232,160,32,0.08)', border:'1px solid rgba(232,160,32,0.2)', display:'flex', gap:'0.5rem', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'1rem' }}>💡</span>
                  <p style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.6 }}>
                    <strong>Key takeaway:</strong> {step.keyTakeaway}
                  </p>
                </div>
                {i < worksheet.steps.length - 1 && (
                  <div style={{ marginLeft:'2.5rem', marginTop:'1.5rem', height:'1px', background:'rgba(34,85,14,0.1)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Summary */}
        <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem', borderLeft:'4px solid rgb(232,160,32)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
            <div style={{ width:'2rem', height:'2rem', borderRadius:'50%', background:'rgb(232,160,32)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.875rem', fontWeight:700, flexShrink:0 }}>3</div>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)' }}>Summary</h2>
          </div>
          <ul style={{ listStyle:'none', padding:0, margin:'0 0 1.5rem', display:'flex', flexDirection:'column', gap:'0.625rem' }}>
            {worksheet.summary.bullets.map((bullet, i) => (
              <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.625rem', fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.7 }}>
                <span style={{ color:'rgb(34,85,14)', fontWeight:700, flexShrink:0, marginTop:'0.125rem' }}>✓</span>
                {bullet}
              </li>
            ))}
          </ul>
          {worksheet.summary.quickCheck.length > 0 && (
            <>
              <h3 style={{ fontWeight:600, color:'rgb(26,26,20)', marginBottom:'0.75rem', fontSize:'0.9375rem' }}>⚡ Quick Check</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {worksheet.summary.quickCheck.map((q, i) => (
                  <div key={i} style={{ padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.1)', fontSize:'0.9375rem', color:'rgb(26,26,20)' }}>
                    {i + 1}. {q}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 4. Practice Questions */}
        {worksheet.practiceQuestions.length > 0 && (
          <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
              <div style={{ width:'2rem', height:'2rem', borderRadius:'50%', background:'rgb(74,122,40)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.875rem', fontWeight:700, flexShrink:0 }}>4</div>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)' }}>Practice Questions</h2>
            </div>
            <PracticeQuestions questions={worksheet.practiceQuestions} session={session} />
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <button onClick={() => router.push('/generate')} className="btn-secondary" style={{ flex:1 }}>
            New Topic
          </button>
          <button onClick={downloadPDF} className="btn-ghost" style={{ flex:'0 0 auto' }}>
            <Download style={{ width:'1rem', height:'1rem' }} /> Save PDF
          </button>
          <button onClick={() => router.push('/dashboard')} className="btn-primary" style={{ flex:1 }}>
            <BookOpen style={{ width:'1rem', height:'1rem' }} /> Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}

function PracticeQuestions({ questions, session }: { questions: Question[]; session: any }) {
  const [answers, setAnswers] = useState<Record<number, { answer: string; correct: boolean | null }>>({})
  const [frInputs, setFrInputs] = useState<Record<number, string>>({})
  const [frFeedback, setFrFeedback] = useState<Record<number, { score: string; feedback: string }>>({})
  const [frLoading, setFrLoading] = useState<Record<number, boolean>>({})

  function selectMC(index: number, question: MCQuestion, choice: string) {
    if (answers[index]) return
    const correct = choice === question.correctAnswer
    setAnswers(prev => ({ ...prev, [index]: { answer: choice, correct } }))
  }

  async function submitFR(index: number, question: FRQuestion) {
    const studentAnswer = frInputs[index] ?? ''
    if (!studentAnswer.trim()) return
    setFrLoading(prev => ({ ...prev, [index]: true }))
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
      setFrFeedback(prev => ({ ...prev, [index]: data }))
      setAnswers(prev => ({ ...prev, [index]: { answer: studentAnswer, correct: null } }))
    } catch {}
    setFrLoading(prev => ({ ...prev, [index]: false }))
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      {questions.map((q, i) => (
        <div key={i}>
          <p style={{ fontSize:'0.8125rem', fontWeight:600, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>
            Question {i + 1} · {q.type === 'mc' ? 'Multiple Choice' : 'Free Response'}
          </p>
          <p style={{ fontSize:'1rem', fontWeight:600, color:'rgb(26,26,20)', lineHeight:1.6, marginBottom:'1rem' }}>{q.question}</p>

          {q.type === 'mc' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
              {(q as MCQuestion).options.map(option => {
                const letter = option.charAt(0)
                const isSelected = answers[i]?.answer === letter
                const isCorrect = letter === (q as MCQuestion).correctAnswer
                const answered = !!answers[i]
                let cls = 'mc-option'
                if (answered) {
                  if (isCorrect) cls += ' mc-option-correct'
                  else if (isSelected) cls += ' mc-option-wrong'
                  else cls += ' mc-option-disabled'
                }
                return (
                  <button key={letter} onClick={() => selectMC(i, q as MCQuestion, letter)}
                    className={cls} style={{ width:'100%', background:'none', textAlign:'left' }}>
                    <div style={{ width:'1.5rem', height:'1.5rem', borderRadius:'50%', border:`2px solid ${answered ? (isCorrect ? 'rgb(59,109,17)' : isSelected ? 'rgb(163,45,45)' : 'rgba(34,85,14,0.2)') : 'rgba(34,85,14,0.3)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.75rem', fontWeight:700, color: answered ? (isCorrect ? 'rgb(59,109,17)' : isSelected ? 'rgb(163,45,45)' : 'rgb(107,107,88)') : 'rgb(34,85,14)' }}>
                      {letter}
                    </div>
                    <span style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)' }}>{option.substring(3)}</span>
                    {answered && isCorrect && <CheckCircle style={{ width:'1rem', height:'1rem', color:'rgb(59,109,17)', marginLeft:'auto', flexShrink:0 }} />}
                    {answered && isSelected && !isCorrect && <XCircle style={{ width:'1rem', height:'1rem', color:'rgb(163,45,45)', marginLeft:'auto', flexShrink:0 }} />}
                  </button>
                )
              })}
              {answers[i] && (
                <div style={{ padding:'1rem', borderRadius:'0.75rem', background: answers[i].correct ? 'rgb(234,243,222)' : 'rgb(252,235,235)', border:`1px solid ${answers[i].correct ? 'rgba(59,109,17,0.2)' : 'rgba(163,45,45,0.2)'}`, marginTop:'0.25rem' }}>
                  <p style={{ fontWeight:700, fontSize:'0.9375rem', color: answers[i].correct ? 'rgb(59,109,17)' : 'rgb(163,45,45)', marginBottom:'0.375rem' }}>
                    {answers[i].correct ? '🎉 Excellent!!!' : "💡 Here's the correct answer:"}
                  </p>
                  <p style={{ fontSize:'0.875rem', color: answers[i].correct ? 'rgba(59,109,17,0.9)' : 'rgba(163,45,45,0.9)', lineHeight:1.7 }}>
                    {(q as MCQuestion).explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <textarea value={frInputs[i] ?? ''} onChange={e => setFrInputs(prev => ({ ...prev, [i]: e.target.value }))}
                disabled={!!answers[i]} placeholder="Write your answer here..." rows={4}
                className="input" style={{ resize:'vertical', lineHeight:1.6 }} />
              {!answers[i] && (
                <button onClick={() => submitFR(i, q as FRQuestion)}
                  disabled={frLoading[i] || !frInputs[i]?.trim()} className="btn-primary" style={{ alignSelf:'flex-start' }}>
                  {frLoading[i] ? 'Checking...' : 'Check My Answer'}
                </button>
              )}
              {frFeedback[i] && (
                <div style={{ padding:'1rem', borderRadius:'0.75rem', background:'rgb(234,243,222)', border:'1px solid rgba(59,109,17,0.2)' }}>
                  <p style={{ fontWeight:700, color:'rgb(59,109,17)', marginBottom:'0.375rem' }}>Score: {frFeedback[i].score}</p>
                  <p style={{ fontSize:'0.875rem', color:'rgba(59,109,17,0.9)', lineHeight:1.7 }}>{frFeedback[i].feedback}</p>
                </div>
              )}
            </div>
          )}
          {i < questions.length - 1 && (
            <div style={{ height:'1px', background:'rgba(34,85,14,0.08)', marginTop:'1.5rem' }} />
          )}
        </div>
      ))}
    </div>
  )
}