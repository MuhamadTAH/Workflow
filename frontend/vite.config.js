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
  build: {
    chunkSizeWarningLimit: 1000, // Raise warning limit to 1000 KB to silence chunk size warnings
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild'
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
