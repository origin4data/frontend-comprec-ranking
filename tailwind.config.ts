import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        comprec: { 50: "#eefbfb", 100: "#d5f4f3", 400: "#48BAB8", 500: "#3aa09e", 600: "#2d8583", 700: "#266b6a" },
        forest: { 800: "#0B5348", 900: "#06302a" },
      },
      fontFamily: { display: ["var(--font-display)", "serif"], body: ["var(--font-body)", "sans-serif"] },
      letterSpacing: { "extra-wide": "0.15em" },
    },
  },
  plugins: [],
};
export default config;
