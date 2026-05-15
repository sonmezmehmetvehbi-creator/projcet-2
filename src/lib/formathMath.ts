export function formatMath(text: string): string {
  if (!text) return text

  return text
    // Superscripts: a^2 → a²  (common exponents)
    .replace(/\^{(\d+)}/g, (_, n) => toSuperscript(n))
    .replace(/\^(\d+)/g, (_, n) => toSuperscript(n))
    .replace(/\^{([^}]+)}/g, (_, n) => `<sup>${n}</sup>`)
    // Subscripts: H_2 → H₂
    .replace(/_\{(\d+)\}/g, (_, n) => toSubscript(n))
    .replace(/_(\d+)/g, (_, n) => toSubscript(n))
    // Fractions: (a/b) stays as is but looks cleaner
    // Multiplication: * → ×
    .replace(/\s\*\s/g, ' × ')
    // Division: / between numbers stays
    // Square root: sqrt(x) → √x
    .replace(/sqrt\(([^)]+)\)/gi, '√($1)')
    .replace(/√\(([^)]+)\)/g, '√$1')
    // Pi
    .replace(/\bpi\b/gi, 'π')
    // Infinity
    .replace(/\binfinity\b/gi, '∞')
    // Less/greater than or equal
    .replace(/</g, '≤').replace(/>/g, '≥')
    // Arrows
    .replace(/->/g, '→')
    // Degree symbol
    .replace(/(\d+)\s*degrees?/gi, '$1°')
    .replace(/(\d+)\s*deg\b/gi, '$1°')
    // Remove leftover carets
    .replace(/\^/g, '')
}

function toSuperscript(n: string): string {
  const map: Record<string, string> = {
    '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴',
    '5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
    '+':'⁺','-':'⁻','n':'ⁿ','x':'ˣ',
  }
  return n.split('').map(c => map[c] || c).join('')
}

function toSubscript(n: string): string {
  const map: Record<string, string> = {
    '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄',
    '5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
  }
  return n.split('').map(c => map[c] || c).join('')
}