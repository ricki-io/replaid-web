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
          purple: '#9d4edd',
          pink: '#e040fb',
          blue: '#3d5af1',
          cyan: '#22d1ee',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'mesh-bg': `
          radial-gradient(at 0% 0%, #9d4edd 0px, transparent 50%),
          radial-gradient(at 100% 0%, #3d5af1 0px, transparent 50%),
          radial-gradient(at 100% 100%, #e040fb 0px, transparent 50%),
          radial-gradient(at 0% 100%, #22d1ee 0px, transparent 50%)
        `,
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
};
