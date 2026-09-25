/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        locus: {
          accent: '#59C7B8',
          accentSecondary: '#F28C47',
          danger: '#EB525C',
          good: '#4DDC8C',
          warn: '#FAC747',
          bad: '#EB525C',
          darkBg: '#0b0f14',
          glassBg: 'rgba(18, 24, 32, 0.78)',
          glassBorder: 'rgba(255, 255, 255, 0.12)',
        }
      }
    },
  },
  plugins: [],
}
