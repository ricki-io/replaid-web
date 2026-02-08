/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Pure blacks and whites for Typography First
        ink: {
          950: '#000000',
          900: '#050505',
          800: '#0a0a0a',
          700: '#111111',
          600: '#1a1a1a',
          500: '#2a2a2a',
          400: '#404040',
          300: '#999999',
          200: '#aaaaaa',
          100: '#bbbbbb',
          50: '#cccccc',
        },
        // Single accent color
        accent: {
          DEFAULT: '#ff6b35',
          light: '#ff8c5a',
          dark: '#e55a2b',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Massive display sizes
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
