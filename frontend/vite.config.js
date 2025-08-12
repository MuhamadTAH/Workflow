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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') && !id.includes('router')) {
              return 'vendor';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('@xyflow') || id.includes('reactflow')) {
              return 'workflow';
            }
            if (id.includes('axios') || id.includes('uuid')) {
              return 'utils';
            }
            return 'vendor';
          }
          if (id.includes('src/workflownode')) {
            return 'workflow-components';
          }
          if (id.includes('src/pages')) {
            return 'pages';
          }
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    target: 'esnext',
    minify: 'esbuild'
  },
  server: {
    historyApiFallback: true,
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