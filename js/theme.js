tailwind.config = {
  darkMode: 'class',
  theme: { extend: {
    colors: {
      brand: { DEFAULT: '#FF2E4C', dark: '#D91E36' },
      bg: 'rgb(var(--bg) / <alpha-value>)',
      surface: 'rgb(var(--surface) / <alpha-value>)',
      ink: 'rgb(var(--ink) / <alpha-value>)',
      muted: 'rgb(var(--muted) / <alpha-value>)',
      line: 'rgb(var(--line) / <alpha-value>)'
    },
    fontFamily: { sans: ['Inter', 'sans-serif'] }
  } }
};
var _s = localStorage.getItem('kyaza_theme');
document.documentElement.classList.toggle('dark', _s ? _s === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
