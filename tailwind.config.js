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
      },
    },
  },
  plugins: [],
}