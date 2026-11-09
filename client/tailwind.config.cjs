module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { canvas: '#f5f7fb', white: '#ffffff', ink: '#172033', muted: '#68758a', border: '#e3e8f0', brand: '#3563d9', brandDark: '#274fb5', brandSoft: '#eaf0ff' },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    boxShadow: { card: '0 20px 60px rgba(23, 32, 51, .08)' }
  } },
  plugins: []
};
