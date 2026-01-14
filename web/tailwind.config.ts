import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark eco-theme palette
        background: {
          DEFAULT: '#0f1419',
          secondary: '#1a2027',
          tertiary: '#242d36',
        },
        surface: {
          DEFAULT: '#1e2730',
          hover: '#2a3542',
          active: '#364454',
        },
        eco: {
          50: '#e6f7f4',
          100: '#b3e8df',
          200: '#80d9ca',
          300: '#4dc9b5',
          400: '#26bda4',
          500: '#0d9488', // Primary teal
          600: '#0b7d74',
          700: '#086660',
          800: '#064f4a',
          900: '#033836',
        },
        accent: {
          green: '#22c55e',
          teal: '#14b8a6',
          emerald: '#10b981',
          lime: '#84cc16',
        },
        status: {
          pending: '#f59e0b',
          accepted: '#3b82f6',
          collected: '#22c55e',
          error: '#ef4444',
        },
        confidence: {
          high: '#22c55e',
          medium: '#f59e0b',
          low: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'eco': '0 4px 20px -4px rgba(13, 148, 136, 0.25)',
        'eco-lg': '0 8px 30px -6px rgba(13, 148, 136, 0.35)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
