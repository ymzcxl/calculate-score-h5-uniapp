import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import uviewPlus from 'uview-plus'
import './uni.promisify.adaptor'

import LoginPage from './pages/login/login.vue'
import ForgotPasswordPage from './pages/login/forgot-password.vue'
import IndexPage from './pages/index/index.vue'
import HistoryPage from './pages/history/history.vue'
import RoomPage from './pages/room/room.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/pages/login/login' },
    { path: '/login', redirect: '/pages/login/login' },
    { path: '/forgot-password', redirect: '/pages/login/forgot-password' },
    { path: '/index', redirect: '/pages/index/index' },
    { path: '/history', redirect: '/pages/history/history' },
    { path: '/room', redirect: '/pages/room/room' },
    { path: '/pages/login/login', component: LoginPage },
    { path: '/pages/login/forgot-password', component: ForgotPasswordPage },
    { path: '/pages/index/index', component: IndexPage },
    { path: '/pages/history/history', component: HistoryPage },
    { path: '/pages/room/room', component: RoomPage }
  ]
})

createApp(App)
  .use(router)
  .use(uviewPlus)
  .mount('#app')
