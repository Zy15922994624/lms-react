import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
    },
    build: {
      assetsInlineLimit: 2048,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name ?? ''
            if (/\.(png|jpe?g|webp|avif|gif|svg)$/i.test(name)) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/\.css$/i.test(name)) {
              return 'assets/styles/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router-dom/') ||
              id.includes('/react-router/')
            ) {
              return 'vendor-react'
            }

            if (id.includes('/@tanstack/')) {
              return 'vendor-query'
            }

            if (id.includes('/@dnd-kit/')) {
              return 'vendor-dnd'
            }

            if (id.includes('/echarts/')) {
              return 'vendor-echarts'
            }

            if (id.includes('/socket.io-client/')) {
              return 'vendor-socket'
            }

            if (
              id.includes('/axios/') ||
              id.includes('/dayjs/') ||
              id.includes('/zustand/')
            ) {
              return 'vendor-utils'
            }

            return
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }
})
