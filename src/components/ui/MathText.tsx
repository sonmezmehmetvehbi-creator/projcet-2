'use client'

import { formatMath } from '@/lib/formatMath'

interface Props {
  text: string
  style?: React.CSSProperties
  className?: string
}

export default function MathText({ text, style, className }: Props) {
  const formatted = formatMath(text)

  // Check if we need HTML rendering (for <sup> tags)
  if (formatted.includes('<sup>') || formatted.includes('<sub>')) {
    return (
      <span
        style={style}
        className={className}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    )
  }

  return <span style={style} className={className}>{formatted}</span>
}