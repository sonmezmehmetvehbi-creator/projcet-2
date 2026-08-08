import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import PreviewClient, { type PreviewData } from './PreviewClient'

export default async function BrowsePreviewPage({ params }: { params: { quizId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arena/browse/${params.quizId}`)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bans = await getUserBans(user.id, adminClient)

  const { data: quiz } = await adminClient
    .from('forge_quizzes')
    .select('id, title, banner_color, play_mode, creator_id, creator_name, subject, topic, question_count, play_count, is_public')
    .eq('id', params.quizId)
    .maybeSingle()
  // Only public quizzes (or your own) are viewable in the browse preview.
  if (!quiz) redirect('/arena/browse')
  const isOwner = quiz.creator_id === user.id
  if (!quiz.is_public && !isOwner) redirect('/arena/browse')

  const { data: questions } = await adminClient
    .from('forge_quiz_questions')
    .select('id, position, question_text, question_type, options, correct_index, correct_answer, slider_min, slider_max, slider_correct, image_url')
    .eq('quiz_id', params.quizId)
    .order('position', { ascending: true })

  // Fresh creator name.
  const { data: creator } = await adminClient.from('profiles').select('display_name').eq('id', quiz.creator_id).maybeSingle()

  // Star aggregate + this user's star.
  const { data: stars } = await adminClient.from('forge_quiz_stars').select('user_id').eq('quiz_id', params.quizId)
  const starCount = (stars ?? []).length
  const starred = (stars ?? []).some((s: any) => s.user_id === user.id)

  // Rating aggregate + this user's rating.
  const { data: ratings } = await adminClient.from('forge_quiz_ratings').select('user_id, rating').eq('quiz_id', params.quizId)
  const ratingCount = (ratings ?? []).length
  const ratingSum = (ratings ?? []).reduce((a: number, r: any) => a + (r.rating ?? 0), 0)
  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0
  const myRating = (ratings ?? []).find((r: any) => r.user_id === user.id)?.rating ?? 0

  const data: PreviewData = {
    id: quiz.id,
    title: quiz.title,
    bannerColor: quiz.banner_color || '#7c3aed',
    creatorName: creator?.display_name || quiz.creator_name || 'Someone',
    subject: quiz.subject || '',
    topic: quiz.topic || '',
    playMode: quiz.play_mode === 'live' ? 'live' : 'self_paced',
    questionCount: quiz.question_count ?? (questions?.length ?? 0),
    playCount: quiz.play_count ?? 0,
    starCount,
    starred,
    avgRating,
    ratingCount,
    myRating,
    isOwner,
    questions: (questions ?? []).map((q: any) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: Array.isArray(q.options) ? q.options : null,
      correct_index: q.correct_index,
      correct_answer: q.correct_answer,
      slider_min: q.slider_min,
      slider_max: q.slider_max,
      slider_correct: q.slider_correct,
      image_url: q.image_url,
    })),
  }

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <PreviewClient data={data} />
    </div>
  )
}
