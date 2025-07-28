// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',          // relative assets, good for Netlify
  server: { open: true } // optional, keep if you like it opening on dev
});
