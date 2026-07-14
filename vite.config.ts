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
    port: 5174,
    strictPort: true,
    allowedHosts: ['.lvh.me', '.hms.me', '.hmsap.test', 'localhost'],
    // Proxy disabled - using direct API URL (api.hmsap.test)
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

