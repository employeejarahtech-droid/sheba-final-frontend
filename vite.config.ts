import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-router', '@tanstack/react-query'],
    force: false,
  },
  server: {
    fs: {
      strict: false,
    },
    watch: {
      usePolling: false,
      interval: 1000,
    },
    hmr: {
      overlay: true,
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split large packages into separate chunks
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack')) {
              return 'tanstack'
            }
            if (id.includes('lucide-react')) {
              return 'icons'
            }
            if (id.includes('react')) {
              return 'react-vendor'
            }
            return 'vendor'
          }
        },
      },
    },
  },
})
