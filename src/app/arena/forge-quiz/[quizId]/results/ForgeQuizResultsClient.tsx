'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChevronDown, RotateCcw, Share2, Zap, Check, X } from 'lucide-react'

const MEDALS = ['🥇', '🥈', '🥉']
const MEDAL_COLOR = ['rgb(251,191,36)', 'rgb(203,213,225)', 'rgb(217,119,6)']
const MEDAL_TINT = ['rgba(251,191,36,0.12)', 'rgba(203,213,225,0.1)', 'rgba(217,119,6,0.1)']
const MEDAL_BORDER = ['rgba(251,191,36,0.45)', 'rgba(203,213,225,0.4)', 'rgba(217,119,6,0.4)']

type Player = { id: string; user_id: string; display_name: string; avatar_emoji: string; total_score: number; completed: boolean }
type Answer = { question_id: string; answer: string | null; is_correct: boolean; points: number }
type Question = { id: string; position: number; question_text: string; question_type: string; options: string[] | null; correct_index: number | null; correct_answer: string | null; slider_correct: number | null }

function correctText(q: Question): string {
  if (q.question_type === 'mc') return q.options?.[q.correct_index ?? 0] ?? ''
  if (q.question_type === 'tf') return q.correct_index === 1 ? 'False' : 'True'
  if (q.question_type === 'slider') return String(q.slider_correct ?? '')
  return q.correct_answer ?? ''
}

