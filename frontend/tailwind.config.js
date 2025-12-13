/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand color - Emerald Green
        primary: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Dark green backgrounds
        dark: {
          DEFAULT: '#0f1a14',
          50: '#1a2e23',
          100: '#1f3a2c',
          200: '#254535',
          300: '#2a503e',
          400: '#305b47',
          500: '#0f1a14',
          600: '#0a1210',
          700: '#060d0a',
          800: '#030605',
          900: '#000000',
        },
        // Status colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        // Background colors
        background: {
          DEFAULT: '#f8faf9',
          dark: '#0f1a14',
          secondary: '#1a2e23',
          tertiary: '#ffffff',
        },
        // Card colors
        card: {
          DEFAULT: '#ffffff',
          dark: '#1a2e23',
          border: '#e5e7eb',
          hover: '#f9fafb',
        },
        // Text colors
        foreground: {
          DEFAULT: '#0f1a14',
          secondary: '#6b7280',
          muted: '#9ca3af',
          light: '#ffffff',
        },
        // Legacy aliases
        border: '#e5e7eb',
        muted: '#f3f4f6',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        'muted-foreground': '#6b7280',
        'primary-foreground': '#ffffff',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
