/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Neo-Geo palette - bold and artistic
        neo: {
          black: '#1a1a2e',
          navy: '#16213e',
        },
        // Mediterranean-inspired accents
        coral: {
          DEFAULT: '#e07a5f',
          light: '#f2a391',
          dark: '#c9614a',
        },
        cream: {
          DEFAULT: '#f4f1de',
          dark: '#e8e4cc',
        },
        sage: {
          DEFAULT: '#81b29a',
          light: '#a8d5ba',
          dark: '#5f9178',
        },
        gold: {
          DEFAULT: '#f2cc8f',
          dark: '#ddb870',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
