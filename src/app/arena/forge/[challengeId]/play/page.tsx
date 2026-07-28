import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createHash } from 'crypto'
import ForgeGameClient from './ForgeGameClient'

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

export default async function ForgePlayPage({
  params,
  searchParams,
}: {
  params: { challengeId: string }
  searchParams: { pw?: string }
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: challenge } = await adminClient
    .from('forge_challenges')
    .select('*')
    .eq('id', params.challengeId)
    .maybeSingle()
  if (!challenge) redirect('/arena')

  const lobby = `/arena/forge/${params.challengeId}/lobby`

  // Expired?
  if (new Date(challenge.expires_at) < new Date()) redirect(lobby)

  // Already completed?
  const { data: participant } = await adminClient
    .from('forge_participants')
    .select('*')
    .eq('challenge_id', params.challengeId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (participant?.completed) redirect(lobby)

  // Max players (new joiners only)?
  if (challenge.max_players && !participant) {
    const { count } = await adminClient
      .from('forge_participants')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', params.challengeId)
    if ((count ?? 0) >= challenge.max_players) redirect(lobby)
  }

  // Password gate (non-creators who haven't joined yet).
  if (challenge.is_password_protected && user.id !== challenge.creator_id && !participant) {
    const pw = searchParams?.pw ?? ''
    if (!pw || sha256(pw) !== challenge.password_hash) redirect(lobby)
  }

  return (
    <ForgeGameClient
      challenge={{
        id: challenge.id,
        subject: challenge.subject,
        topic: challenge.topic,
        title: challenge.title,
        banner_color: challenge.banner_color,
        total_time_seconds: challenge.total_time_seconds,
        correct_bonus_seconds: challenge.correct_bonus_seconds,
        wrong_penalty_seconds: challenge.wrong_penalty_seconds,
        questions: challenge.questions,
      }}
      defaultName={participant?.display_name || profile?.display_name || 'Player'}
      defaultAvatar={participant?.avatar_emoji || '🎓'}
    />
  )
}
