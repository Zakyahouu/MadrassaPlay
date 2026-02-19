/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#3D5CFF",
        "primary-hover": "#2E48DA",
        "primary-light": "#F0F3FF",
        "background-light": "#f8fafc",
        "background-dark": "#0f172a",
        "surface-light": "#ffffff",
        "surface-dark": "#1e293b",
        "border-light": "#e2e8f0",
        "border-dark": "#334155",
        "text-main-light": "#334155",
        "text-main-dark": "#e2e8f0",
        "text-muted-light": "#64748b",
        "text-muted-dark": "#94a3b8",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        xl: "1rem",
      },
    },
  },
  plugins: [],
}
