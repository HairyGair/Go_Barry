import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = command === 'build'
  const isLegacy = mode === 'legacy'
  
  return {
    plugins: [
      react({
        // Enable JSX for .js files (legacy compatibility)
        include: /\.(jsx|js|ts|tsx)$/,
        babel: {
          parserOpts: {
            plugins: ['jsx']
          }
        }
      }),
      
      // Legacy browser support (IE11+)
      ...(isLegacy ? [
        legacy({
          targets: ['defaults', 'not IE 11']
        })
      ] : []),
      
      // Bundle analysis in production
      ...(isProduction ? [
        visualizer({
          filename: 'dist/bundle-analysis.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
        compression({
          algorithm: 'gzip',
          ext: '.gz',
        }),
        compression({
          algorithm: 'brotliCompress',
          ext: '.br',
        }),
      ] : []),
    ],
    
    build: {
      rollupOptions: {
        input: {
          'breakdown-guide': resolve(__dirname, 'breakdown-guide/index.html'),
          'breakdown-guide-modern': resolve(__dirname, 'breakdown-guide/index-modern.html'),
          'breakdown-analytics': resolve(__dirname, 'breakdown-analytics/index.html'),
          'dashboard': resolve(__dirname, 'dashboard/index.html'),
        },
        
        output: {
          // Optimize chunk splitting
          manualChunks: (id) => {
            // Vendor chunk for React and core dependencies
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor'
              }
              if (id.includes('zustand')) {
                return 'state-vendor'
              }
              return 'vendor'
            }
            
            // Wizard components chunk
            if (id.includes('/wizards/')) {
              return 'wizards'
            }
            
            // Common components chunk
            if (id.includes('/components/common')) {
              return 'common'
            }
            
            // Services chunk
            if (id.includes('/services/')) {
              return 'services'
            }
          },
          
          // Optimize asset naming
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
        
        // Don't externalize for modern builds - keep everything bundled for better optimization
        ...(isLegacy ? {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM'
            }
          }
        } : {}),
      },
      
      outDir: isLegacy ? 'dist/legacy' : 'dist',
      sourcemap: !isProduction ? true : 'hidden', // Hidden sourcemaps in production
      minify: isProduction ? 'terser' : false,
      
      // Terser options for maximum compression
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        mangle: {
          safari10: true,
        },
        format: {
          safari10: true,
        },
      } : {},
      
      // Optimize chunk size warnings
      chunkSizeWarningLimit: 1000,
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Report compressed size
      reportCompressedSize: isProduction,
      
      // Target modern browsers for better optimization
      target: isLegacy ? 'es2015' : 'esnext',
    },
    
    server: {
      port: 3001,
      open: '/breakdown-guide/index-modern.html',
      host: true, // Allow external connections
      proxy: {
        // Proxy API requests to dedicated backend
        '/api': {
          target: 'http://localhost:3003',
          changeOrigin: true,
          secure: false,
          ws: true
        },
        '/gne-fleet-database.json': {
          target: 'http://localhost:3003',
          changeOrigin: true
        }
      }
    },
    
    preview: {
      port: 3001,
      host: true,
    },
    
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
        '@components': resolve(__dirname, 'breakdown-guide/components'),
        '@services': resolve(__dirname, 'breakdown-guide/services'),
        '@stores': resolve(__dirname, 'breakdown-guide/src/stores'),
        '@styles': resolve(__dirname, 'breakdown-guide/styles'),
        '@utils': resolve(__dirname, 'breakdown-guide/utils'),
      },
    },
    
    define: {
      // Expose some globals for backward compatibility
      'global': 'globalThis',
      // Enable production optimizations
      '__DEV__': !isProduction,
    },
    
    esbuild: {
      // Handle JSX in .js files
      loader: 'jsx',
      include: /\.(jsx|js)$/,
      // Drop console in production
      drop: isProduction ? ['console', 'debugger'] : [],
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'zustand'
      ],
      exclude: ['@vite/client', '@vite/env'],
    },
    
    // CSS optimization
    css: {
      devSourcemap: !isProduction,
      preprocessorOptions: {
        css: {
          charset: false,
        },
      },
    },
  }
})