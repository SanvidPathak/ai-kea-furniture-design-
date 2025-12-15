/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // IKEA-inspired brand colors
        ikea: {
          blue: 'rgb(var(--color-ikea-blue) / <alpha-value>)',
          yellow: 'rgb(var(--color-ikea-yellow) / <alpha-value>)',
          electric: 'rgb(var(--color-ikea-electric) / <alpha-value>)',
        },
        // Primary palette - modern furniture e-commerce
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0057AD',  // IKEA blue as primary
          600: '#004a94',
          700: '#003d7a',
          800: '#003061',
          900: '#002548',
        },
        // Accent - warm and inviting
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FBDA0C',  // IKEA yellow as accent
          600: '#d4b109',
          700: '#a78907',
          800: '#7a6105',
          900: '#4d3a03',
        },
        // Earthy/Natural tones (2025 trend)
        earth: {
          beige: '#F5F2ED',
          sand: '#E8E1D5',
          terracotta: '#D4775F',
          mocha: '#8B7355',
          bark: '#5C4033',
        },
        // Neutral palette - clean and modern
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      animation: {
        'aurora': 'aurora 20s linear infinite',
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '50% 50%, 50% 50%' },
          '100%': { backgroundPosition: '350% 50%, 350% 50%' },
        },
      },
    },
  },
  plugins: [],
}
