/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Glassmorphism palette
        glass: {
          white: 'rgba(255,255,255,0.15)',
          border: 'rgba(255,255,255,0.2)',
          light: 'rgba(255,255,255,0.25)',
        },
        bg: {
          start: '#1a1a2e',
          mid: '#16213e',
          end: '#0f3460',
        },
        accent: {
          green: '#10b981',
          emerald: '#34d399',
          teal: '#14b8a6',
          cyan: '#22d3ee',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'mesh-bg': `
          radial-gradient(at 0% 0%, #10b981 0px, transparent 50%),
          radial-gradient(at 100% 0%, #14b8a6 0px, transparent 50%),
          radial-gradient(at 100% 100%, #34d399 0px, transparent 50%),
          radial-gradient(at 0% 100%, #22d3ee 0px, transparent 50%)
        `,
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
};
