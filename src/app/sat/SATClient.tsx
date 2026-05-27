'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Zap } from 'lucide-react'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
  satUsage: number
}

const MODULES = [
  {
    id: 'math_no_calc',
    label: 'SAT Math',
    sub: 'No Calculator',
    emoji: '📐',
    desc: 'Algebra, advanced math, problem solving — no calculator allowed',
    color: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
    activeColor: 'rgb(79,70,229)',
    badge: '⛔ No Calc',
    badgeBg: 'rgba(239,68,68,0.1)',
    badgeColor: 'rgb(185,28,28)',
  },
  {
    id: 'math_calc',
    label: 'SAT Math',
    sub: 'Calculator',
    emoji: '🔢',
    desc: 'Data analysis, statistics, complex algebra — calculator permitted',
    color: 'rgba(34,85,14,0.06)',
    border: 'rgba(34,85,14,0.25)',
    activeColor: 'rgb(34,85,14)',
    badge: '✅ Calculator',
    badgeBg: 'rgba(34,85,14,0.08)',
    badgeColor: 'rgb(34,85,14)',
  },
  {
    id: 'reading_writing',
    label: 'SAT Reading',
    sub: '& Writing',
    emoji: '📖',
    desc: 'Passage-based questions — words in context, evidence, grammar',
    color: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.25)',
    activeColor: 'rgb(180,120,10)',
    badge: '📝 Passage-based',
    badgeBg: 'rgba(245,158,11,0.1)',
    badgeColor: 'rgb(180,120,10)',
  },
]

const QUESTION_COUNTS = [5, 10, 15, 22]
const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', emoji: '🟢', desc: 'CB Level 1-2' },
  { value: 'medium', label: 'Medium', emoji: '🟡', desc: 'CB Level 3' },
  { value: 'hard', label: 'Hard', emoji: '🔴', desc: 'CB Level 4-5' },
]

