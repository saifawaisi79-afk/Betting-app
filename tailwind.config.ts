import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        'surface-1': 'var(--bg-surface-1)',
        'surface-2': 'var(--bg-surface-2)',
        'surface-3': 'var(--bg-surface-3)',
        background: '#06080e',
        foreground: '#f8fafc',
        card: '#0a0f1d',
        'card-foreground': '#f8fafc',
        primary: {
          DEFAULT: '#00e676',
          foreground: '#000000',
          hover: '#00c853',
        },
        secondary: {
          DEFAULT: '#00b0ff',
          foreground: '#000000',
        },
        accent: {
          DEFAULT: '#00e676',
          foreground: '#000000',
          cyan: '#00b0ff',
          purple: '#8b5cf6',
        },
        destructive: {
          DEFAULT: '#ff3366',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#10172a',
          foreground: '#8899aa',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          subtle: 'rgba(255, 255, 255, 0.06)',
          active: 'rgba(0, 230, 118, 0.35)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
