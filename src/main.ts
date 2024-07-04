import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import store from './store'
import App from './App.vue'

import '@/styles/index.less'
import 'primeicons/primeicons.css'

export const app = createApp(App)
  .use(store)
  .use(PrimeVue, {
    theme: {
      preset: Aura
    }
  })
app.mount('#app')
