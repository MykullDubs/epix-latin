/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🔥 THE INTERCEPT: We hijack 'indigo' and route it to our CSS variables
        indigo: {
          50: 'rgb(var(--theme-primary-50) / <alpha-value>)',
          100: 'rgb(var(--theme-primary-100) / <alpha-value>)',
          200: 'rgb(var(--theme-primary-200) / <alpha-value>)',
          300: 'rgb(var(--theme-primary-300) / <alpha-value>)',
          400: 'rgb(var(--theme-primary-400) / <alpha-value>)',
          500: 'rgb(var(--theme-primary-500) / <alpha-value>)',
          600: 'rgb(var(--theme-primary-600) / <alpha-value>)',
          900: 'rgb(var(--theme-primary-900) / <alpha-value>)',
          950: 'rgb(var(--theme-primary-950) / <alpha-value>)',
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
