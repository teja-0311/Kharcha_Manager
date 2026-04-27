import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#1a1a2e",
          light: "#2d2d4a",
          muted: "#6b6b8a",
        },
        paper: {
          DEFAULT: "#f5f0e8",
          dark: "#ede8df",
          warm: "#faf7f2",
        },
        accent: {
          DEFAULT: "#e8572a",
          hover: "#d4481d",
          muted: "#f4a882",
        },
        jade: {
          DEFAULT: "#2a7a5e",
          light: "#3a9b76",
          muted: "#a8d5c4",
        },
        amber: {
          DEFAULT: "#c8860a",
          light: "#f0a820",
          muted: "#f5d08a",
        },
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "count-up": "countUp 0.2s ease-out",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
