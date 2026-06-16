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
    react({
      tsconfigRoot: './tsconfig.app.json',
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [],
    force: false,
  },
  server: {
    host: true,
    allowedHosts: ['.lvh.me', '.hms.me', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward original Host so backend can extract subdomain
            proxyReq.setHeader('X-Forwarded-Host', req.headers.host || '');
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
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
  },
})
