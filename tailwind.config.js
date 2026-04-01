/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Tells Tailwind exactly where to look for your class names
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    // 2. We use EXTEND so we don't accidentally delete Tailwind's default colors (like slate, rose, emerald)
    extend: {
      colors: {
        // 🔥 Hijacking 'indigo' to be a beautiful Cornflower Blue scale
        indigo: {
          50: '#f0f5fe',
          100: '#e1ebfd',
          200: '#c8daf9',
          300: '#a0c1f5',
          400: '#719eee',
          500: '#6495ed', // Base Cornflower Blue
          600: '#3b72e4',
          700: '#305cd0',
          800: '#2b4bab',
          900: '#274288',
          950: '#1b2952',
        },
      },
      // Keeping a few custom animations you are using in the Arena!
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
      }
    },
  },
  plugins: [],
}
