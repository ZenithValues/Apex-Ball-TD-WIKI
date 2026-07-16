import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes all built asset paths relative, so the production build
// works correctly no matter where it's hosted — a GitHub Pages project site
// (username.github.io/repo-name/), a custom domain, Netlify, Vercel, or even
// opened directly from the filesystem. No base-path guessing needed.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Split large third-party libraries into their own chunks so the main
    // app bundle stays small and vendor code (which rarely changes) can be
    // cached separately by the browser across deploys — faster repeat loads.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lenis')) return 'vendor-lenis';
          if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
            return 'vendor-react';
          }
          return 'vendor';
        },
      },
    },
  },
})
