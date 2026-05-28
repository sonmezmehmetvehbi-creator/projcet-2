import AdminNavbar from '../dashboard/AdminNavbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPolicyPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
      <div style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem 1.5rem' }}>

          <div style={{ marginBottom: '2.5rem' }}>
            <Link href="/admin/dashboard" style={{ fontSize: '0.875rem', color: 'rgb(34,85,14)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
              ← Back to Dashboard
            </Link>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.75rem' }}>
              Admin Policy & Guidelines
            </h1>
            <p style={{ color: 'rgb(107,107,88)', fontSize: '0.9375rem' }}>
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.06)', border: '1px solid rgba(163,45,45,0.2)' }}>
              <p style={{ fontSize: '0.9375rem', color: 'rgb(163,45,45)', fontWeight: 600 }}>
                ⚠️ By accepting an admin role at AceForge, you have agreed to these policies in full. Violations may result in immediate termination and legal action.
              </p>
            </div>
          </div>

          {[
            {
              title: '1. User Privacy Protection',
              icon: '🔒',
              color: 'rgb(37,99,235)',
              bg: 'rgba(37,99,235,0.04)',
              border: 'rgba(37,99,235,0.15)',
              content: [
                'As an AceForge administrator, you have access to sensitive user data including personal information, session histories, payment records, and support conversations. This access is granted solely for the purpose of performing your administrative duties.',
                'You are strictly prohibited from: accessing user data out of personal curiosity, sharing any user information with third parties, using user data for personal gain, discussing specific user cases outside of official AceForge channels, or retaining copies of user data after your employment ends.',
                'All user data accessed during your role must remain confidential indefinitely, even after your relationship with AceForge ends. This obligation survives termination of your admin role.',
                'Violations of user privacy constitute a breach of federal and state privacy laws including but not limited to the Computer Fraud and Abuse Act (CFAA) and applicable state privacy statutes. AceForge will pursue legal remedies including civil damages and criminal referral.',
              ]
            },
            {
              title: '2. Fair & Unbiased Decision Making',
              icon: '⚖️',
              color: 'rgb(34,85,14)',
              bg: 'rgba(34,85,14,0.04)',
              border: 'rgba(34,85,14,0.15)',
              content: [
                'All administrative decisions — including tutor approvals, dispute resolutions, and support responses — must be made fairly, consistently, and without bias or personal preference.',
                'You must not favor or disadvantage any user, tutor, or applicant based on race, ethnicity, gender, religion, national origin, sexual orientation, age, disability, or any other protected characteristic.',
                'Tutor application decisions must be based solely on the applicant\'s qualifications, submitted materials, and AceForge\'s published criteria. Personal relationships with applicants must be disclosed immediately.',
                'Dispute resolutions must be based on evidence — primarily session recordings and documented communications. You must review all available evidence before making a determination. Decisions must be documented with reasoning.',
              ]
            },
            {
              title: '3. Support Chat Standards',
              icon: '🎧',
              color: 'rgb(180,120,10)',
              bg: 'rgba(232,160,32,0.04)',
              border: 'rgba(232,160,32,0.2)',
              content: [
                'When responding to support tickets, you represent AceForge. All communications must be professional, respectful, and solution-focused. Personal opinions, casual language, and sarcasm are strictly prohibited.',
                'Response time expectation: all open tickets must receive a first response within 4 hours during business hours. Tickets must be resolved or escalated within 48 hours.',
                'You must never promise refunds, policy exceptions, or account changes without authorization from AceForge leadership. When in doubt, escalate rather than improvise.',
                'Support conversations are logged and may be reviewed by AceForge leadership at any time. Never say anything in a support chat that you would not be comfortable with leadership reading.',
                'If a user is abusive, threatening, or inappropriate, close the ticket and escalate to AceForge leadership immediately. Do not engage with abusive users.',
              ]
            },
            {
              title: '4. Data Handling & Security',
              icon: '🛡️',
              color: 'rgb(107,107,88)',
              bg: 'rgba(107,107,88,0.04)',
              border: 'rgba(107,107,88,0.15)',
              content: [
                'Admin credentials must never be shared with anyone. If you suspect your account has been compromised, notify AceForge immediately and change your password.',
                'You must not download, export, or copy user data to personal devices or external storage. All administrative work must be performed within the AceForge platform.',
                'Session recordings accessed during dispute resolution must be treated as strictly confidential and must not be shared, distributed, or retained beyond the resolution of the dispute.',
                'Any security vulnerabilities or data breaches discovered must be reported to AceForge immediately. Failure to report known security issues is a violation of this policy.',
              ]
            },
            {
              title: '5. Conflict of Interest',
              icon: '🚫',
              color: 'rgb(163,45,45)',
              bg: 'rgba(163,45,45,0.04)',
              border: 'rgba(163,45,45,0.15)',
              content: [
                'You must immediately disclose any personal or financial relationship with a tutor applicant, user, or other party whose case you are reviewing. Upon disclosure, you must recuse yourself from that decision.',
                'You may not use your admin access to benefit yourself, friends, family, or business associates. This includes but is not limited to: approving unqualified tutors you know personally, resolving disputes in favor of people you know, or granting account privileges not earned.',
                'Outside employment or business activities that compete with or conflict with AceForge\'s interests must be disclosed. You may not use knowledge gained through your admin role to compete with AceForge.',
              ]
            },
            {
              title: '6. Consequences of Violations',
              icon: '⚡',
              color: 'rgb(163,45,45)',
              bg: 'rgba(163,45,45,0.04)',
              border: 'rgba(163,45,45,0.15)',
              content: [
                'Violations of this policy will result in: immediate suspension of admin access pending investigation, potential permanent termination of your admin role, and depending on severity, civil legal action for damages caused by the violation.',
                'Privacy violations involving user data may result in criminal referral to relevant law enforcement agencies under applicable computer fraud, privacy, and data protection laws.',
                'AceForge reserves the right to seek injunctive relief and monetary damages for policy violations. You acknowledge that damages from privacy violations and abuse of admin access may be difficult to quantify and agree that AceForge may seek liquidated damages.',
                'By accessing the AceForge admin panel, you acknowledge that you have read, understood, and agree to be bound by these policies.',
              ]
            },
          ].map((section, i) => (
            <div key={i} style={{ marginBottom: '2rem', padding: '1.75rem', borderRadius: '1rem', background: section.bg, border: `1px solid ${section.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
                <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'rgb(26,26,20)' }}>{section.title}</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {section.content.map((para, j) => (
                  <p key={j} style={{ fontSize: '0.9375rem', color: 'rgb(26,26,20)', lineHeight: 1.8 }}>{para}</p>
                ))}
              </div>
            </div>
          ))}

          <div style={{ padding: '1.5rem', borderRadius: '1rem', background: 'rgba(26,26,20,0.04)', border: '1px solid rgba(26,26,20,0.12)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9375rem', color: 'rgb(107,107,88)', marginBottom: '0.5rem' }}>
              Questions about these policies?
            </p>
            <a href="mailto:contactinfo21342@gmail.com" style={{ color: 'rgb(34,85,14)', fontWeight: 700, textDecoration: 'none' }}>
              contactinfo21342@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
