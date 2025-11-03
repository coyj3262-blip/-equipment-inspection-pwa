/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // South Eastern Excavating brand colors
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b', // Professional dark slate
          900: '#0f172a', // Deep black
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#ffa450',
          500: '#ff8c00', // Construction orange (brand match)
          600: '#ea7500',
          700: '#c25e00',
          800: '#9a4a00',
          900: '#7c3a00',
        },
        // Semantic colors
        success: '#10B981',
        warning: '#fbbf24',
        error: '#EF4444',
        pass: '#22C55E',
        fail: '#DC2626',
        na: '#6B7280',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'card': '1rem',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

