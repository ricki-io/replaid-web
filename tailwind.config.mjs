/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Tech Forward palette
        tech: {
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
        electric: {
          DEFAULT: '#0ea5e9',
          light: '#38bdf8',
          dark: '#0284c7',
          glow: '#7dd3fc',
        },
        violet: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'tech-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
        'tech-subtle': 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(139,92,246,0.1) 100%)',
        'grid-tech': `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='%230ea5e910' stroke-width='1'/%3E%3C/svg%3E")`,
      },
      boxShadow: {
        'tech': '0 4px 30px rgba(14,165,233,0.1)',
        'tech-lg': '0 8px 40px rgba(14,165,233,0.15)',
        'glow': '0 0 30px rgba(14,165,233,0.3)',
      },
    },
  },
  plugins: [],
};
