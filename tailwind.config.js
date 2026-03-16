/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Farben basierend auf dem KochPlan Design System
      colors: {
        // Primary Palette
        primary: {
          DEFAULT: '#F97316', // orange-500
          light: '#FB923C',   // orange-400
          dark: '#EA580C',    // orange-600
          subtle: '#FFF7ED',  // orange-50
        },
        // Secondary Palette
        secondary: {
          DEFAULT: '#92400E', // amber-800
          light: '#B45309',   // amber-700
        },
        // Background Colors
        background: {
          DEFAULT: '#FFFBEB', // amber-50
          card: '#FFFFFF',
          elevated: '#FEF3C7', // amber-100
        },
        // Text Colors
        text: {
          primary: '#451A03',   // amber-950
          secondary: '#78350F', // amber-900
          muted: '#A16207',     // amber-700
        },
        // Semantic Colors
        success: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#EAB308',
          light: '#FEF9C3',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
        info: {
          DEFAULT: '#3B82F6',
        },
        // Kitchen Mode Colors
        kitchen: {
          bg: '#1A1A1A',
          card: '#262626',
          elevated: '#404040',
          text: '#FFFFFF',
          muted: '#A3A3A3',
        },
      },
      
      // Schriftarten
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      // Schriftgrößen
      fontSize: {
        // Kitchen Mode extra large sizes
        'kitchen-sm': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],   // 18px
        'kitchen-base': ['1.25rem', { lineHeight: '1.4', fontWeight: '400' }],  // 20px
        'kitchen-lg': ['1.5rem', { lineHeight: '1.5', fontWeight: '500' }],     // 24px
        'kitchen-xl': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],       // 32px
        'kitchen-timer': ['5rem', { lineHeight: '1', fontWeight: '700' }],      // 80px
      },
      
      // Abstände
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '88': '22rem',    // 352px
      },
      
      // Border Radius
      borderRadius: {
        '2xl': '1rem',     // 16px
        '3xl': '1.5rem',   // 24px
        '4xl': '2rem',     // 32px
      },
      
      // Schatten
      boxShadow: {
        'warm': '0 4px 14px rgba(249, 115, 22, 0.15)',
        'warm-lg': '0 8px 24px rgba(249, 115, 22, 0.2)',
        'inner-warm': 'inset 0 2px 4px rgba(249, 115, 22, 0.06)',
        'kitchen': '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
      
      // Z-Index
      zIndex: {
        'dropdown': '10',
        'sticky': '20',
        'nav': '30',
        'modal': '40',
        'popover': '50',
        'toast': '60',
        'overlay': '70',
      },
      
      // Animationen
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounceShort 0.5s ease-in-out 1',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceShort: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      
      // Transition Timing
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // Minimale Größen für Touch Targets
      minWidth: {
        'touch': '44px',
        'touch-kitchen': '64px',
        'button-kitchen': '80px',
      },
      minHeight: {
        'touch': '44px',
        'touch-kitchen': '64px',
        'button-kitchen': '80px',
      },
    },
  },
  plugins: [
    // Plugin für Kitchen Mode Utilities
    function({ addUtilities }) {
      const kitchenUtilities = {
        '.kitchen-mode': {
          backgroundColor: '#1A1A1A',
          color: '#FFFFFF',
        },
        '.kitchen-text': {
          fontSize: '1.125rem',
          lineHeight: '1.5',
        },
        '.kitchen-button': {
          minWidth: '80px',
          minHeight: '80px',
          fontSize: '1.5rem',
          fontWeight: '600',
        },
        '.kitchen-touch': {
          minWidth: '64px',
          minHeight: '64px',
        },
        '.kitchen-card': {
          backgroundColor: '#262626',
          borderRadius: '1rem',
          padding: '2rem',
        },
        '.line-clamp-2': {
          display: '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-3': {
          display: '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.tabular-nums': {
          fontVariantNumeric: 'tabular-nums',
        },
      }
      addUtilities(kitchenUtilities)
    },
  ],
}
