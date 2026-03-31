/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🔥 THE REAL INTERCEPT
        indigo: {
           50: '#f0f4fe',
          100: '#dee7fc',
          200: '#c4d6fa',
          300: '#9abaf6',
          400: '#6495ed', // Exact Cornflower Blue
          500: '#4875e5',
          600: '#345ad6',
          700: '#2a46bb',
          800: '#263a98',
          900: '#233479',
          950: '#1a234a',        }
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
