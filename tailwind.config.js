/** @type {import('tailwindcss').Config} */
// NEURIX design tokens: Obsidian + Champagne. Every colour used in the UI comes from here.
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      colors: {
        obsidian: '#111111',
        graphite: { DEFAULT: '#202020', deep: '#181818', raised: '#262626' },
        gold: { DEFAULT: '#D6B46A', pale: '#E8D9B5', line: '#514A3C' },
        ivory: '#F7F3EA',
        stone: '#AAA49A',
        sage: '#8BB8A5',
        softblue: '#9AA9D6',
        rose: '#D58F8F',
        bronze: '#38342C',
        divider: '#353535',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px -16px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(214,180,106,0.25), 0 8px 30px -12px rgba(214,180,106,0.25)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up 0.35s ease-out both' },
    },
  },
  plugins: [require('@tailwindcss/forms')({ strategy: 'class' }), require('tailwindcss-animate')],
};
