import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    host: true, // expose on your local network so phones can connect
    port: 3000,
    strictPort: true, // fail loudly if port 3000 is busy — avoids wrong Network URL
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
