/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",           // Matches App.tsx, index.tsx in root
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mantis-green': '#39ff14',
        'theme-bg': 'var(--color-bg)',
        'theme-text': 'var(--color-text)',
        'theme-accent': 'var(--color-accent)',
        'theme-panel': 'var(--color-panel)',
        'theme-border': 'var(--color-border)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tightest: '-0.08em',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glitch': 'glitch 3s linear infinite',
        'blob': 'blob 7s infinite',
        'marquee': 'marquee 30s linear infinite',
        'scanline': 'scanline 8s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)', opacity: '1' },
          '2%': { transform: 'translate(2px,0) skew(0deg)', opacity: '0.8' },
          '4%': { transform: 'translate(-2px,0) skew(0deg)', opacity: '0.8' },
          '5%': { transform: 'translate(0)', opacity: '1' },
          '59%': { transform: 'translate(0)', opacity: '1' },
          '60%': { transform: 'translate(-2px,0) skew(0deg)', opacity: '0.8' },
          '62%': { transform: 'translate(0,0) skew(5deg)', opacity: '0.8' },
          '63%': { transform: 'translate(0)', opacity: '1' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}