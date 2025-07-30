import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/engines': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // NEW: Add the optimizeDeps configuration
  // This explicitly tells Vite to find and pre-bundle 'socket.io-client',
  // which resolves the import error.
  optimizeDeps: {
    include: ['socket.io-client'],
  },
})
