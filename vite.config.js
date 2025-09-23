// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // use localhost to match the app origin
        changeOrigin: true,
        secure: false,
        // these help ensure Set-Cookie makes sense in the browser
        cookieDomainRewrite: 'localhost',
        cookiePathRewrite: '/',
      },
    },
  },
})
