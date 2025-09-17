/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gne-red': '#e30613',
        'gne-navy': '#003b5c',
        'gne-light-gray': '#f5f5f5',
        'gne-dark-gray': '#333333',
      }
    },
  },
  plugins: [],
}
