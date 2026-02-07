/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        rule: "var(--color-rule)",
        proof: "var(--color-proof)",
      },
      borderWidth: {
        hairline: "var(--border-hairline)",
        thin: "var(--border-thin)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      maxWidth: {
        reading: "var(--measure-reading)",
        content: "var(--measure-content)",
        wide: "var(--measure-wide)",
      },
      fontFamily: {
        ui: ["var(--font-ui)", "sans-serif"],
        editorial: ["var(--font-editorial)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        xs: ["var(--text-xs)", "var(--leading-tight)"],
        sm: ["var(--text-sm)", "var(--leading-normal)"],
        base: ["var(--text-base)", "var(--leading-normal)"],
        lg: ["var(--text-lg)", "var(--leading-normal)"],
        xl: ["var(--text-xl)", "var(--leading-normal)"],
        "2xl": ["var(--text-2xl)", "var(--leading-tight)"],
      },
      lineHeight: {
        tight: "var(--leading-tight)",
        normal: "var(--leading-normal)",
        relaxed: "var(--leading-relaxed)",
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        7: "var(--space-7)",
        8: "var(--space-8)",
        9: "var(--space-9)",
        10: "var(--space-10)",
        11: "var(--space-11)",
        12: "var(--space-12)",
      },
    },
  },
  plugins: [],
};
