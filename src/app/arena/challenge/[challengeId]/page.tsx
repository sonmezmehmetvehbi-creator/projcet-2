import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default async function ChallengePage({ params }: { params: { challengeId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bans = await getUserBans(user.id, adminClient)

  const { data: challenge } = await adminClient
    .from('arena_challenges')
    .select('*')
    .eq('id', params.challengeId)
    .maybeSingle()

  if (!challenge) redirect('/arena')

  const startParams = new URLSearchParams({
    subject: challenge.subject ?? '',
    topic: challenge.topic ?? '',
    difficulty: challenge.difficulty ?? 'medium',
    challengeId: challenge.id,
    challengerName: challenge.challenger_name ?? 'A friend',
    challengerScore: String(challenge.challenger_score ?? 0),
  })

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40rem', height: '24rem', borderRadius: '9999px', background: 'rgba(124,58,237,0.14)', filter: 'blur(120px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '36rem', margin: '0 auto', padding: '7rem 1.5rem 4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎯</div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.25rem', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '1rem' }}>
            {challenge.challenger_name} challenges you!
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'rgb(180,180,200)', marginBottom: '2rem' }}>
            Beat their score on <strong style={{ color: 'white' }}>{challenge.subject}</strong>{' '}
            <span style={{ color: 'rgb(196,181,253)' }}>({challenge.difficulty})</span> Speed Round.
          </p>

          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', borderRadius: '1.5rem', border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.06)', padding: '1.75rem 3rem', marginBottom: '2.5rem', boxShadow: '0 0 40px rgba(245,158,11,0.15)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgb(245,158,11)', marginBottom: '0.5rem' }}>
              Score to Beat
            </span>
            <span style={{ fontSize: '4rem', fontWeight: 900, color: 'rgb(251,191,36)', lineHeight: 1, textShadow: '0 0 30px rgba(245,158,11,0.5)' }}>
              {challenge.challenger_score}
            </span>
          </div>

          <div>
            <Link
              href={`/arena/speed-round?${startParams.toString()}`}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.5rem', padding: '0 2.5rem', borderRadius: '0.875rem', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '1.0625rem', textDecoration: 'none', boxShadow: '0 0 30px rgba(124,58,237,0.45)' }}
            >
              Accept Challenge →
            </Link>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/arena" style={{ fontSize: '0.875rem', color: 'rgb(148,148,168)', textDecoration: 'none' }}>
              ← Back to Arena
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
