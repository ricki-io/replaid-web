/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neobrutalist palette - high contrast, bold
        brutal: {
          black: '#000000',
          white: '#FFFFFF',
          cream: '#FFFEF0',
          yellow: '#FFDE59',
          cyan: '#00FFFF',
          magenta: '#FF00FF',
          red: '#FF3333',
          blue: '#0066FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'brutal': '4px 4px 0 0 #000000',
        'brutal-lg': '6px 6px 0 0 #000000',
        'brutal-xl': '8px 8px 0 0 #000000',
        'brutal-yellow': '4px 4px 0 0 #FFDE59',
        'brutal-cyan': '4px 4px 0 0 #00FFFF',
      },
      animation: {
        'marquee': 'marquee 20s linear infinite',
        'bounce-brutal': 'bounce-brutal 0.5s ease-in-out',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'bounce-brutal': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
