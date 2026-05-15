import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/ui/CookieBanner'

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
      </body>
    </html>
  )
}