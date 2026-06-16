import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/ui/CookieBanner'
import Script from 'next/script'
import { StudentThemeProvider } from '@/app/contexts/StudentThemeContext'

export const metadata: Metadata = {
  title: 'AceForge — AI-Powered Study Materials',
  description: 'Generate personalized questions and visual worksheets for any subject and grade level.',
  other: {
    'google-adsense-account': 'ca-pub-8087795524838705',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-8087795524838705" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <StudentThemeProvider>
          {children}
        </StudentThemeProvider>
        <CookieBanner />
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