import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import BrowseClient, { type BrowseQuiz } from './BrowseClient'

export default async function BrowsePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/arena/browse')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bans = await getUserBans(user.id, adminClient)

  // All public quizzes.
  const { data: quizzes } = await adminClient
    .from('forge_quizzes')
    .select('id, title, banner_color, play_mode, creator_id, creator_name, subject, topic, question_count, play_count, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = quizzes ?? []
  const ids = rows.map((q: any) => q.id)

  // Fresh creator display names.
  const creatorIds = Array.from(new Set(rows.map((q: any) => q.creator_id).filter(Boolean)))
  const nameById = new Map<string, string>()
  if (creatorIds.length > 0) {
    const { data: profs } = await adminClient.from('profiles').select('id, display_name').in('id', creatorIds)
    for (const p of profs ?? []) nameById.set(p.id, p.display_name)
  }

  // Stars (total per quiz + whether the current user starred).
  const starCount = new Map<string, number>()
  const myStars = new Set<string>()
  if (ids.length > 0) {
    const { data: stars } = await adminClient.from('forge_quiz_stars').select('quiz_id, user_id').in('quiz_id', ids)
    for (const s of stars ?? []) {
      starCount.set(s.quiz_id, (starCount.get(s.quiz_id) ?? 0) + 1)
      if (s.user_id === user.id) myStars.add(s.quiz_id)
    }
  }

  // Ratings (avg + count per quiz + the current user's rating).
  const ratingSum = new Map<string, number>()
  const ratingCnt = new Map<string, number>()
  const myRating = new Map<string, number>()
  if (ids.length > 0) {
    const { data: ratings } = await adminClient.from('forge_quiz_ratings').select('quiz_id, user_id, rating').in('quiz_id', ids)
    for (const r of ratings ?? []) {
      ratingSum.set(r.quiz_id, (ratingSum.get(r.quiz_id) ?? 0) + r.rating)
      ratingCnt.set(r.quiz_id, (ratingCnt.get(r.quiz_id) ?? 0) + 1)
      if (r.user_id === user.id) myRating.set(r.quiz_id, r.rating)
    }
  }

  const items: BrowseQuiz[] = rows.map((q: any) => {
    const cnt = ratingCnt.get(q.id) ?? 0
    const avg = cnt > 0 ? (ratingSum.get(q.id) ?? 0) / cnt : 0
    return {
      id: q.id,
      title: q.title,
      bannerColor: q.banner_color || '#7c3aed',
      playMode: q.play_mode === 'live' ? 'live' : 'self_paced',
      creatorName: nameById.get(q.creator_id) || q.creator_name || 'Someone',
      isOwner: q.creator_id === user.id,
      subject: q.subject || '',
      topic: q.topic || '',
      questionCount: q.question_count ?? 0,
      playCount: q.play_count ?? 0,
      starCount: starCount.get(q.id) ?? 0,
      starred: myStars.has(q.id),
      avgRating: avg,
      ratingCount: cnt,
      myRating: myRating.get(q.id) ?? 0,
      createdAt: q.created_at,
    }
  })

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <BrowseClient quizzes={items} currentUserId={user.id} />
    </div>
  )
}
