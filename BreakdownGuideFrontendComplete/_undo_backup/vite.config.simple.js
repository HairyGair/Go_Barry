import { defineConfig } from 'vite'
import { resolve } from 'path'

// Simplified config for deployment
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // Just build the main guide for now
        main: resolve(__dirname, 'index.html'),
        guide: resolve(__dirname, 'breakdown-guide/guide.html'),
        dashboard: resolve(__dirname, 'dashboard/sdc-operations-dashboard.html'),
      },
    },
    outDir: 'dist',
    sourcemap: false,
    minify: true,
  },
  
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
