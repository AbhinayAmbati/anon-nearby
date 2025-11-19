/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          green: '#00ff41',
          'dark-green': '#008f11',
          bg: '#0d1117',
          surface: '#161b22',
          border: '#21262d',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'pulse-green': 'pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanner': 'scanner 2s ease-in-out infinite',
        'rain': 'rain 3s linear infinite'
      }
    },
  },
  plugins: [],
}