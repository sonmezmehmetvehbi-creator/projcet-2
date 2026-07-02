export function StudentThemeProvider({ children }: { children: React.ReactNode }) { return <>{children}</> }
export function useStudentTheme() { return { theme: 'light', toggle: () => {} } }
