/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Art Deco palette
        deco: {
          black: '#0d0d0d',
          navy: '#0a1628',
          charcoal: '#1a1a2e',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#f4d03f',
          dark: '#b8860b',
          muted: '#c9a227',
        },
        ivory: {
          DEFAULT: '#fffff0',
          dark: '#f5f5dc',
          muted: '#e8e4d9',
        },
        accent: {
          emerald: '#046307',
          burgundy: '#722f37',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        accent: ['Poiret One', 'cursive'],
      },
      backgroundImage: {
        'deco-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='%23d4af3710' stroke-width='1'/%3E%3C/svg%3E")`,
        'sunburst': `conic-gradient(from 0deg at 50% 100%, transparent 0deg, rgba(212,175,55,0.03) 10deg, transparent 20deg, rgba(212,175,55,0.03) 30deg, transparent 40deg, rgba(212,175,55,0.03) 50deg, transparent 60deg, rgba(212,175,55,0.03) 70deg, transparent 80deg, rgba(212,175,55,0.03) 90deg, transparent 100deg, rgba(212,175,55,0.03) 110deg, transparent 120deg, rgba(212,175,55,0.03) 130deg, transparent 140deg, rgba(212,175,55,0.03) 150deg, transparent 160deg, rgba(212,175,55,0.03) 170deg, transparent 180deg)`,
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};
