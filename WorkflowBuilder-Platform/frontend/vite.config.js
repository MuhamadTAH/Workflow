import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://workflow-lg9z.onrender.com',
        changeOrigin: true,
        secure: true
      },
      '/uploads': {
        target: 'https://workflow-lg9z.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
