import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electronRenderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    //Increase the threshold for chunk size warning, default is 500kB, here it is increased to 1000kB
    chunkSizeWarningLimit: 1000,  

    //Manually split chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          //If the modules come from the Node.js folder, package them into vendor. js
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  plugins: [
    react(),
    electronRenderer({
      nodeIntegration: true,
    }),
  ],
  server: {
    port: 5173,
    open: true
  }
})
