import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    })
    .catch((error) => {
      console.warn('Could not clear stale service workers:', error);
    });
}

if ('caches' in window) {
  caches.keys()
    .then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('north-bengal-tracker'))
        .map((key) => caches.delete(key))
    ))
    .catch((error) => {
      console.warn('Could not clear stale app caches:', error);
    });
}
