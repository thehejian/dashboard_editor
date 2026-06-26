<template>
  <div class="resource-monitor">
    <div class="page-header">
      <h2>资源监控</h2>
    </div>

    <div class="alert-cards">
      <div class="alert-card" v-for="item in alertCards" :key="item.label">
        <div class="card-body">
          <div class="card-info">
            <div class="card-number">
              <span class="num-alert" :class="{ zero: item.alertCount === 0 }">{{ item.alertCount }}</span>
              <span class="num-total">/{{ item.total }}</span>
            </div>
            <div class="card-label">{{ item.label }}</div>
          </div>
          <div class="card-icon-wrap" :style="{ background: item.iconBg }">
            <i :class="item.icon"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-row">
        <span class="filter-label">资源类别</span>
        <div class="tab-group">
          <button
            v-for="tab in mainTabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: mainTab === tab.key }"
            @click="mainTab = tab.key"
          >{{ tab.label }}</button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-label">当前可选分类</span>
        <div class="sub-tab-group">
          <span class="pill-btn active">应用</span>
          <span class="pill-btn">应用服务</span>
        </div>
      </div>
    </div>

    <div class="table-section">
      <div class="table-toolbar">
        <a-input
          v-model:value="searchText"
          placeholder="输入关键字搜索、过滤"
          allow-clear
        />
      </div>

      <a-table
        :columns="columns"
        :data-source="tableData"
        :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: total => '共 ' + total + ' 条' }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a class="app-link" href="javascript:;" @click="openDetail(record)">{{ record.name }}</a>
          </template>
          <template v-if="column.key === 'alertStatus'">
            <span v-if="record.alertStatus === '紧急'" class="status-tag emergency">
              <i class="fa-solid fa-circle-exclamation"></i> 紧急
            </span>
            <span v-else class="status-tag normal">
              <i class="fa-solid fa-circle-check"></i> 正常
            </span>
          </template>
          <template v-if="column.key === 'runStatus'">
            <span class="run-status"><span class="dot-green"></span> 运行中</span>
          </template>
        </template>
      </a-table>
    </div>

    <div class="detail-panel" :class="{ open: detailOpen }">
      <div class="detail-mask" @click="closeDetail"></div>
      <div class="detail-panel-content" v-if="currentApp">
        <div class="detail-header">
          <h3>{{ currentApp.name }} - 详情</h3>
          <button class="detail-close" @click="closeDetail"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="detail-body">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="info-grid">
              <div class="info-item"><span class="label">名称</span><span class="value">{{ currentApp.name }}</span></div>
              <div class="info-item"><span class="label">标识</span><span class="value">{{ currentApp.identifier }}</span></div>
              <div class="info-item"><span class="label">告警状态</span><span class="value"><span :class="currentApp.alertStatus === '紧急' ? 'text-danger' : 'text-success'">{{ currentApp.alertStatus }}</span></span></div>
              <div class="info-item"><span class="label">运行状态</span><span class="value text-success">运行中</span></div>
              <div class="info-item"><span class="label">应用级别</span><span class="value">{{ currentApp.appLevel }}</span></div>
              <div class="info-item"><span class="label">所属VDC</span><span class="value">{{ currentApp.vdc }}</span></div>
              <div class="info-item"><span class="label">负责人</span><span class="value">{{ currentApp.owner }}</span></div>
              <div class="info-item"><span class="label">来源</span><span class="value">{{ currentApp.source }}</span></div>
            </div>
          </div>
          <div class="detail-section">
            <h4>监控指标</h4>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="metric-label">CPU 使用率</div>
                <div class="metric-value">{{ currentApp.metrics.cpu }}%</div>
                <div class="metric-bar"><div class="metric-fill" :style="{ width: currentApp.metrics.cpu + '%', background: getMetricColor(currentApp.metrics.cpu) }"></div></div>
              </div>
              <div class="metric-card">
                <div class="metric-label">内存使用率</div>
                <div class="metric-value">{{ currentApp.metrics.memory }}%</div>
                <div class="metric-bar"><div class="metric-fill" :style="{ width: currentApp.metrics.memory + '%', background: getMetricColor(currentApp.metrics.memory) }"></div></div>
              </div>
              <div class="metric-card">
                <div class="metric-label">请求速率</div>
                <div class="metric-value">{{ currentApp.metrics.requests }} req/s</div>
                <div class="metric-bar"><div class="metric-fill" :style="{ width: currentApp.metrics.requests / 10 + '%', background: getMetricColor(currentApp.metrics.requests / 10) }"></div></div>
              </div>
              <div class="metric-card">
                <div class="metric-label">错误率</div>
                <div class="metric-value">{{ currentApp.metrics.errorRate }}%</div>
                <div class="metric-bar"><div class="metric-fill" :style="{ width: currentApp.metrics.errorRate * 10 + '%', background: getMetricColor(currentApp.metrics.errorRate * 10) }"></div></div>
              </div>
              <div class="metric-card">
                <div class="metric-label">响应时间</div>
                <div class="metric-value">{{ currentApp.metrics.responseTime }} ms</div>
                <div class="metric-bar"><div class="metric-fill" :style="{ width: Math.min(currentApp.metrics.responseTime / 5, 100) + '%', background: getMetricColor(currentApp.metrics.responseTime / 5) }"></div></div>
              </div>
              <div class="metric-card">
                <div class="metric-label">连接数</div>
                <div class="metric-value">{{ currentApp.metrics.connections }}</div>
                <div class="metric-bar"><div class="metric-fill" :style="{ width: Math.min(currentApp.metrics.connections / 2, 100) + '%', background: getMetricColor(currentApp.metrics.connections / 2) }"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const searchText = ref('')
