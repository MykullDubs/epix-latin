/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🔥 THE INTERCEPT: We hijack 'indigo' and route it to our CSS variables
        // We use a simpler string format to ensure the CSS variable is read
        indigo: {
          50: 'rgb(var(--theme-primary-50))',
          100: 'rgb(var(--theme-primary-100))',
          200: 'rgb(var(--theme-primary-200))',
          300: 'rgb(var(--theme-primary-300))',
          400: 'rgb(var(--theme-primary-400))',
          500: 'rgb(var(--theme-primary-500))',
          600: 'rgb(var(--theme-primary-600))',
          900: 'rgb(var(--theme-primary-900))',
          950: 'rgb(var(--theme-primary-950))',
        }
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        }
      },
      animation: {
        shimmer: 'shimmer 8s linear infinite',
      }
    },
  },
  plugins: [],
}