export default function ForgeQuizResultsClient({
  quiz, me, leaderboard, answers, questions, currentUserId,
}: {
  quiz: any; me: Player; leaderboard: Player[]; answers: Answer[]; questions: Question[]; currentUserId: string
}) {
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const completed = useMemo(() => [...leaderboard].sort((a, b) => b.total_score - a.total_score), [leaderboard])
  const totalPlayers = completed.length
  const myRank = Math.max(1, completed.findIndex((p) => p.user_id === currentUserId) + 1)
  const isTop3 = myRank <= 3
  const totalQ = questions.length
  const correctCount = answers.filter((a) => a.is_correct).length
  const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0

  // Best streak, computed over answers ordered by question position.
  const bestStreak = useMemo(() => {
    const pos = new Map(questions.map((q) => [q.id, q.position]))
    const ordered = [...answers].sort((a, b) => (pos.get(a.question_id) ?? 0) - (pos.get(b.question_id) ?? 0))
    let best = 0, run = 0
    for (const a of ordered) { run = a.is_correct ? run + 1 : 0; best = Math.max(best, run) }
    return best
  }, [answers, questions])

  const answerByQ = useMemo(() => new Map(answers.map((a) => [a.question_id, a])), [answers])
  const glow = isTop3 ? MEDAL_COLOR[myRank - 1] : 'rgb(196,181,253)'

  async function share() {
    const text = `I ranked #${myRank} in ${quiz.title} on AceForge with ${me.total_score} points! 🎯`
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2200) } catch {}
  }

  const stats = [
    { label: 'Final Score', value: `${me.total_score}` },
    { label: 'Correct', value: `${correctCount}/${totalQ}` },
    { label: 'Accuracy', value: `${accuracy}%` },
    { label: 'Best Streak', value: `${bestStreak}` },
  ]

  return (
    <div className="animate-fade-in" style={{ position: 'relative', maxWidth: '44rem', margin: '0 auto', padding: '5.5rem 1.5rem 4rem' }}>
      <div style={{ position: 'absolute', top: '4rem', left: '50%', transform: 'translateX(-50%)', width: '34rem', height: '20rem', borderRadius: '9999px', background: `${glow}22`, filter: 'blur(120px)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'relative', borderRadius: '1.25rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(19,19,31,0.7)', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ height: '0.5rem', background: quiz.banner_color || '#7c3aed' }} />
        <div style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(196,181,253)' }}>⚡ Quiz Results</span>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 800, color: 'white', marginTop: '0.25rem' }}>{quiz.title}</h1>
        </div>
      </div>

      {/* Placement hero */}
      <div style={{ position: 'relative', textAlign: 'center', borderRadius: '1.5rem', border: `1px solid ${glow}55`, background: 'rgba(19,19,31,0.7)', padding: '2.5rem 1.5rem', marginBottom: '1.5rem', boxShadow: `0 0 50px ${glow}22`, animation: 'forgeRankPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, color: glow, textShadow: `0 0 40px ${glow}80` }}>
          {isTop3 ? MEDALS[myRank - 1] : `#${myRank}`}
        </div>
        <p style={{ fontSize: '0.9375rem', color: 'rgb(148,148,168)', marginTop: '0.5rem' }}>out of {totalPlayers} player{totalPlayers === 1 ? '' : 's'}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', marginTop: '1.25rem' }}>
          <span style={{ fontSize: '4rem', lineHeight: 1 }}>{me.avatar_emoji}</span>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{me.display_name}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(19,19,31,0.7)', padding: '1.25rem', textAlign: 'center', animation: 'slideup 0.4s ease both', animationDelay: `${i * 0.08}s` }}>
            <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'rgb(251,191,36)', lineHeight: 1.1 }}>{s.value}</p>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgb(148,148,168)', marginTop: '0.3rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Question breakdown */}
      <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <button type="button" onClick={() => setShowDetails((s) => !s)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700 }}>Your Answers</h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(196,181,253)' }}>
            {showDetails ? 'Hide' : 'Show Details'} <ChevronDown style={{ width: '1rem', height: '1rem', transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </span>
        </button>
        {showDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {questions.map((q, i) => {
              const a = answerByQ.get(q.id)
              const correct = !!a?.is_correct
              return (
                <div key={q.id} style={{ borderRadius: '0.875rem', border: `1px solid ${correct ? 'rgba(34,197,94,0.35)' : 'rgba(248,113,113,0.35)'}`, background: 'rgba(255,255,255,0.03)', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'rgb(196,181,253)', textTransform: 'uppercase' }}>Q{i + 1}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 800, color: correct ? 'rgb(134,239,172)' : 'rgb(252,165,165)' }}>
                      {correct ? <Check style={{ width: '0.85rem', height: '0.85rem' }} /> : <X style={{ width: '0.85rem', height: '0.85rem' }} />} +{a?.points ?? 0} pts
                    </span>
                  </div>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>{q.question_text}</p>
                  <p style={{ fontSize: '0.8125rem', color: correct ? 'rgb(134,239,172)' : 'rgb(252,165,165)' }}>Your answer: {a?.answer ?? <em style={{ color: 'rgb(148,148,168)' }}>no answer</em>}</p>
                  {!correct && <p style={{ fontSize: '0.8125rem', color: 'rgb(134,239,172)', marginTop: '0.15rem' }}>Correct: {correctText(q)}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Final standings */}
      <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Zap style={{ width: '1.1rem', height: '1.1rem', color: 'rgb(196,181,253)' }} />
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Final Standings</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {completed.map((p, i) => {
            const isMe = p.user_id === currentUserId
            const top3 = i < 3
            const bg = isMe ? 'rgba(124,58,237,0.14)' : top3 ? MEDAL_TINT[i] : 'rgba(255,255,255,0.03)'
            const border = isMe ? 'rgba(124,58,237,0.6)' : top3 ? MEDAL_BORDER[i] : 'rgba(255,255,255,0.06)'
            const acc = totalQ // correct/total shown per player would need their answers; show score-based rank
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.875rem', padding: '0.7rem 1rem', border: `1px solid ${border}`, background: bg, boxShadow: isMe ? '0 0 22px rgba(124,58,237,0.35)' : 'none', animation: 'slidein 0.4s ease both', animationDelay: `${i * 0.05}s` }}>
                <span style={{ width: '1.75rem', textAlign: 'center', fontWeight: 800, color: top3 ? MEDAL_COLOR[i] : 'rgb(180,180,200)' }}>{top3 ? MEDALS[i] : i + 1}</span>
                <span style={{ fontSize: '1.3rem' }}>{p.avatar_emoji}</span>
                <span style={{ flex: 1, minWidth: 0, color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.display_name}{isMe && <span style={{ marginLeft: '0.4rem', fontSize: '0.625rem', fontWeight: 800, color: 'rgb(196,181,253)' }}>YOU</span>}
                </span>
                {isMe && <span style={{ fontSize: '0.75rem', color: 'rgb(148,148,168)' }}>{correctCount}/{acc}</span>}
                <span style={{ fontWeight: 900, color: 'rgb(251,191,36)', fontSize: '1.05rem' }}>{p.total_score}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {quiz.status !== 'ended' && (
          <button onClick={() => router.push(`/arena/forge-quiz/${quiz.id}/lobby`)}
            style={{ flex: '1 1 12rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '0.9375rem', cursor: 'pointer', boxShadow: '0 0 26px rgba(124,58,237,0.4)' }}>
            <RotateCcw style={{ width: '1.05rem', height: '1.05rem' }} /> Play Again 🔄
          </button>
        )}
        <button onClick={share}
          style={{ flex: '1 1 12rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', borderRadius: '0.875rem', border: '1px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.1)', color: 'rgb(196,181,253)', fontWeight: 800, fontSize: '0.9375rem', cursor: 'pointer' }}>
          <Share2 style={{ width: '1.05rem', height: '1.05rem' }} /> {copied ? 'Copied!' : 'Share Result'}
        </button>
        <button onClick={() => router.push('/arena')}
          style={{ flex: '1 1 12rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgb(200,200,215)', fontWeight: 800, fontSize: '0.9375rem', cursor: 'pointer' }}>
          Back to Arena <ArrowRight style={{ width: '1.05rem', height: '1.05rem' }} />
        </button>
      </div>

      <style>{`@keyframes forgeRankPop { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
}
