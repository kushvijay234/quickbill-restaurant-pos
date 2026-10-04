import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, // Specify a port for the frontend dev server
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true, // This helps with some proxying issues
      }
    }
  }
})