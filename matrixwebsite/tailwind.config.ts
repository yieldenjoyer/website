import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fff4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Main green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        matrix: {
          green: '#00FF41',
          'dark-green': '#003B00',
          'bright-green': '#39FF14',
          'neon-green': '#0FFF50',
        },
        background: {
          dark: '#0a0a0a',
          darker: '#050505',
          'matrix-dark': '#001100',
        },
      },
      fontFamily: {
        'matrix': ['Orbitron', 'monospace'],
        'tech': ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'matrix-rain': 'matrix-rain 20s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'cyber-glitch': 'cyber-glitch 0.3s ease-in-out infinite alternate',
      },
      keyframes: {
        'matrix-rain': {
          '0%': { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'glow-pulse': {
          '0%': { 
            boxShadow: '0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 15px #00FF41',
          },
          '100%': { 
            boxShadow: '0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 30px #00FF41',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'cyber-glitch': {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
      },
      backdropBlur: {
        'matrix': '8px',
      },
      backgroundImage: {
        'matrix-grid': `
          linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'matrix-grid': '20px 20px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config
