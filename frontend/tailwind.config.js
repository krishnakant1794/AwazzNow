/** @type {import('tailwindcss').Config} */
export default {
 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
     
      colors: {
        
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316', 
          600: '#EA580C', 
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431409', 
        },
        
        'light-text': '#F0F0F0', 
                'dark-card-bg': 'rgba(30, 30, 30, 0.9)',
      },
            keyframes: {
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },           '100%': { transform: 'translateY(0)', opacity: '1' },           },
        'fade-in': {
          '0%': { opacity: '0' },             '100%': { opacity: '1' },         },
      },
            animation: {
        'slide-down': 'slide-down 0.3s ease-out forwards',         'fade-in': 'fade-in 0.5s ease-out forwards',             },
    },
  },
    plugins: [],
}


