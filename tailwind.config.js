/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#252621', cream: '#f7f5ef', lime: '#dff26d', sage: '#dce8d9', blue: '#dce8f7', coral: '#ff8e72'
      },
      boxShadow: { soft: '0 18px 60px rgba(44, 45, 38, .08)' },
      fontFamily: { sans: ['Manrope', 'sans-serif'], serif: ['Playfair Display', 'serif'] },
    },
  },
  plugins: [],
}
