<template>
  <div class="resource-monitor">
    <div class="page-header">
      <h2>资源监控</h2>
      <a-radio-group v-model:value="viewMode" size="small">
        <a-radio-button value="list"><i class="fa-solid fa-list"></i> 列表</a-radio-button>
        <a-radio-button value="card"><i class="fa-solid fa-table-cells-large"></i> 卡片</a-radio-button>
      </a-radio-group>
    </div>

    <div class="stats-header">
      <span class="stats-title">统计概览</span>
      <a-button type="text" size="small" @click="statsCollapsed = !statsCollapsed">
        <i class="fa-solid" :class="statsCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
        {{ statsCollapsed ? '展开' : '收起' }}
      </a-button>
    </div>
    <div class="alert-cards" v-show="!statsCollapsed">
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
            @click="mainTab = tab.key; subActive = 0"
          >{{ tab.label }}</button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-label">当前可选分类</span>
        <div class="sub-tab-group">
          <span
            v-for="(st, i) in subTabs"
            :key="i"
            class="pill-btn"
            :class="{ active: subActive === i, 'pill-more': st.more }"
            @click="subActive = i"
          >
            {{ st.label }}
            <i v-if="st.more" class="fa-solid fa-filter"></i>
          </span>
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

      <div v-if="viewMode === 'card'" class="card-grid">
        <div class="res-card" v-for="record in filteredData" :key="record.id" @click="openDetail(record)">
          <div class="res-icon" :class="{ alert: record.alertStatus === '紧急' }">
            <i :class="record.type === 'obs' ? 'fa-solid fa-cloud' : 'fa-solid fa-circle-nodes'"></i>
          </div>
          <div class="res-name">{{ record.name }}</div>
          <div class="res-alert" :class="{ alert: record.alertStatus === '紧急' }">
            告警：{{ record.alertStatus === '紧急' ? '紧急 1' : '正常' }}
          </div>
        </div>
      </div>

      <a-table
        v-else
        :columns="columns"
        :data-source="filteredData"
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
          <template v-if="column.key === 'storageSize'">
            <span>{{ record.storageSize || '--' }}</span>
          </template>
        </template>
      </a-table>
    </div>

    <ResourceDetailPanel />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResourceDetail } from '../../composables/useResourceDetail'
import ResourceDetailPanel from './ResourceDetailPanel.vue'

const { state: rdpState, openDetail: rdpOpen } = useResourceDetail()

const searchText = ref('')
const mainTab = ref('app')
const subActive = ref(0)
const viewMode = ref('list')
const statsCollapsed = ref(true)

const subTabMap = {
  all: [
    { label: '全部' },
  ],
  app: [
    { label: '应用' },
    { label: '应用服务' },
  ],
  cloud: [
    { label: '全部' },
    { label: '弹性计算服务' },
    { label: '镜像管理服务' },
    { label: '云硬盘' },
    { label: '更多', more: true },
  ],
  'cloud-resource': [
    { label: '全部' },
    { label: '弹性云服务器' },
    { label: '裸金属服务器' },
    { label: 'GPU云服务器' },
  ],
  virtual: [
    { label: '全部' },
    { label: 'Kubernetes集群' },
    { label: '容器实例' },
    { label: 'Serverless函数' },
  ],
  physical: [
    { label: '全部' },
    { label: '物理服务器' },
    { label: '网络设备' },
    { label: '存储设备' },
  ],
}

const subTabs = computed(() => subTabMap[mainTab.value] || subTabMap.all)

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
  { title: '存储量', dataIndex: 'storageSize', key: 'storageSize', width: 100, sorter: true },
  { title: '所属VDC', dataIndex: 'vdc', key: 'vdc', width: 120, sorter: true },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 100, sorter: true },
  { title: '来源', dataIndex: 'source', key: 'source', width: 100, sorter: true },
]

const openDetail = (app) => {
  rdpOpen(app)
}
const getMetricColor = (value) => {
  if (value >= 80) return '#f5222d'
  if (value >= 50) return '#fa8c16'
  return '#52c41a'
}

const appData = [
  { id: 1, name: '订单服务中心', alertStatus: '紧急', identifier: 'order-svc-prod-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '张伟', source: '运营', type: 'app', metrics: { cpu: 87, memory: 92, requests: 1560, errorRate: 3.2, responseTime: 245, connections: 128 } },
  { id: 2, name: '用户认证中心', alertStatus: '正常', identifier: 'auth-center-prod-02', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '李娜', source: '运营', type: 'app', metrics: { cpu: 23, memory: 45, requests: 420, errorRate: 0.1, responseTime: 32, connections: 56 } },
  { id: 3, name: '支付网关服务', alertStatus: '正常', identifier: 'payment-gw-prod-03', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '--', source: '运营', type: 'app', metrics: { cpu: 45, memory: 62, requests: 780, errorRate: 0.5, responseTime: 68, connections: 89 } },
  { id: 4, name: '消息推送平台', alertStatus: '正常', identifier: 'push-platform-prod-04', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '王强', source: '运营', type: 'app', metrics: { cpu: 12, memory: 34, requests: 230, errorRate: 0.0, responseTime: 18, connections: 34 } },
  { id: 5, name: '日志采集服务', alertStatus: '正常', identifier: 'log-collector-prod-05', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '--', source: '运营', type: 'app', metrics: { cpu: 67, memory: 78, requests: 1100, errorRate: 1.8, responseTime: 120, connections: 92 } },
  { id: 6, name: '数据同步引擎', alertStatus: '正常', identifier: 'data-sync-prod-06', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '赵敏', source: '运营', type: 'app', metrics: { cpu: 34, memory: 51, requests: 560, errorRate: 0.3, responseTime: 45, connections: 67 } },
  { id: 7, name: '配置管理中心', alertStatus: '正常', identifier: 'config-center-prod-07', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 8, memory: 22, requests: 180, errorRate: 0.0, responseTime: 15, connections: 28 } },
]

