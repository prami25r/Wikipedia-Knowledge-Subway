import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--theme-bg)',
          surface: 'var(--theme-surface)',
          panel: 'var(--theme-panel)',
          card: 'var(--theme-card)',
          subcard: 'var(--theme-subcard)',
          header: 'var(--theme-header)',
          floating: 'var(--theme-floating)',
          border: 'var(--theme-border)',
          'border-strong': 'var(--theme-border-strong)',
          text: 'var(--theme-text)',
          muted: 'var(--theme-text-muted)',
          soft: 'var(--theme-text-soft)',
          primary: 'var(--theme-line-primary)',
          secondary: 'var(--theme-line-secondary)',
          'primary-soft': 'var(--theme-primary-soft)',
          'secondary-soft': 'var(--theme-secondary-soft)',
          station: 'var(--theme-station)',
          transfer: 'var(--theme-transfer)',
          'transfer-soft': 'var(--theme-transfer-soft)',
          highlight: 'var(--theme-line-highlight)',
          'highlight-soft': 'var(--theme-highlight-soft)',
          danger: 'var(--theme-danger)',
          'danger-soft': 'var(--theme-danger-soft)',
          'canvas-label': 'var(--theme-canvas-label)',
        },
      },
      backgroundImage: {
        'theme-app': 'var(--theme-app-gradient)',
        'theme-hero': 'var(--theme-hero-gradient)',
      },
      boxShadow: {
        'theme-soft': 'var(--theme-shadow-soft)',
        'theme-glow': 'var(--theme-shadow-glow)',
        'theme-strong': 'var(--theme-shadow-strong)',
      },
    },
  },
  plugins: [],
};

export default config;
