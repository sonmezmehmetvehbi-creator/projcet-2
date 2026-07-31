import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Forge Quiz (Kahoot-style). Run once in Supabase:
//
// -- CREATE TABLE IF NOT EXISTS forge_quizzes (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   creator_id uuid REFERENCES profiles(id),
// --   creator_name text,
// --   title text NOT NULL,
// --   welcome_message text,
// --   banner_color text DEFAULT '#7c3aed',
// --   play_mode text DEFAULT 'self_paced',      -- 'self_paced' | 'live'
// --   time_per_question int DEFAULT 20,
// --   max_players int,
// --   room_code text,
// --   status text DEFAULT 'active',             -- 'active' | 'waiting' | 'ended'
// --   question_count int DEFAULT 0,
// --   created_at timestamptz DEFAULT now()
// -- );
// -- ALTER TABLE forge_quizzes DISABLE ROW LEVEL SECURITY;
// -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS expires_at timestamptz;
// -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS allow_replay boolean DEFAULT true;
// -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false;
// -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
// -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS play_count int DEFAULT 0;
// -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS subject text;
// -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS topic text;
// --
// -- -- Browse-public "save" (star) join table — replaces the is_starred boolean.
// -- CREATE TABLE IF NOT EXISTS forge_quiz_stars (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   quiz_id uuid REFERENCES forge_quizzes(id),
// --   user_id uuid REFERENCES profiles(id),
// --   created_at timestamptz DEFAULT now(),
// --   UNIQUE (quiz_id, user_id)
// -- );
// -- ALTER TABLE forge_quiz_stars DISABLE ROW LEVEL SECURITY;
// --
// -- -- 1-5 star ratings (one per user per quiz).
// -- CREATE TABLE IF NOT EXISTS forge_quiz_ratings (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   quiz_id uuid REFERENCES forge_quizzes(id),
// --   user_id uuid REFERENCES profiles(id),
// --   rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
// --   created_at timestamptz DEFAULT now(),
// --   updated_at timestamptz DEFAULT now(),
// --   UNIQUE (quiz_id, user_id)
// -- );
// -- ALTER TABLE forge_quiz_ratings DISABLE ROW LEVEL SECURITY;
// --
// -- CREATE TABLE IF NOT EXISTS forge_quiz_questions (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   quiz_id uuid REFERENCES forge_quizzes(id),
// --   position int DEFAULT 0,
// --   question_text text NOT NULL,
// --   question_type text DEFAULT 'mc',          -- 'mc' | 'tf' | 'slider' | 'fr'
// --   options jsonb,                            -- string[] for mc/tf
// --   correct_index int,                        -- for mc/tf
// --   correct_answer text,                      -- for fr
// --   slider_min int,
// --   slider_max int,
// --   slider_correct int,
// --   points_multiplier int DEFAULT 1,
// --   time_limit int,
// --   image_url text,
// --   created_at timestamptz DEFAULT now()
// -- );
// -- ALTER TABLE forge_quiz_questions DISABLE ROW LEVEL SECURITY;
// -- ALTER TABLE forge_quiz_questions ADD COLUMN IF NOT EXISTS speed_bonus_enabled boolean DEFAULT true;
// --
// -- Create a public storage bucket named 'quiz-images'.

function roomCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const {
      title,
      welcomeMessage = '',
      bannerColor = '#7c3aed',
      playMode = 'self_paced', // 'self_paced' | 'live'
      timePerQuestion = 20,
      maxPlayers = null,
      duration = '24h',
      customDurationHours = null,
      allowReplay = true,
      isPublic = false,
      subject = '',
      topic = '',
      questions = [],
    } = await request.json()

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'A title and at least one question are required' }, { status: 400 })
    }

    const { data: profile } = await adminClient.from('profiles').select('display_name').eq('id', user.id).single()

    const isLive = playMode === 'live'
    // Every quiz (self-paced and live) gets a shareable join code.
    const code = roomCode()

    // Self-paced quizzes stay open for a chosen window (preset or custom hours).
    const DURATION_HOURS: Record<string, number> = { '1h': 1, '6h': 6, '12h': 12, '24h': 24, '3d': 72, '7d': 168 }
    const hours = customDurationHours ? Math.max(1, Number(customDurationHours)) : (DURATION_HOURS[duration] ?? 24)
    const expiresAt = isLive ? null : new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

    const { data: quiz, error } = await adminClient
      .from('forge_quizzes')
      .insert({
        creator_id: user.id,
        creator_name: profile?.display_name || 'Host',
        title,
        welcome_message: welcomeMessage,
        banner_color: bannerColor,
        play_mode: isLive ? 'live' : 'self_paced',
        time_per_question: timePerQuestion,
        max_players: maxPlayers ? Number(maxPlayers) : null,
        room_code: code,
        status: isLive ? 'waiting' : 'active',
        question_count: questions.length,
        expires_at: expiresAt,
        allow_replay: !!allowReplay,
        is_public: !!isPublic,
        subject: subject ? String(subject).slice(0, 80) : null,
        topic: topic ? String(topic).slice(0, 120) : null,
      })
      .select('id')
      .single()
    if (error) throw error

    const rows = questions.map((q: any, i: number) => ({
      quiz_id: quiz.id,
      position: i,
      question_text: String(q.question_text ?? ''),
      question_type: ['mc', 'tf', 'slider', 'fr'].includes(q.question_type) ? q.question_type : 'mc',
      options: Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : null,
      correct_index: typeof q.correct_index === 'number' ? q.correct_index : null,
      correct_answer: q.correct_answer != null ? String(q.correct_answer) : null,
      slider_min: q.slider_min != null ? Number(q.slider_min) : null,
      slider_max: q.slider_max != null ? Number(q.slider_max) : null,
      slider_correct: q.slider_correct != null ? Number(q.slider_correct) : null,
      points_multiplier: [0, 1, 2].includes(q.points_multiplier) ? q.points_multiplier : 1,
      time_limit: q.time_limit != null ? Number(q.time_limit) : null,
      speed_bonus_enabled: q.speed_bonus_enabled === false ? false : true,
      image_url: q.image_url || null,
    }))

    const { error: qErr } = await adminClient.from('forge_quiz_questions').insert(rows)
    if (qErr) throw qErr

    return NextResponse.json({ quizId: quiz.id, roomCode: code })
  } catch (error: any) {
    console.error('Forge quiz create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
