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

  // Challenges the user CREATED.
  const { data: createdChallenges } = await adminClient
    .from('forge_challenges')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Challenges the user PARTICIPATED IN.
  const { data: participations } = await adminClient
    .from('forge_participants')
    .select('*, forge_challenges(*)')
    .eq('user_id', user.id)
    .eq('is_kicked', false)
    .order('started_at', { ascending: false })
    .limit(10)

  // Gather every relevant challenge id so we can compute player counts + ranks
  // in a single follow-up query.
  const createdRows = createdChallenges ?? []
  const partRows = (participations ?? []).filter((p: any) => p.forge_challenges && p.forge_challenges.creator_id !== user.id)
  const allIds = Array.from(new Set([
    ...createdRows.map((c: any) => c.id),
    ...partRows.map((p: any) => p.challenge_id),
  ]))

  const byChallenge = new Map<string, any[]>()
  if (allIds.length > 0) {
    const { data: allParts } = await adminClient
      .from('forge_participants')
      .select('challenge_id, user_id, score, completed')
      .in('challenge_id', allIds)
      .eq('is_kicked', false)
    for (const row of allParts ?? []) {
      const arr = byChallenge.get(row.challenge_id) ?? []
      arr.push(row)
      byChallenge.set(row.challenge_id, arr)
    }
  }

  const now = Date.now()

  const created = createdRows.map((c: any) => {
    const parts = byChallenge.get(c.id) ?? []
    return {
      id: c.id,
      title: c.title,
      subject: c.subject,
      topic: c.topic,
      created_at: c.created_at,
      expires_at: c.expires_at,
      banner_color: c.banner_color,
      playerCount: parts.length,
      active: c.status !== 'ended' && new Date(c.expires_at).getTime() > now,
    }
  })

  const joined = partRows.map((p: any) => {
    const c = p.forge_challenges
    const parts = byChallenge.get(p.challenge_id) ?? []
    const completedSorted = parts.filter((x: any) => x.completed).sort((a: any, b: any) => b.score - a.score)
    const rank = p.completed ? completedSorted.findIndex((x: any) => x.user_id === user.id) + 1 : 0
    return {
      id: p.challenge_id,
      title: c?.title ?? 'Challenge',
      subject: c?.subject ?? '',
      topic: c?.topic ?? '',
      banner_color: c?.banner_color ?? '#7c3aed',
      expires_at: c?.expires_at ?? null,
      active: c ? c.status !== 'ended' && new Date(c.expires_at).getTime() > now : false,
      avatar_emoji: p.avatar_emoji,
      display_name: p.display_name,
      score: p.score,
      correct: p.correct,
      attempted: p.attempted,
      completed: p.completed,
      rank,
      playerCount: parts.length,
    }
  })

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <ArenaClient profile={profile} created={created} joined={joined} />
    </div>
  )
}
