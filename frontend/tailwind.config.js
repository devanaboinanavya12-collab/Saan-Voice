/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#F8FAFC',
        bgSecondary: '#FFFFFF',
        accentCyan: '#0EA5E9',
        accentTeal: '#0D9488',
        accentPurple: '#6366F1',
        successGreen: '#10B981',
        warningGold: '#F59E0B',
        dangerRed: '#EF4444',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        textMuted: '#64748B',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
