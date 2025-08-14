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
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          shop: ['reactflow'],
          utils: ['axios']
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    target: 'esnext',
    minify: 'terser',
    sourcemap: false
  },
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'https://shoppro-backend.onrender.com',
        changeOrigin: true,
        secure: true
      },
      '/uploads': {
        target: 'https://shoppro-backend.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})