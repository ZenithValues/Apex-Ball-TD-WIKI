import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import './index.css'
import App from './App.jsx'

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
