/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // custom color scheme
        accent: {
          DEFAULT: '#F2E28E',
          light: '#F7EDB8',
          dark: '#D9C96E',
        },
        warm: {
          DEFAULT: '#A28680',
          light: '#B9A39E',
          dark: '#8A706B',
        },
        slate: {
          DEFAULT: '#5E5F69',
          light: '#7A7B84',
          dark: '#494A52',
        },
        muted: {
          DEFAULT: '#AEAFB7',
          light: '#C5C6CC',
          dark: '#9798A0',
        },
        surface: {
          light: '#FFFFFF',
          DEFAULT: '#F5F5F7',
          dark: '#0C0C10',
          darker: '#050507',
        },
      },
    },
  },
  plugins: [],
}
