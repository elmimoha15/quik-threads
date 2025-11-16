/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--text-primary)',
        card: {
          DEFAULT: 'var(--card-bg)',
          foreground: 'var(--text-primary)',
        },
        popover: {
          DEFAULT: 'var(--card-bg)',
          foreground: 'var(--text-primary)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'var(--background-secondary)',
          foreground: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--primary-50)',
          foreground: 'var(--text-primary)',
        },
        destructive: {
          DEFAULT: 'var(--error)',
          foreground: '#ffffff',
        },
        border: 'var(--card-border)',
        input: 'var(--card-border)',
        ring: 'var(--primary)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
