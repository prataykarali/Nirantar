/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../modules/m01_citizen_ux/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '4xl': '2.5rem',
        '5xl': '3rem',
      },
      colors: {
        nirantar: {
          // Primary: Royal Purple
          royal: {
            50: '#FAF5FF',
            100: '#F3E8FF',
            200: '#E9D5FF',
            300: '#D8B4FE',
            400: '#C084FC',
            500: '#A855F7',
            600: '#9333EA',
            700: '#7E22CE',
            800: '#6B21A8', // Royal Purple Main
            900: '#581C87', // Royal Purple Deep
            950: '#3B0764',
            DEFAULT: '#6B21A8',
          },
          // Secondary: Lavender
          lavender: {
            50: '#FBF9FF',  // Very Light Lavender Canvas
            100: '#F4F0FF',
            200: '#EDE9FE', // Soft Lavender Tint Card
            300: '#DDD6FE', // Border & Divider
            400: '#C4B5FD',
            500: '#A78BFA',
            600: '#8B5CF6',
            DEFAULT: '#8B5CF6',
          },
          // Accent: Warm Golden Yellow
          gold: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B', // Warm Golden Yellow
            600: '#D97706',
            700: '#B45309',
            DEFAULT: '#F59E0B',
          },
          // Background Canvas
          canvas: '#F8F6FC',
          card: '#FFFFFF',
          // Text Neutrals
          text: {
            primary: '#1E1B4B',   // Deep Indigo Black
            secondary: '#475569', // Slate 600
            muted: '#64748B',     // Slate 500
          }
        },
      },
      boxShadow: {
        'soft-sm': '0 2px 8px 0 rgba(88, 28, 135, 0.04)',
        'soft': '0 4px 20px 0 rgba(88, 28, 135, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 10px 30px -4px rgba(88, 28, 135, 0.09), 0 4px 6px -2px rgba(88, 28, 135, 0.04)',
        'soft-xl': '0 20px 40px -6px rgba(88, 28, 135, 0.12), 0 8px 12px -4px rgba(88, 28, 135, 0.04)',
        'royal': '0 4px 18px 0 rgba(107, 33, 168, 0.30)',
        'gold': '0 4px 18px 0 rgba(245, 158, 11, 0.28)',
      },
    },
  },
  plugins: [],
}
