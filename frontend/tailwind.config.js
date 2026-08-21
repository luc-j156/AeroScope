export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f172a', // deep background
          800: '#1e293b', // card background
          700: '#334155', // border or hover
          600: '#475569',
        },
        primary: {
          500: '#3b82f6', // blue accent
          400: '#60a5fa',
        },
        accent: {
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          orange: '#f97316'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
