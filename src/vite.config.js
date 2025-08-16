import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // This is the crucial change. It tells Vite to use relative paths.
  base: './', 
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
