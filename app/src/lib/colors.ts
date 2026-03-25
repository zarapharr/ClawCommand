/**
 * Semantic Color System for ClawCommand Enterprise
 * Dark-first design with light mode opt-in
 * All values use CSS custom properties for theme switching
 */

export const semanticColors = {
  // Primary brand colors
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

  // Success state
  success: {
    50: "hsl(var(--color-success-50) / <alpha-value>)",
    100: "hsl(var(--color-success-100) / <alpha-value>)",
    500: "hsl(var(--color-success-500) / <alpha-value>)",
    600: "hsl(var(--color-success-600) / <alpha-value>)",
    700: "hsl(var(--color-success-700) / <alpha-value>)",
  },

  // Warning state
  warning: {
    50: "hsl(var(--color-warning-50) / <alpha-value>)",
    100: "hsl(var(--color-warning-100) / <alpha-value>)",
    500: "hsl(var(--color-warning-500) / <alpha-value>)",
    600: "hsl(var(--color-warning-600) / <alpha-value>)",
    700: "hsl(var(--color-warning-700) / <alpha-value>)",
  },

  // Error state
  error: {
    50: "hsl(var(--color-error-50) / <alpha-value>)",
    100: "hsl(var(--color-error-100) / <alpha-value>)",
    500: "hsl(var(--color-error-500) / <alpha-value>)",
    600: "hsl(var(--color-error-600) / <alpha-value>)",
    700: "hsl(var(--color-error-700) / <alpha-value>)",
  },

  // Info state
  info: {
    50: "hsl(var(--color-info-50) / <alpha-value>)",
    100: "hsl(var(--color-info-100) / <alpha-value>)",
    500: "hsl(var(--color-info-500) / <alpha-value>)",
    600: "hsl(var(--color-info-600) / <alpha-value>)",
    700: "hsl(var(--color-info-700) / <alpha-value>)",
  },

  // Neutral/grayscale
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
} as const;

/**
 * Dark mode (default) CSS variables
 * These define the actual HSL values for semantic colors
 */
export const darkModeVars = {
  "--color-primary-50": "220 13% 91%",
  "--color-primary-100": "220 13% 82%",
  "--color-primary-200": "220 14% 65%",
  "--color-primary-300": "220 13% 48%",
  "--color-primary-400": "220 14% 35%",
  "--color-primary-500": "220 12% 26%", // Main primary
  "--color-primary-600": "220 13% 20%",
  "--color-primary-700": "220 13% 15%",
  "--color-primary-800": "220 13% 10%",
  "--color-primary-900": "220 12% 5%",
  "--color-primary-950": "220 14% 2%",

  "--color-success-50": "142 71% 91%",
  "--color-success-100": "142 71% 81%",
  "--color-success-500": "142 71% 45%",
  "--color-success-600": "142 72% 36%",
  "--color-success-700": "142 73% 29%",

  "--color-warning-50": "38 92% 88%",
  "--color-warning-100": "38 93% 77%",
  "--color-warning-500": "38 92% 50%",
  "--color-warning-600": "38 90% 40%",
  "--color-warning-700": "38 89% 31%",

  "--color-error-50": "0 84% 91%",
  "--color-error-100": "0 84% 81%",
  "--color-error-500": "0 84% 60%",
  "--color-error-600": "0 85% 48%",
  "--color-error-700": "0 86% 38%",

  "--color-info-50": "206 93% 91%",
  "--color-info-100": "206 93% 81%",
  "--color-info-500": "206 89% 52%",
  "--color-info-600": "206 90% 40%",
  "--color-info-700": "206 91% 31%",

  "--color-neutral-0": "0 0% 0%",
  "--color-neutral-50": "220 13% 91%",
  "--color-neutral-100": "220 13% 82%",
  "--color-neutral-200": "220 13% 73%",
  "--color-neutral-300": "220 13% 64%",
  "--color-neutral-400": "220 12% 50%",
  "--color-neutral-500": "220 11% 40%",
  "--color-neutral-600": "220 11% 30%",
  "--color-neutral-700": "220 12% 20%",
  "--color-neutral-800": "220 13% 10%",
  "--color-neutral-900": "220 12% 5%",
  "--color-neutral-950": "220 14% 2%",
} as const;

/**
 * Light mode CSS variables (opt-in via class)
 */
export const lightModeVars = {
  "--color-primary-50": "220 13% 98%",
  "--color-primary-100": "220 13% 96%",
  "--color-primary-200": "220 14% 91%",
  "--color-primary-300": "220 13% 82%",
  "--color-primary-400": "220 14% 65%",
  "--color-primary-500": "220 12% 48%", // Main primary
  "--color-primary-600": "220 13% 40%",
  "--color-primary-700": "220 13% 30%",
  "--color-primary-800": "220 13% 20%",
  "--color-primary-900": "220 12% 10%",
  "--color-primary-950": "220 14% 5%",

  "--color-success-50": "142 71% 96%",
  "--color-success-100": "142 71% 92%",
  "--color-success-500": "142 71% 45%",
  "--color-success-600": "142 72% 36%",
  "--color-success-700": "142 73% 29%",

  "--color-warning-50": "38 92% 95%",
  "--color-warning-100": "38 93% 90%",
  "--color-warning-500": "38 92% 50%",
  "--color-warning-600": "38 90% 40%",
  "--color-warning-700": "38 89% 31%",

  "--color-error-50": "0 84% 96%",
  "--color-error-100": "0 84% 92%",
  "--color-error-500": "0 84% 60%",
  "--color-error-600": "0 85% 48%",
  "--color-error-700": "0 86% 38%",

  "--color-info-50": "206 93% 96%",
  "--color-info-100": "206 93% 92%",
  "--color-info-500": "206 89% 52%",
  "--color-info-600": "206 90% 40%",
  "--color-info-700": "206 91% 31%",

  "--color-neutral-0": "0 0% 100%",
  "--color-neutral-50": "220 13% 98%",
  "--color-neutral-100": "220 13% 96%",
  "--color-neutral-200": "220 13% 91%",
  "--color-neutral-300": "220 13% 82%",
  "--color-neutral-400": "220 12% 70%",
  "--color-neutral-500": "220 11% 50%",
  "--color-neutral-600": "220 11% 35%",
  "--color-neutral-700": "220 12% 20%",
  "--color-neutral-800": "220 13% 10%",
  "--color-neutral-900": "220 12% 5%",
  "--color-neutral-950": "220 14% 2%",
} as const;
