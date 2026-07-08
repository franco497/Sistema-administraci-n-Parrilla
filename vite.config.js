import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    // ✅ Agregar esto para forzar el origen correcto
    origin: 'http://localhost:5173',
  },
  build: {
    outDir: 'dist',
    // ✅ Limpiar la caché de build
    rollupOptions: {
      output: {
        // Forzar nuevos hash en los archivos
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      }
    }
  },
})