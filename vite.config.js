// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'), // allows `@/components/...`
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // your Express server
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
