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
          DEFAULT: '#c9984d',
          light: '#f8e1a9',
          dark: '#a67d35',
        },
        warm: {
          DEFAULT: '#A28680',
          light: '#B9A39E',
          dark: '#8A706B',
        },
        slate: {
          DEFAULT: '#014f99',
          light: '#3373b3',
          dark: '#003971',
        },
        muted: {
          DEFAULT: '#596D80',
          light: '#f8e1a9',
          dark: '#465A6C',
        },
        surface: {
          light: '#f9f2d5',
          DEFAULT: '#F5F4D6',
          dark: '#091428',
          darker: '#0E1C32',
        },
        cream: {
          DEFAULT: '#F5F4D6',
          light: '#f9f2d5',
        },
        navy: '#142640',
      },
    },
  },
  plugins: [],
}
