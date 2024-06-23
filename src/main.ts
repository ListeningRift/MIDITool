import { createApp } from 'vue'
import store from './store'
import App from './App.vue'

import './assets/fonts/iconfont.css'
import '@/styles/index.less'

export const app = createApp(App).use(store)
app.mount('#app')
