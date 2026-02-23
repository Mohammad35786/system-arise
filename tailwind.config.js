/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#0A0A0F',
        'secondary-bg': '#0D1117',
        'gold-accent': '#C9A84C',
        'text-primary': '#E8E8E8',
      },
      fontFamily: {
        'system': ['monospace'],
      },
    },
  },
  plugins: [],
}
