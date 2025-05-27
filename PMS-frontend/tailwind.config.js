/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-rainbow': 'linear-gradient(to right, #ff9a9e, #fad0c4, #fad0c4, #a1c4fd, #c2e9fb)',
        // Highly interactive, vibrant, and modern dark diagonal gradient
        'gradient-rainbow-dark': 'linear-gradient(135deg, #22c1c3,#fdbb2d)'
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'blink': 'blink 0.75s step-end infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      scale: {
        '102': '1.02',
        '98': '0.98',
      },
      spacing: {
        '55': '13.75rem',
      },
      transitionTimingFunction: {
        'bounce-sm': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionProperty: {
        'width': 'width',
        'spacing': 'margin, padding',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}