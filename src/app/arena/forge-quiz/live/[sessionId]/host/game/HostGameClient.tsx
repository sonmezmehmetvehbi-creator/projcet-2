'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChevronRight, Check, Flame, Loader2, RotateCw, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import TimerRing from '@/components/arena/TimerRing'
import { ANSWER_STYLES, AnswerShape } from '@/components/arena/AnswerShapes'
import LivePodium from '@/components/arena/LivePodium'
import { useFlipRows } from '@/components/arena/useFlipRows'

type Question = any
type SessionState = { status: string; display_mode: string; current_question_index: number; question_state: string; question_started_at: string | null }

export default function HostGameClient({
  sessionId, quizId, initialSession, quiz, questions,
}: {
  sessionId: string
  quizId: string
  initialSession: SessionState
  quiz: any
  questions: Question[]
}) {
  const router = useRouter()
  const color = quiz.banner_color || '#7c3aed'
  const [session, setSession] = useState<SessionState>(initialSession)
  const [now, setNow] = useState(() => Date.now())
  const [total, setTotal] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [reveal, setReveal] = useState<{ counts: number[]; total: number } | null>(null)
  const [board, setBoard] = useState<{ user_id: string; display_name: string; avatar_emoji: string; score: number; streak: number; gained: number; change: number }[]>([])
  const [busy, setBusy] = useState(false)

  const supaRef = useRef(createClient())
  const autoRevealedRef = useRef<Set<number>>(new Set())
  const prevRanksRef = useRef<Record<string, number>>({})
  // Active-player total (denominator of "X / Y answered"), kept in a ref so the
  // realtime handlers can compare against it without a stale closure.
  const totalRef = useRef(0)

  const qIndex = session.current_question_index
  const q = questions[qIndex]
  const timeLimit = (q?.time_limit || quiz.time_per_question || 20)
  const total_qs = questions.length
  const nOptions = q?.question_type === 'tf' ? 2 : q?.question_type === 'mc' ? Math.min(4, (q.options?.length ?? 4)) : 0

  const elapsed = session.question_started_at ? Math.max(0, (now - new Date(session.question_started_at).getTime()) / 1000) : 0
  const secondsLeft = Math.max(0, Math.ceil(timeLimit - elapsed))

  // Leaderboard FLIP animation: the visible rows, plus the round's single
  // biggest riser (largest positive rank delta) which gets an extra scale pulse.
  const lbVisible = board.slice(0, session.status === 'podium' ? 10 : 5)
  const setLbRef = useFlipRows(lbVisible.map((p) => p.user_id), session.question_state === 'leaderboard')
  const lbMaxUp = Math.max(0, ...lbVisible.map((p) => (p.change > 0 ? p.change : 0)))
  const lbBigMoverId = lbMaxUp > 0 ? lbVisible.find((p) => p.change === lbMaxUp)?.user_id : undefined

  // Refs so the realtime handlers (which are set up once) always read the
  // CURRENT question index / state rather than the values captured at mount.
  const qIndexRef = useRef(qIndex)
  const qStateRef = useRef(session.question_state)
  const qIdRef = useRef<string | undefined>(q?.id)
  qIndexRef.current = qIndex
  qStateRef.current = session.question_state
  qIdRef.current = q?.id

  // Tick.
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t) }, [])

  // Single source of truth for answer data, read via the SERVICE-ROLE API route
  // (bypasses RLS on forge_quiz_live_answers — the anon browser client read
  // silently returned 0 rows, which is why the counter and reveal bars stayed at
  // 0 even though the rows exist). Drives: the "X / Y answered" counter, the
  // reveal option bars, the active-player total, and auto-reveal.
  const fetchStats = useCallback(async () => {
    const i = qIndexRef.current
    const questionId = questions[i]?.id
    if (!questionId) return
    try {
      const res = await fetch('/api/arena/forge-quiz/live/answer-stats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId }),
      })
      const data = await res.json().catch(() => ({}))
      // Raw rows BEFORE aggregating: 0 rows here (with the row confirmed in the
      // DB) means the read/query is wrong; rows present but empty bars means the
      // aggregation below is wrong.
      console.error('[Live/host] answer-stats for q', i, ':', { ok: res.ok, status: res.status, data })
      if (!res.ok) return
      const rows: { answer: string | null }[] = data.rows ?? []
      const tot = typeof data.total === 'number' ? data.total : totalRef.current
      totalRef.current = tot
      setTotal(tot)
      setAnswered(rows.length)

      // Aggregate option counts for the reveal bars. `answer` is stored as the
      // option index in string form ("0".."3"), so we group by Number(a.answer).
      const qq = questions[i]
      const opts = qq?.question_type === 'tf' ? 2 : qq?.question_type === 'mc' ? Math.min(4, (qq.options?.length ?? 4)) : 1
      const counts = Array.from({ length: Math.max(1, opts) }, () => 0)
      for (const a of rows) { const idx = Number(a.answer); if (idx >= 0 && idx < counts.length) counts[idx]++ }
      if (qStateRef.current === 'revealed') {
        console.error('[Live/host] reveal counts for q', i, ':', { counts, total: rows.length, rows })
        setReveal({ counts, total: rows.length })
      }

      // Auto-reveal once every active player has answered this question.
      if (qStateRef.current === 'question' && tot > 0 && rows.length >= tot && !autoRevealedRef.current.has(i)) {
        autoRevealedRef.current.add(i)
        console.error('[Live/host] all players answered → auto reveal q', i)
        revealNow()
      }
    } catch (e) {
      console.error('[Live/host] answer-stats fetch threw:', e)
    }
  }, [sessionId, questions])

  const fetchBoard = useCallback(async () => {
    const supabase = supaRef.current
    // The leaderboard only needs cumulative per-player stats from
    // forge_quiz_live_players (score/streak/best_streak) sorted by score. It does
    // NOT need per-question answer rows — that's the reveal bar chart's concern,
    // handled server-side by answer-stats. (The old forge_quiz_live_answers query
    // also 400'd: it selected user_id, a column that doesn't exist there.)
    const { data: players } = await supabase
      .from('forge_quiz_live_players')
      .select('id, user_id, display_name, avatar_emoji, score, streak, best_streak')
      .eq('session_id', sessionId)
      .eq('is_kicked', false)
      .order('score', { ascending: false })
    console.error('[Leaderboard] final player list:', players)
    const ranked = (players ?? []).map((p, i) => {
      const prev = prevRanksRef.current[p.user_id]
      const change = prev != null ? prev - (i + 1) : 0
      return { ...p, gained: 0, change }
    })
    // Record ranks for next comparison.
    const nextRanks: Record<string, number> = {}
    ranked.forEach((p, i) => { nextRanks[p.user_id] = i + 1 })
    prevRanksRef.current = nextRanks
    console.log('Leaderboard players fetched:', { rawPlayers: players, ranked })
    setBoard(ranked)
  }, [sessionId])

  // Realtime: session (state/status) + answers (live counter + reveal bars) +
  // players (live leaderboard scores). Handlers merge into local state and read
  // the current question via refs — never a stale closure, never a full refresh.
  useEffect(() => {
    const supabase = supaRef.current
    const channel = supabase
      .channel(`live-hostgame-${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forge_quiz_live_sessions', filter: `id=eq.${sessionId}` }, (payload: any) => {
        const s = payload.new
        console.log('[Live/host] session update:', { status: s.status, question_state: s.question_state, q: s.current_question_index })
        setSession((prev) => ({ ...prev, status: s.status, display_mode: s.display_mode, current_question_index: s.current_question_index ?? 0, question_state: s.question_state ?? 'question', question_started_at: s.question_started_at }))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forge_quiz_live_answers', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
        // Fast path — fires only if RLS/publication lets answer events through.
        // (May be silent under RLS; the players-UPDATE trigger below is the
        // reliable path since scoring updates the player row on every answer.)
        console.error('[Live/host] answer event received:', payload.new)
        // Answer rows are keyed by question_id (uuid); ignore other questions.
        if (payload.new?.question_id !== qIdRef.current) return
        fetchStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forge_quiz_live_players', filter: `session_id=eq.${sessionId}` }, () => {
        // Every answer also updates the player's row (score/attempted) via the
        // submit route, and players-realtime is confirmed working — so this is
        // the reliable trigger to re-read answer stats during a live question.
        if (qStateRef.current === 'question' || qStateRef.current === 'revealed') fetchStats()
        if (qStateRef.current === 'leaderboard') fetchBoard()
      })
      .subscribe((status) => { console.log('[Live/host] channel status:', status) })
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // React to state changes (drives the host UI + data fetches for each phase).
  useEffect(() => {
    console.log('[Live/host] phase:', session.status, '/', session.question_state, 'q', session.current_question_index)
    if (session.status === 'podium') { fetchBoard(); return }
    if (session.question_state === 'question') {
      const optTexts = q?.question_type === 'tf' ? ['True', 'False'] : (q?.options ?? []).slice(0, nOptions)
      console.log('Rendering options with text:', { question: q?.question_text, options: optTexts })
      // New question → reset the counter, then read fresh stats from the server.
      setReveal(null)
      setAnswered(0)
      fetchStats()
    }
    else if (session.question_state === 'revealed') { fetchStats() }
    else if (session.question_state === 'leaderboard') { fetchBoard() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.question_state, session.current_question_index, session.status])

  // Auto-reveal when the timer hits zero.
  useEffect(() => {
    if (session.question_state === 'question' && secondsLeft <= 0 && session.question_started_at && !autoRevealedRef.current.has(qIndex)) {
      autoRevealedRef.current.add(qIndex)
      console.log('[Live/host] timer hit 0 → auto reveal, q', qIndex)
      revealNow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, session.question_state, qIndex])

  async function post(endpoint: string, body: any) {
    setBusy(true)
    try {
      const res = await fetch(`/api/arena/forge-quiz/live/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      setBusy(false)
      return { ok: res.ok, data }
    } catch { setBusy(false); return { ok: false, data: {} as any } }
  }

  // Host actions update the local session immediately (optimistic) so the host's
  // own screen advances without waiting for the realtime echo; realtime then
  // propagates the same change to the players.
  async function revealNow() {
    console.log('[Live/host] reveal now, q', qIndexRef.current)
    setSession((prev) => ({ ...prev, question_state: 'revealed' }))
    await post('reveal-question', { sessionId, state: 'revealed' })
  }
  async function showLeaderboard() {
    console.log('[Live/host] show leaderboard')
    setSession((prev) => ({ ...prev, question_state: 'leaderboard' }))
    await post('reveal-question', { sessionId, state: 'leaderboard' })
  }
  async function nextQuestion() {
    const { ok, data } = await post('next-question', { sessionId })
    if (!ok) return
    if (data.finalLeaderboard) {
      // Last question done, but the final leaderboard hasn't been shown yet —
      // show it first (with a "See Podium →" button); podium comes on the next tap.
      console.log('[Live/host] final leaderboard before podium')
      setSession((prev) => ({ ...prev, status: 'active', question_state: 'leaderboard' }))
    } else if (data.podium) {
      console.log('[Live/host] podium reached')
      setSession((prev) => ({ ...prev, status: 'podium', question_state: 'leaderboard' }))
    } else if (typeof data.questionIndex === 'number') {
      console.log('[Live/host] next question →', data.questionIndex)
      autoRevealedRef.current.delete(data.questionIndex)
      setSession((prev) => ({ ...prev, current_question_index: data.questionIndex, question_state: 'question', status: 'active', question_started_at: new Date().toISOString() }))
    }
  }

  async function runAgain() {
    setBusy(true)
    try {
      const res = await fetch('/api/arena/forge-quiz/live/relaunch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
      const data = await res.json()
      if (res.ok && data.newSessionId) { router.push(`/arena/forge-quiz/live/${data.newSessionId}/host`); return }
    } catch {}
    setBusy(false)
  }

  const isLast = qIndex + 1 >= total_qs
  const correctIdx = q?.correct_index

  // ── PODIUM / FINAL RESULTS ──
  if (session.status === 'podium') {
    return (
      <LivePodium
        players={board}
        quizTitle={quiz.title}
        bannerColor={color}
        animated
        controls={
          <>
            <button onClick={runAgain} disabled={busy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.5rem', borderRadius: '9999px', border: 'none', background: 'linear-gradient(90deg, rgb(22,163,74), rgb(34,197,94))', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
              <RotateCw style={{ width: '1.1rem', height: '1.1rem' }} /> Run Again
            </button>
            <button onClick={() => router.push(`/arena/forge-quiz/${quizId}/edit`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.5rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
              <Pencil style={{ width: '1.1rem', height: '1.1rem' }} /> Edit Quiz
            </button>
          </>
        }
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ height: '0.5rem', background: color }} />
      <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', width: '48rem', height: '24rem', borderRadius: '9999px', background: `${color}22`, filter: 'blur(140px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: '60rem', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

       {/* Keyed on the current phase/question so the fade+scale transition replays
           on every real state change (not on timer ticks). Fixed action buttons
           live OUTSIDE this wrapper — a transform here would un-pin them. */}
       <div key={session.status === 'podium' ? 'podium' : `${session.question_state}:${qIndex}`} style={{ animation: 'fadeScaleIn 0.28s ease both' }}>

        {/* ── QUESTION ── */}
        {session.question_state === 'question' && q && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'rgb(196,181,253)' }}>Question {qIndex + 1} of {total_qs}</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>{answered} / {total} answered</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <TimerRing secondsLeft={secondsLeft} totalSeconds={timeLimit} />
              {q.image_url && <img src={q.image_url} alt="" style={{ maxHeight: '14rem', borderRadius: '1rem' }} />}
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 800, color: 'white', textAlign: 'center', lineHeight: 1.2 }}>{q.question_text}</h1>
            </div>

            {(q.question_type === 'mc' || q.question_type === 'tf') ? (
              <div style={{ display: 'grid', gridTemplateColumns: nOptions <= 2 ? '1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
                {Array.from({ length: nOptions }).map((_, i) => {
                  const s = ANSWER_STYLES[i]
                  const optText = q.question_type === 'tf' ? (i === 0 ? 'True' : 'False') : q.options?.[i]
                  // The host "big screen" ALWAYS shows full option text, regardless
                  // of display_mode — display_mode only affects the player's device.
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '1rem', background: s.color, padding: '1.25rem 1.5rem', minHeight: '5rem' }}>
                      <AnswerShape shape={s.shape} size={40} />
                      <span style={{ color: 'white', fontWeight: 800, fontSize: '1.35rem' }}>{optText}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgb(148,148,168)', fontSize: '1.0625rem' }}>
                {q.question_type === 'slider' ? `Players choose a value between ${q.slider_min} and ${q.slider_max} on their device.` : 'Players type their answer on their device.'}
              </div>
            )}

          </>
        )}

        {/* ── REVEALED ── */}
        {session.question_state === 'revealed' && q && (
          <>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: '2rem' }}>{q.question_text}</h1>
            {(q.question_type === 'mc' || q.question_type === 'tf') ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array.from({ length: nOptions }).map((_, i) => {
                  const s = ANSWER_STYLES[i]
                  const cnt = reveal?.counts[i] ?? 0
                  // Bar length is proportional to this option's count vs the total answered.
                  const barPct = reveal && reveal.total > 0 ? Math.round((cnt / reveal.total) * 100) : 0
                  const isCorrect = i === correctIdx
                  const optText = q.question_type === 'tf' ? (i === 0 ? 'True' : 'False') : q.options?.[i]
                  return (
                    <div key={i} style={{ position: 'relative', borderRadius: '1rem', border: isCorrect ? '2px solid rgb(74,222,128)' : '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', padding: '0.5rem', overflow: 'hidden', boxShadow: isCorrect ? '0 0 24px rgba(34,197,94,0.4)' : 'none', opacity: isCorrect ? 1 : 0.75 }}>
                      <div style={{ position: 'absolute', inset: 0, width: `${barPct}%`, background: s.color, opacity: 0.85, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
                        <AnswerShape shape={s.shape} size={28} />
                        <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', flex: 1 }}>{optText}</span>
                        {isCorrect && <Check style={{ width: '1.5rem', height: '1.5rem', color: 'rgb(134,239,172)' }} />}
                        <span style={{ color: 'white', fontWeight: 900, fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
                          {cnt} {cnt === 1 ? 'player' : 'players'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', borderRadius: '1rem', border: '2px solid rgb(74,222,128)', background: 'rgba(34,197,94,0.1)', padding: '2rem' }}>
                <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Correct answer</p>
                <p style={{ color: 'rgb(134,239,172)', fontWeight: 900, fontSize: '2rem' }}>{q.question_type === 'slider' ? q.slider_correct : q.correct_answer}</p>
              </div>
            )}
          </>
        )}

        {/* ── LEADERBOARD / PODIUM ── */}
        {session.question_state === 'leaderboard' && (
          <>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
              {session.status === 'podium' ? '🏆 Final Results' : 'Leaderboard'}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '40rem', margin: '0 auto' }}>
              {lbVisible.map((p, i) => {
                const onFire = p.streak >= 3 && i === board.findIndex((x) => x.streak >= 3)
                const movedUp = p.change > 0
                const isBigMover = movedUp && p.user_id === lbBigMoverId
                // Glow (green) for up-movers; extra scale pulse for the biggest riser.
                // Inner element carries the visuals so the FLIP transform on the
                // outer wrapper never collides with the scale-pulse transform.
                const innerAnim = movedUp
                  ? `lbFadeIn 0.4s ease both, lbUpGlow 1.6s ease 0.1s both${isBigMover ? ', lbBigMover 0.8s ease 0.25s both' : ''}`
                  : 'lbFadeIn 0.4s ease both'
                return (
                  <div key={p.user_id} ref={setLbRef(p.user_id)} style={{ willChange: 'transform' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '1rem', border: i < 3 ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.08)', background: i < 3 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)', padding: '0.9rem 1.25rem', animation: innerAnim }}>
                      <span style={{ width: '2rem', textAlign: 'center', fontWeight: 900, fontSize: '1.25rem', color: i < 3 ? 'rgb(251,191,36)' : 'rgb(180,180,200)' }}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
                      <span style={{ fontSize: '1.75rem' }}>{p.avatar_emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</span>
                          {onFire && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6875rem', fontWeight: 800, color: 'rgb(251,146,60)', background: 'rgba(251,146,60,0.15)', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}><Flame style={{ width: '0.75rem', height: '0.75rem' }} /> On Fire</span>}
                          {movedUp && <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', color: 'rgb(41,28,4)', background: 'rgb(74,222,128)', fontWeight: 900, padding: '0.08rem 0.4rem', borderRadius: '9999px', animation: 'lbBadge 1.8s ease both' }}>▲ +{p.change}</span>}
                          {p.change < 0 && <span style={{ fontSize: '0.72rem', color: 'rgb(150,150,168)', fontWeight: 800 }}>▼{-p.change}</span>}
                        </div>
                        {p.gained > 0 && <span style={{ fontSize: '0.8125rem', color: 'rgb(74,222,128)', fontWeight: 700 }}>+{p.gained}</span>}
                      </div>
                      <span style={{ fontWeight: 900, color: 'rgb(251,191,36)', fontSize: '1.35rem' }}>{p.score}</span>
                    </div>
                  </div>
                )
              })}
              {board.length === 0 && <p style={{ textAlign: 'center', color: 'rgb(148,148,168)' }}>No scores yet.</p>}
            </div>
          </>
        )}
       </div>

        {/* ── Fixed action bar (kept outside the transformed wrapper so it stays
             pinned to the viewport bottom during the fade/scale transition) ── */}
        {session.question_state === 'question' && q && (
          <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
            <button onClick={revealNow} disabled={busy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3.5rem', padding: '0 2.25rem', borderRadius: '9999px', border: 'none', background: 'linear-gradient(90deg, rgb(245,158,11), rgb(251,191,36))', color: 'rgb(41,28,4)', fontWeight: 900, fontSize: '1.0625rem', cursor: 'pointer', boxShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
              Skip Timer / Reveal Now <ArrowRight style={{ width: '1.2rem', height: '1.2rem' }} />
            </button>
          </div>
        )}
        {session.question_state === 'revealed' && q && (
          <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
            <button onClick={showLeaderboard} disabled={busy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3.5rem', padding: '0 2.25rem', borderRadius: '9999px', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 900, fontSize: '1.0625rem', cursor: 'pointer', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}>
              Show Leaderboard <ChevronRight style={{ width: '1.2rem', height: '1.2rem' }} />
            </button>
          </div>
        )}
        {session.question_state === 'leaderboard' && session.status !== 'podium' && (
          <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
            <button onClick={nextQuestion} disabled={busy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3.5rem', padding: '0 2.25rem', borderRadius: '9999px', border: 'none', background: 'linear-gradient(90deg, rgb(22,163,74), rgb(34,197,94))', color: 'white', fontWeight: 900, fontSize: '1.0625rem', cursor: 'pointer', boxShadow: '0 0 30px rgba(34,197,94,0.4)' }}>
              {busy ? <><Loader2 style={{ width: '1.2rem', height: '1.2rem' }} className="animate-spin" /> …</> : <>{isLast ? 'See Podium' : 'Next Question'} <ArrowRight style={{ width: '1.2rem', height: '1.2rem' }} /></>}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeScaleIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes lbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lbUpGlow { 0% { box-shadow: 0 0 0 rgba(34,197,94,0); } 28% { box-shadow: 0 0 26px rgba(34,197,94,0.55); border-color: rgba(74,222,128,0.7); } 100% { box-shadow: 0 0 0 rgba(34,197,94,0); } }
        @keyframes lbBigMover { 0%, 100% { transform: scale(1); } 45% { transform: scale(1.05); } }
        @keyframes lbBadge { 0% { opacity: 0; transform: translateY(4px); } 12% { opacity: 1; transform: translateY(0); } 72% { opacity: 1; } 100% { opacity: 0; transform: translateY(-2px); } }
      `}</style>
    </div>
  )
}