const obsData = [
  { id: 101, name: 'OBS-生产存储', alertStatus: '正常', identifier: 'obs-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '11.68 TB', vdc: 'VDC-BJ-01', owner: '存储团队', source: '云服务', type: 'obs', obs: { buckets: 8, objects: '1,285,432', usedStorage: '4.28 TB', availStorage: '92.78 TB', totalRequests: '3,450,892', readRequests: '2,180,456', writeRequests: '1,270,436', downTraffic: '2.57 GB/s', upTraffic: '530 KB/s', storageUtil: 78, topBuckets: [{ name: 'bucket-data-01', size: '4.28 TB', pct: 78 }, { name: 'bucket-log-01', size: '2.15 TB', pct: 45 }, { name: 'bucket-backup-01', size: '1.87 TB', pct: 38 }, { name: 'bucket-media-01', size: '1.24 TB', pct: 26 }, { name: 'bucket-archive-01', size: '0.89 TB', pct: 18 }] } },
  { id: 102, name: 'OBS-灾备存储', alertStatus: '正常', identifier: 'obs-dr-02', runStatus: '运行中', appLevel: '核心服务', storageSize: '8.45 TB', vdc: 'VDC-SH-02', owner: '存储团队', source: '云服务', type: 'obs', obs: { buckets: 5, objects: '654,321', usedStorage: '2.87 TB', availStorage: '45.22 TB', totalRequests: '892,156', readRequests: '534,289', writeRequests: '357,867', downTraffic: '890 MB/s', upTraffic: '210 KB/s', storageUtil: 32, topBuckets: [{ name: 'bucket-dr-data-01', size: '1.45 TB', pct: 52 }, { name: 'bucket-dr-log-01', size: '0.78 TB', pct: 28 }, { name: 'bucket-dr-backup-01', size: '0.64 TB', pct: 22 }] } },
  { id: 103, name: 'OBS-日志归档', alertStatus: '紧急', identifier: 'obs-log-03', runStatus: '运行中', appLevel: '基础服务', storageSize: '6.12 TB', vdc: 'VDC-GZ-03', owner: '--', source: '云服务', type: 'obs', obs: { buckets: 3, objects: '456,789', usedStorage: '3.56 TB', availStorage: '35.78 TB', totalRequests: '1,234,567', readRequests: '723,456', writeRequests: '511,111', downTraffic: '1.2 GB/s', upTraffic: '340 KB/s', storageUtil: 85, topBuckets: [{ name: 'bucket-log-access', size: '2.15 TB', pct: 85 }, { name: 'bucket-log-audit', size: '0.98 TB', pct: 42 }, { name: 'bucket-log-ops', size: '0.43 TB', pct: 18 }] } },
  { id: 104, name: 'OBS-媒体存储', alertStatus: '正常', identifier: 'obs-media-04', runStatus: '运行中', appLevel: '基础服务', storageSize: '3.78 TB', vdc: 'VDC-BJ-01', owner: '媒体团队', source: '云服务', type: 'obs', obs: { buckets: 4, objects: '345,678', usedStorage: '1.89 TB', availStorage: '28.56 TB', totalRequests: '2,345,678', readRequests: '1,567,890', writeRequests: '777,788', downTraffic: '3.2 GB/s', upTraffic: '890 KB/s', storageUtil: 45, topBuckets: [{ name: 'bucket-media-images', size: '0.89 TB', pct: 45 }, { name: 'bucket-media-videos', size: '0.67 TB', pct: 34 }, { name: 'bucket-media-audio', size: '0.33 TB', pct: 16 }] } },
]

const filteredData = computed(() => {
  if (mainTab.value === 'all') return [...appData, ...obsData]
  if (mainTab.value === 'app') return appData
  if (mainTab.value === 'cloud') return obsData
  return appData
})

const loading = ref(false)

onMounted(async function() {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/ci?ci_type_id=5&sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      const apiData = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          alertStatus: '正常',
          identifier: item.identifier,
          runStatus: '运行中',
          appLevel: item.app_level,
          storageSize: '--',
          vdc: item.vdc,
          owner: item.owner,
          source: item.source,
          type: 'app',
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
      // merge API data into appData
      appData.splice(0, appData.length, ...apiData)
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
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.stats-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}
.res-card {
  background: #fff;
  border: 1px solid #eef1f6;
  border-radius: 12px;
  padding: 20px 14px;
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.res-card:hover {
  box-shadow: 0 4px 14px rgba(0,0,0,0.1);
  border-color: #1890ff;
}
.res-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(24, 144, 255, 0.12);
  color: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.res-icon.alert {
  background: rgba(245, 34, 45, 0.12);
  color: #f5222d;
}
.res-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
}
.res-alert {
  font-size: 12px;
  color: #52c41a;
}
.res-alert.alert {
  color: #f5222d;
  font-weight: 500;
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
.pill-more i {
  margin-left: 4px;
  font-size: 11px;
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

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.metric-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 14px;
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
  .metric-grid { grid-template-columns: 1fr; }
}

@media (max-width: 1200px) {
  .card-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 900px) {
  .card-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