const mainTab = ref('app')
const detailOpen = ref(false)
const currentApp = ref(null)

const mainTabs = [
  { key: 'all', label: '全部' },
  { key: 'app', label: '业务应用' },
  { key: 'cloud', label: '云服务' },
  { key: 'cloud-resource', label: '云资源' },
  { key: 'virtual', label: '虚拟资源池' },
  { key: 'physical', label: '物理资源' },
]

const alertCards = [
  { label: '应用', alertCount: 3, total: 100, icon: 'fa-solid fa-circle-nodes', iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)' },
  { label: '云服务', alertCount: 1, total: 100, icon: 'fa-solid fa-cloud', iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)' },
  { label: '云资源', alertCount: 3, total: 100, icon: 'fa-solid fa-server', iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)' },
  { label: '虚拟资源池', alertCount: 0, total: 100, icon: 'fa-solid fa-layer-group', iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)' },
  { label: '物理资源', alertCount: 3, total: 100, icon: 'fa-solid fa-microchip', iconBg: 'linear-gradient(135deg, #1890ff, #096dd9)' },
]

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 120, sorter: (a, b) => a.name.localeCompare(b.name) },
  { title: '告警状态', dataIndex: 'alertStatus', key: 'alertStatus', width: 120, sorter: true, filters: [{ text: '紧急', value: '紧急' }, { text: '正常', value: '正常' }], onFilter: (value, record) => record.alertStatus === value },
  { title: '标识', dataIndex: 'identifier', key: 'identifier', width: 150, sorter: true },
  { title: '运行状态', dataIndex: 'runStatus', key: 'runStatus', width: 120, sorter: true, filters: [{ text: '运行中', value: '运行中' }, { text: '已停止', value: '已停止' }], onFilter: (value, record) => record.runStatus === value },
  { title: '应用级别', dataIndex: 'appLevel', key: 'appLevel', width: 120, sorter: true },
  { title: '所属VDC', dataIndex: 'vdc', key: 'vdc', width: 120, sorter: true },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 100, sorter: true },
  { title: '来源', dataIndex: 'source', key: 'source', width: 100, sorter: true },
]

const openDetail = (app) => {
  currentApp.value = app
  detailOpen.value = true
}
const closeDetail = () => {
  detailOpen.value = false
}
const getMetricColor = (value) => {
  if (value >= 80) return '#f5222d'
  if (value >= 50) return '#fa8c16'
  return '#52c41a'
}

const tableData = ref([
  { id: 1, name: '订单服务中心', alertStatus: '紧急', identifier: 'order-svc-prod-01', runStatus: '运行中', appLevel: '重要应用', vdc: 'VDC-BJ-01', owner: '张伟', source: '运营', metrics: { cpu: 87, memory: 92, requests: 1560, errorRate: 3.2, responseTime: 245, connections: 128 } },
  { id: 2, name: '用户认证中心', alertStatus: '正常', identifier: 'auth-center-prod-02', runStatus: '运行中', appLevel: '重要应用', vdc: 'VDC-BJ-01', owner: '李娜', source: '运营', metrics: { cpu: 23, memory: 45, requests: 420, errorRate: 0.1, responseTime: 32, connections: 56 } },
  { id: 3, name: '支付网关服务', alertStatus: '正常', identifier: 'payment-gw-prod-03', runStatus: '运行中', appLevel: '重要应用', vdc: 'VDC-SH-02', owner: '--', source: '运营', metrics: { cpu: 45, memory: 62, requests: 780, errorRate: 0.5, responseTime: 68, connections: 89 } },
  { id: 4, name: '消息推送平台', alertStatus: '正常', identifier: 'push-platform-prod-04', runStatus: '运行中', appLevel: '普通应用', vdc: 'VDC-BJ-01', owner: '王强', source: '运营', metrics: { cpu: 12, memory: 34, requests: 230, errorRate: 0.0, responseTime: 18, connections: 34 } },
  { id: 5, name: '日志采集服务', alertStatus: '正常', identifier: 'log-collector-prod-05', runStatus: '运行中', appLevel: '普通应用', vdc: 'VDC-GZ-03', owner: '--', source: '运营', metrics: { cpu: 67, memory: 78, requests: 1100, errorRate: 1.8, responseTime: 120, connections: 92 } },
  { id: 6, name: '数据同步引擎', alertStatus: '正常', identifier: 'data-sync-prod-06', runStatus: '运行中', appLevel: '重要应用', vdc: 'VDC-SH-02', owner: '赵敏', source: '运营', metrics: { cpu: 34, memory: 51, requests: 560, errorRate: 0.3, responseTime: 45, connections: 67 } },
  { id: 7, name: '配置管理中心', alertStatus: '正常', identifier: 'config-center-prod-07', runStatus: '运行中', appLevel: '普通应用', vdc: 'VDC-BJ-01', owner: '--', source: '运营', metrics: { cpu: 8, memory: 22, requests: 180, errorRate: 0.0, responseTime: 15, connections: 28 } },
])
const loading = ref(false)

