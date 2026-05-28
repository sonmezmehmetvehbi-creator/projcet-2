import Navbar from '@/components/layout/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function TutoringLegalPage() {
  let profile = null
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      profile = data
    }
  } catch {}

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <Navbar profile={profile} />
      <div style={{ paddingTop:'5rem', paddingBottom:'5rem' }}>
        <div style={{ maxWidth:'48rem', margin:'0 auto', padding:'3rem 1.5rem' }}>

          <div style={{ marginBottom:'2.5rem' }}>
            <Link href="/tutoring/dashboard" style={{ fontSize:'0.875rem', color:'rgb(34,85,14)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'0.375rem', marginBottom:'1.5rem' }}>
              ← Back to Tutoring
            </Link>
            <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
              AceForge Tutoring Policies
            </h1>
            <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>
              Last updated: {new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
            </p>
          </div>

          {[
            {
              title: '1. Platform-Exclusive Tutoring Policy',
              icon: '⚖️',
              color: 'rgb(163,45,45)',
              bg: 'rgba(163,45,45,0.04)',
              border: 'rgba(163,45,45,0.15)',
              content: [
                'All tutoring sessions arranged through AceForge must be conducted exclusively on the AceForge platform. Tutors and students are strictly prohibited from arranging, scheduling, or conducting sessions outside of AceForge for a period of 12 months from the date of their first connection on the platform.',
                'This includes but is not limited to: direct payment arrangements, sessions on other platforms (Zoom, Skype, Google Meet arranged independently), in-person meetings, or any other form of tutoring contact arranged to circumvent AceForge.',
                'Violation of this policy by tutors will result in: immediate permanent account termination, forfeiture of all pending payouts, and potential civil legal action for breach of contract. AceForge reserves the right to pursue damages including lost platform revenue.',
                'Students who knowingly participate in off-platform sessions with AceForge tutors will have their accounts terminated and will forfeit any refund rights.',
              ]
            },
            {
              title: '2. Session Recording Policy',
              icon: '📹',
              color: 'rgb(37,99,235)',
              bg: 'rgba(37,99,235,0.04)',
              border: 'rgba(37,99,235,0.15)',
              content: [
                'All tutoring sessions conducted through AceForge are recorded for quality assurance and dispute resolution purposes. By booking or accepting a tutoring session, both the student and tutor explicitly consent to being recorded.',
                'Session recordings are stored securely and are only accessed by AceForge staff in the following circumstances: (a) a dispute is filed within 48 hours of the session, (b) a complaint is made about tutor or student conduct, (c) required by law or legal proceedings.',
                'Recordings are automatically deleted 30 days after the session date unless a dispute or legal matter is pending, in which case they are retained until resolution.',
                'Attempting to disable, circumvent, or interfere with session recording is a violation of this policy and grounds for immediate account termination.',
              ]
            },
            {
              title: '3. Refund & Dispute Policy',
              icon: '🛡️',
              color: 'rgb(34,85,14)',
              bg: 'rgba(34,85,14,0.04)',
              border: 'rgba(34,85,14,0.15)',
              content: [
                'Students are entitled to a full refund in the following circumstances: (a) the tutor fails to appear for the session, (b) the tutor cancels within 24 hours of the scheduled session, (c) the tutor is more than 10 minutes late without prior notice, (d) technical issues on the tutor\'s side prevent the session from occurring.',
                'Students will receive a 50% refund if they cancel a session with less than 24 hours notice. No refund is issued for student no-shows.',
                'Disputes must be filed within 48 hours of the session end time. Disputes filed after this window will not be considered. To file a dispute, navigate to your session page and click "File Dispute."',
                'All disputes are reviewed by AceForge staff within 3-5 business days. The session recording will be reviewed as part of this process. AceForge\'s decision on disputes is final.',
                'Tutors found guilty in a dispute will have their payout for that session withheld permanently. Multiple disputes may result in account suspension or termination.',
                'Frivolous or fraudulent dispute filings by students will result in account termination and potential legal liability.',
              ]
            },
            {
              title: '4. Tutor Payment & Payout Policy',
              icon: '💰',
              color: 'rgb(180,120,10)',
              bg: 'rgba(232,160,32,0.04)',
              border: 'rgba(232,160,32,0.2)',
              content: [
                'Tutors are paid a base rate of $30 per hour for all sessions. Payouts are processed manually via the tutor\'s registered payment method (Venmo, PayPal, or Zelle) within 24 hours of session completion, provided no dispute is filed.',
                'If a student files a dispute within the 48-hour window, the tutor\'s payout for that session is held pending resolution. If the dispute is resolved in the student\'s favor, the payout is permanently withheld. If resolved in the tutor\'s favor, the payout is processed within 24 hours of resolution.',
                'Tutors are classified as independent contractors, not employees of AceForge. Tutors are solely responsible for reporting and paying applicable taxes on their earnings. AceForge will issue a 1099 form to tutors who earn $600 or more in a calendar year.',
                'AceForge reserves the right to adjust payout rates with 30 days written notice to active tutors.',
              ]
            },
            {
              title: '5. Tutor Code of Conduct',
              icon: '📋',
              color: 'rgb(107,107,88)',
              bg: 'rgba(107,107,88,0.04)',
              border: 'rgba(107,107,88,0.15)',
              content: [
                'Tutors must maintain professional conduct at all times during sessions. This includes: being punctual, prepared, respectful, and focused on the student\'s academic needs.',
                'Tutors are prohibited from: engaging in romantic or inappropriate relationships with students, sharing personal contact information (phone numbers, personal email, social media), discussing topics unrelated to the academic subject, recording sessions independently, or sharing session content without explicit consent.',
                'Tutors who work with minors (students under 18) must adhere to additional safeguarding requirements and maintain strictly professional boundaries at all times.',
                'AceForge reserves the right to terminate any tutor\'s account at any time for conduct violations, poor performance (average rating below 3.0 after 10+ reviews), or any behavior deemed harmful to students or the platform.',
              ]
            },
            {
              title: '6. Student Code of Conduct',
              icon: '🎓',
              color: 'rgb(34,85,14)',
              bg: 'rgba(34,85,14,0.04)',
              border: 'rgba(34,85,14,0.15)',
              content: [
                'Students must treat tutors with respect and maintain professional conduct during sessions. Harassment, discrimination, or inappropriate behavior will result in immediate account termination.',
                'Students may not record sessions independently, share session content publicly, or use session materials for commercial purposes.',
                'Students who repeatedly no-show for booked sessions may have their booking privileges restricted.',
                'Attempting to manipulate the dispute system, filing false disputes, or engaging in any fraudulent activity will result in immediate account termination and potential legal action.',
              ]
            },
            {
              title: '7. Privacy & Data Policy for Tutoring',
              icon: '🔒',
              color: 'rgb(37,99,235)',
              bg: 'rgba(37,99,235,0.04)',
              border: 'rgba(37,99,235,0.15)',
              content: [
                'AceForge collects and stores tutoring session data including session recordings, chat logs, booking information, and payment records. This data is used solely for platform operation, dispute resolution, and legal compliance.',
                'Tutor application data including uploaded documents (ID, CV, certifications) is stored securely and accessed only by AceForge administrators for verification purposes. This data is never shared with third parties except as required by law.',
                'Student and tutor personal information is never sold to third parties. Payment information is processed exclusively through Stripe and is never stored on AceForge servers.',
                'For full privacy information, see our <a href="/privacy" style="color:rgb(37,99,235)">Privacy Policy</a>.',
              ]
            },
            {
              title: '8. Governing Law & Disputes',
              icon: '🏛️',
              color: 'rgb(107,107,88)',
              bg: 'rgba(107,107,88,0.04)',
              border: 'rgba(107,107,88,0.15)',
              content: [
                'These policies are governed by the laws of the United States. Any legal disputes arising from tutoring services provided through AceForge shall be resolved through binding arbitration in accordance with the American Arbitration Association rules.',
                'By using AceForge\'s tutoring services, both students and tutors agree to these policies in their entirety. AceForge reserves the right to update these policies at any time with notice provided via email.',
                'For questions about these policies, contact us at contactinfo21342@gmail.com.',
              ]
            },
          ].map((section, i) => (
            <div key={i} style={{ marginBottom:'2rem', padding:'1.75rem', borderRadius:'1rem', background:section.bg, border:`1px solid ${section.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
                <span style={{ fontSize:'1.5rem' }}>{section.icon}</span>
                <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)' }}>
                  {section.title}
                </h2>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                {section.content.map((para, j) => (
                  <p key={j} style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.8 }}
                    dangerouslySetInnerHTML={{ __html: para }} />
                ))}
              </div>
            </div>
          ))}

          <div style={{ padding:'1.5rem', borderRadius:'1rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.12)', textAlign:'center' }}>
            <p style={{ fontSize:'0.9375rem', color:'rgb(107,107,88)', marginBottom:'0.75rem' }}>
              Questions about these policies?
            </p>
            <a href="mailto:contactinfo21342@gmail.com" style={{ color:'rgb(34,85,14)', fontWeight:700, textDecoration:'none', fontSize:'0.9375rem' }}>
              contactinfo21342@gmail.com
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
