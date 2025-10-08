/** @type {import('tailwindcss').Config} */
export default {
  // Use class strategy so toggling `dark` on <html> works with Tailwind's `dark:` utilities
  darkMode: 'class',
  content: [
    "./src/components/**/*.{js,vue,ts}",
    "./src/layouts/**/*.vue",
    "./src/pages/**/*.vue",
    "./src/plugins/**/*.{js,ts}",
    "./src/app.vue",
    "./src/error.vue"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f1',
          100: '#ffd6d6',
          200: '#ffb3b3',
          300: '#ff8f8f',
          400: '#ff5f5f',
          500: '#ff2f2f',
          600: '#e62626',
          700: '#b31f1f',
          800: '#821717',
          900: '#4f0f0f'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}