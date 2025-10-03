import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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