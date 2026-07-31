/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      // Arena v0 components use h-13/w-13 (3.25rem), which isn't in Tailwind's
      // default spacing scale.
      spacing: {
        13: '3.25rem',
      },
      // Semantic color tokens used by the landing components. Mapped to the
      // AceForge student (light green) palette. Defined as hex so Tailwind
      // opacity modifiers (e.g. bg-primary/10) resolve correctly.
      colors: {
        border: '#dfe8d2',
        input: '#cdddbf',
        ring: '#22550e',
        background: '#f8faf5',
        foreground: '#1a1a14',
        primary: {
          DEFAULT: '#22550e',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f4f7ec',
          foreground: '#1a1a14',
        },
        muted: {
          DEFAULT: '#edf1e5',
          foreground: '#6b6b58',
        },
        accent: {
          DEFAULT: '#e6efda',
          foreground: '#22550e',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1a1a14',
        },
        destructive: {
          DEFAULT: '#a32d2d',
          foreground: '#ffffff',
        },
        // ── Arena hub (dark) design tokens. Scoped names (brand/ember/sky/
        // surface + arena-*) so the dark Arena theme never collides with the
        // light-green landing/student palette above. Hex values approximate the
        // v0 OKLCH source so Tailwind opacity modifiers (e.g. bg-surface/70)
        // resolve correctly.
        brand: {
          DEFAULT: '#7c3aed', // vibrant purple
          foreground: '#f4f2ff',
        },
        ember: '#f59e0b', // orange accent
        sky: '#8ecbf0', // baby blue accent
        surface: '#201d2b', // dark card surface
        'arena-bg': '#0a0a14', // near-black page base (matches Arena page)
        'arena-fg': '#f4f4f7', // primary light text
        'arena-muted': '#a3a1b0', // muted light text
        'arena-border': 'rgba(255,255,255,0.09)',
        'arena-input': 'rgba(255,255,255,0.14)',
      },
    },
  },
  plugins: [],
}