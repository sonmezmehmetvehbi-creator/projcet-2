import Navbar from '@/components/layout/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p style={{ color:'rgb(107,107,88)', marginBottom:'3rem' }}>Last updated: May 15, 2026</p>

          <div style={{ display:'flex', flexDirection:'column', gap:'2.5rem', color:'rgb(26,26,20)', lineHeight:1.8, fontSize:'0.9375rem' }}>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>1. Introduction</h2>
              <p>AceForge ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use AceForge ("Service"). By using AceForge, you agree to the practices described in this policy.</p>
              <p style={{ marginTop:'0.75rem' }}>Questions? Contact us at <a href="mailto:contactinfo21342@gmail.com" style={{ color:'rgb(34,85,14)', fontWeight:600 }}>contactinfo21342@gmail.com</a></p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>2. Information We Collect</h2>
              <p><strong>Information you provide directly:</strong></p>
              <ul style={{ paddingLeft:'1.5rem', marginTop:'0.5rem', marginBottom:'0.75rem', display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <li>Name and email address when creating an account</li>
                <li>Profile photo (optional)</li>
                <li>Study content you generate (subject, topic, grade level, answers)</li>
                <li>Files you upload (notes, PDFs, images) — processed immediately and never permanently stored</li>
                <li>Payment information (processed by Stripe — we never see your card details)</li>
              </ul>
              <p><strong>Information collected automatically:</strong></p>
              <ul style={{ paddingLeft:'1.5rem', marginTop:'0.5rem', display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <li>Usage data (pages visited, features used, session history)</li>
                <li>Device type, browser, and operating system</li>
                <li>IP address and general location</li>
                <li>Cookies and similar tracking technologies (see Section 6)</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>3. How We Use Your Information</h2>
              <ul style={{ paddingLeft:'1.5rem', display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <li>To provide, operate, and improve the Service</li>
                <li>To generate personalized study materials using AI</li>
                <li>To process payments and manage subscriptions</li>
                <li>To send account-related emails (confirmations, password resets)</li>
                <li>To display advertisements to free-tier users (see Section 7)</li>
                <li>To analyze usage patterns and improve the Service</li>
                <li>To enforce our Terms of Service and prevent abuse</li>
              </ul>
              <p style={{ marginTop:'0.75rem' }}>We do not sell your personal information. We do not use your data to train AI models.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>4. Children's Privacy (COPPA)</h2>
              <p>AceForge is designed for students of all ages, including children under 13. We comply with the Children's Online Privacy Protection Act (COPPA).</p>
              <p style={{ marginTop:'0.75rem' }}><strong>For users under 13:</strong> We require verifiable parental consent before collecting personal information. During registration, users under 13 are directed through a parental consent flow. Parents may review, modify, or request deletion of their child's data at any time by contacting <a href="mailto:contactinfo21342@gmail.com" style={{ color:'rgb(34,85,14)', fontWeight:600 }}>contactinfo21342@gmail.com</a>.</p>
              <p style={{ marginTop:'0.75rem' }}>We collect the minimum information necessary from all users. We do not show behaviorally targeted advertising to users under 13. Any ads shown to users under 13 are contextual only (based on page content, not personal data).</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>5. Data Sharing</h2>
              <p>We share your data only with the following service providers to operate the Service:</p>
              <ul style={{ paddingLeft:'1.5rem', marginTop:'0.5rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                <li><strong>Supabase</strong> — database and authentication (supabase.com)</li>
                <li><strong>Vercel</strong> — hosting and infrastructure (vercel.com)</li>
                <li><strong>OpenAI</strong> — AI content generation. Your study topics and uploaded notes are sent to OpenAI to generate content. OpenAI's privacy policy governs this data (openai.com/privacy)</li>
                <li><strong>Stripe</strong> — payment processing. Stripe's privacy policy governs payment data (stripe.com/privacy)</li>
                <li><strong>Google AdSense</strong> — advertising for free-tier users. Google may use cookies to serve relevant ads. See Section 7 for details and opt-out options (google.com/privacy)</li>
              </ul>
              <p style={{ marginTop:'0.75rem' }}>We do not share data with data brokers, advertisers for targeting purposes beyond AdSense, or any other third parties.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>6. Cookies</h2>
              <p>We use the following types of cookies:</p>
              <ul style={{ paddingLeft:'1.5rem', marginTop:'0.5rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                <li><strong>Essential cookies</strong> — required to keep you logged in and use the Service. Cannot be disabled.</li>
                <li><strong>Analytics cookies</strong> — help us understand how users use the Service (anonymous, aggregated data).</li>
                <li><strong>Advertising cookies</strong> — used by Google AdSense to show relevant ads to free-tier users. These may track your activity across websites. Premium users do not see ads and are not subject to advertising cookies.</li>
              </ul>
              <p style={{ marginTop:'0.75rem' }}>You can opt out of Google advertising cookies at <a href="https://adssettings.google.com" target="_blank" style={{ color:'rgb(34,85,14)', fontWeight:600 }}>adssettings.google.com</a> or by upgrading to Premium.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>7. Advertising</h2>
              <p>Free-tier users see advertisements served by <strong>Google AdSense</strong>. These ads help us keep the free tier available.</p>
              <ul style={{ paddingLeft:'1.5rem', marginTop:'0.5rem', display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <li>Ads are displayed in sidebars, between questions, and on the loading screen</li>
                <li>Google AdSense may use cookies and your browsing data to show personalized ads</li>
                <li>We do not control which specific ads are shown</li>
                <li>Users under 13 see contextual ads only — no behavioral targeting</li>
                <li><strong>Premium subscribers see no ads whatsoever</strong></li>
              </ul>
              <p style={{ marginTop:'0.75rem' }}>To opt out of personalized ads: <a href="https://adssettings.google.com" target="_blank" style={{ color:'rgb(34,85,14)', fontWeight:600 }}>adssettings.google.com</a> or <a href="https://optout.aboutads.info" target="_blank" style={{ color:'rgb(34,85,14)', fontWeight:600 }}>optout.aboutads.info</a></p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>8. Data Retention</h2>
              <p>We retain your account data as long as your account is active. When you delete your account, we delete your personal information within 30 days, except where required by law (e.g., payment records retained 7 years for tax purposes).</p>
              <p style={{ marginTop:'0.75rem' }}>Uploaded files are processed in memory and never permanently stored on our servers.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>9. Your Rights</h2>
              <ul style={{ paddingLeft:'1.5rem', display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                <li><strong>Access</strong> — request a copy of your data</li>
                <li><strong>Correction</strong> — update your information in account settings</li>
                <li><strong>Deletion</strong> — delete your account via Settings → Danger Zone, or email us</li>
                <li><strong>Opt-out of ads</strong> — upgrade to Premium or use Google's opt-out tools</li>
                <li><strong>Portability</strong> — request your data in a portable format</li>
              </ul>
              <p style={{ marginTop:'0.75rem' }}>California residents (CCPA): you have the right to know what personal information we collect, the right to delete it, and the right to non-discrimination for exercising privacy rights.</p>
              <p style={{ marginTop:'0.75rem' }}>To exercise any right: <a href="mailto:contactinfo21342@gmail.com" style={{ color:'rgb(34,85,14)', fontWeight:600 }}>contactinfo21342@gmail.com</a></p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>10. Security</h2>
              <p>We implement industry-standard security including HTTPS encryption, hashed passwords via Supabase Auth, and row-level database security so users can only access their own data. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>11. Changes to This Policy</h2>
              <p>We may update this Privacy Policy at any time. We will notify you of significant changes by email or in-app notice. Continued use after changes take effect constitutes acceptance of the revised policy.</p>
            </section>

            <section>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, marginBottom:'0.75rem' }}>12. Contact</h2>
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