/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Retro-futuristic palette
        void: {
          950: '#0a0010',
          900: '#0d0015',
          800: '#12001f',
          700: '#1a0030',
          600: '#250045',
        },
        neon: {
          cyan: '#00f5ff',
          pink: '#ff00ff',
          purple: '#bf00ff',
          blue: '#4d4dff',
          yellow: '#ffff00',
        },
        chrome: {
          DEFAULT: '#c0c0c0',
          light: '#e8e8e8',
          dark: '#808080',
        },
        sunset: {
          orange: '#ff6b00',
          pink: '#ff1493',
          purple: '#8b00ff',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(0,245,255,0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0,245,255,0.1) 1px, transparent 1px)`,
        'sunset-gradient': 'linear-gradient(180deg, #0a0010 0%, #1a0030 30%, #ff1493 70%, #ff6b00 100%)',
        'horizon-glow': 'radial-gradient(ellipse at 50% 100%, rgba(255,20,147,0.4) 0%, transparent 60%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00f5ff, 0 0 20px #00f5ff, 0 0 40px #00f5ff',
        'neon-pink': '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff',
        'neon-subtle': '0 0 10px rgba(0,245,255,0.5)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
};
