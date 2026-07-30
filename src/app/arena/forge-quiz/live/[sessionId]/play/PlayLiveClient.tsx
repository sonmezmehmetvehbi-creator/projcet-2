'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ANSWER_STYLES, AnswerShape } from '@/components/arena/AnswerShapes'
import PlayerResult from '@/components/arena/PlayerResult'

type SessionState = { status: string; display_mode: string; current_question_index: number; question_state: string; question_started_at: string | null }
type Result = { qIndex: number; isCorrect?: boolean; points?: number; correctAnswer?: string; answer?: any; tooLate?: boolean }

const WAITING_MSGS = ['Nice pick!', "Let's see how you did…", 'Fingers crossed!', 'Locked and loaded.', 'Hold tight…']

export default function PlayLiveClient({
  sessionId, userId, me, initialSession, quiz, questions,
}: {
  sessionId: string
  userId: string
  me: { display_name: string; avatar_emoji: string }
  initialSession: SessionState
  quiz: any
  questions: any[]
}) {
  const color = quiz.banner_color || '#7c3aed'
  const [session, setSession] = useState<SessionState>(initialSession)
  const [now, setNow] = useState(() => Date.now())
  const [result, setResult] = useState<Result | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sliderVal, setSliderVal] = useState<number | null>(null)
  const [frVal, setFrVal] = useState('')
  const [waitIdx, setWaitIdx] = useState(0)
  const [board, setBoard] = useState<{ user_id: string; display_name: string; avatar_emoji: string; score: number; correct?: number; attempted?: number; best_streak?: number }[]>([])
  const [shake, setShake] = useState(false)

  const supaRef = useRef(createClient())
  const qIndex = session.current_question_index
  const q = questions[qIndex]
  const timeLimit = (q?.time_limit || quiz.time_per_question || 20)
  const isScreenShare = session.display_mode === 'screen_share'
  const nOptions = q?.question_type === 'tf' ? 2 : q?.question_type === 'mc' ? Math.min(4, (q.options?.length ?? 4)) : 0

  const elapsed = session.question_started_at ? Math.max(0, (now - new Date(session.question_started_at).getTime()) / 1000) : 0
  const secondsLeft = Math.max(0, timeLimit - elapsed)
  const timePct = Math.max(0, Math.min(1, secondsLeft / timeLimit))

  const answeredThis = result?.qIndex === qIndex

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(t) }, [])

  // Reset per-question local input when the question changes.
  useEffect(() => {
    if (result && result.qIndex !== qIndex) setResult(null)
    setSliderVal(q?.question_type === 'slider' ? Math.round(((q.slider_min ?? 0) + (q.slider_max ?? 100)) / 2) : null)
    setFrVal('')
    setShake(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex])

  // Rotating waiting messages.
  useEffect(() => {
    if (session.question_state === 'question' && answeredThis) {
      const t = setInterval(() => setWaitIdx((i) => (i + 1) % WAITING_MSGS.length), 1800)
      return () => clearInterval(t)
    }
  }, [session.question_state, answeredThis])

  // Trigger shake on a wrong reveal.
  useEffect(() => {
    if (session.question_state === 'revealed' && answeredThis && result?.isCorrect === false) {
      setShake(true); const t = setTimeout(() => setShake(false), 600); return () => clearTimeout(t)
    }
  }, [session.question_state, answeredThis, result?.isCorrect])

  const fetchBoard = useCallback(async () => {
    const supabase = supaRef.current
    const { data } = await supabase.from('forge_quiz_live_players').select('user_id, display_name, avatar_emoji, score, correct, attempted, best_streak').eq('session_id', sessionId).eq('is_kicked', false).order('score', { ascending: false })
    setBoard(data ?? [])
  }, [sessionId])

  const qStateRef = useRef(session.question_state)
  qStateRef.current = session.question_state

  // Realtime: session drives every screen transition; players keeps the
  // leaderboard scores fresh and handles being kicked. Merge into local state.
  useEffect(() => {
    const supabase = supaRef.current
    const channel = supabase
      .channel(`live-play-${sessionId}-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forge_quiz_live_sessions', filter: `id=eq.${sessionId}` }, (payload: any) => {
        const s = payload.new
        console.log('Session state updated to:', { status: s.status, question_state: s.question_state, q: s.current_question_index })
        if (s.status === 'ended') { window.location.href = '/arena'; return }
        setSession((prev) => ({ ...prev, status: s.status, display_mode: s.display_mode, current_question_index: s.current_question_index ?? 0, question_state: s.question_state ?? 'question', question_started_at: s.question_started_at }))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forge_quiz_live_players', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
        if (payload.new.user_id === userId && payload.new.is_kicked) { window.location.href = `/arena/forge-quiz/live/${sessionId}/join`; return }
        if (qStateRef.current === 'leaderboard' || qStateRef.current === 'revealed') fetchBoard()
      })
      .subscribe((status) => { console.log('[Live/play] channel status:', status) })
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId])

  useEffect(() => {
    if (session.status === 'podium' || session.question_state === 'leaderboard' || session.question_state === 'revealed') fetchBoard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.question_state, session.current_question_index, session.status])

  async function submit(answer: any) {
    if (submitting || answeredThis) return
    console.log('[Live/play] submitting answer for q', qIndex, ':', answer)
    setSubmitting(true)
    try {
      const res = await fetch('/api/arena/forge-quiz/live/submit-answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionIndex: qIndex, answer }),
      })
      const data = await res.json()
      // Transition to the "waiting for others" screen immediately on success —
      // don't wait for any realtime echo.
      if (res.ok) { console.log('[Live/play] answer accepted:', data); setResult({ qIndex, isCorrect: data.isCorrect, points: data.points, correctAnswer: data.correctAnswer, answer }) }
      else if (data.tooLate) { console.log('[Live/play] answer too late'); setResult({ qIndex, tooLate: true }) }
      else console.warn('[Live/play] submit failed:', data)
    } catch (e) { console.warn('[Live/play] submit error:', e) }
    setSubmitting(false)
  }

  const myRank = board.findIndex((p) => p.user_id === userId)
  const myScore = myRank >= 0 ? board[myRank].score : 0

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '0.375rem', background: color }} />
      {children}
      <style>{`
        @keyframes shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-8px)} 40%,60%{transform:translateX(8px)} }
        @keyframes pop { from{transform:scale(0.6);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes confettiFall { to { transform: translateY(120vh) rotate(720deg); opacity: 0; } }
      `}</style>
    </div>
  )

  // ── PODIUM (final, personalized) ──
  if (session.status === 'podium') {
    const meRow = board[myRank] as any
    return (
      <PlayerResult
        rank={myRank >= 0 ? myRank + 1 : board.length + 1}
        totalPlayers={board.length}
        score={myScore}
        correct={meRow?.correct ?? 0}
        attempted={meRow?.attempted ?? 0}
        bestStreak={meRow?.best_streak ?? 0}
        quizTitle={quiz.title}
        bannerColor={color}
        playerName={me.display_name}
        avatar={me.avatar_emoji}
      />
    )
  }

  // ── PODIUM / LEADERBOARD ──
  if (session.question_state === 'leaderboard') {
    return shell(
      <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p style={{ color: 'rgb(148,148,168)', fontSize: '0.875rem', fontWeight: 700 }}>{session.status === 'podium' ? 'Final standing' : 'Your standing'}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>{me.avatar_emoji}</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{myRank >= 0 ? `#${myRank + 1}` : '—'}</p>
              <p style={{ color: 'rgb(251,191,36)', fontWeight: 800, fontSize: '1.1rem' }}>{myScore} pts</p>
            </div>
          </div>
        </div>
        <div style={{ width: '100%', maxWidth: '26rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {board.slice(0, 5).map((p, i) => (
            <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.75rem', border: p.user_id === userId ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)', background: p.user_id === userId ? `${color}22` : 'rgba(255,255,255,0.03)', padding: '0.6rem 0.9rem' }}>
              <span style={{ width: '1.5rem', fontWeight: 900, color: 'rgb(180,180,200)' }}>{i + 1}</span>
              <span style={{ fontSize: '1.25rem' }}>{p.avatar_emoji}</span>
              <span style={{ flex: 1, color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</span>
              <span style={{ fontWeight: 800, color: 'rgb(251,191,36)' }}>{p.score}</span>
            </div>
          ))}
        </div>
        {session.status !== 'podium' && <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem', marginTop: '0.5rem' }}>Waiting for next question…</p>}
      </div>
    )
  }

  // ── REVEALED ──
  if (session.question_state === 'revealed') {
    const late = result?.tooLate || !answeredThis
    const correct = answeredThis && result?.isCorrect
    const bg = correct ? 'rgb(21,60,35)' : late ? 'rgb(30,30,44)' : 'rgb(60,25,30)'
    return shell(
      <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', textAlign: 'center', animation: shake ? 'shake 0.6s' : 'none' }}>
        <div style={{ fontSize: '4rem', animation: 'pop 0.4s ease both' }}>{correct ? '🎉' : late ? '⏳' : '😬'}</div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 900, color: 'white' }}>
          {correct ? `Correct! +${result?.points}` : late ? 'Missed this one' : 'Not quite…'}
        </h1>
        {!correct && <p style={{ color: 'rgb(226,226,240)', fontSize: '1.0625rem' }}>The answer was <strong>{result?.correctAnswer ?? correctFor(q)}</strong></p>}
        <p style={{ color: 'rgb(148,148,168)', fontWeight: 700, marginTop: '0.5rem' }}>Total score: {(myScore || 0)}</p>
        {correct && <Confetti />}
      </div>
    )
  }

  // ── QUESTION: already answered → waiting ──
  if (answeredThis || result?.tooLate) {
    return shell(
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', animation: 'pop 0.4s ease both' }}>{result?.tooLate ? '⏳' : '✅'}</div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>{result?.tooLate ? 'Too late!' : 'Answer locked in!'}</h1>
        {!result?.tooLate && <p style={{ color: 'rgb(148,148,168)', fontSize: '1.0625rem' }}>{WAITING_MSGS[waitIdx]}</p>}
      </div>
    )
  }

  // ── QUESTION: answering ──
  return shell(
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* timer bar */}
      <div style={{ height: '0.5rem', background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', width: `${timePct * 100}%`, background: secondsLeft <= 5 ? 'rgb(239,68,68)' : color, transition: 'width 0.2s linear' }} />
      </div>
      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgb(148,148,168)', fontSize: '0.8125rem', fontWeight: 700 }}>Question {qIndex + 1}</span>
        <span style={{ color: 'white', fontWeight: 800 }}>{Math.ceil(secondsLeft)}s</span>
      </div>

      {!isScreenShare && q && (
        <div style={{ padding: '0 1.25rem 1rem', textAlign: 'center' }}>
          {q.image_url && <img src={q.image_url} alt="" style={{ maxHeight: '9rem', borderRadius: '0.75rem', margin: '0 auto 0.75rem' }} />}
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.4rem', fontWeight: 800, color: 'white', lineHeight: 1.25 }}>{q.question_text}</h1>
        </div>
      )}
      {isScreenShare && (
        <p style={{ textAlign: 'center', color: 'rgb(148,148,168)', fontSize: '0.9375rem', padding: '0 1.25rem 0.75rem' }}>Look at the main screen and tap your answer</p>
      )}

      <div style={{ flex: 1, padding: '0 1rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {(q?.question_type === 'mc' || q?.question_type === 'tf') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {Array.from({ length: nOptions }).map((_, i) => {
              const s = ANSWER_STYLES[i]
              const optText = q.question_type === 'tf' ? (i === 0 ? 'True' : 'False') : q.options?.[i]
              return (
                <button key={i} onClick={() => submit(i)} disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', minHeight: '5.5rem', borderRadius: '1rem', border: 'none', background: s.color, color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', padding: '1rem', opacity: submitting ? 0.6 : 1 }}>
                  <AnswerShape shape={s.shape} size={36} />
                  {!isScreenShare && <span>{optText}</span>}
                </button>
              )
            })}
          </div>
        )}

        {q?.question_type === 'slider' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem' }}>
            <div style={{ textAlign: 'center', fontFamily: 'Fraunces, Georgia, serif', fontSize: '3rem', fontWeight: 900, color: 'white' }}>{sliderVal}</div>
            <input type="range" min={q.slider_min ?? 0} max={q.slider_max ?? 100} value={sliderVal ?? 0} onChange={(e) => setSliderVal(Number(e.target.value))} disabled={submitting}
              style={{ width: '100%', accentColor: color }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgb(148,148,168)', fontSize: '0.8125rem' }}><span>{q.slider_min ?? 0}</span><span>{q.slider_max ?? 100}</span></div>
            <button onClick={() => submit(sliderVal)} disabled={submitting}
              style={{ height: '3.25rem', borderRadius: '9999px', border: 'none', background: color, color: 'white', fontWeight: 800, fontSize: '1.0625rem', cursor: 'pointer' }}>Lock in {sliderVal}</button>
          </div>
        )}

        {q?.question_type === 'fr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
            <input value={frVal} onChange={(e) => setFrVal(e.target.value)} placeholder="Type your answer…" disabled={submitting}
              style={{ height: '3.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1.1rem', padding: '0 1rem', outline: 'none' }} />
            <button onClick={() => submit(frVal)} disabled={submitting || !frVal.trim()}
              style={{ height: '3.25rem', borderRadius: '9999px', border: 'none', background: frVal.trim() ? color : 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, fontSize: '1.0625rem', cursor: frVal.trim() ? 'pointer' : 'default' }}>Submit</button>
          </div>
        )}
      </div>
    </div>
  )
}

function correctFor(q: any) {
  if (!q) return ''
  if (q.question_type === 'slider') return q.slider_correct
  if (q.question_type === 'tf') return q.correct_index === 1 ? 'False' : 'True'
  if (q.question_type === 'mc') return q.options?.[q.correct_index]
  return q.correct_answer
}

function Confetti() {
  const pieces = Array.from({ length: 40 })
  const colors = ['#f97316', '#9333ea', '#38bdf8', '#22c55e', '#fbbf24']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pieces.map((_, i) => (
        <span key={i} style={{
          position: 'absolute', top: '-5vh', left: `${Math.random() * 100}%`,
          width: '0.5rem', height: '0.9rem', background: colors[i % colors.length], borderRadius: '1px',
          animation: `confettiFall ${1.5 + Math.random() * 1.5}s linear ${Math.random() * 0.5}s forwards`,
        }} />
      ))}
    </div>
  )
}
