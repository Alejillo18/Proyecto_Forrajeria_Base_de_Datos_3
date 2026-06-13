/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,ts,sass}'],
  theme: {
    extend: {
      colors: {
        forrajería: {
          dark: '#0f172a',
          slate: '#1e293b',
          accent: '#10b981',
          surface: '#334155',
        },
      },
    },
  },
  plugins: [],
};
