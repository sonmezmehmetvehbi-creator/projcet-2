import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function MeetGuidePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1e, #1a1a2e)', paddingTop: '5rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '44rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <Link href="/tutor/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> Back to Dashboard
        </Link>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>
          How to Create a Google Meet 🎥
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontSize: '1rem' }}>
          Step-by-step guide to setting up your tutoring sessions on Google Meet.
        </p>

        {/* Quick link */}
        <div style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.3)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>🚀 Quick Start</p>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Go directly to Google Meet and create a new meeting</p>
          </div>
          <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem', whiteSpace: 'nowrap' }}>
            Create Meet Now →
          </a>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            {
              step: 1,
              title: 'Go to Google Meet',
              desc: 'Open your browser and go to meet.google.com. Make sure you are signed in with your Google account.',
              tip: 'Use the same Google account you use for everything — no new account needed.',
              link: { label: 'Open Google Meet →', url: 'https://meet.google.com' }
            },
            {
              step: 2,
              title: 'Create a New Meeting',
              desc: 'Click "New Meeting" and then select "Schedule in Google Calendar" for a scheduled session, or "Start an instant meeting" if the session is about to begin.',
              tip: 'For scheduled sessions always use "Schedule in Google Calendar" so both you and the student get a calendar invite.',
            },
            {
              step: 3,
              title: 'Set the Date & Time',
              desc: 'In Google Calendar, set the event title to something like "AceForge Tutoring — [Subject]", set the correct date and time matching what the student booked.',
              tip: 'Add the student\'s email as a guest in the calendar event so they get an automatic invite.',
            },
            {
              step: 4,
              title: 'Copy the Meet Link',
              desc: 'After creating the calendar event, you\'ll see a Google Meet link automatically generated (looks like meet.google.com/xxx-xxxx-xxx). Copy this link.',
              tip: 'The link is permanent — it won\'t change even if you edit the calendar event.',
            },
            {
              step: 5,
              title: 'Paste the Link in AceForge',
              desc: 'Go back to your AceForge tutor dashboard, find the pending session, paste the Meet link in the field provided, and click "Accept & Send Links".',
              tip: 'The student will receive the link by email automatically once you confirm.',
            },
            {
              step: 6,
              title: 'For Intro Calls (15-min)',
              desc: 'If the student requested a free 15-minute intro call, create a SEPARATE Google Meet link for it. Schedule it BEFORE the main session — ideally 1-2 days before.',
              tip: 'Intro calls are a great way to introduce yourself, understand the student\'s needs, and make them feel comfortable.',
            },
          ].map(item => (
            <div key={item.step} style={{ padding: '1.5rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                  {item.step}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>{item.title}</p>
                  <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '0.625rem' }}>{item.desc}</p>
                  <div style={{ padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p style={{ fontSize: '0.8125rem', color: 'rgb(165,180,252)' }}>💡 {item.tip}</p>
                  </div>
                  {item.link && (
                    <a href={item.link.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: '0.75rem', color: 'rgb(99,102,241)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'underline' }}>
                      {item.link.label}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Common issues */}
        <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '1rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ fontWeight: 700, color: 'rgb(248,113,113)', marginBottom: '1rem' }}>⚠️ Common Issues & Fixes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { issue: 'Student can\'t join the meet', fix: 'Make sure you shared the correct link. The link should start with meet.google.com/. Check that the student\'s email was added as a guest.' },
              { issue: 'Meet link expired', fix: 'Links from Google Calendar events don\'t expire. If you used an "instant meeting" link, those can expire. Always use scheduled calendar events.' },
              { issue: 'Video/audio not working', fix: 'Ask the student to check their browser permissions for camera and microphone. Chrome works best with Google Meet.' },
              { issue: 'Student didn\'t receive the calendar invite', fix: 'Make sure you added their email correctly as a guest in the calendar event. You can also manually share the Meet link via AceForge chat.' },
            ].map(item => (
              <div key={item.issue} style={{ padding: '0.875rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ fontWeight: 600, color: 'rgb(248,113,113)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>❌ {item.issue}</p>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>✅ {item.fix}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Still having trouble? Contact us at contactinfo21342@gmail.com</p>
        </div>

      </div>
    </div>
  )
}
