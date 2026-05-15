import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/ui/CookieBanner'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'StudySpark — AI-Powered Study Materials',
  description: 'Generate personalized questions and visual worksheets for any subject and grade level.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
        <CookieBanner />
        {/* Replace ca-pub-XXXXXXXXXXXXXXXX with your real publisher ID after AdSense approval */}
       <Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8087795524838705"
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
      </body>
    </html>
  )
}