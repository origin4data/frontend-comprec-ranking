import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        comprec: { 400: "#48BAB8", 500: "#3aa09e" },
        forest:  { 900: "#050D0B", 800: "#0C1815" },
        ink:     { 900: "#050D0B", 800: "#0C1815", 700: "#111D19" },
        gold:    { DEFAULT: "#C49A2C", light: "#D4B058", dim: "rgba(196,154,44,0.12)" },
        silver:  { DEFAULT: "#8E9FAB" },
        bronze:  { DEFAULT: "#9A6040" },
        parchment: "#E4ECE4",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body:    ["var(--font-body)", "Arial", "sans-serif"],
      },
      letterSpacing: { "extra-wide": "0.15em" },
    },
  },
  plugins: [],
};
export default config;
