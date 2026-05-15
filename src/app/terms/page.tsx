import Navbar from '@/components/layout/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function TermsPage() {
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
      <div style={{ paddingTop:'5rem' }}>
        <div className="container-base" style={{ padding:'3rem 1.5rem', maxWidth:'48rem' }}>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
            Terms of Service
          </h1>
          <p style={{ color:'rgb(107,107,88)', marginBottom:'3rem' }}>Last updated: May 15, 2026</p>

          <div style={{ display:'flex', flexDirection:'column', gap:'2.5rem', color:'rgb(26,26,20)', lineHeight:1.8, fontSize:'0.9375rem' }}>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>1. Acceptance of Terms</h2>
              <p>By creating an account or using AceForge ("Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.</p>
              <p style={{ marginTop:'0.75rem' }}>If you are under 18, your parent or guardian must review and agree to these Terms. If you are under 13, parental consent is required as described in our Privacy Policy.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>2. Description of Service</h2>
              <p>AceForge is an AI-powered educational platform that generates study materials including questions and worksheets. The Service uses third-party AI (OpenAI) to generate content.</p>
              <p style={{ marginTop:'0.75rem' }}><strong>Important disclaimer:</strong> AI-generated content may contain errors or inaccuracies. AceForge is a study aid — not a substitute for your teacher, textbook, or academic institution. Always verify important information with authoritative sources. We are not responsible for academic outcomes.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>3. User Accounts</h2>
              <ul style={{ paddingLeft:'1.5rem', display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <li>You must provide accurate information when registering</li>
                <li>You are responsible for maintaining your password's security</li>
                <li>Notify us immediately of unauthorized account access</li>
                <li>One account per person — creating multiple accounts to bypass limits is prohibited</li>
                <li>Account sharing is not permitted</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>4. Acceptable Use</h2>
              <p>You agree NOT to:</p>
              <ul style={{ paddingLeft:'1.5rem', marginTop:'0.5rem', display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <li>Submit AI-generated content as your own work where prohibited by your school or institution (academic dishonesty)</li>
                <li>Upload content that is illegal, harmful, copyrighted without permission, or inappropriate</li>
                <li>Attempt to reverse engineer, scrape, or abuse the Service or its APIs</li>
                <li>Use the Service to generate harmful, discriminatory, or illegal content</li>
                <li>Use ad-blocking software to circumvent advertisements (free tier)</li>
                <li>Resell or sublicense access to the Service</li>
              </ul>
              <p style={{ marginTop:'0.75rem' }}>We reserve the right to suspend or terminate accounts that violate these terms without refund.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>5. Advertising (Free Tier)</h2>
              <p>Free-tier users will see advertisements served by Google AdSense. By using the free tier, you acknowledge and agree that:</p>
              <ul style={{ paddingLeft:'1.5rem', marginTop:'0.5rem', display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <li>Ads are displayed in various locations within the Service</li>
                <li>Google AdSense may use cookies to show personalized ads</li>
                <li>Ad revenue helps us maintain the free tier</li>
              </ul>
              <p style={{ marginTop:'0.75rem' }}>Premium subscribers are completely ad-free. You may opt out of personalized ads via Google's ad settings without affecting your use of the Service.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>6. Subscription and Payments</h2>
              <p><strong>Free tier:</strong> Available to all with daily generation limits and ads.</p>
              <p style={{ marginTop:'0.75rem' }}><strong>Premium ($5.99/month):</strong></p>
              <ul style={{ paddingLeft:'1.5rem', marginTop:'0.5rem', display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <li>Billed monthly, renews automatically until cancelled</li>
                <li>Cancel anytime via Settings → Manage Subscription. Access continues until end of billing period</li>
                <li>No refunds for partial months, except where required by law</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
                <li>Premium includes: unlimited generations, faster loading, and no ads</li>
              </ul>
              <p style={{ marginTop:'0.75rem' }}>Payments processed by Stripe. By subscribing you also agree to Stripe's Terms of Service.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>7. Intellectual Property</h2>
              <p><strong>Your content:</strong> You retain ownership of materials you upload. You grant us a limited license to process your content solely to provide the Service.</p>
              <p style={{ marginTop:'0.75rem' }}><strong>Generated content:</strong> Study materials generated by AceForge are for your personal educational use. You may not resell or commercially distribute generated content.</p>
              <p style={{ marginTop:'0.75rem' }}><strong>Our platform:</strong> The AceForge platform, design, code, and branding are our property and protected by intellectual property laws.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>8. Disclaimer of Warranties</h2>
              <p style={{ textTransform:'uppercase', fontSize:'0.875rem' }}>The service is provided "as is" without warranties of any kind. We do not warrant that AI-generated content is accurate or error-free, that the service will be uninterrupted, or that the service is suitable for any particular educational purpose.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>9. Limitation of Liability</h2>
              <p style={{ textTransform:'uppercase', fontSize:'0.875rem' }}>To the maximum extent permitted by law, AceForge shall not be liable for any indirect, incidental, special, or consequential damages, including academic outcomes, lost data, or lost profits. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>10. Termination</h2>
              <p>You may delete your account at any time via Settings. We may suspend or terminate your account for Terms violations. Upon termination, your right to use the Service ceases immediately.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>11. Governing Law</h2>
              <p>These Terms are governed by the laws of the United States. Any disputes shall be resolved in United States courts. If any provision is found unenforceable, the remaining provisions continue in full force.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>12. Changes to Terms</h2>
              <p>We may update these Terms at any time. We will notify you of material changes by email or in-app notice. Continued use after changes take effect constitutes acceptance.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>13. Contact</h2>
              <p>
                <strong>AceForge</strong><br />
                Email: <a href="mailto:contactinfo21342@gmail.com" style={{ color:'rgb(34,85,14)', fontWeight:600 }}>contactinfo21342@gmail.com</a>
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}