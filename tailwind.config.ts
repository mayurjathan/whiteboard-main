import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        clouds: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '400% 0%' }, // simulate scroll
        },
      },
      animation: {
        clouds: 'clouds 60s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
