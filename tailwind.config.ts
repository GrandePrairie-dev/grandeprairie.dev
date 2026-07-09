import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Peace Region palette
        "boreal-spruce": { DEFAULT: "#2D4A3E", light: "#4A7C6A" },
        "prairie-amber": { DEFAULT: "#D4A24E", dark: "#C4943F" },
        "aurora-teal": { DEFAULT: "#3DBFA8", dark: "#34A893" },
        "river-slate": "#4C5B6E",
        "midnight-prairie": "#161B22",
        "deep-frost": "#1E2530",
        "twilight": "#262D38",
        "fresh-snow": "#F7F5F2",
        "hoarfrost": "#EDEAE6",
        // Semantic
        "rig-amber": "#D08770",
        "pipeline-red": "#C45B5B",
        "clear-sky": "#6BA3BE",
        "prairie-sky": "#1E5FA0",
        "wheat-gold": "#D4A84B",
        "harvest-amber": "#D4922A",
        // shadcn/ui tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        "gp-1": "var(--shadow-e1)",
        "gp-2": "var(--shadow-e2)",
        "gp-3": "var(--shadow-e3)",
      },
    },
  },
  plugins: [],
} satisfies Config;
