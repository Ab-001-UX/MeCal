import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/global.css'
import * as Sentry from "@sentry/react"
import posthog from "posthog-js"
import axios from 'axios'

// Auto-conforms daily tracking timers and boundaries to user's country timezone
axios.defaults.headers.common['x-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone
axios.defaults.headers.common['x-timezone-offset'] = new Date().getTimezoneOffset()


// Initialize Sentry dynamically if DSN is provided
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

// Initialize PostHog dynamically if API key is provided
const posthogKey = import.meta.env.VITE_POSTHOG_KEY
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
  })
}

// Global error display to help diagnose blank pages
window.addEventListener('error', (event) => {
  const errorDiv = document.createElement('div')
  errorDiv.style.position = 'fixed'
  errorDiv.style.top = '0'
  errorDiv.style.left = '0'
  errorDiv.style.width = '100vw'
  errorDiv.style.height = '100vh'
  errorDiv.style.backgroundColor = 'rgba(0,0,0,0.95)'
  errorDiv.style.color = '#ff6b6b'
  errorDiv.style.padding = '20px'
  errorDiv.style.zIndex = '999999'
  errorDiv.style.fontFamily = 'monospace'
  errorDiv.style.overflow = 'auto'
  errorDiv.innerHTML = `
    <h1 style="color: #fff; font-size: 20px; margin-bottom: 10px;">⚠️ Runtime Error Detected</h1>
    <p style="font-weight: bold;">${event.message}</p>
    <p>File: ${event.filename}</p>
    <p>Line: ${event.lineno}:${event.colno}</p>
    <pre style="background: #222; color: #ccc; padding: 10px; border-radius: 5px; margin-top: 10px;">${event.error?.stack || 'No stack trace'}</pre>
    <button onclick="location.reload()" style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">Reload App</button>
  `
  document.body.appendChild(errorDiv)
})

window.addEventListener('unhandledrejection', (event) => {
  const errorDiv = document.createElement('div')
  errorDiv.style.position = 'fixed'
  errorDiv.style.top = '0'
  errorDiv.style.left = '0'
  errorDiv.style.width = '100vw'
  errorDiv.style.height = '100vh'
  errorDiv.style.backgroundColor = 'rgba(0,0,0,0.95)'
  errorDiv.style.color = '#ff6b6b'
  errorDiv.style.padding = '20px'
  errorDiv.style.zIndex = '999999'
  errorDiv.style.fontFamily = 'monospace'
  errorDiv.style.overflow = 'auto'
  errorDiv.innerHTML = `
    <h1 style="color: #fff; font-size: 20px; margin-bottom: 10px;">⚠️ Unhandled Promise Rejection</h1>
    <p style="font-weight: bold;">${event.reason?.message || event.reason}</p>
    <pre style="background: #222; color: #ccc; padding: 10px; border-radius: 5px; margin-top: 10px;">${event.reason?.stack || 'No stack trace'}</pre>
    <button onclick="location.reload()" style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">Reload App</button>
  `
  document.body.appendChild(errorDiv)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker only in production (avoids breaking Vite dev)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
