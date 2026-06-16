<template>
  <div class="page-view">
    <div class="page-header"><h2>实时告警</h2></div>

    <div class="alert-stats">
      <div class="stat-item critical" :class="{ active: filterLevel === 'critical' }" @click="filterLevel = filterLevel === 'critical' ? '' : 'critical'">
        <span class="stat-value">{{ getCountByLevel('critical') }}</span>
        <span class="stat-label">紧急</span>
      </div>
      <div class="stat-item warning" :class="{ active: filterLevel === 'warning' }" @click="filterLevel = filterLevel === 'warning' ? '' : 'warning'">
        <span class="stat-value">{{ getCountByLevel('warning') }}</span>
        <span class="stat-label">重要</span>
      </div>
      <div class="stat-item info" :class="{ active: filterLevel === 'info' }" @click="filterLevel = filterLevel === 'info' ? '' : 'info'">
        <span class="stat-value">{{ getCountByLevel('info') }}</span>
        <span class="stat-label">次要</span>
      </div>
      <div class="stat-item all" :class="{ active: filterLevel === '' }" @click="filterLevel = ''">
        <span class="stat-value">{{ realtimeAlerts.length }}</span>
        <span class="stat-label">全部</span>
      </div>
    </div>

    <div class="filter-bar">
      <a-input-search v-model:value="searchText" placeholder="搜索告警名称、资源" style="width: 280px" />
    </div>

    <a-table
      :columns="columns"
      :data-source="filteredAlerts"
      :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total) => '共 ' + total + ' 条' }"
      :row-selection="{ selectedRowKeys: selectedKeys, onChange: function(keys) { selectedKeys = keys } }"
      row-key="id"
      :row-class-name="function(record) { return 'row-' + record.level }"
      :scroll="{ x: 1200, y: scrollY }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'level'">
          <span class="level-dot" :class="record.level"></span>
          <a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag>
        </template>
        <template v-if="column.key === 'title'">
          <a class="alert-link" @click="openDetail(record)">{{ record.title }}</a>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'firing' ? 'red' : 'green'">
            {{ record.status === 'firing' ? '告警中' : '已恢复' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <div class="action-btns">
            <a-tooltip title="查看详情">
              <button class="icon-btn" @click="openDetail(record)"><i class="fa-solid fa-eye"></i></button>
            </a-tooltip>
            <a-tooltip title="处理告警">
              <button class="icon-btn" @click="handleAlert(record.id)"><i class="fa-solid fa-check"></i></button>
            </a-tooltip>
          </div>
        </template>
      </template>
    </a-table>

    <!-- 告警详情右侧抽屉 -->
    <div class="detail-panel" :class="{ open: detailVisible }">
      <div class="detail-mask" @click="detailVisible = false"></div>
      <div class="detail-panel-content">
        <div class="detail-header">
          <h3>{{ currentAlert ? currentAlert.title : '告警详情' }}</h3>
          <button class="close-btn" @click="detailVisible = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="detail-body" v-if="currentAlert">
          <div class="detail-tabs">
            <button v-for="tab in detailTabs" :key="tab.key"
              class="detail-tab" :class="{ active: activeDetailTab === tab.key }"
              @click="activeDetailTab = tab.key">
              {{ tab.label }}
            </button>
          </div>

          <div v-if="activeDetailTab === 'info'" class="tab-panel">
            <div class="detail-kpi">
              <div class="kpi-item">
                <div class="kpi-label">告警级别</div>
                <div class="kpi-value"><a-tag :color="getLevelColor(currentAlert.level)">{{ getLevelText(currentAlert.level) }}</a-tag></div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">告警状态</div>
                <div class="kpi-value">
                  <a-tag :color="currentAlert.status === 'firing' ? 'red' : 'green'">
                    {{ currentAlert.status === 'firing' ? '告警中' : '已恢复' }}
                  </a-tag>
                </div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">当前值</div>
                <div class="kpi-value">{{ currentAlert.currentValue }}</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">阈值</div>
                <div class="kpi-value">{{ currentAlert.threshold }}</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">持续时间</div>
                <div class="kpi-value">{{ currentAlert.duration }}</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">触发时间</div>
                <div class="kpi-value">{{ currentAlert.triggerTime }}</div>
              </div>
            </div>

            <div class="section-block">
              <div class="section-title">告警源</div>
              <div class="section-body">{{ currentAlert.resource }}</div>
            </div>

            <div class="section-block">
              <div class="section-title">处理建议</div>
              <div class="section-body suggestion">{{ currentAlert.suggestion }}</div>
            </div>
          </div>

          <div v-if="activeDetailTab === 'experience'" class="tab-panel">
            <div class="empty-state">
              <i class="fa-solid fa-book"></i>
              <p>暂无维护经验记录</p>
            </div>
          </div>

          <div v-if="activeDetailTab === 'history'" class="tab-panel">
            <a-table
              :columns="historyRecordColumns"
              :data-source="alertHistoryRecords"
              :pagination="{ pageSize: 5, size: 'small' }"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'level'">
                  <a-tag :color="getLevelColor(record.level)" size="small">{{ getLevelText(record.level) }}</a-tag>
                </template>
                <template v-if="column.key === 'status'">
                  <a-tag :color="record.status === 'resolved' ? 'green' : 'default'" size="small">
                    {{ record.status === 'resolved' ? '已恢复' : '处理中' }}
                  </a-tag>
                </template>
              </template>
            </a-table>
          </div>

          <div v-if="activeDetailTab === 'help'" class="tab-panel">
            <div class="help-section">
              <h4><i class="fa-solid fa-headset"></i> 告警处理流程</h4>
              <ol class="help-steps">
                <li>确认告警级别与影响范围</li>
                <li>检查相关资源状态与日志</li>
                <li>执行对应处理建议</li>
                <li>验证告警是否恢复</li>
                <li>记录处理过程与结果</li>
              </ol>
            </div>
            <div class="help-section">
              <h4><i class="fa-solid fa-phone"></i> 联系方式</h4>
              <div class="help-info">
                <p>运维值班：138-0000-0001</p>
                <p>DBA值班：138-0000-0002</p>
                <p>网络值班：138-0000-0003</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const filterLevel = ref('')
const searchText = ref('')
const selectedKeys = ref([])
const detailVisible = ref(false)
const currentAlert = ref(null)
const activeDetailTab = ref('info')
const scrollY = ref(500)

const detailTabs = [
  { key: 'info', label: '告警详情和处理建议' },
  { key: 'experience', label: '维护经验' },
  { key: 'history', label: '最近2个月处理记录' },
  { key: 'help', label: '告警处理与告警帮助' },
]

const realtimeAlerts = ref([
  { id: 1, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)', triggerTime: '2026-06-16 10:32:00', currentValue: '95%', threshold: '> 90%', duration: '5分钟', status: 'firing', suggestion: '1. 检查是否有异常进程占用CPU\n2. 查看应用日志定位慢查询\n3. 必要时重启相关服务' },
  { id: 2, level: 'critical', title: '磁盘空间不足', resource: 'db-primary (华东区域)', triggerTime: '2026-06-16 10:28:00', currentValue: '92%', threshold: '> 90%', duration: '12分钟', status: 'firing', suggestion: '1. 清理过期日志文件\n2. 检查大表并归档历史数据\n3. 扩容磁盘或迁移数据' },
  { id: 3, level: 'critical', title: '数据库主从延迟', resource: 'db-replica-02 (华东区域)', triggerTime: '2026-06-16 09:55:00', currentValue: '35s', threshold: '> 10s', duration: '37分钟', status: 'firing', suggestion: '1. 检查主库写入压力\n2. 检查从库IO/SQL线程状态\n3. 确认网络带宽是否充足' },
  { id: 4, level: 'warning', title: '内存使用率偏高', resource: 'app-server-03 (华南区域)', triggerTime: '2026-06-16 10:15:00', currentValue: '82%', threshold: '> 80%', duration: '20分钟', status: 'firing', suggestion: '1. 检查JVM堆内存使用情况\n2. 分析是否有内存泄漏\n3. 调整容器内存限制' },
  { id: 5, level: 'warning', title: '响应时间超时', resource: 'api-gateway (华北区域)', triggerTime: '2026-06-16 09:45:00', currentValue: '2500ms', threshold: '> 2000ms', duration: '1小时', status: 'firing', suggestion: '1. 检查下游服务响应时间\n2. 分析慢请求链路\n3. 考虑增加限流或降级策略' },
  { id: 6, level: 'warning', title: 'HTTP 5xx错误率上升', resource: 'nginx-ingress (华北区域)', triggerTime: '2026-06-16 09:30:00', currentValue: '3.2%', threshold: '> 1%', duration: '1.5小时', status: 'firing', suggestion: '1. 检查后端服务健康状态\n2. 查看nginx错误日志\n3. 回滚最近变更' },
  { id: 7, level: 'info', title: '连接数接近上限', resource: 'redis-cluster (华东区域)', triggerTime: '2026-06-16 09:20:00', currentValue: '85%', threshold: '> 80%', duration: '2小时', status: 'firing', suggestion: '1. 检查连接池配置\n2. 排查是否有连接泄漏\n3. 考虑扩容Redis节点' },
  { id: 8, level: 'info', title: '证书即将过期', resource: 'cdn-domain.example.com', triggerTime: '2026-06-16 08:00:00', currentValue: '15天', threshold: '< 30天', duration: '2.5小时', status: 'firing', suggestion: '1. 申请新证书\n2. 更新证书配置\n3. 验证HTTPS访问正常' },
  { id: 9, level: 'critical', title: 'K8s Pod频繁重启', resource: 'payment-service (prod)', triggerTime: '2026-06-16 08:45:00', currentValue: '5次/小时', threshold: '> 3次/小时', status: 'resolved', duration: '已恢复', suggestion: '1. 查看Pod事件和日志\n2. 检查OOMKilled情况\n3. 调整resources限制' },
  { id: 10, level: 'warning', title: '消息队列积压', resource: 'kafka-consumer-group order', triggerTime: '2026-06-16 07:30:00', currentValue: '50000条', threshold: '> 10000条', status: 'resolved', duration: '已恢复', suggestion: '1. 检查消费者处理逻辑\n2. 增加消费者实例数\n3. 检查生产者发送速率' },
])

const alertHistoryRecords = ref([
  { id: 201, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001', time: '2026-06-10 09:15', duration: '20分钟', status: 'resolved', operator: '张工' },
  { id: 202, level: 'warning', title: '内存使用率偏高', resource: 'app-server-03', time: '2026-06-08 14:30', duration: '45分钟', status: 'resolved', operator: '李工' },
  { id: 203, level: 'critical', title: '磁盘空间不足', resource: 'db-primary', time: '2026-06-05 11:20', duration: '1小时', status: 'resolved', operator: '王工' },
  { id: 204, level: 'info', title: '连接数接近上限', resource: 'redis-cluster', time: '2026-06-01 16:00', duration: '30分钟', status: 'resolved', operator: '张工' },
])

const columns = [
  { title: '级别', dataIndex: 'level', key: 'level', width: 120, sorter: function(a, b) { var order = { critical: 0, warning: 1, info: 2 }; return order[a.level] - order[b.level]; } },
  { title: '告警名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', key: 'resource', ellipsis: true },
  { title: '触发时间', dataIndex: 'triggerTime', key: 'triggerTime', width: 180 },
  { title: '持续时间', dataIndex: 'duration', key: 'duration', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
]

const historyRecordColumns = [
  { title: '告警名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '级别', dataIndex: 'level', key: 'level', width: 80 },
  { title: '处理人', dataIndex: 'operator', key: 'operator', width: 70 },
  { title: '时间', dataIndex: 'time', key: 'time', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
]

const getCountByLevel = function(level) {
  return realtimeAlerts.value.filter(function(a) { return a.level === level; }).length
}

const filteredAlerts = computed(function() {
  var list = realtimeAlerts.value
  if (filterLevel.value) {
    list = list.filter(function(a) { return a.level === filterLevel.value; })
  }
  if (searchText.value) {
    var kw = searchText.value.toLowerCase()
    list = list.filter(function(a) { return a.title.toLowerCase().includes(kw) || a.resource.toLowerCase().includes(kw); })
  }
  return list
})

const getLevelColor = function(level) {
  var map = { critical: 'red', warning: 'orange', info: 'blue' }
  return map[level] || 'default'
}

const getLevelText = function(level) {
  var map = { critical: '紧急', warning: '重要', info: '次要' }
  return map[level] || level
}

const handleAlert = function(id) {
  realtimeAlerts.value = realtimeAlerts.value.filter(function(a) { return a.id !== id; })
}

const openDetail = function(alert) {
  currentAlert.value = alert
  activeDetailTab.value = 'info'
  detailVisible.value = true
}

function updateScrollY() {
  scrollY.value = window.innerHeight - 310
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
.page-view { display: flex; flex-direction: column; padding: 16px 24px 0; height: 100%; }
.page-header { margin-bottom: 16px; flex-shrink: 0; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }

.alert-stats { display: flex; gap: 16px; margin-bottom: 16px; flex-shrink: 0; }
.stat-item { flex: 1; padding: 16px; background: #fff; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.15s; border: 2px solid transparent; }
.stat-item:hover { border-color: var(--brand); }
.stat-item.active { border-color: var(--brand); background: var(--brand-subtle); }
.stat-item.critical { border-left: 3px solid #f5222d; }
.stat-item.warning { border-left: 3px solid #fa8c16; }
.stat-item.info { border-left: 3px solid #1890ff; }
.stat-value { display: block; font-size: 28px; font-weight: 600; }
.stat-label { font-size: 12px; color: var(--text-secondary); }

.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; justify-content: flex-end; flex-shrink: 0; }

.level-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 6px; }
.level-dot.critical { background: #f5222d; }
.level-dot.warning { background: #fa8c16; }
.level-dot.info { background: #1890ff; }

.alert-link { color: var(--brand); cursor: pointer; }
.alert-link:hover { text-decoration: underline; }

.action-btns { display: flex; gap: 4px; }
.icon-btn { width: 28px; height: 28px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.icon-btn:hover { background: var(--bg-sec); color: var(--brand); }

.row-critical { background: #fff1f0; }
.row-warning { background: #fff7e6; }

:deep(.ant-table-wrapper) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
:deep(.ant-table) { flex: 1; min-height: 0; }
:deep(.ant-table-container) { flex: 1; min-height: 0; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
:deep(.ant-table-row) { cursor: pointer; }
:deep(.ant-table-row:hover td) { background: #e6f7ff !important; }
:deep(.row-critical:hover td) { background: #fff1f0 !important; }
:deep(.row-warning:hover td) { background: #fff7e6 !important; }

/* 右侧详情面板 */
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
.detail-panel.open {
  pointer-events: auto;
  opacity: 1;
}
.detail-mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.3);
}
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
.detail-panel.open .detail-panel-content {
  right: 0;
}
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

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; flex-wrap: wrap; }
.detail-tab { padding: 6px 12px; border: none; background: transparent; font-size: 13px; color: var(--text-secondary); cursor: pointer; border-radius: 4px; transition: all 0.15s; white-space: nowrap; }
.detail-tab:hover { background: var(--bg-sec); color: var(--text); }
.detail-tab.active { background: var(--brand); color: #fff; font-weight: 500; }

.tab-panel { min-height: 200px; }

.detail-kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.kpi-item { padding: 12px; background: #fafafa; border-radius: 6px; }
.kpi-label { font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
.kpi-value { font-size: 14px; font-weight: 500; }

.section-block { margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #1a1a1a; padding-bottom: 6px; border-bottom: 1px solid #f0f0f0; }
.section-body { font-size: 13px; color: #595959; line-height: 1.8; white-space: pre-line; }
.section-body.suggestion { background: #f6ffed; padding: 12px; border-radius: 6px; border-left: 3px solid #52c41a; }

.empty-state { text-align: center; padding: 40px 20px; color: #8c8c8c; }
.empty-state i { font-size: 32px; margin-bottom: 12px; display: block; }
.empty-state p { margin: 0; }

.help-section { margin-bottom: 20px; }
.help-section h4 { font-size: 14px; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
.help-steps { margin: 0; padding-left: 20px; font-size: 13px; line-height: 2; }
.help-info { font-size: 13px; line-height: 1.8; }
.help-info p { margin: 4px 0; }

@media (max-width: 768px) {
  .page-view { padding: 12px; }
  .alert-stats { flex-wrap: wrap; gap: 8px; }
  .stat-item { min-width: calc(50% - 4px); }
  .detail-panel-content { width: 100%; right: -100%; }
  .detail-panel.open .detail-panel-content { right: 0; }
  .detail-kpi { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .detail-tabs { flex-wrap: wrap; }
}

@media (max-width: 576px) {
  .detail-kpi { grid-template-columns: 1fr; }
  .detail-tabs .detail-tab { flex: 1 1 45%; text-align: center; }
}
</style>
