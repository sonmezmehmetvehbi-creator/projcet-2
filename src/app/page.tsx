import { createServerSupabaseClient } from '@/lib/supabase-server'
import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/landing/hero'
import StatsBar from '@/components/landing/stats-bar'
import Features from '@/components/landing/features'
import HowItWorks from '@/components/landing/how-it-works'
import SubjectGrid from '@/components/landing/subject-grid'
import SplitComparison from '@/components/landing/split-comparison'
import Pricing from '@/components/landing/pricing'
import Testimonials from '@/components/landing/testimonials'
import TutorShowcase from '@/components/landing/tutor-showcase'
import CtaSection from '@/components/landing/cta-section'
import SiteFooter from '@/components/landing/site-footer'
import type { Profile } from '@/types'

export default async function HomePage() {
  let profile: Profile | null = null
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      profile = data
    }
  } catch {}

  return (
    <div style={{ background: 'rgb(248,250,245)', minHeight: '100vh' }}>
      <Navbar profile={profile} />
      <Hero isLoggedIn={!!profile} />
      <StatsBar />
      <Features />
      <HowItWorks />
      <SubjectGrid />
      <SplitComparison />
      <Pricing />
      <Testimonials />
      <TutorShowcase />
      <CtaSection isLoggedIn={!!profile} />
      <SiteFooter />
    </div>
  )
}
