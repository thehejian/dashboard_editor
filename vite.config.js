import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['demo3.laohebuhui.dpdns.org'],
    proxy: {
      '/api/v1': {
        target: 'http://192.168.0.155:9090',
        changeOrigin: true,
      }
    }
  },
})
