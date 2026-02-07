/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Gradient Modern palette
        dark: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
        },
        aurora: {
          purple: '#a855f7',
          violet: '#8b5cf6',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          pink: '#ec4899',
          rose: '#f43f5e',
          orange: '#f97316',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'aurora': 'linear-gradient(135deg, #a855f7 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #8b5cf6 100%)',
        'aurora-soft': 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.15) 50%, rgba(139,92,246,0.15) 100%)',
        'mesh': `radial-gradient(at 40% 20%, rgba(168,85,247,0.3) 0px, transparent 50%),
                 radial-gradient(at 80% 0%, rgba(236,72,153,0.2) 0px, transparent 50%),
                 radial-gradient(at 0% 50%, rgba(59,130,246,0.2) 0px, transparent 50%),
                 radial-gradient(at 80% 50%, rgba(249,115,22,0.15) 0px, transparent 50%),
                 radial-gradient(at 0% 100%, rgba(139,92,246,0.2) 0px, transparent 50%)`,
      },
      boxShadow: {
        'glow-purple': '0 0 40px rgba(168,85,247,0.3)',
        'glow-pink': '0 0 40px rgba(236,72,153,0.3)',
      },
    },
  },
  plugins: [],
};
