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
  {
    path: '/ops/logs',
    component: () => import('../views/ops/OpsLogManageView.vue'),
    children: [
      { path: '', redirect: '/ops/logs/operation/query' },
      { path: 'operation/query', component: () => import('../views/ops/logs/OperationLogQuery.vue') },
      { path: 'operation/config', component: () => import('../views/ops/logs/OperationLogConfig.vue') },
      { path: 'operation/cluster', component: () => import('../views/ops/logs/OperationLogCluster.vue') },
      { path: 'runtime/query', component: () => import('../views/ops/logs/RuntimeLogQuery.vue') },
      { path: 'runtime/download', component: () => import('../views/ops/logs/RuntimeLogDownload.vue') },
      { path: 'config/tasks', component: () => import('../views/ops/logs/LogCollectTasks.vue') },
      { path: 'config/tasks/create', component: () => import('../views/ops/logs/LogCollectTaskCreate.vue') },
      { path: 'config/forward', component: () => import('../views/ops/logs/LogForwardTasks.vue') },
      { path: 'config/templates', component: () => import('../views/ops/logs/LogCollectTemplates.vue') },
      { path: 'config/destinations', component: () => import('../views/ops/logs/LogForwardDestinations.vue') },
      { path: 'config/download-settings', component: () => import('../views/ops/logs/LogDownloadConfig.vue') },
    ],
  },
  {
    path: '/ops/account',
    component: () => import('../views/ops/account/AccountView.vue'),
    children: [
      { path: '', redirect: '/ops/account/os/list' },
      { path: 'os/list', component: () => import('../views/ops/account/OsAccountList.vue') },
      { path: 'os/policy', component: () => import('../views/ops/account/OsAccountPolicy.vue') },
      { path: 'os/thirdparty', component: () => import('../views/ops/account/ThirdPartyMgmt.vue') },
      { path: 'db/list', component: () => import('../views/ops/account/DbAccountList.vue') },
      { path: 'db/policy', component: () => import('../views/ops/account/DbAccountPolicy.vue') },
      { path: 'op/list', component: () => import('../views/ops/account/OpAccountList.vue') },
      { path: 'op/policy', component: () => import('../views/ops/account/OpAccountPolicy.vue') },
      { path: 'middleware/list', component: () => import('../views/ops/account/MiddlewareAccountList.vue') },
      { path: 'middleware/policy', component: () => import('../views/ops/account/MiddlewareAccountPolicy.vue') },
      { path: 'device/list', component: () => import('../views/ops/account/DeviceAccountList.vue') },
      { path: 'device/policy', component: () => import('../views/ops/account/DeviceAccountPolicy.vue') },
      { path: 'apply/history', component: () => import('../views/ops/account/ApplyHistory.vue') },
      { path: 'apply/new', component: () => import('../views/ops/account/ApplyNew.vue') },
      { path: 'apply/create', component: () => import('../views/ops/account/ApplyCreatePage.vue') },
      { path: 'config/backup', component: () => import('../views/ops/account/ConfigBackup.vue') },
      { path: 'config/esight-bmc', component: () => import('../views/ops/account/ConfigEsightBmc.vue') },
      { path: 'config/snapshot', component: () => import('../views/ops/account/ConfigSnapshot.vue') },
      { path: 'safebox', component: () => import('../views/ops/account/SafeBoxView.vue') },
    ],
  },
  { path: '/ops/inspect', name: 'ops-inspect', component: () => import('../views/ops/InspectView.vue') },

  {
    path: '/system/security',
    component: () => import('../views/system/SecurityView.vue'),
    children: [
      { path: '', redirect: '/system/security/users' },
      { path: 'users', component: () => import('../views/system/security/UserManagement.vue') },
      { path: 'user-groups', component: () => import('../views/system/security/UserGroupsView.vue') },
      { path: 'policies', component: () => import('../views/system/security/PoliciesView.vue') },
      { path: 'roles', component: () => import('../views/system/security/RolesView.vue') },
      { path: 'resource-groups', component: () => import('../views/system/security/ResourceGroupsView.vue') },
      { path: 'app-integration', component: () => import('../views/system/security/AppIntegrationView.vue') },
      { path: 'app-integration/create', component: () => import('../views/system/security/AppCreatePage.vue') },
      { path: 'idp', component: () => import('../views/system/security/IdentityProvidersView.vue') },
      { path: 'idp/create', component: () => import('../views/system/security/IdpCreatePage.vue') },
      { path: 'integration-accounts', component: () => import('../views/system/security/IntegrationAccountsView.vue') },
    ],
  },
  { path: '/system/users', redirect: '/system/security' },
  { path: '/system/config', name: 'system-config', component: () => import('../views/system/SystemConfigView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router