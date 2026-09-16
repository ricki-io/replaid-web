/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,mjs,md,mdx,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
