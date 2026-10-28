import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './store/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { navy: '#172554', indigo: '#4F46E5', turquoise: '#0F766E' },
        surface: { page: '#F8FAFC', card: '#FFFFFF', muted: '#EEF2F6' },
        ink: { primary: '#172033', secondary: '#475569', soft: '#64748B' },
        status: { success: '#15803D', warning: '#B45309', danger: '#B91C1C', work: '#64748B' },
        class: { blue: '#2563EB', purple: '#7C3AED', teal: '#0F766E', orange: '#C2410C', rose: '#BE185D' },
      },
      boxShadow: {
        card: '0 16px 40px rgba(23, 37, 84, 0.08)',
        soft: '0 8px 24px rgba(23, 37, 84, 0.12)',
        focus: '0 0 0 4px rgba(79, 70, 229, 0.18)',
      },
      borderRadius: { sm: '8px', md: '12px', lg: '16px', pill: '9999px' },
      fontFamily: { sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}

export default config
