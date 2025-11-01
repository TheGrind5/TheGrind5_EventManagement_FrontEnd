/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Orange
        'orange-primary': '#FF7A00',
        'orange-primary-light': '#FF8A00',
        'orange-primary-dark': '#E66A00',
        'orange-glow': 'rgba(255, 122, 0, 0.5)',
        
        // Secondary: Deep Green
        'green-secondary': '#003820',
        'green-secondary-light': '#004F34',
        'green-secondary-dark': '#002D1A',
        'green-glow': 'rgba(0, 56, 32, 0.4)',
        
        // Alternative Secondary: Dark Navy (for variety)
        'navy-secondary': '#0A1128',
        'navy-secondary-light': '#001F3F',
        'navy-secondary-dark': '#050911',
        
        // Base: Deep Black / Dark Gray
        'base-black': '#0D0D0D',
        'base-dark': '#121212',
        'base-gray': '#1A1A1A',
        'base-gray-light': '#242424',
        
        // Accent
        'accent-white': '#FFFFFF',
        'accent-gray': '#A5A5A5',
        'accent-gray-light': '#C5C5C5',
        'accent-gray-dark': '#858585',
        
        // Legacy FPT colors (for backward compatibility)
        'fpt-orange': '#FF7A00',
        'fpt-orange-dark': '#E66A00',
        'fpt-black': '#0D0D0D',
        'fpt-gray': '#1A1A1A',
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #FF7A00 0%, #FF8A00 100%)',
        'gradient-orange-hover': 'linear-gradient(135deg, #FF8A00 0%, #FF9A20 100%)',
        'gradient-green': 'linear-gradient(135deg, #003820 0%, #004F34 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0D0D0D 0%, #121212 100%)',
        'gradient-glow-orange': 'radial-gradient(circle at center, rgba(255, 122, 0, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'neon-orange': '0 0 10px rgba(255, 122, 0, 0.5), 0 0 20px rgba(255, 122, 0, 0.3)',
        'neon-orange-lg': '0 0 20px rgba(255, 122, 0, 0.6), 0 0 40px rgba(255, 122, 0, 0.4)',
        'neon-green': '0 0 10px rgba(0, 56, 32, 0.5), 0 0 20px rgba(0, 56, 32, 0.3)',
        'neon-teal': '0 0 10px rgba(0, 255, 200, 0.4), 0 0 20px rgba(0, 255, 200, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      borderRadius: {
        'custom': '12px',
        'custom-lg': '14px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-in-out',
        'fade-in': 'fade-in 0.3s ease-in-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 10px rgba(255, 122, 0, 0.5), 0 0 20px rgba(255, 122, 0, 0.3)',
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(255, 122, 0, 0.8), 0 0 40px rgba(255, 122, 0, 0.5)',
          },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      aspectRatio: {
        '16/9': '16 / 9',
        '4/3': '4 / 3',
      },
    },
  },
  plugins: [],
}

