import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ArenaClient from './ArenaClient'

export default async function ArenaPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bans = await getUserBans(user.id, adminClient)

  // Quizzes the user CREATED.
  const { data: createdQuizzes } = await adminClient
    .from('forge_quizzes')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Quizzes the user JOINED (as a player).
  const { data: playerRows } = await adminClient
    .from('forge_quiz_players')
    .select('*, forge_quizzes(*)')
    .eq('user_id', user.id)
    .eq('is_kicked', false)
    .order('joined_at', { ascending: false })
    .limit(20)

  const createdRows = createdQuizzes ?? []
  const joinedRows = (playerRows ?? []).filter((p: any) => p.forge_quizzes && p.forge_quizzes.creator_id !== user.id)
  const allIds = Array.from(new Set([...createdRows.map((q: any) => q.id), ...joinedRows.map((p: any) => p.quiz_id)]))

  const byQuiz = new Map<string, any[]>()
  if (allIds.length > 0) {
    const { data: allPlayers } = await adminClient
      .from('forge_quiz_players')
      .select('quiz_id, user_id, total_score, completed')
      .in('quiz_id', allIds)
      .eq('is_kicked', false)
    for (const row of allPlayers ?? []) {
      const arr = byQuiz.get(row.quiz_id) ?? []
      arr.push(row); byQuiz.set(row.quiz_id, arr)
    }
  }

  const now = Date.now()
  const isActive = (q: any) => q && q.status !== 'ended' && (!q.expires_at || new Date(q.expires_at).getTime() > now)

  // Which of these quizzes has the current user starred (forge_quiz_stars join
  // table — replaces the old is_starred boolean).
  const starredSet = new Set<string>()
  if (allIds.length > 0) {
    const { data: stars } = await adminClient
      .from('forge_quiz_stars')
      .select('quiz_id')
      .eq('user_id', user.id)
      .in('quiz_id', allIds)
    for (const s of stars ?? []) starredSet.add(s.quiz_id)
  }

  const quizzesCreated = createdRows.map((q: any) => {
    const parts = byQuiz.get(q.id) ?? []
    return {
      id: q.id, title: q.title, banner_color: q.banner_color, play_mode: q.play_mode,
      expires_at: q.expires_at ?? null, playerCount: parts.filter((p) => p.completed).length,
      active: isActive(q), is_starred: starredSet.has(q.id),
    }
  })

  const quizzesJoined = joinedRows.map((p: any) => {
    const q = p.forge_quizzes
    const parts = byQuiz.get(p.quiz_id) ?? []
    const completedSorted = parts.filter((x: any) => x.completed).sort((a: any, b: any) => b.total_score - a.total_score)
    const rank = p.completed ? completedSorted.findIndex((x: any) => x.user_id === user.id) + 1 : 0
    return {
      id: p.quiz_id, title: q?.title ?? 'Quiz', banner_color: q?.banner_color ?? '#7c3aed',
      active: isActive(q), completed: p.completed, score: p.total_score ?? 0, rank, playerCount: completedSorted.length,
    }
  })

  // ── Live Room sessions (hosted + joined) ──
  const { data: hostedLive } = await adminClient
    .from('forge_quiz_live_sessions')
    .select('id, quiz_id, status, created_at')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: joinedLivePlayers } = await adminClient
    .from('forge_quiz_live_players')
    .select('session_id, score, forge_quiz_live_sessions(id, quiz_id, host_id, status, created_at)')
    .eq('user_id', user.id)
    .eq('is_kicked', false)
    .order('joined_at', { ascending: false })
    .limit(20)

  const hostedLiveRows = hostedLive ?? []
  const joinedLiveRows = (joinedLivePlayers ?? [])
    .map((r: any) => ({ score: r.score, session: r.forge_quiz_live_sessions }))
    .filter((r: any) => r.session && r.session.host_id !== user.id)

  const liveSessionIds = Array.from(new Set([...hostedLiveRows.map((s: any) => s.id), ...joinedLiveRows.map((r: any) => r.session.id)]))
  const liveQuizIds = Array.from(new Set([...hostedLiveRows.map((s: any) => s.quiz_id), ...joinedLiveRows.map((r: any) => r.session.quiz_id)]))

  const liveBySession = new Map<string, { user_id: string; score: number }[]>()
  if (liveSessionIds.length > 0) {
    const { data: lp } = await adminClient
      .from('forge_quiz_live_players')
      .select('session_id, user_id, score')
      .in('session_id', liveSessionIds)
      .eq('is_kicked', false)
    for (const row of lp ?? []) {
      const arr = liveBySession.get(row.session_id) ?? []
      arr.push(row); liveBySession.set(row.session_id, arr)
    }
  }

  const liveQuizMeta = new Map<string, any>()
  if (liveQuizIds.length > 0) {
    const { data: lq } = await adminClient.from('forge_quizzes').select('id, title, banner_color').in('id', liveQuizIds)
    for (const q of lq ?? []) liveQuizMeta.set(q.id, q)
  }

  const liveActive = (status: string) => status === 'waiting' || status === 'active'

  const liveHosted = hostedLiveRows.map((s: any) => {
    const meta = liveQuizMeta.get(s.quiz_id)
    return {
      id: s.id, title: meta?.title ?? 'Live Quiz', banner_color: meta?.banner_color ?? '#7c3aed',
      date: s.created_at, playerCount: (liveBySession.get(s.id) ?? []).length, active: liveActive(s.status),
    }
  })

  const liveJoined = joinedLiveRows.map((r: any) => {
    const s = r.session
    const meta = liveQuizMeta.get(s.quiz_id)
    const parts = (liveBySession.get(s.id) ?? []).slice().sort((a, b) => b.score - a.score)
    const rank = parts.findIndex((p) => p.user_id === user.id) + 1
    return {
      id: s.id, title: meta?.title ?? 'Live Quiz', banner_color: meta?.banner_color ?? '#7c3aed',
      date: s.created_at, score: r.score ?? 0, rank, playerCount: parts.length, active: liveActive(s.status),
    }
  })

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <ArenaClient profile={profile} quizzesCreated={quizzesCreated} quizzesJoined={quizzesJoined} liveHosted={liveHosted} liveJoined={liveJoined} />
    </div>
  )
}
