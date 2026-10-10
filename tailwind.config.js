/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tv: {
          bg: '#131722',
          surface: '#1e222d',
          border: '#2a2e39',
          hover: '#2a2e39',
          text: '#d1d4dc',
          muted: '#787b86',
          green: '#089981',
          greenHover: '#067a68',
          red: '#f23645',
          redHover: '#cc2432',
          blue: '#2962ff'
        }
      }
    },
  },
  plugins: [],
}
