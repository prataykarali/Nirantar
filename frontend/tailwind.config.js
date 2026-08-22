/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        neon: {
          green: '#00FF9D',
          cyan: '#00F0FF',
          purple: '#A855F7',
          pink: '#FF007A',
          amber: '#FFB800',
          rose: '#FF2A5F',
        },
        obsidian: {
          900: '#060B14',
          950: '#030712',
        },
      },
    },
  },
  plugins: [],
}
