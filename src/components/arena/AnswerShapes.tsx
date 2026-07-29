import type { CSSProperties } from 'react'

// Kahoot-style answer identity: colour + symbol per option slot.
export const ANSWER_STYLES = [
  { color: 'rgb(249,115,22)', shape: 'star' as const, letter: 'A' },
  { color: 'rgb(147,51,234)', shape: 'hexagon' as const, letter: 'B' },
  { color: 'rgb(56,189,248)', shape: 'droplet' as const, letter: 'C' },
  { color: 'rgb(100,116,139)', shape: 'cloud' as const, letter: 'D' },
]

type Shape = 'star' | 'hexagon' | 'droplet' | 'cloud'

export function AnswerShape({ shape, size = 28, color = 'white', style }: { shape: Shape; size?: number; color?: string; style?: CSSProperties }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', style }
  if (shape === 'star') {
    return (
      <svg {...common}>
        <path d="M12 2 L14.9 8.6 L22 9.2 L16.6 13.9 L18.3 21 L12 17.2 L5.7 21 L7.4 13.9 L2 9.2 L9.1 8.6 Z" fill={color} />
      </svg>
    )
  }
  if (shape === 'hexagon') {
    return (
      <svg {...common}>
        <path d="M12 2 L20.66 7 L20.66 17 L12 22 L3.34 17 L3.34 7 Z" fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
    )
  }
  if (shape === 'droplet') {
    return (
      <svg {...common}>
        <path d="M12 2.5 C12 2.5 5 10.5 5 15 A7 7 0 0 0 19 15 C19 10.5 12 2.5 12 2.5 Z" fill={color} />
      </svg>
    )
  }
  // cloud
  return (
    <svg {...common}>
      <path d="M7.5 19 A4.2 4.2 0 0 1 7 10.6 A5 5 0 0 1 16.8 9.4 A3.8 3.8 0 0 1 16.5 19 Z" fill={color} />
    </svg>
  )
}
