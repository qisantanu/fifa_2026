import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    // Set base path to '/fifa2026/' only for GitHub Pages builds, otherwise root '/'
    base: process.env.GITHUB_PAGES === 'true' ? '/fifa2026/' : '/',
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
