<template>
  <div>
    <div class="page-header">
      <h3>日志下载</h3>
    </div>
    <a-tabs v-model:activeKey="activeTab" class="log-tabs">
      <a-tab-pane key="admin" tab="管理侧运行日志">
        <div style="margin-bottom: 12px;">
          <a-button>新增日志下载任务</a-button>
        </div>
        <div class="search-bar-wrapper" style="margin-bottom: 16px;">
          <div class="search-bar-inner">
            <i class="fa-solid fa-magnifying-glass" style="color: #999; margin: 0 8px;"></i>
            <a-input placeholder="输入关键字搜索、过滤" :bordered="false" style="flex: 1;" />
            <div class="search-icons">
              <i class="fa-solid fa-magnifying-glass" style="color: #999; cursor: pointer; padding: 0 4px;"></i>
              <i class="fa-solid fa-gear" style="color: #999; cursor: pointer; padding: 0 4px;"></i>
            </div>
          </div>
        </div>
        <a-table :columns="columns" :data-source="data" :pagination="pagination" row-key="id" :scroll="{ x: 900 }" :expandable="{ expandedRowRender: () => h('div', '日志详情'), rowExpandable: () => true, defaultExpandedRowKeys: ['1'] }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <span><i :class="record.status === '成功' ? 'fa-solid fa-circle' : 'fa-solid fa-circle'" :style="{ color: record.status === '成功' ? '#52c41a' : '#ff4d4f', fontSize: '10px', marginRight: '4px' }"></i>{{ record.status }}</span>
            </template>
            <template v-if="column.key === 'progress'">
              <a-progress :percent="record.progress" :stroke-color="record.progress >= 100 ? '#52c41a' : '#007DFF'" :show-info="true" size="small" style="width: 120px;" />
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" style="padding: 0 4px;">下载</a-button>
              <a-button type="link" size="small" style="padding: 0 4px; color: #ff4d4f;">删除</a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="tenant" tab="租户侧管理节点运行日志">
        <div style="margin-bottom: 12px;">
          <a-button>新增日志下载任务</a-button>
        </div>
        <div class="search-bar-wrapper" style="margin-bottom: 16px;">
          <div class="search-bar-inner">
            <i class="fa-solid fa-magnifying-glass" style="color: #999; margin: 0 8px;"></i>
            <a-input placeholder="输入关键字搜索、过滤" :bordered="false" style="flex: 1;" />
            <div class="search-icons">
              <i class="fa-solid fa-magnifying-glass" style="color: #999; cursor: pointer; padding: 0 4px;"></i>
              <i class="fa-solid fa-gear" style="color: #999; cursor: pointer; padding: 0 4px;"></i>
            </div>
          </div>
        </div>
        <a-table :columns="columns" :data-source="tenantData" :pagination="pagination" row-key="id" :scroll="{ x: 900 }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <span><i class="fa-solid fa-circle" :style="{ color: record.status === '成功' ? '#52c41a' : '#ff4d4f', fontSize: '10px', marginRight: '4px' }"></i>{{ record.status }}</span>
            </template>
            <template v-if="column.key === 'progress'">
              <a-progress :percent="record.progress" :stroke-color="record.progress >= 100 ? '#52c41a' : '#007DFF'" :show-info="true" size="small" style="width: 120px;" />
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" style="padding: 0 4px;">下载</a-button>
              <a-button type="link" size="small" style="padding: 0 4px; color: #ff4d4f;">删除</a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, h } from 'vue'

const activeTab = ref('admin')

const columns = [
  { title: '任务名称', dataIndex: 'taskName', width: 200 },
  { title: '用户名', dataIndex: 'user', width: 100 },
  { title: '日志包大小', dataIndex: 'size', width: 100 },
  { title: '时长', dataIndex: 'duration', width: 100 },
  { title: '创建时间', dataIndex: 'created', width: 160 },
  { title: '状态', key: 'status', width: 80 },
  { title: '进度', key: 'progress', width: 140 },
  { title: '操作', key: 'action', width: 110 },
]

const data = ref([
  { id: 1, taskName: 'Sce_Mo6_5_1_Cco_Nni_Log_002-2a3f', user: 'bss_admin', size: '4.83MB', duration: '0分钟 41秒', created: '2025-10-20 06:06:54', status: '成功', progress: 100 },
  { id: 2, taskName: 'Log_Export_20251020_full', user: 'bss_admin', size: '128MB', duration: '2分钟 15秒', created: '2025-10-20 05:00:00', status: '成功', progress: 100 },
  { id: 3, taskName: 'Error_log_collection_001', user: 'bss_admin', size: '45MB', duration: '0分钟 30秒', created: '2025-10-19 22:15:00', status: '失败', progress: 67 },
  { id: 4, taskName: 'Audit_log_weekly_export', user: 'bss_admin', size: '256MB', duration: '5分钟 10秒', created: '2025-10-18 00:00:00', status: '成功', progress: 100 },
])

const tenantData = ref([
  { id: 1, taskName: 'Tenant_Log_Batch_1020', user: 'bss_admin', size: '12.5MB', duration: '1分钟 12秒', created: '2025-10-20 07:00:00', status: '成功', progress: 100 },
  { id: 2, taskName: 'Node_Health_Check_Log', user: 'bss_admin', size: '2.1MB', duration: '0分钟 18秒', created: '2025-10-20 06:30:00', status: '成功', progress: 100 },
  { id: 3, taskName: 'Network_Diagnostic_Dump', user: 'bss_admin', size: '89MB', duration: '3分钟 05秒', created: '2025-10-20 04:00:00', status: '失败', progress: 34 },
  { id: 4, taskName: 'Security_Audit_Tenant_Logs', user: 'bss_admin', size: '512MB', duration: '8分钟 22秒', created: '2025-10-19 23:00:00', status: '成功', progress: 100 },
])

const pagination = { pageSize: 10, total: 153, showTotal: (total, range) => `总条数：${total} | 已选：0`, showSizeChanger: true, current: 14 }
</script>

<style scoped>
.page-header { margin-bottom: 4px; }

.search-bar-wrapper { border: 1px solid #d9d9d9; border-radius: 6px; background: #fff; }
.search-bar-inner { display: flex; align-items: center; padding: 4px 8px; }
.search-bar-inner :deep(.ant-input) { border: none; box-shadow: none; }
.search-bar-inner :deep(.ant-input:focus) { box-shadow: none; }
.search-icons { display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; }
@media (max-width: 768px) {
  .filter-bar { flex-wrap: wrap; }
  .filter-bar .search-bar-wrapper { max-width: 100% !important; margin-left: 0 !important; }
  .page-header h3 { font-size: 15px; }
}
</style>
