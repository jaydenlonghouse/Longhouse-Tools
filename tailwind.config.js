/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'sans-serif'],
        mono: ['Figtree', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#EDF4FA',
          100: '#D5E8F7',
          200: '#C4DEF4',
          300: '#8EBFE8',
          400: '#22BBF2',
          500: '#0898CC',
          600: '#1F5B99',
          700: '#08447F',
          800: '#043566',
          900: '#00234D',
          950: '#02163D',
        },
        ink: {
          50: '#F4F8FC',
          100: '#E8F0F8',
          200: '#D5E8F7',
          300: '#B0C4D8',
          400: '#7A8D9E',
          600: '#5C6773',
          800: '#2E3A47',
          900: '#02163D',
        },
      },
    },
  },
  plugins: [],
}
