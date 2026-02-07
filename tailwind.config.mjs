/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Swiss brutalist palette - stark
        swiss: {
          black: '#000000',
          white: '#ffffff',
          red: '#ff0000',
          gray: '#666666',
          light: '#f5f5f5',
        },
      },
      fontFamily: {
        display: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'monospace'],
      },
      fontSize: {
        'massive': ['clamp(4rem, 20vw, 16rem)', { lineHeight: '0.85', letterSpacing: '-0.04em' }],
        'huge': ['clamp(3rem, 12vw, 10rem)', { lineHeight: '0.9', letterSpacing: '-0.03em' }],
        'big': ['clamp(2rem, 6vw, 5rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
      },
    },
  },
  plugins: [],
};
