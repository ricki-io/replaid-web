/** @type {import('tailwindcss').Config} */

// Tailwind color helper — allows opacity modifiers (e.g. bg-ink-950/30)
// when the underlying value is a CSS variable holding an RGB triplet.
function cv(varName) {
  return ({ opacityValue }) =>
    opacityValue !== undefined
      ? `rgba(var(${varName}), ${opacityValue})`
      : `rgb(var(${varName}))`;
}

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: cv('--ink-950'),
          900: cv('--ink-900'),
          800: cv('--ink-800'),
          700: cv('--ink-700'),
          600: cv('--ink-600'),
          500: cv('--ink-500'),
          400: cv('--ink-400'),
          300: cv('--ink-300'),
          200: cv('--ink-200'),
          100: cv('--ink-100'),
          50:  cv('--ink-50'),
        },
        accent: {
          DEFAULT: cv('--accent-rgb'),
          light: cv('--accent-light'),
          dark: cv('--accent-dark'),
        },
        // Semantic theme colors
        fg:      cv('--fg'),       // primary foreground (text)
        overlay: cv('--overlay'),   // semi-transparent borders & subtle fills
        surface: cv('--surface'),   // glass panel backgrounds
      },
      fontFamily: {
        display: ['Space Grotesk Variable', 'system-ui', 'sans-serif'],
        sans: ['Inter Variable', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.25rem, 10vw, 12rem)', { lineHeight: '0.9', letterSpacing: '-0.04em' }],
        'display-lg': ['clamp(2rem, 8vw, 8rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(2rem, 6vw, 5rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.5rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      letterSpacing: {
        'tightest': '-0.06em',
        'ultra-wide': '0.3em',
      },
    },
  },
  plugins: [],
};