onMounted(async function() {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/ci?ci_type_id=5&sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      tableData.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          alertStatus: '正常',
          identifier: item.identifier,
          runStatus: '运行中',
          appLevel: item.app_level,
          vdc: item.vdc,
          owner: item.owner,
          source: item.source,
          metrics: {
            cpu: item.metadata && item.metadata.cpu || 45,
            memory: item.metadata && item.metadata.memory || 60,
            requests: 500,
            errorRate: 0.5,
            responseTime: 50,
            connections: 60,
          },
        }
      })
    }
  } catch (e) {
    console.error('加载资源监控数据失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.resource-monitor {
  padding: 0 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.page-header {
  padding: 24px 0 20px;
}
.page-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.alert-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.alert-card {
  flex: 1;
  background: linear-gradient(135deg, #f0f9ff, #e0f0fe);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s;
}
.alert-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-number {
  line-height: 1;
  margin-bottom: 8px;
}
.num-alert {
  font-size: 32px;
  font-weight: 700;
  color: #f5222d;
}
.num-alert.zero {
  color: #1a1a1a;
}
.num-total {
  font-size: 14px;
  color: #8c8c8c;
  margin-left: 2px;
}
.card-label {
  font-size: 14px;
  color: #595959;
  font-weight: 500;
}

.card-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.card-icon-wrap i {
  font-size: 22px;
  color: #fff;
}

.filter-section {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  color: #595959;
  font-weight: 500;
  white-space: nowrap;
  width: 96px;
  flex-shrink: 0;
}

.tab-group {
  display: flex;
  gap: 4px;
}
.tab-btn {
  padding: 7px 18px;
  border: 1px solid #e8e8e8;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
  transition: all 0.15s;
}
.tab-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}
.tab-btn.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.sub-tab-group {
  display: flex;
  gap: 8px;
}
.pill-btn {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #595959;
  transition: all 0.15s;
}
.pill-btn.active {
  border-color: #1890ff;
  background: #fff;
  color: #1890ff;
}
.pill-btn:not(.active):hover {
  border-color: #1890ff;
}

.table-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-toolbar {
  margin-bottom: 16px;
}

:deep(.ant-table-wrapper) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
:deep(.ant-table) {
  flex: 1;
  min-height: 0;
}
:deep(.ant-table-container) {
  flex: 1;
  min-height: 0;
}

.app-link {
  color: #1890ff;
  text-decoration: none;
}
.app-link:hover {
  text-decoration: underline;
}

.status-tag i {
  margin-right: 4px;
}
.status-tag.emergency {
  color: #f5222d;
  font-weight: 500;
}
.status-tag.normal {
  color: #52c41a;
  font-weight: 500;
}

.run-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #52c41a;
}
.dot-green {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #52c41a;
}

.detail-panel {
  position: fixed;
  top: 48px; right: 0; bottom: 0; left: 0;
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
  top: 0; right: 0; bottom: 0; left: 0;
  background: rgba(0, 0, 0, 0.3);
}
.detail-panel-content {
  position: absolute;
  top: 0;
  right: -500px;
  width: 500px;
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
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.detail-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}
.detail-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  color: #8c8c8c;
  transition: all 0.15s;
}
.detail-close:hover {
  background: #f0f0f0;
  color: #1a1a1a;
}
.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.detail-section {
  margin-bottom: 24px;
}
.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.info-item {
  display: flex;
  align-items: center;
}
.info-item .label {
  width: 80px;
  font-size: 13px;
  color: #8c8c8c;
  flex-shrink: 0;
}
.info-item .value {
  font-size: 13px;
  color: #1a1a1a;
}
.text-danger {
  color: #f5222d !important;
}
.text-success {
  color: #52c41a !important;
}
.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.metric-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}
.metric-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 6px;
}
.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
}
.metric-bar {
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
}
.metric-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

@media (max-width: 768px) {
  .resource-monitor { padding: 0 16px; }
  .page-header { padding: 16px 0; }
  .alert-cards { flex-wrap: wrap; }
  .alert-card { min-width: calc(50% - 8px); flex: none; }
  .filter-row { flex-wrap: wrap; }
  .filter-label { width: auto; }
  .tab-group { flex-wrap: wrap; }
  .table-section { padding: 12px; }
  .detail-panel-content { width: 100%; right: -100%; }
  .metric-grid { grid-template-columns: 1fr; }
}
</style>
