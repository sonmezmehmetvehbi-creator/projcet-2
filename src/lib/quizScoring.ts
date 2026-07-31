// Shared scoring for Forge Quiz (self-paced + live). Kahoot-style speed points
// with a points multiplier, plus graduated partial credit for slider answers.

export type ScoreQuestion = {
  question_type: 'mc' | 'tf' | 'slider' | 'fr'
  correct_index?: number | null
  correct_answer?: string | null
  slider_min?: number | null
  slider_max?: number | null
  slider_correct?: number | null
  points_multiplier?: number | null
  time_limit?: number | null
  // When false, a correct answer earns the full base points regardless of speed
  // (no time-based reduction). Defaults to true (speed-weighted) when unset.
  speed_bonus_enabled?: boolean | null
}

const norm = (s: string) => s.trim().toLowerCase()

// Points for how fast the answer came in (1000 at full time, 0 at no time).
export function speedBase(answerTimeMs: number, timeLimitMs: number): number {
  if (timeLimitMs <= 0) return 0
  return 1000 * Math.max(0, Math.min(1, 1 - answerTimeMs / timeLimitMs))
}

// Graduated partial credit for slider questions. Only answers within 70%
// closeness continue a streak; closer answers earn more of the base points.
export function sliderPoints(guess: number, correct: number, min: number, max: number, basePts: number): { points: number; isCorrect: boolean } {
  const range = Math.max(1, max - min)
  const distance = Math.abs(guess - correct)
  const closeness = 1 - distance / range
  if (closeness >= 0.95) return { points: basePts, isCorrect: true }
  if (closeness >= 0.85) return { points: Math.round(basePts * 0.7), isCorrect: true }
  if (closeness >= 0.70) return { points: Math.round(basePts * 0.4), isCorrect: true }
  if (closeness >= 0.50) return { points: Math.round(basePts * 0.15), isCorrect: false }
  return { points: 0, isCorrect: false }
}

// Score a single answer. `answer` is the option index (mc/tf), a number
// (slider), or text (fr). Returns points BEFORE any streak bonus.
export function scoreAnswer(
  q: ScoreQuestion,
  answer: string | number,
  answerTimeMs: number,
  timeLimitSec: number,
): { isCorrect: boolean; points: number } {
  // Speed bonus ON (default): award points weighted by how fast the answer came
  // in. Speed bonus OFF: award the full base (1000) for any correct answer.
  const basePts = q.speed_bonus_enabled === false
    ? 1000
    : speedBase(answerTimeMs, Math.max(1, timeLimitSec) * 1000)
  const mult = [0, 1, 2].includes(q.points_multiplier as number) ? (q.points_multiplier as number) : 1

  if (q.question_type === 'mc' || q.question_type === 'tf') {
    const isCorrect = Number(answer) === q.correct_index
    return { isCorrect, points: isCorrect ? Math.round(basePts) * mult : 0 }
  }
  if (q.question_type === 'slider') {
    const sp = sliderPoints(Number(answer), q.slider_correct ?? 0, q.slider_min ?? 0, q.slider_max ?? 100, basePts)
    return { isCorrect: sp.isCorrect, points: Math.round(sp.points) * mult }
  }
  if (q.question_type === 'fr') {
    const s = String(answer)
    const isCorrect = norm(s) === norm(q.correct_answer ?? '') && s.trim().length > 0
    return { isCorrect, points: isCorrect ? Math.round(basePts) * mult : 0 }
  }
  return { isCorrect: false, points: 0 }
}

// The human-readable correct answer, for reveal screens.
export function correctAnswerText(q: ScoreQuestion & { options?: string[] | null }): string {
  if (q.question_type === 'mc') return q.options?.[q.correct_index ?? 0] ?? ''
  if (q.question_type === 'tf') return q.correct_index === 1 ? 'False' : 'True'
  if (q.question_type === 'slider') return String(q.slider_correct ?? '')
  return q.correct_answer ?? ''
}
