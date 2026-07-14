import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import './index.css'
import App from './App.jsx'
import { applyTheme, loadTheme } from './utils/theme.js'

applyTheme(loadTheme())

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline mode is best-effort; ignore registration failures.
    })
  })
}

// HashRouter (not BrowserRouter) is used so the site works correctly when
// hosted on GitHub Pages (or any static host) without needing server-side
// rewrite rules for client-side routes. URLs look like /#/wiki/units/Rares
// instead of /wiki/units/Rares, but every route, refresh, and direct link
// works out of the box.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
