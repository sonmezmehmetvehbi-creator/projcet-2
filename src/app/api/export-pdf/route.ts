import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId } = await request.json()

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Mark as downloaded
    await supabase
      .from('sessions')
      .update({ pdf_downloaded: true, pdf_downloaded_at: new Date().toISOString() })
      .eq('id', sessionId)

    // Build HTML content for PDF
    const content = buildPDFContent(session)

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html',
        'X-Session-Topic': encodeURIComponent(session.topic),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function buildPDFContent(session: any): string {
  const isQuestions = session.output_type === 'questions'
  const questions = session.content?.questions ?? []
  const worksheet = session.content?.worksheet

  if (isQuestions) {
    const questionsHTML = questions.map((q: any, i: number) => `
      <div class="question">
        <p class="q-number">Question ${i + 1} — ${q.type === 'mc' ? 'Multiple Choice' : 'Free Response'}</p>
        <p class="q-text">${q.question}</p>
        ${q.type === 'mc' ? `
          <div class="options">
            ${q.options.map((opt: string) => `<div class="option">${opt}</div>`).join('')}
          </div>
        ` : `
          <div class="answer-lines">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        `}
      </div>
    `).join('')

    const answerKeyHTML = questions.map((q: any, i: number) => `
      <div class="answer-item">
        <span class="answer-num">Q${i + 1}:</span>
        ${q.type === 'mc'
          ? `<span><strong>${q.correctAnswer}</strong> — ${q.explanation}</span>`
          : `<span>${q.modelAnswer}</span>`
        }
      </div>
    `).join('')

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; color: #1a1a14; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 3px solid #22550e; padding-bottom: 20px; margin-bottom: 32px; }
  .app-name { font-size: 14px; color: #22550e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .title { font-size: 28px; font-weight: bold; color: #1a1a14; margin-bottom: 4px; }
  .meta { font-size: 14px; color: #6b6b58; }
  .question { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
  .q-number { font-size: 11px; font-weight: bold; color: #22550e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .q-text { font-size: 16px; line-height: 1.6; margin-bottom: 12px; font-weight: 600; }
  .options { display: flex; flex-direction: column; gap: 8px; }
  .option { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .answer-lines { margin-top: 8px; }
  .line { border-bottom: 1px solid #d1d5db; margin-bottom: 16px; height: 24px; }
  .answer-key { margin-top: 48px; padding-top: 32px; border-top: 3px solid #22550e; }
  .answer-key h2 { font-size: 22px; margin-bottom: 20px; color: #22550e; }
  .answer-item { display: flex; gap: 12px; margin-bottom: 16px; font-size: 14px; line-height: 1.6; padding: 12px; background: #f0f7ea; border-radius: 6px; }
  .answer-num { font-weight: bold; color: #22550e; min-width: 32px; flex-shrink: 0; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <div class="app-name">StudySpark</div>
    <div class="title">${session.topic}</div>
    <div class="meta">${session.subject} · ${session.grade} · ${questions.length} Questions · ${new Date(session.created_at).toLocaleDateString()}</div>
  </div>
  ${questionsHTML}
  <div class="answer-key">
    <h2>Answer Key</h2>
    ${answerKeyHTML}
  </div>
</body>
</html>`
  }

  // Worksheet
  const steps = worksheet?.steps ?? []
  const vocab = worksheet?.introduction?.vocabulary ?? []
  const bullets = worksheet?.summary?.bullets ?? []
  const practiceQs = worksheet?.practiceQuestions ?? []

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; color: #1a1a14; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 3px solid #22550e; padding-bottom: 20px; margin-bottom: 32px; }
  .app-name { font-size: 14px; color: #22550e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .title { font-size: 28px; font-weight: bold; margin-bottom: 4px; }
  .meta { font-size: 14px; color: #6b6b58; }
  .section { margin-bottom: 36px; }
  .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .section-num { width: 32px; height: 32px; border-radius: 50%; background: #22550e; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0; }
  .section-title { font-size: 20px; font-weight: bold; color: #22550e; }
  p { font-size: 15px; line-height: 1.8; margin-bottom: 12px; }
  .vocab-item { display: flex; gap: 12px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; font-size: 14px; }
  .vocab-term { font-weight: bold; color: #22550e; min-width: 120px; }
  .step { margin-bottom: 24px; padding: 16px; border-left: 3px solid #22550e; background: #f9fafb; border-radius: 0 8px 8px 0; }
  .step-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
  .visual-box { margin: 12px 0; padding: 12px; border: 1px dashed #22550e; border-radius: 6px; font-style: italic; font-size: 13px; color: #6b6b58; }
  .takeaway { padding: 8px 12px; background: #fef3c7; border-radius: 6px; font-size: 13px; margin-top: 8px; }
  .bullet { display: flex; gap: 8px; font-size: 14px; line-height: 1.7; margin-bottom: 8px; }
  .bullet-check { color: #22550e; font-weight: bold; }
  .practice-q { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
  .q-num { font-size: 11px; font-weight: bold; color: #22550e; text-transform: uppercase; margin-bottom: 6px; }
  .options { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
  .option { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; }
  .answer-lines .line { border-bottom: 1px solid #d1d5db; margin-bottom: 14px; height: 20px; }
  .answer-key { margin-top: 48px; padding-top: 24px; border-top: 3px solid #22550e; }
  .answer-key h2 { font-size: 20px; color: #22550e; margin-bottom: 16px; }
  .answer-item { padding: 10px 12px; background: #f0f7ea; border-radius: 6px; margin-bottom: 10px; font-size: 13px; line-height: 1.6; }
</style>
</head>
<body>
  <div class="header">
    <div class="app-name">StudySpark Worksheet</div>
    <div class="title">${session.topic}</div>
    <div class="meta">${session.subject} · ${session.grade} · ${new Date(session.created_at).toLocaleDateString()}</div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">1</div>
      <div class="section-title">Introduction</div>
    </div>
    <p>${worksheet?.introduction?.text ?? ''}</p>
    ${vocab.map((v: any) => `<div class="vocab-item"><span class="vocab-term">${v.term}</span><span>${v.definition}</span></div>`).join('')}
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">2</div>
      <div class="section-title">Step-by-Step Explanation</div>
    </div>
    ${steps.map((step: any, i: number) => `
      <div class="step">
        <div class="step-title">Step ${i + 1}: ${step.title}</div>
        <p>${step.explanation}</p>
        <div class="visual-box">📊 Visual: ${step.visualDescription}</div>
        <div class="takeaway">💡 Key takeaway: ${step.keyTakeaway}</div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">3</div>
      <div class="section-title">Summary</div>
    </div>
    ${bullets.map((b: string) => `<div class="bullet"><span class="bullet-check">✓</span><span>${b}</span></div>`).join('')}
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">4</div>
      <div class="section-title">Practice Questions</div>
    </div>
    ${practiceQs.map((q: any, i: number) => `
      <div class="practice-q">
        <div class="q-num">Question ${i + 1} · ${q.type === 'mc' ? 'Multiple Choice' : 'Free Response'}</div>
        <p style="font-weight:600">${q.question}</p>
        ${q.type === 'mc' ? `
          <div class="options">${q.options.map((o: string) => `<div class="option">${o}</div>`).join('')}</div>
        ` : `
          <div class="answer-lines"><div class="line"></div><div class="line"></div><div class="line"></div></div>
        `}
      </div>
    `).join('')}
  </div>

  <div class="answer-key">
    <h2>Answer Key</h2>
    ${practiceQs.map((q: any, i: number) => `
      <div class="answer-item">
        <strong>Q${i + 1}:</strong> ${q.type === 'mc' ? `${q.correctAnswer} — ${q.explanation}` : q.modelAnswer}
      </div>
    `).join('')}
  </div>
</body>
</html>`
}