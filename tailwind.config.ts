import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        keypress: {
          '0%, 100%': { transform: 'scale(1)', backgroundColor: 'rgb(59 130 246)' },
          '50%': { transform: 'scale(0.95)', backgroundColor: 'rgb(37 99 235)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        keypress: 'keypress 0.1s ease-in-out',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
