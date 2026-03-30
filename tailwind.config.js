/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🔥 THE RED BUTTON TEST
        indigo: {
          50: '#ff0000',
          100: '#ff0000',
          200: '#ff0000',
          300: '#ff0000',
          400: '#ff0000',
          500: '#ff0000', // This should turn almost every button in your app RED
          600: '#ff0000',
          900: '#ff0000',
          950: '#ff0000',
        }
      },
    },
  },
  plugins: [],
}
