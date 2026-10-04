/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aws: {
          orange: '#FF9900',
          squid: '#232F3E',
          deep: '#0F172A',
          blue: '#0073BB',
          lightBlue: '#EBF8FF',
          darkBlue: '#1A2A3A',
          card: '#1E293B',
          border: '#334155',
          hover: '#2D3748',
          accent: '#FF9900',
          danger: '#EF4444',
          success: '#10B981',
          warning: '#F59E0B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace']
      },
      boxShadow: {
        'glow-orange': '0 0 15px rgba(255, 153, 0, 0.3)',
        'glow-blue': '0 0 15px rgba(0, 115, 187, 0.3)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
