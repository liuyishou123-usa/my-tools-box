import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ErrorToast from './components/ErrorToast.vue'
import { installGlobalErrorHandler } from './utils/globalError'
import './style.css'

// PWA：Service Worker 离线缓存注册（autoUpdate 模式，新版本自动生效）
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

const app = createApp(App)

// 全局错误拦截：捕获渲染/异步错误，弹友好提示，防止白屏
installGlobalErrorHandler(app)

// 全局注册 Toast 组件
app.component('ErrorToast', ErrorToast)

app.use(router).mount('#app')
