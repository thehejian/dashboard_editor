import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },

  { path: '/alarm/realtime', name: 'alarm-realtime', component: () => import('../views/alarm/RealtimeView.vue') },
  { path: '/alarm/history', name: 'alarm-history', component: () => import('../views/alarm/HistoryView.vue') },
  { path: '/alarm/config', name: 'alarm-config', component: () => import('../views/alarm/ConfigView.vue') },

  { path: '/monitor/dashboard', name: 'monitor-dashboard', component: () => import('../views/MonitorView.vue') },
  { path: '/monitor/resource', name: 'monitor-resource', component: () => import('../views/monitor/ResourceMonitorView.vue') },
  { path: '/monitor/config', name: 'monitor-config', component: () => import('../views/monitor/MonitorConfigView.vue') },
  { path: '/monitor/topology', name: 'monitor-topology', component: () => import('../views/monitor/TopologyView.vue') },

  { path: '/resource/list', name: 'resource-list', component: () => import('../views/resource/AssetListView.vue') },
  { path: '/resource/topology', name: 'resource-topology', component: () => import('../views/resource/AssetTopologyView.vue') },
  { path: '/resource/changes', name: 'resource-changes', component: () => import('../views/resource/ChangesView.vue') },

  { path: '/ops/jobs', name: 'ops-jobs', component: () => import('../views/ops/JobsView.vue') },
  { path: '/ops/logs', name: 'ops-logs', component: () => import('../views/ops/LogsView.vue') },
  { path: '/ops/inspect', name: 'ops-inspect', component: () => import('../views/ops/InspectView.vue') },

  { path: '/system/security', name: 'system-security', component: () => import('../views/system/SecurityView.vue') },
  { path: '/system/users', redirect: '/system/security' },
  { path: '/system/config', name: 'system-config', component: () => import('../views/system/SystemConfigView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router