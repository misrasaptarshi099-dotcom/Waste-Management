/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "background-cream": "#FDFBF7",
        "surface-sand": "#F5ECE3",
        "surface-dim": "#e3d8d4",
        "surface-bright": "#fff8f6",
        "surface-container": "#f7ebe8",
        "surface-container-high": "#f2e6e2",
        "surface-container-highest": "#ece0dd",
        "surface-container-low": "#fdf1ed",
        "surface-container-lowest": "#ffffff",
        "on-background": "#201a18",
        "on-surface": "#201a18",
        "on-surface-variant": "#56423e",
        
        // Brand & Accent Colors
        primary: "#9a402f",
        "primary-container": "#b95745",
        "primary-fixed": "#ffdad3",
        "primary-fixed-dim": "#ffb4a5",
        "on-primary": "#ffffff",
        
        secondary: "#446554",
        "secondary-container": "#c3e8d2",
        "secondary-fixed": "#c6ebd5",
        "secondary-fixed-dim": "#aacfba",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#486a58",

        tertiary: "#006858",
        "tertiary-container": "#008470",
        "tertiary-fixed": "#8bf6dc",
        "tertiary-fixed-dim": "#6ed9c1",
        "on-tertiary": "#ffffff",
        
        terracotta: {
          DEFAULT: "#C25E4B",
          dark: "#9A402F",
          light: "#E07A5F",
        },
        "sage-green": "#6B8E7B",
        "muted-taupe": "#8B7E76",
        outline: "#89726d",
        "outline-variant": "#dcc0bb",
        
        // Status Indicators
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "status-overflow": "#EF4444",
        "status-caution": "#F59E0B",
        "status-stable": "#22C55E",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px",
        organic: "60% 40% 50% 50% / 40% 50% 50% 60%",
        "organic-alt": "40% 60% 50% 50% / 50% 40% 60% 50%",
      },
      fontFamily: {
        headline: ["'Noto Serif'", "'Fraunces'", "serif"],
        editorial: ["'Noto Serif'", "'Fraunces'", "serif"],
        body: ["'DM Sans'", "'Satoshi'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      spacing: {
        gutter: "2rem",
        "page-margin": "5vw",
        "interaction-radius": "24px",
        "section-gap": "8rem",
      },
    },
  },
  plugins: [],
}
