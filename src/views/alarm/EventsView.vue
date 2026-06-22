<template>
  <div class="page-view">
    <div class="page-header">
      <h2>事件</h2>
    </div>
    <div class="filter-actions-bar"><a-button type="primary" style="margin-left: auto"><i class="fa-solid fa-download"></i> 导出</a-button></div>
    <div class="filter-bar">
      <a-range-picker v-model:value="timeRange" style="width:260px" />
      <a-select v-model:value="eventType" placeholder="事件类型" style="width:140px" allowClear>
        <a-select-option value="trigger">告警触发</a-select-option>
        <a-select-option value="resolve">告警恢复</a-select-option>
        <a-select-option value="mute">告警屏蔽</a-select-option>
        <a-select-option value="unmute">取消屏蔽</a-select-option>
        <a-select-option value="escalate">告警升级</a-select-option>
        <a-select-option value="assign">分配处理</a-select-option>
      </a-select>
      <a-select v-model:value="eventLevel" placeholder="告警级别" style="width:120px" allowClear>
        <a-select-option value="critical">紧急</a-select-option>
        <a-select-option value="warning">重要</a-select-option>
        <a-select-option value="info">次要</a-select-option>
      </a-select>
      <a-input-search v-model:value="searchText" placeholder="搜索事件、资源" class="search-input" />
    </div>
    <a-table
      :columns="columns"
      :data-source="filteredData"
      :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
      row-key="id"
      :scroll="{ y: scrollY, x: 1200 }"
      :row-class-name="function(record) { return 'row-' + record.level }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'level'">
          <a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag>
        </template>
        <template v-if="column.key === 'type'">
          <a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'closed' ? 'green' : record.status === 'open' ? 'blue' : 'default'">
            {{ record.status === 'closed' ? '已关闭' : record.status === 'open' ? '进行中' : '已处理' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <div class="action-btns">
            <a-tooltip title="查看详情"><button class="icon-btn" @click="openDetail(record)"><i class="fa-solid fa-eye"></i></button></a-tooltip>
          </div>
        </template>
      </template>
    </a-table>

    <div class="detail-panel" :class="{ open: detailVisible }">
      <div class="detail-mask" @click="detailVisible = false"></div>
      <div class="detail-panel-content">
        <div class="detail-header">
          <h3>{{ currentEvent ? currentEvent.title : '事件详情' }}</h3>
          <button class="close-btn" @click="detailVisible = false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="detail-body" v-if="currentEvent">
          <div class="detail-kpi">
            <div class="kpi-item"><div class="kpi-label">事件类型</div><div class="kpi-value"><a-tag :color="getTypeColor(currentEvent.type)">{{ getTypeText(currentEvent.type) }}</a-tag></div></div>
            <div class="kpi-item"><div class="kpi-label">告警级别</div><div class="kpi-value"><a-tag :color="getLevelColor(currentEvent.level)">{{ getLevelText(currentEvent.level) }}</a-tag></div></div>
            <div class="kpi-item"><div class="kpi-label">状态</div><div class="kpi-value"><a-tag :color="currentEvent.status === 'closed' ? 'green' : 'blue'">{{ currentEvent.status === 'closed' ? '已关闭' : '进行中' }}</a-tag></div></div>
            <div class="kpi-item"><div class="kpi-label">发生时间</div><div class="kpi-value">{{ currentEvent.time }}</div></div>
            <div class="kpi-item"><div class="kpi-label">处理人</div><div class="kpi-value">{{ currentEvent.assignee || '未分配' }}</div></div>
            <div class="kpi-item"><div class="kpi-label">持续时间</div><div class="kpi-value">{{ currentEvent.duration }}</div></div>
          </div>
          <div class="section-block">
            <div class="section-title">资源</div>
            <div class="section-body">{{ currentEvent.resource }}</div>
          </div>
          <div class="section-block">
            <div class="section-title">事件描述</div>
            <div class="section-body">{{ currentEvent.description }}</div>
          </div>
          <div class="section-block" v-if="currentEvent.relatedAlerts">
            <div class="section-title">关联告警</div>
            <div class="section-body">{{ currentEvent.relatedAlerts }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const searchText = ref('')
const timeRange = ref(null)
const eventType = ref(null)
const eventLevel = ref(null)
const scrollY = ref(500)
const detailVisible = ref(false)
const currentEvent = ref(null)

const eventsData = ref([
  { id: 1, type: 'trigger', level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)', assignee: '张工', time: '2026-06-17 10:32:00', duration: '45分钟', status: 'open', description: '服务器CPU使用率持续超过90%阈值，已触发紧急告警。疑似异常进程或流量突增导致。', relatedAlerts: 'ALM-1001, ALM-1002' },
  { id: 2, type: 'resolve', level: 'critical', title: 'K8s Pod频繁重启', resource: 'payment-service (prod)', assignee: '王工', time: '2026-06-17 10:00:00', duration: '1小时15分钟', status: 'closed', description: 'Payment-service Pod重启频率恢复正常，OOM问题已解决。', relatedAlerts: 'ALM-1009' },
  { id: 3, type: 'mute', level: 'warning', title: 'HTTP 5xx错误率上升', resource: 'nginx-ingress (华北区域)', assignee: '李工', time: '2026-06-17 09:35:00', duration: '-', status: 'open', description: '因维护窗口期，屏蔽HTTP 5xx错误率告警。', relatedAlerts: 'ALM-1006' },
  { id: 4, type: 'escalate', level: 'critical', title: '数据库主从延迟', resource: 'db-replica-02 (华东区域)', assignee: '王工', time: '2026-06-17 10:15:00', duration: '52分钟', status: 'open', description: '主从延迟从警告升级为紧急，延迟已达35秒，可能影响读写分离。', relatedAlerts: 'ALM-1003' },
  { id: 5, type: 'assign', level: 'warning', title: '内存使用率偏高', resource: 'app-server-03 (华南区域)', assignee: '张工', time: '2026-06-17 10:20:00', duration: '35分钟', status: 'open', description: '已将内存告警分配给张工处理，待排查JVM heap使用情况。', relatedAlerts: 'ALM-1004' },
  { id: 6, type: 'unmute', level: 'info', title: '连接数接近上限', resource: 'redis-cluster (华东区域)', assignee: '-', time: '2026-06-17 11:20:00', duration: '-', status: 'closed', description: '维护升级已完成，取消屏蔽Redis连接数告警。', relatedAlerts: 'ALM-1007' },
  { id: 7, type: 'trigger', level: 'warning', title: '响应时间超时', resource: 'api-gateway (华北区域)', assignee: '王工', time: '2026-06-17 09:45:00', duration: '1小时20分钟', status: 'open', description: 'API网关平均响应时间超过2000ms阈值，影响用户体验。', relatedAlerts: 'ALM-1005' },
  { id: 8, type: 'resolve', level: 'warning', title: '消息队列积压', resource: 'kafka-consumer-group order', assignee: '系统', time: '2026-06-17 10:30:00', duration: '45分钟', status: 'closed', description: 'Kafka消费者积压已消化完毕，积压量降至1000条以下。', relatedAlerts: 'ALM-1010' },
  { id: 9, type: 'trigger', level: 'info', title: '证书即将过期', resource: 'cdn-domain.example.com', assignee: '赵工', time: '2026-06-17 08:00:00', duration: '3小时', status: 'open', description: 'CDN域名SSL证书剩余有效期15天，需尽快续期。', relatedAlerts: 'ALM-1008' },
  { id: 10, type: 'handle', level: 'critical', title: '网络延迟过高', resource: 'lb-001', assignee: '李工', time: '2026-06-16 08:45:00', duration: '30分钟', status: 'closed', description: '负载均衡器网络延迟问题已处理，切换备用链路后恢复正常。', relatedAlerts: 'ALM-1013' },
  { id: 11, type: 'mute', level: 'info', title: 'NTP同步偏移过大', resource: 'ntp-server', assignee: '赵工', time: '2026-06-16 23:05:00', duration: '-', status: 'open', description: '因计划校准时间，屏蔽NTP偏移告警。', relatedAlerts: 'ALM-1012' },
  { id: 12, type: 'escalate', level: 'critical', title: '磁盘空间不足', resource: 'db-primary (华东区域)', assignee: '王工', time: '2026-06-17 10:30:00', duration: '25分钟', status: 'open', description: '磁盘使用率从92%持续上升至95%，紧急升级处理。', relatedAlerts: 'ALM-1002' },
])

const columns = [
  { title: '事件类型', key: 'type', width: 100 },
  { title: '事件标题', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', key: 'resource', ellipsis: true, width: 220 },
  { title: '级别', key: 'level', width: 80 },
  { title: '处理人', dataIndex: 'assignee', key: 'assignee', width: 80 },
  { title: '发生时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '持续时间', dataIndex: 'duration', key: 'duration', width: 100 },
  { title: '状态', key: 'status', width: 90 },
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

const getTypeColor = function(type) {
  var map = { trigger: 'red', resolve: 'green', mute: 'default', unmute: 'blue', escalate: 'orange', assign: 'purple' }
  return map[type] || 'default'
}

const getTypeText = function(type) {
  var map = { trigger: '触发', resolve: '恢复', mute: '屏蔽', unmute: '取消屏蔽', escalate: '升级', assign: '分配' }
  return map[type] || type
}

const filteredData = computed(function() {
  var list = eventsData.value
  if (searchText.value) {
    var kw = searchText.value.toLowerCase()
    list = list.filter(function(e) { return e.title.toLowerCase().includes(kw) || e.resource.toLowerCase().includes(kw) })
  }
  if (eventType.value) {
    list = list.filter(function(e) { return e.type === eventType.value })
  }
  if (eventLevel.value) {
    list = list.filter(function(e) { return e.level === eventLevel.value })
  }
  return list
})

const openDetail = function(event) {
  currentEvent.value = event
  detailVisible.value = true
}

function updateScrollY() {
  scrollY.value = window.innerHeight - 310
}

onMounted(function() {
  updateScrollY()
  window.addEventListener('resize', updateScrollY)
})

onBeforeUnmount(function() {
  window.removeEventListener('resize', updateScrollY)
})
</script>

<style scoped>
.page-view { display: flex; flex-direction: column; padding: 16px 0 0; height: 100%; }
.page-header { margin-bottom: 16px; flex-shrink: 0; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.filter-actions-bar { display: flex; gap: 8px; margin-bottom: 8px; justify-content: flex-end; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-shrink: 0; align-items: center; }
.filter-bar :deep(.ant-input-search) { flex: 1; }
.search-input { flex: 1; min-width: 200px; }
:deep(.ant-table-wrapper) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
:deep(.ant-table) { flex: 1; min-height: 0; }
:deep(.ant-table-container) { flex: 1; min-height: 0; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
:deep(.ant-table-row) { cursor: pointer; }
:deep(.ant-table-row:hover td) { background: #e6f7ff !important; }
:deep(.row-critical) { background: #fff1f0; }
:deep(.row-warning) { background: #fff7e6; }
:deep(.row-critical:hover td) { background: #fff1f0 !important; }
:deep(.row-warning:hover td) { background: #fff7e6 !important; }

.action-btns { display: flex; gap: 4px; }
.icon-btn { width: 28px; height: 28px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.icon-btn:hover { background: var(--bg-sec); color: var(--brand); }

.detail-panel {
  position: fixed;
  top: 48px;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1050;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}
.detail-panel.open { pointer-events: auto; opacity: 1; }
.detail-mask { position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0, 0, 0, 0.3); }
.detail-panel-content {
  position: absolute;
  top: 0;
  right: -560px;
  width: 560px;
  height: 100%;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transition: right 0.3s;
}
.detail-panel.open .detail-panel-content { right: 0; }
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.detail-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.close-btn { font-size: 16px; color: #8c8c8c; border: none; background: transparent; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.close-btn:hover { color: var(--brand); background: var(--bg-sec); }
.detail-body { flex: 1; overflow-y: auto; padding: 0 20px 20px; }
.detail-kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.kpi-item { padding: 12px; background: #fafafa; border-radius: 6px; }
.kpi-label { font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
.kpi-value { font-size: 14px; font-weight: 500; }
.section-block { margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #1a1a1a; padding-bottom: 6px; border-bottom: 1px solid #f0f0f0; }
.section-body { font-size: 13px; color: #595959; line-height: 1.8; }

@media (max-width: 768px) {
  .filter-bar { flex-direction: column; }
  .filter-bar .ant-input-search,
  .filter-bar .ant-select,
  .filter-bar input,
  .filter-bar .ant-input-affix-wrapper { width: 100% !important; }
  .detail-panel-content { width: 100%; right: -100%; }
  .detail-panel.open .detail-panel-content { right: 0; }
  .detail-kpi { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
