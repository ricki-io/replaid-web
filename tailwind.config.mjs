/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Scandinavian palette - warm and cozy
        cream: {
          DEFAULT: '#faf8f5',
          dark: '#f5f0e8',
          warm: '#f8f4ed',
        },
        charcoal: {
          DEFAULT: '#2d2d2d',
          light: '#4a4a4a',
          muted: '#6b6b6b',
        },
        wood: {
          light: '#d4a574',
          DEFAULT: '#b8956c',
          dark: '#8b7355',
        },
        sage: {
          DEFAULT: '#9caa97',
          light: '#b8c4b4',
          dark: '#7d8f78',
        },
        dusty: {
          blue: '#8fa8b8',
          rose: '#c9a9a6',
        },
      },
      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'soft': '1rem',
        'softer': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0,0,0,0.04)',
        'softer': '0 8px 30px rgba(0,0,0,0.06)',
        'warm': '0 4px 20px rgba(184,149,108,0.15)',
      },
    },
  },
  plugins: [],
};
