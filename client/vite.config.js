import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determine the backend URL based on environment
  const backendUrl = mode === 'production' 
    ? 'http://72.60.133.119:5000'  // Your VPS IP
    : 'http://localhost:5000';      // Local development

  return {
    plugins: [react()],
    
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/engines': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/badge-icons': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/school-documents': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/socket.io': {
          target: backendUrl,
          changeOrigin: true,
          ws: true, // Enable WebSocket proxying
        },
      },
    },
    // NEW: Add the optimizeDeps configuration
    // This explicitly tells Vite to find and pre-bundle 'socket.io-client',
    // which resolves the import error.
    optimizeDeps: {
      include: ['socket.io-client'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('react')) return 'react';
            if (id.includes('chart.js') || id.includes('recharts')) return 'charts';
            if (id.includes('three')) return 'three';
            if (id.includes('socket.io')) return 'socket';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
            return 'vendor';
          },
        },
      },
    },
  }
})
