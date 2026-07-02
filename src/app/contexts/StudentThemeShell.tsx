'use client'

import { useEffect, useState } from 'react'

/**
 * Wraps a (server-rendered) page's content so the scoped `.student-dark`
 * theme applies. Descendant `.card`/`.input` and any `var(--af-*)` colors
 * flip automatically. `lightBg` is the page background used in light mode.
 *
 * Reads the theme straight from localStorage (rather than context) so the
 * class is applied on the client without depending on provider ordering.
 */
export default function StudentThemeShell({
  children,
  lightBg = 'rgb(250,250,247)',
}: {
  children: React.ReactNode
  lightBg?: string
}) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Read from localStorage directly — no context needed
    const saved = localStorage.getItem('aceforge_student_theme')
    setIsDark(saved === 'dark')

    // Listen for theme changes from the toggle in Navbar
    const handler = (e: StorageEvent) => {
      if (e.key === 'aceforge_student_theme') {
        setIsDark(e.newValue === 'dark')
      }
    }
    window.addEventListener('storage', handler)

    // Also listen for a custom event fired by the toggle button
    const customHandler = () => {
      const current = localStorage.getItem('aceforge_student_theme')
      setIsDark(current === 'dark')
    }
    window.addEventListener('aceforge-theme-change', customHandler)

    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('aceforge-theme-change', customHandler)
    }
  }, [])

  return (
    <div
      className={isDark ? 'student-dark' : ''}
      style={{
        minHeight: '100vh',
        background: isDark ? 'var(--af-bg)' : lightBg,
      }}
    >
      {children}
    </div>
  )
}
