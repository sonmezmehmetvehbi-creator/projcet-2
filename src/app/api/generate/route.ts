import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subject, grade, topic, focus, outputType, questionCount, questionTypes, uploadedText, isRetry, difficulty } = await request.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    if (!profile?.is_premium) {
      const today = new Date().toISOString().split('T')[0]
      const { data: usage } = await supabase
        .from('daily_usage')
        .select('questions, worksheets')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
      const used = outputType === 'questions' ? (usage?.questions ?? 0) : (usage?.worksheets ?? 0)
      if (used >= 2) return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 })
    }

    const difficultyGuide: Record<string, string> = {
      easy: 'Test direct recall and basic conceptual understanding. Questions should have one clearly correct answer with obviously wrong distractors. Use simple, unambiguous language. Suitable for first exposure to a topic.',
      medium: 'Test understanding and application. Require the student to apply a concept to a new situation or interpret information. Distractors should be plausible but clearly wrong on reflection. Standard grade-level challenge.',
      hard: 'Test analysis and multi-step reasoning. Questions should require combining multiple concepts, spotting subtle distinctions, or working through a problem with several steps. Distractors should reflect common misconceptions.',
      expert: 'Test synthesis and evaluation at AP/college level. Questions should involve edge cases, non-obvious applications, or require the student to evaluate competing approaches. Distractors should be sophisticated and reflect deep misconceptions.',
    }

    // Subject-specific instruction sets that guide GPT-4o on question style,
    // structure, and common pitfalls — without hardcoding example questions.
    const subjectInstructions: Record<string, string> = {
      // ── MATHEMATICS ──────────────────────────────────────────────────────
      mathematics: `
- Always present a concrete problem, not a definition question ("Solve..." not "What is...").
- For MC: make sure exactly one answer is mathematically correct; verify all distractors are wrong.
- Distractors must reflect real student errors: sign mistakes, order-of-operations errors, wrong formula application.
- Show all necessary given information in the question stem — never assume unstated values.
- Vary question format: some numeric answers, some "which of the following is true", some "find and interpret".
- Never ask the same concept twice in one set.`,

      calculus: `
- Questions must involve an actual function, limit expression, integral, or derivative — never abstract definitions alone.
- For limits: specify the point and direction (left/right) when relevant.
- For derivatives: name the rule being tested (chain, product, quotient, implicit) in your internal planning but NOT in the question.
- For integrals: specify definite vs indefinite; include bounds for definite integrals.
- For FRQs: structure as multi-part (a, b, c) mirroring AP Calc FRQ style — set up, solve, interpret.
- Distractors: missing chain rule, wrong sign on integration, forgetting +C, differentiating instead of integrating.
- Use functions that produce clean answers at the difficulty level specified.`,

      algebra: `
- Always include an equation, expression, or word problem — never a pure vocabulary question.
- Cover a range: linear equations, systems, quadratics, inequalities, functions, word problems.
- Word problems must give all necessary values and ask for a specific numeric or algebraic answer.
- Distractors: arithmetic sign errors, wrong order of operations, forgetting to apply operation to both sides.
- For quadratics: require the student to choose the correct method (factor, quadratic formula, complete the square) at hard/expert.
- Systems of equations: specify the method or let the student choose; always have a unique solution at easy/medium.`,

      'pre-calculus': `
- Cover: functions and inverses, trigonometry, polar coordinates, vectors, sequences/series, conic sections.
- Trig questions must specify the quadrant or unit circle position when relevant.
- For inverse functions: always confirm the domain restriction is stated.
- Sequence/series questions must specify arithmetic vs geometric and what is being asked (nth term, sum, convergence).
- Distractors: wrong quadrant sign, forgetting domain restrictions, confusing arithmetic/geometric formulas.`,

      statistics: `
- Questions must reference a realistic scenario or dataset — never abstract statistics in a vacuum.
- Cover: descriptive stats, probability, distributions, hypothesis testing, confidence intervals, regression.
- Always state sample size, significance level, or distribution type when relevant.
- For hypothesis testing: require the student to state H0 and H1, choose the test, and interpret the p-value.
- Distractors: confusing p-value with probability of H0, wrong degrees of freedom, correlation vs causation errors.
- Avoid questions with ambiguous interpretations of probability.`,

      // ── SCIENCES ──────────────────────────────────────────────────────────
      biology: `
- Frame questions around a scenario, organism, or experimental result — not pure definition recall at medium+.
- Cover cellular processes, genetics, evolution, ecology, physiology, and molecular biology as appropriate to topic.
- For genetics: use Punnett squares or genotype/phenotype problems with specific crosses.
- For experimental questions: provide a hypothesis and data, then ask for interpretation or conclusion.
- Distractors: common misconceptions (evolution is directed, mitosis produces gametes, DNA is made of amino acids).
- Free response: require the student to explain a mechanism step-by-step, not just name it.`,

      chemistry: `
- Always include actual chemical formulas, equations, or numeric data — never pure vocabulary at medium+.
- Balance chemical equations in the question if stoichiometry is involved; verify balance before including.
- For mole/stoichiometry problems: provide molar masses or specify that students should use periodic table values.
- Cover: atomic structure, bonding, reactions, stoichiometry, thermodynamics, equilibrium, kinetics, acids/bases, electrochemistry.
- Distractors: common errors — forgetting to balance, wrong mole ratios, confusing exothermic/endothermic signs.
- Free response: show the setup, calculation steps, and unit analysis.`,

      physics: `
- Every question must include numeric values, units, or a described physical scenario.
- Always specify the reference frame, direction of forces, and whether to ignore friction/air resistance when relevant.
- Cover: kinematics, dynamics, energy/work, momentum, waves, electricity, magnetism, optics, modern physics.
- For vector questions: specify components or angles given.
- Distractors: sign errors on direction, forgetting to square in kinetic energy, confusing mass and weight.
- Free response: require a free body diagram description, equation setup, substitution, and final answer with units.`,

      // ── HISTORY & SOCIAL STUDIES ──────────────────────────────────────────
      'us history': `
- Ground every question in a specific event, period, person, document, or turning point — no vague generalities.
- Periods to draw from: Colonial, Revolution, Early Republic, Civil War, Reconstruction, Gilded Age, Progressive Era, WWI, Great Depression, WWII, Cold War, Civil Rights, Modern.
- At medium+: include cause-and-effect, significance, or comparison questions — not just "when did X happen."
- Primary source style: present a short quote or document excerpt and ask the student to identify author, context, or significance.
- Distractors: plausible-sounding but factually wrong dates, figures, or outcomes.
- Free response: require thesis + evidence + analysis, mirroring AP US History SAQ/LEQ style.`,

      'world history': `
- Span multiple civilizations, time periods, and regions — avoid Eurocentrism unless the topic requires it.
- Ground every question in a specific civilization, event, trade route, empire, ideology, or turning point.
- Include cross-cultural comparisons and global connections at medium+.
- Primary source style: present a short excerpt and ask for context, author's purpose, or historical significance.
- Distractors: confusing similar empires, wrong centuries, mixing up cause/effect of major events.
- Free response: compare two civilizations or analyze a historical change over time with evidence.`,

      'ap us history': `
- Mirror APUSH exam style precisely: stimulus-based MC, SAQ, LEQ, DBQ structure for FR.
- MC questions must be stimulus-based (quote, map, image description, or data).
- SAQ style FR: three-part questions (a) describe, (b) explain, (c) evaluate/compare.
- Cover APUSH periods 1-9 with appropriate weighting (periods 3-8 are most heavily tested).
- Distractors: must reflect actual common APUSH student misconceptions.
- Use APUSH vocabulary: continuity and change over time, periodization, causation, contextualization.`,

      // ── ENGLISH & LITERATURE ──────────────────────────────────────────────
      literature: `
- Questions must reference specific literary elements: theme, motif, character development, narrative structure, point of view, symbolism, tone, diction, imagery.
- At medium+: ask the student to interpret or analyze — not just identify.
- For MC: provide a short passage excerpt (2-4 sentences) and ask an analytical question about it.
- Avoid plot summary questions at hard/expert — focus on meaning and craft.
- Distractors: plausible misreadings of tone, theme confusion, surface vs deep interpretation errors.
- Free response: require a claim, textual evidence, and analysis (CEA format).`,

      grammar: `
- Present actual sentences — never ask about rules in the abstract.
- Cover: subject-verb agreement, pronoun antecedent, comma usage, semicolons, apostrophes, parallel structure, modifier placement, active/passive voice.
- For MC: underline or bracket the part of the sentence being tested.
- Distractors: grammatically plausible but technically incorrect alternatives.
- At hard/expert: combine multiple grammar issues in one sentence and ask which revision is best.`,

      // ── SAT / ACT / STANDARDIZED ─────────────────────────────────────────
      'sat math': `
- Mirror College Board SAT Math format exactly.
- Two modules: no-calculator concepts (algebra, advanced math) and calculator-permitted (problem solving, data analysis).
- Question types: multiple choice (4 options) and student-produced response (grid-in).
- Always include a realistic context for word problems (science, social studies, careers).
- Distractors: must be the result of specific wrong approaches a student would actually make.
- Difficulty progression: easy questions test one skill; hard questions require multiple steps and concept connections.
- Specify if the question is Heart of Algebra, Problem Solving & Data Analysis, Passport to Advanced Math, or Additional Topics.`,

      'sat reading': `
- Mirror College Board SAT Reading format: passage-based questions only.
- Provide a short passage excerpt (3-6 sentences) for each question.
- Question types: main idea, inference, vocabulary in context, evidence support, author's purpose, data interpretation.
- Distractors: too broad, too narrow, opposite of correct, or out of scope.
- Paired evidence questions: ask for the best evidence to support the previous answer.`,

      'act math': `
- Mirror ACT Math format: 60 questions in 60 minutes style, no passage context needed.
- Cover: pre-algebra, elementary algebra, intermediate algebra, coordinate geometry, plane geometry, trigonometry.
- Questions should be solvable in ~1 minute at medium, ~1.5-2 minutes at hard/expert.
- Distractors: wrong formula, arithmetic error, misread question.
- Always provide 5 answer choices (A-E) for ACT Math.`,

      // ── ECONOMICS ─────────────────────────────────────────────────────────
      economics: `
- Frame questions around a real-world economic scenario, graph description, or policy decision.
- Cover: supply/demand, elasticity, market structures, GDP, inflation, monetary/fiscal policy, trade, opportunity cost.
- Graph questions: describe a supply/demand or production possibilities curve shift and ask what happens to price/quantity.
- Distractors: confusing shifts of vs movements along curves, wrong direction of policy effects, mixing micro/macro.
- Free response: require the student to draw (describe) a graph, explain the shift, and predict the outcome.`,

      // ── GEOGRAPHY ─────────────────────────────────────────────────────────
      geography: `
- Questions must reference specific regions, countries, physical features, or geographic concepts.
- Cover: physical geography, human geography, population, urbanization, political geography, economic geography, environmental issues.
- At medium+: require analysis of why a geographic pattern exists, not just identification.
- Distractors: plausible-sounding but factually incorrect locations, statistics, or cause-effect relationships.`,
    }

    // Normalize subject name to match keys
    const subjectKey = subject?.toLowerCase().trim()
    const mathSubjects = ['math', 'mathematics', 'calculus', 'algebra', 'pre-calculus', 'statistics', 'geometry', 'trigonometry']
    const isMathSubject = mathSubjects.some(s => subjectKey?.includes(s))

    // Get subject-specific instructions — fall back to math or generic
    const specificInstructions = subjectInstructions[subjectKey]
      || (isMathSubject ? subjectInstructions['mathematics'] : '')

    const activeDifficulty = difficulty || 'medium'

    const systemPrompt = `You are AceForge, an expert educational content creator with deep knowledge of standardized exams, curriculum standards, and pedagogical best practices.

Your job is to generate high-quality, accurate study questions that genuinely challenge students at the right level.

DIFFICULTY: ${activeDifficulty.toUpperCase()}
${difficultyGuide[activeDifficulty]}

SUBJECT-SPECIFIC RULES FOR ${subject?.toUpperCase()}:
${specificInstructions || `
- Questions must be specific and grounded — no vague or trivially easy questions.
- Every question must have exactly one defensibly correct answer.
- Distractors must reflect real student misconceptions, not random wrong answers.
- Vary the cognitive level: recall, comprehension, application, analysis.
- Free response answers must be substantive and model excellent student work.`}

FORMATTING RULES (STRICTLY ENFORCED):
- Do NOT use LaTeX notation. Write math in plain text: ^ for exponents (x^2), / for fractions (1/2), * for multiplication.
- Never use \\frac, \\times, \\( \\), \\[ \\], or any LaTeX commands.
- All options must start with "A. ", "B. ", "C. ", "D. " exactly.
- correctAnswer must be exactly "A", "B", "C", or "D".
- Always respond in valid JSON only — no markdown, no preamble, no backticks.

QUALITY CHECKS before responding:
- Every MC question has exactly one correct answer — verify this.
- No two questions test the exact same concept or skill.
- Each explanation teaches, not just states the answer.
- Distractors are plausible but unambiguously wrong.`

    const notesContext = uploadedText
      ? `\n\nIMPORTANT: Base ALL questions/content ONLY on the following student notes. Do not add information from outside these notes:\n\n---\n${uploadedText}\n---\n`
      : ''

    const hasMC = questionTypes?.includes('mc')
    const hasFR = questionTypes?.includes('fr')
    const types = hasMC && hasFR
      ? 'a mix of multiple choice and free response'
      : hasFR
      ? 'ONLY free response — do not include any multiple choice questions'
      : 'ONLY multiple choice — do not include any free response questions'

    let userPrompt = ''
    if (outputType === 'questions') {
      userPrompt = `Generate ${questionCount} ${activeDifficulty.toUpperCase()} difficulty study questions about "${topic}" in ${subject} for a ${grade} student.${focus ? ` Focus specifically on: ${focus}.` : ''}${notesContext}

Include ${types} questions. This is strictly enforced — if the type says ONLY, do not include any other type.

For each MC question provide:
- id (number)
- type: "mc"
- question (string) — must be a complete, specific question
- options (array of 4 strings like ["A. ...", "B. ...", "C. ...", "D. ..."])
- correctAnswer (string: "A", "B", "C", or "D")
- explanation (3-5 sentences: state the correct answer, explain WHY it's correct step by step, then briefly explain why the main distractor is wrong)
- topic (string: the specific subtopic this question covers, e.g. "Chain Rule", "Mitosis", "Supply and Demand")

For each FR question provide:
- id (number)
- type: "fr"
- question (string) — must be a complete, specific, multi-part question where appropriate
- modelAnswer (4-6 sentences: a model response showing full reasoning, not just the final answer)
- topic (string: the specific subtopic this question covers)

Ensure questions span different aspects of "${topic}" — do not repeat the same concept.

Return JSON: { "questions": [...] }`
    } else {
      userPrompt = `Create a complete ${activeDifficulty.toUpperCase()} difficulty study worksheet about "${topic}" in ${subject} for a ${grade} student.${focus ? ` Focus on: ${focus}.` : ''}${notesContext}

The worksheet must be substantive and educational — not generic. Every section should contain specific, accurate content about "${topic}".

Return JSON with this exact structure:
{
  "worksheet": {
    "introduction": {
      "text": "2-3 sentence engaging intro that explains what this topic is and why it matters",
      "vocabulary": [{"term": "...", "definition": "clear, specific definition relevant to ${topic}"}]
    },
    "steps": [
      {
        "title": "Specific step or concept title",
        "explanation": "Clear, detailed explanation with specific facts, formulas, or processes — not generic filler",
        "visualDescription": "Describe a specific diagram, table, graph, or visual that illustrates this concept",
        "keyTakeaway": "One precise sentence capturing the core idea"
      }
    ],
    "summary": {
      "bullets": ["Specific fact or rule about ${topic}", "Another key point"],
      "quickCheck": ["Specific true/false about ${topic}", "Fill in the blank about ${topic}"]
    },
    "practiceQuestions": [
      {
        "id": 1,
        "type": "mc",
        "question": "...",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
        "correctAnswer": "A",
        "explanation": "State the correct answer, explain why step by step, address the main wrong answer",
        "topic": "specific subtopic"
      }
    ]
  }
}`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    let clean = raw.replace(/```json|```/g, '').trim()

    clean = clean
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
      .replace(/\n/g, ' ')
      .trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (e) {
      clean = clean.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
      try {
        parsed = JSON.parse(clean)
      } catch (e2) {
        console.error('JSON parse failed:', clean.substring(0, 500))
        throw new Error('Failed to parse AI response. Please try again.')
      }
    }

    if (isRetry) {
      return NextResponse.json({ sessionId: 'retry', outputType, content: parsed })
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        subject,
        grade,
        topic,
        focus: focus || null,
        output_type: outputType,
        content: parsed,
        difficulty: activeDifficulty,
      })
      .select('id')
      .single()

    if (sessionError) throw sessionError

    const today = new Date().toISOString().split('T')[0]
    const field = outputType === 'questions' ? 'questions' : 'worksheets'

    const { data: existingUsage } = await supabase
      .from('daily_usage')
      .select('id, questions, worksheets')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (existingUsage) {
      await supabase
        .from('daily_usage')
        .update({ [field]: (existingUsage[field as keyof typeof existingUsage] as number) + 1 })
        .eq('id', existingUsage.id)
    } else {
      await supabase
        .from('daily_usage')
        .insert({ user_id: user.id, date: today, [field]: 1 })
    }

    return NextResponse.json({ sessionId: session.id, outputType })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}
