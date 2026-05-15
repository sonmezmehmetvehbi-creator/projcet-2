import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import QuestionsClient from './QuestionsClient'
import AdSlot from '@/components/ui/AdSlot'

export default async function QuestionsPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: session } = await supabase.from('sessions').select('*').eq('id', params.sessionId).eq('user_id', user.id).single()

  if (!session) redirect('/dashboard')

  const isPremium = profile?.is_premium ?? false

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <Navbar profile={profile} />
      <div style={{ display:'flex', gap:'1.5rem', maxWidth:'80rem', margin:'0 auto', padding:'5rem 1.5rem 2rem' }}>

        {/* Left sidebar ad */}
        <div style={{ width:'160px', flexShrink:0, paddingTop:'1rem' }} className="ad-sidebar">
          <AdSlot
            isPremium={isPremium}
            slot="1234567890"
            format="vertical"
            style={{ position:'sticky', top:'5rem' }}
          />
        </div>

        {/* Main content */}
        <div style={{ flex:1, minWidth:0 }}>
          <QuestionsClient session={session} isPremium={isPremium} />
        </div>

        {/* Right sidebar ad */}
        <div style={{ width:'160px', flexShrink:0, paddingTop:'1rem' }} className="ad-sidebar">
          <AdSlot
            isPremium={isPremium}
            slot="0987654321"
            format="vertical"
            style={{ position:'sticky', top:'5rem' }}
          />
        </div>

      </div>

      <style>{`
        .ad-sidebar { display: none; }
        @media (min-width: 1200px) { .ad-sidebar { display: block; } }
      `}</style>
    </div>
  )
}