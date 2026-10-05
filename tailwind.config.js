/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        periwinkle: {
          50: '#f4f6fe',
          100: '#e9edfd',
          200: '#d3dbfb',
          300: '#b5c4fa',
          400: '#93a7f3',
          500: '#6f85e8',
          600: '#5366cf',
          700: '#4150a6',
          800: '#374284',
          900: '#2f396a',
        },
        butter: {
          50: '#fdfdf0',
          100: '#fbfadd',
          200: '#f2f1a2',
          300: '#eae878',
          400: '#ded94f',
          500: '#c9c233',
          600: '#a69a27',
          700: '#7e7320',
          800: '#5e561e',
          900: '#4a441c',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(63, 72, 140, 0.25)',
      },
    },
  },
  plugins: [],
}
