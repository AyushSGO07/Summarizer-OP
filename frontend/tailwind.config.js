/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC", // Slate-50
        surface: "#FFFFFF",
        card: "#FFFFFF",
        "card-hover": "#F1F5F9",
        sidebar: "#FFFFFF",
        border: "#E2E8F0",
        accent: {
          purple: "#7C3AED",
          indigo: "#6366F1",
          glow: "rgba(124, 58, 237, 0.15)"
        },
        text: {
          primary: "#0F172A", // Slate-900
          secondary: "#475569", // Slate-600
          muted: "#64748B" // Slate-500
        },
        status: {
          success: "#059669",
          error: "#DC2626",
          warning: "#D97706",
          info: "#2563EB"
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(124, 58, 237, 0.25)",
        "glow-lg": "0 0 40px -10px rgba(124, 58, 237, 0.3)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
        "card-hover": "0 12px 30px -5px rgba(124, 58, 237, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)"
      }
    },
  },
  plugins: [],
}
