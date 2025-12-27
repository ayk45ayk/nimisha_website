import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy is only needed when running 'yarn dev' and you have a separate API server
    // When using 'yarn dev:vercel', Vercel handles the /api routes directly
    // Removing proxy to avoid ECONNREFUSED errors when no API server is running
  }
})
