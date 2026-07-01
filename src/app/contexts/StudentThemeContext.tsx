'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
}

const StudentThemeCtx = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} })

export function StudentThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('aceforge_student_theme') as Theme | null
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('aceforge_student_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return <StudentThemeCtx.Provider value={{ theme, toggle }}>{children}</StudentThemeCtx.Provider>
}

export function useStudentTheme() {
  return useContext(StudentThemeCtx)
}
