import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/monitor',
    name: 'monitor',
    component: () => import('../views/MonitorView.vue')
  },
  {
    path: '/alarm',
    name: 'alarm',
    component: () => import('../views/AlarmView.vue')
  },
  {
    path: '/resource',
    name: 'resource',
    component: () => import('../views/ResourceView.vue')
  },
  {
    path: '/ops',
    name: 'ops',
    component: () => import('../views/OpsView.vue')
  },
  {
    path: '/system',
    name: 'system',
    component: () => import('../views/SystemView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router