export default function StudentThemeShell({ children, lightBg = 'rgb(250,250,247)' }: { children: React.ReactNode, lightBg?: string }) {
  return <div style={{ minHeight: '100vh', background: lightBg }}>{children}</div>
}
