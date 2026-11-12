import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import quietTextHover from './scripts/quiet-text-hover.mjs'
import { BUILD_STAMP } from './src/generated/buildStamp.js'

// 'base' must match where the site is served. The GitHub Actions deploy sets
// VITE_BASE_PATH="/<repo>/" for GitHub Pages project sites; local builds fall
// back to '/' (override with VITE_BASE_PATH for manual subfolder builds).
const githubRepoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const deployBase = process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS && githubRepoName ? `/${githubRepoName}/` : '/');

export default defineConfig({
  base: deployBase,
  plugins: [
    react(),
    {
      // Stamp every built (and prerendered) HTML page with the build id, so
      // `curl <site>/ | grep apex-build` answers "which build is live?"
      // without running a single line of JS.
      name: 'apex-build-meta',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `  <meta name="apex-build" content="${BUILD_STAMP.id}" />\n` +
          `  <meta name="apex-built-at" content="${BUILD_STAMP.builtAt}" />\n</head>`,
        );
      },
    },
  ],
  css: { postcss: { plugins: [quietTextHover()] } },
  // `npm run preview` may sit behind a proxy host (e.g. sandbox previews);
  // static output is served as-is, so any host is fine.
  preview: {
    allowedHosts: true,
  },
  server: {
    // Dev-only: allow testing with the production hostname mapped locally
    // (e.g. --host-resolver-rules) — never used in production builds.
    // '.e2b.app' covers the sandbox preview host.
    allowedHosts: ['apexballvalueswiki.github.io', 'zenithvalues.github.io', '.e2b.app'],
  },
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
          // Keep Three.js out of the entry preload; the hero atmosphere imports it only
          // for capable, fine-pointer, motion-enabled devices.
          if (id.includes('/three/')) return 'vendor-three';
          if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
            return 'vendor-react';
          }
          return 'vendor';
        },
      },
    },
  },
})
