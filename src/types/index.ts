export type Plan = 'free' | 'premium'
export type Grade = 'K-5' | '6-8' | '9-10' | '11-12' | 'college'
export type OutputType = 'questions' | 'worksheet'
export type QuestionType = 'mc' | 'fr'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export interface Profile {
  id: string
  display_name: string | null
  email: string | null
  avatar_url: string | null
  is_premium: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  premium_since: string | null
  created_at: string
}

export interface MCQuestion {
  id: number
  type: 'mc'
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export interface FRQuestion {
  id: number
  type: 'fr'
  question: string
  modelAnswer: string
}

export type Question = MCQuestion | FRQuestion

export interface WorksheetStep {
  title: string
  explanation: string
  visualDescription: string
  keyTakeaway: string
}

export interface Worksheet {
  introduction: {
    text: string
    vocabulary: { term: string; definition: string }[]
  }
  steps: WorksheetStep[]
  summary: {
    bullets: string[]
    quickCheck: string[]
  }
  practiceQuestions: Question[]
}

export interface Session {
  id: string
  user_id: string
  subject: string
  grade: Grade
  topic: string
  focus: string | null
  output_type: OutputType
  content: { questions: Question[] } | { worksheet: Worksheet }
  pdf_downloaded: boolean
  pdf_downloaded_at: string | null
  created_at: string
}

export interface DailyUsage {
  questions: number
  worksheets: number
}

export interface GenerateFormData {
  subject: string
  grade: Grade
  topic: string
  focus?: string
  outputType: OutputType
  questionCount?: number
  questionTypes?: QuestionType[]
}