export default function SATClient({ profile, satUsage }: Props) {
  const [module, setModule] = useState('math_no_calc')
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const atLimit = !profile?.is_premium && satUsage >= 1
  const selectedModule = MODULES.find(m => m.id === module)!

  async function handleStart() {
    if (atLimit) { setError('You have used your 1 free SAT practice set today. Upgrade to Premium for unlimited SAT prep.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/sat-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, questionCount, difficulty }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      router.push(`/questions/${data.sessionId}`)
    } catch (err: any) {
      setError(err.message === 'sat_limit_reached'
        ? 'You have used your 1 free SAT practice set today. Upgrade to Premium for unlimited.'
        : err.message)
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem', animation:'spin 2s linear infinite', display:'inline-block' }}>📐</div>
        <p style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
          Building your SAT practice set...
        </p>
        <p style={{ color:'rgb(107,107,88)' }}>Crafting College Board-style questions</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', paddingTop:'5rem' }}>
      <div style={{ maxWidth:'44rem', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(34,85,14,0.06)', border:'1px solid rgba(34,85,14,0.15)', padding:'0.375rem 1rem', borderRadius:'9999px', marginBottom:'1rem' }}>
            <span style={{ fontSize:'0.8125rem', fontWeight:700, color:'rgb(34,85,14)', fontFamily:'Syne, sans-serif', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              SAT Prep
            </span>
          </div>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
            SAT Practice
          </h1>
          <p style={{ color:'rgb(107,107,88)', fontSize:'1.0625rem' }}>
            College Board-style questions. Real format, real difficulty.
          </p>
          {!profile?.is_premium && (
            <div style={{ marginTop:'0.875rem', display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.375rem 0.875rem', borderRadius:'9999px', background: atLimit ? 'rgba(239,68,68,0.08)' : 'rgba(34,85,14,0.06)', border:`1px solid ${atLimit ? 'rgba(239,68,68,0.2)' : 'rgba(34,85,14,0.15)'}` }}>
              <span style={{ fontSize:'0.8125rem', color: atLimit ? 'rgb(185,28,28)' : 'rgb(34,85,14)', fontWeight:600 }}>
                {atLimit ? '⚠️ Daily limit reached' : `✅ ${1 - satUsage} SAT set remaining today`}
              </span>
            </div>
          )}
        </div>

        <div className="card" style={{ padding:'2rem' }}>
          {error && (
            <div className="alert-error" style={{ marginBottom:'1.5rem' }}>
              <AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />
              <div>
                {error}
                {atLimit && <a href="/pricing" style={{ display:'block', marginTop:'0.25rem', fontWeight:600, color:'rgb(34,85,14)' }}>Upgrade to Premium →</a>}
              </div>
            </div>
          )}

          {/* Module selector */}
          <div style={{ marginBottom:'1.75rem' }}>
            <label style={{ display:'block', fontSize:'0.8125rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Select Module
            </label>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {MODULES.map(m => (
                <button key={m.id} type="button" onClick={() => setModule(m.id)}
                  style={{
                    padding:'1.25rem', borderRadius:'0.875rem',
                    border:`2px solid ${module === m.id ? m.border : 'rgba(34,85,14,0.1)'}`,
                    background: module === m.id ? m.color : 'white',
                    cursor:'pointer', textAlign:'left', transition:'all 0.2s',
                    display:'flex', alignItems:'center', gap:'1rem',
                  }}>
                  <span style={{ fontSize:'2rem', flexShrink:0 }}>{m.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem' }}>
                      <p style={{ fontWeight:700, color:'rgb(26,26,20)', fontSize:'1rem' }}>{m.label}</p>
                      <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>{m.sub}</span>
                      <span style={{ marginLeft:'auto', fontSize:'0.6875rem', fontWeight:700, padding:'0.2rem 0.5rem', borderRadius:'9999px', background:m.badgeBg, color:m.badgeColor }}>
                        {m.badge}
                      </span>
                    </div>
                    <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>{m.desc}</p>
                  </div>
                  <div style={{
                    width:'1.25rem', height:'1.25rem', borderRadius:'50%', flexShrink:0,
                    border:`2px solid ${module === m.id ? m.activeColor : 'rgba(34,85,14,0.2)'}`,
                    background: module === m.id ? m.activeColor : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {module === m.id && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'white' }} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div style={{ marginBottom:'1.75rem' }}>
            <label style={{ display:'block', fontSize:'0.8125rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Number of Questions
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.5rem' }}>
              {QUESTION_COUNTS.map(n => (
                <button key={n} type="button" onClick={() => setQuestionCount(n)}
                  style={{
                    padding:'0.75rem', borderRadius:'0.75rem',
                    border:`2px solid ${questionCount === n ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)'}`,
                    background: questionCount === n ? 'rgba(34,85,14,0.06)' : 'white',
                    cursor:'pointer', transition:'all 0.2s', textAlign:'center',
                  }}>
                  <p style={{ fontWeight:700, fontSize:'1.25rem', color: questionCount === n ? 'rgb(34,85,14)' : 'rgb(26,26,20)' }}>{n}</p>
                  <p style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)' }}>
                    {n === 22 ? 'Full module' : n === 15 ? 'Long set' : n === 10 ? 'Standard' : 'Quick set'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom:'2rem' }}>
            <label style={{ display:'block', fontSize:'0.8125rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Difficulty
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.5rem' }}>
              {DIFFICULTIES.map(d => (
                <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                  style={{
                    padding:'0.875rem 0.5rem', borderRadius:'0.75rem',
                    border:`2px solid ${difficulty === d.value ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)'}`,
                    background: difficulty === d.value ? 'rgba(34,85,14,0.06)' : 'white',
                    cursor:'pointer', textAlign:'center', transition:'all 0.2s',
                  }}>
                  <div style={{ fontSize:'1.25rem', marginBottom:'0.25rem' }}>{d.emoji}</div>
                  <p style={{ fontWeight:700, fontSize:'0.875rem', color: difficulty === d.value ? 'rgb(34,85,14)' : 'rgb(26,26,20)' }}>{d.label}</p>
                  <p style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)' }}>{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* What to expect */}
          <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.08)', marginBottom:'1.5rem' }}>
            <p style={{ fontSize:'0.8125rem', fontWeight:700, color:'rgb(34,85,14)', marginBottom:'0.5rem' }}>
              What to expect for {selectedModule.label} {selectedModule.sub}:
            </p>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'0.25rem' }}>
              {module === 'math_no_calc' && [
                '⛔ No calculator — mental math and paper work only',
                '📐 Linear equations, quadratics, functions, word problems',
                '⏱ ~90 seconds per question',
                '🎯 Grid-in questions included for sets of 10+',
              ].map(t => <li key={t} style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>{t}</li>)}
              {module === 'math_calc' && [
                '✅ Calculator permitted',
                '📊 Data analysis, statistics, complex algebra, geometry',
                '⏱ ~90 seconds per question',
                '🎯 Real-world context in every word problem',
              ].map(t => <li key={t} style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>{t}</li>)}
              {module === 'reading_writing' && [
                '📖 Every question has its own passage',
                '✍️ Words in context, evidence, inference, grammar',
                '⏱ ~1.5 minutes per question',
                '🎯 Passage topics: science, history, literature, social studies',
              ].map(t => <li key={t} style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>{t}</li>)}
            </ul>
          </div>

          <button onClick={handleStart} disabled={atLimit} className="btn-primary"
            style={{ width:'100%', justifyContent:'center', padding:'1rem', fontSize:'1.0625rem' }}>
            {atLimit
              ? <><Zap style={{ width:'1rem', height:'1rem' }} />Upgrade for unlimited SAT prep</>
              : `Start ${questionCount}-Question ${selectedModule.label} Practice ✨`}
          </button>
        </div>

        {/* SAT score info */}
        <div style={{ marginTop:'1.5rem', padding:'1.25rem 1.5rem', borderRadius:'1rem', background:'white', border:'1px solid rgba(34,85,14,0.08)' }}>
          <p style={{ fontSize:'0.8125rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
            📊 About the Digital SAT
          </p>
          <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', lineHeight:1.6 }}>
            The Digital SAT has 2 math modules (27 questions each, 70 min total) and 2 Reading & Writing modules (54 questions, 64 min total). Score range: 400–1600. AceForge generates College Board-style questions matching the real exam format and difficulty distribution.
          </p>
        </div>

      </div>
    </div>
  )
}