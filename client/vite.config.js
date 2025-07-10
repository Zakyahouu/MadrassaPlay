import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // NEW: Add the server proxy configuration
  server: {
    proxy: {
      // Any request starting with /api will be proxied
      '/api': {
        target: 'http://localhost:5000', // The address of our backend server
        changeOrigin: true, // Recommended for virtual hosted sites
      },
    },
  },
})
