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
        // Deep Slate & Cockpit Dark palette
        canvas: "#030712",
        "cockpit-bg": "#0E131F",
        "cockpit-card": "#0F172A",
        "cockpit-elevated": "#1A202C",
        "cockpit-high": "#242A36",
        "cockpit-border": "#1E293B",
        "cockpit-border-highlight": "#334155",
        
        // Brand & Optimization colors
        emerald: {
          400: "#4EDEA3",
          500: "#10B981",
          600: "#059669",
        },
        terracotta: {
          DEFAULT: "#C25E4B",
          dark: "#9A402F",
          light: "#E07A5F",
        },
        sage: {
          DEFAULT: "#6B8E7B",
          light: "#A3B899",
        },
        sand: {
          DEFAULT: "#F5ECE3",
          dark: "#E5D9CC",
          cream: "#FDFBF7",
        },
        taupe: {
          DEFAULT: "#8B7E76",
          dark: "#56423E",
        },
        
        // Status Alerts
        status: {
          overflow: "#EF4444",
          caution: "#F59E0B",
          stable: "#22C55E",
          static: "#64748B",
        },
      },
      fontFamily: {
        headline: ["'Cabinet Grotesk'", "sans-serif"],
        editorial: ["'Fraunces'", "'Noto Serif'", "serif"],
        body: ["'Satoshi'", "'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        organic: "60% 40% 30% 70% / 60% 30% 70% 40%",
        "organic-alt": "40% 60% 70% 30% / 40% 50% 60% 50%",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-emerald": "glowEmerald 2s ease-in-out infinite alternate",
        "dash": "dash 25s linear infinite",
      },
      keyframes: {
        glowEmerald: {
          "0%": { filter: "drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))" },
          "100%": { filter: "drop-shadow(0 0 10px rgba(16, 185, 129, 0.9))" },
        },
        dash: {
          to: { strokeDashoffset: "-1000" },
        },
      },
    },
  },
  plugins: [],
}
