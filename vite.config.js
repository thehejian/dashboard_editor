import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'basic-auth',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const auth = req.headers['authorization']
          if (auth) {
            const base64 = auth.split(' ')[1]
            const [user, pass] = Buffer.from(base64, 'base64').toString().split(':')
            if (user === 'admin' && pass === '745544752') {
              return next()
            }
          }
          res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard Editor"')
          res.statusCode = 401
          res.end('Unauthorized')
        })
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['demo3.laohebuhui.dpdns.org', 'demo4.laohebuhui.dpdns.org'],
    proxy: {
      '/api/v1': {
        target: 'http://192.168.0.155:9090',
        changeOrigin: true,
      },
      '/api/cmdb': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/vm': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
})
