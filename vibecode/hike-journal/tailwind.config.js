/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f2f7ec',
          100: '#ddecc6',
          200: '#bad794',
          300: '#92be5e',
          400: '#72a43b',
          500: '#568829',
          600: '#406a1e',
          700: '#2e4f16',
          800: '#1e350e',
          900: '#111f08',
          950: '#090f04',
        },
        gold: {
          300: '#e8c46a',
          400: '#d4a030',
          500: '#b8841a',
          600: '#8f6210',
        },
        stone: {
          50:  '#faf8f3',
          100: '#f2ede0',
          200: '#e2d8c0',
          300: '#ccbd98',
          400: '#b09e74',
          500: '#8c7c54',
          600: '#6e6040',
          700: '#52472e',
          800: '#38301e',
          900: '#1e1a0e',
          950: '#100d06',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':       '0 2px 16px rgba(9,15,4,0.5)',
        'card-hover': '0 8px 40px rgba(9,15,4,0.75), 0 0 0 1px rgba(114,164,59,0.15)',
        'glow-green': '0 0 30px rgba(114,164,59,0.2)',
        'glow-gold':  '0 0 30px rgba(212,160,48,0.2)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up':   'fade-up 0.4s ease-out both',
        'fade-in':   'fade-in 0.3s ease-out both',
        'scale-in':  'scale-in 0.3s ease-out both',
        shimmer:     'shimmer 2s linear infinite',
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
      },
      letterSpacing: {
        widest2: '0.2em',
      },
    },
  },
  plugins: [],
}
