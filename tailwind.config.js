/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmos: {
          darkBlue: "#0B0B2E",
          purpleText: "#1F1B4E",
          accentPink: "#FF69B4",
          lightBg: "#F7F5FC",
        }
      }
    },
  },
  plugins: [],
}