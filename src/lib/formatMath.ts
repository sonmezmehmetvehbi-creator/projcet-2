export function formatMath(text: string): string {
  if (!text) return text

  return text
    // Remove LaTeX delimiters first
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '')
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')

    // LaTeX commands → readable text
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt/g, '√')

    // Fractions: \frac{a}{b} → a/b
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')

    // Superscripts: x^{2} or x^2
    .replace(/\^{([^}]+)}/g, (_, n) => `<sup>${toSuperOrRaw(n)}</sup>`)
    .replace(/\^([a-zA-Z0-9+\-])/g, (_, n) => `<sup>${toSuperOrRaw(n)}</sup>`)

    // Subscripts: x_{2} or x_2
    .replace(/_{([^}]+)}/g, (_, n) => `<sub>${toSubOrRaw(n)}</sub>`)
    .replace(/_([a-zA-Z0-9])/g, (_, n) => `<sub>${toSubOrRaw(n)}</sub>`)

    // Clean up remaining backslashes
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/\\/g, '')

    // misc
    .replace(/(\d+)\s*degrees?/gi, '$1°')
    .replace(/(\d+)\s*deg\b/gi, '$1°')
    .replace(/->/g, '→')
}

function toSuperOrRaw(n: string): string {
  const superMap: Record<string, string> = {
    '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴',
    '5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
    '+':'⁺','-':'⁻','n':'ⁿ','x':'ˣ',
  }
  // If single char has superscript unicode, use it
  if (n.length === 1 && superMap[n]) return superMap[n]
  // Otherwise return as-is (will be wrapped in <sup>)
  return n.split('').map(c => superMap[c] || c).join('')
}

function toSubOrRaw(n: string): string {
  const subMap: Record<string, string> = {
    '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄',
    '5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
  }
  if (n.length === 1 && subMap[n]) return subMap[n]
  return n.split('').map(c => subMap[c] || c).join('')
}