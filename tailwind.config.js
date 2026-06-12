/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0a0c',
          blue: '#00f2ff',
          magenta: '#ff00c8',
          darkBlue: '#0f172a',
          glass: 'rgba(15, 23, 42, 0.7)',
        }
      },
      boxShadow: {
        neon: '0 0 10px #00f2ff, 0 0 20px #00f2ff',
        'neon-magenta': '0 0 10px #ff00c8, 0 0 20px #ff00c8',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, rgba(0, 242, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 242, 255, 0.1) 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}
