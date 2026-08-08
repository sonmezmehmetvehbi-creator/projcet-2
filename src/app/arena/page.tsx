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

  const now = Date.now()
  const isActive = (q: any) => q && q.status !== 'ended' && (!q.expires_at || new Date(q.expires_at).getTime() > now)
  // The canonical quiz an instance belongs to (an original has no source_quiz_id).
  const originalIdOf = (q: any) => q?.source_quiz_id ?? q?.id

  // ── Quizzes the user CREATED — genuine authored templates only ──
  // Launched play instances carry a source_quiz_id and are transient copies owned
  // (attributed) to the ORIGINAL creator; they must never appear here, only under
  // "Joined". This is what keeps a played public quiz out of the player's Created.
  const { data: createdQuizzes } = await adminClient
    .from('forge_quizzes')
    .select('*')
    .eq('creator_id', user.id)
    .is('source_quiz_id', null)
    .order('created_at', { ascending: false })
    .limit(50)
  const createdRows = createdQuizzes ?? []

  // ── Self-paced instances the user PLAYED (has a player row) ──
  const { data: playerRows } = await adminClient
    .from('forge_quiz_players')
    .select('quiz_id, total_score, completed, completed_at, joined_at, forge_quizzes(*)')
    .eq('user_id', user.id)
    .eq('is_kicked', false)
    .order('joined_at', { ascending: false })
    .limit(100)

  // ── Self-paced rooms the user LAUNCHED from someone else's quiz ──
  // (A shareable room they spun up but may not have played themselves yet.)
  const { data: launchedInstances } = await adminClient
    .from('forge_quizzes')
    .select('*')
    .eq('launched_by', user.id)
    .not('source_quiz_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  // Group "Joined" by the ORIGINAL quiz so playing the same public quiz through
  // several instances (solo replays reuse one row; rooms are distinct) collapses
  // into ONE card — no duplicate-looking entries.
  type JoinGroup = { originalId: string; instanceIds: Set<string>; instance: any; players: any[] }
  const joinGroups = new Map<string, JoinGroup>()
  const addInstance = (instanceQuiz: any, player: any | null) => {
    if (!instanceQuiz) return
    // Only quizzes the user did NOT author count as "Joined".
    if (instanceQuiz.creator_id === user.id) return
    const originalId = originalIdOf(instanceQuiz)
    const g: JoinGroup = joinGroups.get(originalId) ?? { originalId, instanceIds: new Set<string>(), instance: instanceQuiz, players: [] }
    g.instanceIds.add(instanceQuiz.id)
    if (player) g.players.push({ ...player, quiz_id: instanceQuiz.id })
    joinGroups.set(originalId, g)
  }
  for (const p of playerRows ?? []) addInstance(p.forge_quizzes, p)
  for (const inst of launchedInstances ?? []) addInstance(inst, null)

  // Fetch the canonical originals for accurate title/active/replay link.
  const joinedOriginalIds = Array.from(joinGroups.keys())
  const origById = new Map<string, any>()
  if (joinedOriginalIds.length > 0) {
    const { data: origs } = await adminClient.from('forge_quizzes').select('*').in('id', joinedOriginalIds)
    for (const o of origs ?? []) origById.set(o.id, o)
  }

  // Every quiz the user has starred (any creator) — drives the Starred tab.
  const { data: myStarRows } = await adminClient
    .from('forge_quiz_stars')
    .select('quiz_id')
    .eq('user_id', user.id)
  const starredQuizIds = Array.from(new Set((myStarRows ?? []).map((s: any) => s.quiz_id)))
  const starredSet = new Set<string>(starredQuizIds)

  // Player counts (for created/joined/starred cards) across every relevant quiz.
  const joinedInstanceIds = Array.from(new Set(Array.from(joinGroups.values()).flatMap((g) => Array.from(g.instanceIds))))
  const allIds = Array.from(new Set([...createdRows.map((q: any) => q.id), ...joinedInstanceIds, ...starredQuizIds]))
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

  const quizzesCreated = createdRows.map((q: any) => {
    const parts = byQuiz.get(q.id) ?? []
    return {
      id: q.id, title: q.title, banner_color: q.banner_color, play_mode: q.play_mode,
      expires_at: q.expires_at ?? null, playerCount: parts.filter((p) => p.completed).length,
      active: isActive(q), is_starred: starredSet.has(q.id), owned: true,
    }
  })

  const quizzesJoined = Array.from(joinGroups.values()).map((g) => {
    const orig = origById.get(g.originalId) ?? g.instance
    const completedPlayers = g.players.filter((p: any) => p.completed)
    // Best completed attempt across this quiz's instances → its score + rank.
    const best = completedPlayers.slice().sort((a: any, b: any) => (b.total_score ?? 0) - (a.total_score ?? 0))[0] ?? null
    let rank = 0, totalPlayers = 0, score = 0
    if (best) {
      score = best.total_score ?? 0
      const board = (byQuiz.get(best.quiz_id) ?? []).filter((p: any) => p.completed).sort((a: any, b: any) => b.total_score - a.total_score)
      totalPlayers = board.length
      rank = board.findIndex((p: any) => p.user_id === user.id) + 1
    }
    const lastPlayed = completedPlayers.map((p: any) => p.completed_at).filter(Boolean).sort().slice(-1)[0] ?? null
    const active = isActive(orig)
    return {
      id: g.originalId,
      title: orig?.title ?? 'Quiz',
      banner_color: orig?.banner_color ?? '#7c3aed',
      active,
      completed: !!best,
      score, rank, playerCount: totalPlayers,
      timesPlayed: g.instanceIds.size,
      lastPlayed,
      // Replay the canonical original as a fresh solo attempt.
      playHref: active ? `/arena/forge-quiz/${g.originalId}/play` : undefined,
    }
  })

  // ── Starred tab — every quiz the user saved, regardless of who created it ──
  let starredQuizRows: any[] = []
  if (starredQuizIds.length > 0) {
    const { data: sq } = await adminClient.from('forge_quizzes').select('*').in('id', starredQuizIds)
    starredQuizRows = sq ?? []
  }
  const quizzesStarred = starredQuizRows.map((q: any) => {
    const parts = byQuiz.get(q.id) ?? []
    return {
      id: q.id, title: q.title, banner_color: q.banner_color, play_mode: q.play_mode,
      expires_at: q.expires_at ?? null, playerCount: parts.filter((p: any) => p.completed).length,
      active: isActive(q), is_starred: true, owned: q.creator_id === user.id,
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
      <ArenaClient profile={profile} quizzesCreated={quizzesCreated} quizzesJoined={quizzesJoined} quizzesStarred={quizzesStarred} liveHosted={liveHosted} liveJoined={liveJoined} />
    </div>
  )
}
