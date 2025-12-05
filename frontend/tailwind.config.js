/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand color
        primary: {
          DEFAULT: '#6b7ba3',
          50: '#f0f2f6',
          100: '#e1e6ed',
          200: '#c4cdd9',
          300: '#a7b4c5',
          400: '#8a9bb1',
          500: '#6b7ba3',
          600: '#596c96',
          700: '#4a5b7d',
          800: '#3a4964',
          900: '#2a364b',
        },
        // Status colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        // Background colors
        background: {
          DEFAULT: '#f5f5f5',
          secondary: '#1a1a1a',
          tertiary: '#ffffff',
        },
        // Card colors
        card: {
          DEFAULT: '#ffffff',
          border: '#e5e7eb',
          hover: '#f9fafb',
        },
        // Text colors
        foreground: {
          DEFAULT: '#1a1a1a',
          secondary: '#6b7280',
          muted: '#9ca3af',
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
