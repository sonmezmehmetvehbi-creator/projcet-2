import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { module, questionCount, difficulty } = await request.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    // Check SAT daily limit for free users
    if (!profile?.is_premium) {
      const today = new Date().toISOString().split('T')[0]
      const { data: usage } = await supabase
        .from('daily_usage')
        .select('sat')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
      if ((usage?.sat ?? 0) >= 1) {
        return NextResponse.json({ error: 'sat_limit_reached' }, { status: 429 })
      }
    }

    const isMath = module === 'math_no_calc' || module === 'math_calc'
    const isCalc = module === 'math_calc'
    const isRW = module === 'reading_writing'

    const difficultyMap: Record<string, string> = {
      easy: 'Easy (College Board difficulty 1-2): straightforward, single-concept, one clear path to the answer',
      medium: 'Medium (College Board difficulty 3): requires applying a concept or interpreting information, 1-2 steps',
      hard: 'Hard (College Board difficulty 4-5): multi-step reasoning, synthesis of multiple concepts, sophisticated distractors',
    }

    const systemPrompt = `You are an expert SAT question writer with 15+ years of experience writing for College Board. You have deep knowledge of the SAT format, question types, difficulty calibration, and distractor construction.

Your questions must be INDISTINGUISHABLE from real College Board SAT questions in terms of:
- Wording style (precise, unambiguous, formal but accessible)
- Distractor quality (each wrong answer targets a specific, common student error)
- Difficulty calibration (exactly matching CB's 1-5 scale)
- Question type variety (matching real SAT module distribution)
- Context and scenario realism

DIFFICULTY: ${difficultyMap[difficulty] ?? difficultyMap.medium}

${isMath ? `
SAT MATH RULES:
- Calculator allowed: ${isCalc ? 'YES' : 'NO — questions must be solvable by hand in ~90 seconds'}
- Every question must present a specific, solvable math problem — never ask for definitions
- Include a mix of: word problems with real context (science, economics, social studies), pure math, data interpretation
- Question types to include: linear equations, systems, quadratics, functions, ratios/proportions, percentages, statistics, geometry, trigonometry (calc only at hard)
- Distractors must be: results of specific wrong approaches (e.g. sign error, wrong operation, misread), NOT random numbers
- All answer choices must be distinct and non-overlapping
- Word problems must give ALL necessary information in the stem
- For hard questions: require multiple steps, function composition, or system solving
- Never use LaTeX — write math in plain text: x^2, sqrt(x), x/y
- Answer choices for MC: exactly 4 options labeled A, B, C, D
- Some questions should be student-produced response style (grid-in) — for these, type is "grid" and there are no options, just the numeric answer
` : `
SAT READING & WRITING RULES:
- EVERY question must include a passage of 3-6 sentences before the question
- Passage topics: literature excerpts, social science, natural science, humanities — rotate between them
- Question types to include (rotate through all):
  * Words in Context: "As used in line X, [word] most nearly means..."
  * Main Idea/Purpose: "The main purpose of the passage is to..."
  * Evidence: "Which choice best supports the claim that..."
  * Inference: "Based on the passage, it can be inferred that..."
  * Transition/Rhetorical: "Which choice most effectively transitions..."
  * Grammar/Usage: sentence with blank, choose grammatically correct option
  * Vocabulary: choose the most precise word for the context
- Passages must be well-written, content-rich, and feel like real academic text
- Distractors must be: too broad, too narrow, opposite meaning, or plausible but unsupported by the text
- Never ask questions answerable without reading the passage
`}

FORMATTING: Always respond in valid JSON only — no markdown, no preamble, no backticks.`

    let userPrompt = ''

    if (isMath) {
      userPrompt = `Generate ${questionCount} SAT Math questions for the ${isCalc ? 'Calculator' : 'No-Calculator'} module at ${difficulty} difficulty.

Mix question types naturally — word problems, pure math, data interpretation. Include 1-2 grid-in (student-produced response) questions if questionCount >= 10.

For each MC question:
- id (number)
- type: "mc"
- calculator: ${isCalc}
- question (string) — the full question stem with all necessary information
- options (array of exactly 4 strings: ["A. ...", "B. ...", "C. ...", "D. ..."])
- correctAnswer ("A", "B", "C", or "D")
- explanation (string) — 4-6 sentences: state the correct approach step by step, show the key calculation, identify what error each main distractor represents, end with a tip for similar questions
- topic (string) — specific math skill e.g. "Linear equations", "Quadratic functions", "Data analysis"
- difficulty_rating (number 1-5 matching CB scale)

For each grid-in question:
- id (number)
- type: "grid"
- calculator: ${isCalc}
- question (string)
- correctAnswer (string) — the numeric answer
- explanation (string) — same quality as MC
- topic (string)
- difficulty_rating (number 1-5)

Return JSON: { "questions": [...] }`
    } else {
      userPrompt = `Generate ${questionCount} SAT Reading and Writing questions at ${difficulty} difficulty.

Rotate through different question types and passage topics. Each question must have its own unique passage.

For each question:
- id (number)
- type: "mc"
- passage (string) — 3-6 sentences of well-written, content-rich text. Must feel like real academic writing. Include specific details, data, or quotes where appropriate.
- question (string) — ONLY the question stem itself, nothing else. Example: "As used in line 2, 'documented' most nearly means..." — do NOT include the answer or explanation in this field
- options (array of exactly 4 strings: ["A. ...", "B. ...", "C. ...", "D. ..."])
- correctAnswer ("A", "B", "C", or "D")
- explanation (string) — 4-6 sentences: identify the correct answer and cite specific evidence from the passage, explain why each main distractor fails (too broad/narrow/unsupported/opposite), end with a strategy tip
- question_type (string) — one of: "Words in Context", "Main Idea", "Evidence", "Inference", "Transition", "Grammar", "Vocabulary"
- topic (string) — passage topic e.g. "Natural science", "Social studies", "Literature", "Humanities"
- difficulty_rating (number 1-5)

Return JSON: { "questions": [...] }`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 6000,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    let clean = raw.replace(/```json|```/g, '').trim()
    clean = clean.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      clean = clean.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
      try { parsed = JSON.parse(clean) }
      catch { throw new Error('Failed to parse AI response. Please try again.') }
    }

    // Save session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        subject: 'SAT',
        grade: 'college',
        topic: module === 'math_no_calc' ? 'SAT Math (No Calculator)' : module === 'math_calc' ? 'SAT Math (Calculator)' : 'SAT Reading & Writing',
        output_type: 'questions',
        content: parsed,
        difficulty,
        is_sat: true,
        sat_module: module,
      })
      .select('id')
      .single()

    if (sessionError) throw sessionError

    // Update usage for free users
    if (!profile?.is_premium) {
      const today = new Date().toISOString().split('T')[0]
      const { data: existingUsage } = await supabase
        .from('daily_usage')
        .select('id, sat')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (existingUsage) {
        await supabase.from('daily_usage').update({ sat: (existingUsage.sat ?? 0) + 1 }).eq('id', existingUsage.id)
      } else {
        await supabase.from('daily_usage').insert({ user_id: user.id, date: today, sat: 1 })
      }
    }

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('SAT generate error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}