/**
 * StickForge 2D - Tailwind CSS CDN Configuration
 * Separated from HTML for clean script management
 */
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        studio: {
          bg: '#080b10',
          panel: '#10151f',
          card: '#161d2b',
          border: '#242f46',
          accent: '#6366f1',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          sky: '#38bdf8'
        }
      }
    }
  }
};
