import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electronRenderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // 增加 chunk size 警告的阈值，默认是 500kB，这里增加到 1000kB
    chunkSizeWarningLimit: 1000,  

    // 手动分割 chunk
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 如果模块来自 node_modules 文件夹，将它们打包到 vendor.js 中
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
