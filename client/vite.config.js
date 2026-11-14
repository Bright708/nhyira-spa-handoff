import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // During local dev, /api calls go to the Express server.
    proxy: { '/api': 'http://localhost:4000' },
  },
})
