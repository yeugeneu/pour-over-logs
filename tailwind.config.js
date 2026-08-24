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
        stone: {
          50: 'rgb(var(--color-stone-50) / <alpha-value>)',
          100: 'rgb(var(--color-stone-100) / <alpha-value>)',
          200: 'rgb(var(--color-stone-200) / <alpha-value>)',
          300: 'rgb(var(--color-stone-300) / <alpha-value>)',
          400: 'rgb(var(--color-stone-400) / <alpha-value>)',
          500: 'rgb(var(--color-stone-500) / <alpha-value>)',
          600: 'rgb(var(--color-stone-600) / <alpha-value>)',
          700: 'rgb(var(--color-stone-700) / <alpha-value>)',
          800: 'rgb(var(--color-stone-800) / <alpha-value>)',
          900: 'rgb(var(--color-stone-900) / <alpha-value>)',
          950: 'rgb(var(--color-stone-950) / <alpha-value>)',
        },
        amber: {
          50: 'rgb(var(--color-amber-50) / <alpha-value>)',
          100: 'rgb(var(--color-amber-100) / <alpha-value>)',
          200: 'rgb(var(--color-amber-200) / <alpha-value>)',
          300: 'rgb(var(--color-amber-300) / <alpha-value>)',
          400: 'rgb(var(--color-amber-400) / <alpha-value>)',
          500: 'rgb(var(--color-amber-500) / <alpha-value>)',
          600: 'rgb(var(--color-amber-600) / <alpha-value>)',
          700: 'rgb(var(--color-amber-700) / <alpha-value>)',
          800: 'rgb(var(--color-amber-800) / <alpha-value>)',
          900: 'rgb(var(--color-amber-900) / <alpha-value>)',
          950: 'rgb(var(--color-amber-950) / <alpha-value>)',
        },
        coffee: {
          50: '#fbf8f5',
          100: '#f6f0eb',
          200: '#eddcd0',
          300: '#e0c0ab',
          400: '#cf9e7f',
          500: '#bf7d57',
          600: '#aa6444',
          700: '#8b4d37',
          800: '#714030',
          900: '#5c362b',
          950: '#321b15',
        },
        roast: {
          light: '#d49b6a',
          medium: '#a05c32',
          dark: '#542f1b',
        },
        crema: {
          100: '#fef7ee',
          200: '#fae7c9',
          300: '#f4d29a',
          400: '#ecb665',
          500: '#e49b38',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Noto Sans TC"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
