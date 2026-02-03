/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#e30613',
        'brand-navy': '#003b5c',
        'brand-light-gray': '#f5f5f5',
        'brand-dark-gray': '#333333',
      }
    },
  },
  plugins: [],
}
