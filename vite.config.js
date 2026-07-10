import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes all built asset paths relative, so the production build
// works correctly no matter where it's hosted — a GitHub Pages project site
// (username.github.io/repo-name/), a custom domain, Netlify, Vercel, or even
// opened directly from the filesystem. No base-path guessing needed.
export default defineConfig({
  base: './',
  plugins: [react()],
})
