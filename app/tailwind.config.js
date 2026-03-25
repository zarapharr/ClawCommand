/** @type {import('tailwindcss').Config} */
module.exports = {
  // Dark mode by default, light mode with explicit class
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic colors from design system
        primary: {
          50: "hsl(var(--color-primary-50) / <alpha-value>)",
          100: "hsl(var(--color-primary-100) / <alpha-value>)",
          200: "hsl(var(--color-primary-200) / <alpha-value>)",
          300: "hsl(var(--color-primary-300) / <alpha-value>)",
          400: "hsl(var(--color-primary-400) / <alpha-value>)",
          500: "hsl(var(--color-primary-500) / <alpha-value>)",
          600: "hsl(var(--color-primary-600) / <alpha-value>)",
          700: "hsl(var(--color-primary-700) / <alpha-value>)",
          800: "hsl(var(--color-primary-800) / <alpha-value>)",
          900: "hsl(var(--color-primary-900) / <alpha-value>)",
          950: "hsl(var(--color-primary-950) / <alpha-value>)",
        },
        success: {
          50: "hsl(var(--color-success-50) / <alpha-value>)",
          100: "hsl(var(--color-success-100) / <alpha-value>)",
          500: "hsl(var(--color-success-500) / <alpha-value>)",
          600: "hsl(var(--color-success-600) / <alpha-value>)",
          700: "hsl(var(--color-success-700) / <alpha-value>)",
        },
        warning: {
          50: "hsl(var(--color-warning-50) / <alpha-value>)",
          100: "hsl(var(--color-warning-100) / <alpha-value>)",
          500: "hsl(var(--color-warning-500) / <alpha-value>)",
          600: "hsl(var(--color-warning-600) / <alpha-value>)",
          700: "hsl(var(--color-warning-700) / <alpha-value>)",
        },
        error: {
          50: "hsl(var(--color-error-50) / <alpha-value>)",
          100: "hsl(var(--color-error-100) / <alpha-value>)",
          500: "hsl(var(--color-error-500) / <alpha-value>)",
          600: "hsl(var(--color-error-600) / <alpha-value>)",
          700: "hsl(var(--color-error-700) / <alpha-value>)",
        },
        info: {
          50: "hsl(var(--color-info-50) / <alpha-value>)",
          100: "hsl(var(--color-info-100) / <alpha-value>)",
          500: "hsl(var(--color-info-500) / <alpha-value>)",
          600: "hsl(var(--color-info-600) / <alpha-value>)",
          700: "hsl(var(--color-info-700) / <alpha-value>)",
        },
        neutral: {
          0: "hsl(var(--color-neutral-0) / <alpha-value>)",
          50: "hsl(var(--color-neutral-50) / <alpha-value>)",
          100: "hsl(var(--color-neutral-100) / <alpha-value>)",
          200: "hsl(var(--color-neutral-200) / <alpha-value>)",
          300: "hsl(var(--color-neutral-300) / <alpha-value>)",
          400: "hsl(var(--color-neutral-400) / <alpha-value>)",
          500: "hsl(var(--color-neutral-500) / <alpha-value>)",
          600: "hsl(var(--color-neutral-600) / <alpha-value>)",
          700: "hsl(var(--color-neutral-700) / <alpha-value>)",
          800: "hsl(var(--color-neutral-800) / <alpha-value>)",
          900: "hsl(var(--color-neutral-900) / <alpha-value>)",
          950: "hsl(var(--color-neutral-950) / <alpha-value>)",
        },
        // Legacy component colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}