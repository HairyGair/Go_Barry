import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable JSX for .js files (legacy compatibility)
      include: /\.(jsx|js|ts|tsx)$/,
      babel: {
        parserOpts: {
          plugins: ['jsx']
        }
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        'breakdown-guide-modern': resolve(__dirname, 'breakdown-guide/index-modern.html'),
        'breakdown-analytics': resolve(__dirname, 'breakdown-analytics/index.html'),
      },
      external: [
        // Externalize React for CDN loading in legacy mode
        'react',
        'react-dom'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3001,
    open: '/breakdown-guide/index-modern.html',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@components': resolve(__dirname, 'breakdown-guide/components'),
      '@services': resolve(__dirname, 'breakdown-guide/services'),
      '@styles': resolve(__dirname, 'styles'),
    },
  },
  define: {
    // Expose some globals for backward compatibility
    'global': 'globalThis',
  },
  esbuild: {
    // Handle JSX in .js files
    loader: 'jsx',
    include: /\.(jsx|js)$/,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand']
  }
})