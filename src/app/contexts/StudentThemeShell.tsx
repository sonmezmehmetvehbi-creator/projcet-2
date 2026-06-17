'use client'

import { useStudentTheme } from './StudentThemeContext'

/**
 * Wraps a (server-rendered) page's content so the scoped `.student-dark`
 * theme applies. Descendant `.card`/`.input` and any `var(--af-*)` colors
 * flip automatically. `lightBg` is the page background used in light mode.
 */
export default function StudentThemeShell({
  children,
  lightBg = 'rgb(250,250,247)',
}: {
  children: React.ReactNode
  lightBg?: string
}) {
  const { theme } = useStudentTheme()
  const isDark = theme === 'dark'
  return (
    <div className={isDark ? 'student-dark' : ''} style={{ minHeight: '100vh', background: isDark ? 'var(--af-bg)' : lightBg }}>
      {children}
    </div>
  )
}
