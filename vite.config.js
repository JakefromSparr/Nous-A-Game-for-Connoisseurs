// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // GitHub Pages needs the repo name as base; local/Netlify can use '/'
  base: mode === 'production' ? '/Nous-A-Game-for-Connoisseurs/' : '/',
  server: { open: true },
}));
