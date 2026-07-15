import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import './index.css'
import App from './App.jsx'
import { applyTheme, loadTheme } from './config/theme.js'
import { RELEASE_ID } from './utils/release.js'

applyTheme(loadTheme())
document.documentElement.dataset.apexRelease = RELEASE_ID

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js?release=${RELEASE_ID}`)
      await registration.update()

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      })
    } catch {
      // Offline mode is best-effort; ignore registration/update failures.
    }
  })

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const key = `apex-reloaded-${RELEASE_ID}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    window.location.reload()
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
