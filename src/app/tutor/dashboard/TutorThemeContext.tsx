'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
}

const TutorThemeCtx = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {} })

export function TutorThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('aceforge_tutor_theme') as Theme | null
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('aceforge_tutor_theme', next)
  }

  return <TutorThemeCtx.Provider value={{ theme, toggle }}>{children}</TutorThemeCtx.Provider>
}

export function useTutorTheme() {
  return useContext(TutorThemeCtx)
}
