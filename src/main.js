import { createApp } from 'vue'
import antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(antd)
app.use(router)
app.mount('#app')
