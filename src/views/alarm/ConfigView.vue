<template>
  <div class="page-view">
    <div class="page-header">
      <h2>告警规则</h2>
    </div>
    <div class="filter-actions-bar"><a-button type="primary"><i class="fa-solid fa-plus"></i> 新建规则</a-button></div>
    <div class="filter-bar">
      <a-select v-model:value="filterLevel" placeholder="告警级别" style="width:120px" allowClear>
        <a-select-option value="critical">紧急</a-select-option>
        <a-select-option value="warning">重要</a-select-option>
        <a-select-option value="info">次要</a-select-option>
      </a-select>
      <a-input-search v-model:value="filterSearch" placeholder="搜索规则名称" class="search-input" />
    </div>
    <a-table
      :columns="columns"
      :data-source="filteredRules"
      :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
      row-key="id"
      :scroll="{ y: scrollY, x: 1100 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'level'">
          <a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag>
        </template>
        <template v-if="column.key === 'enabled'">
          <a-switch v-model:checked="record.enabled" />
        </template>
        <template v-if="column.key === 'action'">
          <div class="action-btns">
            <a-tooltip title="编辑"><button class="icon-btn"><i class="fa-solid fa-pen"></i></button></a-tooltip>
            <a-tooltip title="删除"><button class="icon-btn danger"><i class="fa-solid fa-trash"></i></button></a-tooltip>
          </div>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const filterSearch = ref('')
const filterLevel = ref(null)
const scrollY = ref(500)

const rules = ref([
  { id: 1, name: 'CPU使用率过高', level: 'critical', target: '所有服务器', metric: 'cpu_usage', condition: '> 90%', duration: '5分钟', enabled: true, description: '当服务器CPU使用率持续超过90%时触发告警' },
  { id: 2, name: '磁盘空间不足', level: 'critical', target: '数据库服务器', metric: 'disk_usage', condition: '> 90%', duration: '10分钟', enabled: true, description: '磁盘使用率超过90%时触发，防止磁盘写满' },
  { id: 3, name: '数据库主从延迟', level: 'critical', target: '所有数据库', metric: 'replication_delay', condition: '> 10s', duration: '5分钟', enabled: true, description: '主从复制延迟超过10秒时触发' },
  { id: 4, name: '内存使用率偏高', level: 'warning', target: '应用服务器', metric: 'mem_usage', condition: '> 80%', duration: '15分钟', enabled: true, description: '内存使用率超过80%持续15分钟时触发' },
  { id: 5, name: '响应时间超时', level: 'warning', target: 'API网关', metric: 'response_time', condition: '> 2000ms', duration: '5分钟', enabled: true, description: 'API平均响应时间超过2秒时触发' },
  { id: 6, name: 'HTTP 5xx错误率上升', level: 'warning', target: '所有负载均衡', metric: 'error_rate_5xx', condition: '> 1%', duration: '5分钟', enabled: false, description: '5xx错误率超过1%时触发' },
  { id: 7, name: 'Redis连接数接近上限', level: 'info', target: 'Redis集群', metric: 'redis_connections', condition: '> 80%', duration: '10分钟', enabled: true, description: 'Redis连接数使用率超过80%时触发' },
  { id: 8, name: 'SSL证书即将过期', level: 'info', target: '所有域名', metric: 'cert_days_left', condition: '< 30天', duration: '1天', enabled: true, description: 'SSL证书剩余有效期少于30天时提醒' },
  { id: 9, name: 'K8s Pod频繁重启', level: 'critical', target: '生产环境', metric: 'pod_restart_rate', condition: '> 3次/小时', duration: '1小时', enabled: true, description: 'Pod每小时重启超过3次时触发' },
  { id: 10, name: '消息队列积压', level: 'warning', target: 'Kafka消费者', metric: 'queue_backlog', condition: '> 10000条', duration: '15分钟', enabled: true, description: '消息队列积压超过1万条时触发' },
  { id: 11, name: '网络丢包率过高', level: 'warning', target: '所有网络设备', metric: 'packet_loss', condition: '> 1%', duration: '10分钟', enabled: false, description: '网络丢包率超过1%时触发' },
  { id: 12, name: 'NTP时间偏移', level: 'info', target: '所有服务器', metric: 'ntp_offset', condition: '> 500ms', duration: '30分钟', enabled: true, description: 'NTP时间偏移超过500ms时触发' },
  { id: 13, name: 'MySQL慢查询增多', level: 'warning', target: '数据库主库', metric: 'slow_queries', condition: '> 50/分钟', duration: '10分钟', enabled: true, description: '慢查询数量超过50条/分钟时触发' },
  { id: 14, name: '容器OOMKilled', level: 'critical', target: '所有容器', metric: 'oom_killed', condition: '> 0次', duration: '实时', enabled: true, description: '容器被OOM Kill时立即触发' },
  { id: 15, name: '备份任务失败', level: 'info', target: '备份服务器', metric: 'backup_status', condition: 'failed', duration: '实时', enabled: true, description: '备份任务执行失败时触发' },
  { id: 16, name: '负载均衡后端离线', level: 'critical', target: '所有SLB', metric: 'backend_health', condition: 'offline', duration: '实时', enabled: true, description: '负载均衡后端服务器不可用时触发' },
])

const columns = [
  { title: '规则名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '级别', key: 'level', width: 80 },
  { title: '目标资源', dataIndex: 'target', key: 'target', width: 140 },
  { title: '指标', dataIndex: 'metric', key: 'metric', width: 130 },
  { title: '条件', dataIndex: 'condition', key: 'condition', width: 100 },
  { title: '持续时长', dataIndex: 'duration', key: 'duration', width: 100 },
  { title: '状态', key: 'enabled', width: 70 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]

const getLevelColor = function(level) {
  var map = { critical: 'red', warning: 'orange', info: 'blue' }
  return map[level] || 'default'
}

const getLevelText = function(level) {
  var map = { critical: '紧急', warning: '重要', info: '次要' }
  return map[level] || level
}

const filteredRules = computed(function() {
  var list = rules.value
  if (filterSearch.value) {
    var kw = filterSearch.value.toLowerCase()
    list = list.filter(function(r) { return r.name.toLowerCase().includes(kw) || r.description.toLowerCase().includes(kw) })
  }
  if (filterLevel.value) {
    list = list.filter(function(r) { return r.level === filterLevel.value })
  }
  return list
})

function updateScrollY() {
  scrollY.value = window.innerHeight - 380
}

onMounted(function() {
  updateScrollY()
  window.addEventListener('resize', updateScrollY)
})

onUnmounted(function() {
  window.removeEventListener('resize', updateScrollY)
})
</script>

<style scoped>
.page-view { display: flex; flex-direction: column; padding: 16px 0 0; height: 100%; }
.page-header { margin-bottom: 16px; flex-shrink: 0; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.filter-actions-bar { display: flex; gap: 8px; margin-bottom: 8px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-shrink: 0; align-items: center; }
.filter-bar :deep(.ant-input-search) { flex: 1; }
.search-input { flex: 1; min-width: 200px; }
:deep(.ant-table-wrapper) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
:deep(.ant-table) { flex: 1; min-height: 0; }
:deep(.ant-table-container) { flex: 1; min-height: 0; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
.action-btns { display: flex; gap: 4px; }
.icon-btn { width: 28px; height: 28px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.icon-btn:hover { background: var(--bg-sec); color: var(--brand); }
.icon-btn.danger:hover { color: #f5222d; }

@media (max-width: 768px) {
  .filter-bar { flex-direction: column; }
  .filter-bar .ant-select,
  .filter-bar input { width: 100% !important; }
}
</style>
