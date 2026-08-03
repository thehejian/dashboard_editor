<template>
  <div class="resource-monitor">
    <div class="monitor-header">
      <a-tabs
        :active-key="mainTab"
        size="small"
        class="category-tabs"
        @change="onTabClick"
      >
        <a-tab-pane v-for="tab in mainTabs" :key="tab.key" :tab="tab.label" />
      </a-tabs>
      <div class="header-actions">
        <a-button type="text" size="small" @click="statsCollapsed = !statsCollapsed">
          <i class="fa-solid" :class="statsCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
          {{ statsCollapsed ? '展开' : '收起' }}
        </a-button>
        <a-radio-group v-model:value="viewMode" size="small" @change="onViewModeChange">
          <a-radio-button value="list"><i class="fa-solid fa-list"></i> 列表</a-radio-button>
          <a-radio-button value="card"><i class="fa-solid fa-table-cells-large"></i> 卡片</a-radio-button>
        </a-radio-group>
      </div>
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

    <div class="sub-tabs" v-if="mainTab !== 'all'">
      <a-tabs
        :active-key="'sub-' + subActive"
        size="small"
        class="sub-category-tabs"
        @change="onSubTabChange"
      >
        <a-tab-pane v-for="(st, i) in subTabs" :key="'sub-' + i">
          <template #tab>
            <span>{{ st.label }}</span>
            <i v-if="st.more" class="fa-solid fa-filter"></i>
          </template>
        </a-tab-pane>
      </a-tabs>
    </div>

    <div class="table-section">
      <div class="table-toolbar">
        <a-input
          v-model:value="searchText"
          placeholder="输入关键字搜索、过滤"
          allow-clear
        />
      </div>

      <div v-if="viewMode === 'card'" class="card-groups">
        <div class="card-group" v-for="group in cardGroupsComputed" :key="group.key">
          <div class="group-header" @click="toggleGroup(group.key)">
            <i class="fa-solid group-arrow" :class="groupCollapsed[group.key] ? 'fa-chevron-right' : 'fa-chevron-down'"></i>
            <i :class="group.icon" class="group-icon"></i>
            <span class="group-title">{{ group.label }}</span>
            <span class="group-badge" :class="{ alert: group.alertCount > 0 }">告警 {{ group.alertCount }}</span>
            <span class="group-total">共 {{ group.items.length }} 个</span>
          </div>
          <div class="carousel-wrap" v-show="!groupCollapsed[group.key]">
            <div class="card-grid" :ref="el => carouselRef(group.key, el)" :style="{ transform: `translateX(${carouselOffset[group.key] || 0}px)` }">
              <div class="res-card" v-for="record in group.items" :key="record.id" @click="openDetail(record)">
                <div class="res-icon" :class="{ alert: record.alertStatus === '紧急' }">
                  <i :class="group.icon"></i>
                </div>
                <div class="res-info">
                  <div class="res-name">{{ record.name }}</div>
                  <div class="res-alert">
                    <template v-if="record.alertStatus === '紧急'">
                      <span class="alert-count">紧急 {{ getEmergencyCount(record) }}</span>
                    </template>
                    <template v-else>
                      <span class="alert-label">运行正常</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <template v-if="carouselNeeds[group.key]">
              <button class="carousel-btn carousel-prev" @click.stop="moveCarousel(group.key, -1)"><i class="fa-solid fa-chevron-left"></i></button>
              <button class="carousel-btn carousel-next" @click.stop="moveCarousel(group.key, 1)"><i class="fa-solid fa-chevron-right"></i></button>
            </template>
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
            <template v-if="record.alertStatus === '紧急'">
              <span class="alert-count">紧急 {{ getEmergencyCount(record) }}</span>
            </template>
            <template v-else>
              <span class="alert-label">正常</span>
            </template>
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
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useResourceDetail } from '../../composables/useResourceDetail'
import { ALARM_MOCK } from '../../mock/resourceDetailMock'
import ResourceDetailPanel from './ResourceDetailPanel.vue'

const props = defineProps({
  mode: { type: String, default: 'list' },
})
const router = useRouter()

const { state: rdpState, openDetail: rdpOpen } = useResourceDetail()

const searchText = ref('')
const mainTab = ref('all')
const subActive = ref(0)
const viewMode = ref('card')
const statsCollapsed = ref(true)
const groupCollapsed = reactive({})

const carouselOffset = reactive({})
const carouselRefs = {}
const carouselNeeds = reactive({})

const carouselRef = (key, el) => {
  if (el) {
    carouselRefs[key] = el
    nextTick(() => {
      carouselNeeds[key] = el.scrollWidth > el.clientWidth + 2
    })
  }
}

const moveCarousel = (key, dir) => {
  const el = carouselRefs[key]
  if (!el) return
  const step = el.clientWidth * 0.75
  const maxOffset = el.scrollWidth - el.clientWidth
  const cur = carouselOffset[key] || 0
  const next = Math.max(-maxOffset, Math.min(0, cur - dir * step))
  carouselOffset[key] = next
}

const syncFromRoute = () => {
  const mode = props.mode || 'list'
  if (mode === 'card') {
    mainTab.value = 'all'
    viewMode.value = 'card'
  } else if (mode === 'app') {
    mainTab.value = 'app'
    viewMode.value = 'list'
  } else {
    mainTab.value = 'all'
    viewMode.value = 'list'
  }
  subActive.value = 0
}
watch(() => props.mode, syncFromRoute)
syncFromRoute()

const onTabClick = (key) => {
  mainTab.value = key
  subActive.value = 0
  if (key === 'all') {
    router.push('/monitor/resource/' + viewMode.value)
  }
}

const onViewModeChange = () => {
  if (mainTab.value === 'all') {
    router.push('/monitor/resource/' + viewMode.value)
  }
}

const toggleGroup = (key) => {
  groupCollapsed[key] = !groupCollapsed[key]
}

const onSubTabChange = (key) => {
  const idx = Number(String(key).replace('sub-', ''))
  subActive.value = isNaN(idx) ? 0 : idx
}

const subTabMap = {
  all: [
    { label: '全部' },
  ],
  app: [
    { label: '全部' },
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

const getEmergencyCount = (record) => {
  const count = ALARM_MOCK.filter(a => a.resource === record.name && a.level === 'critical').length
  return count > 0 ? count : (record.alertStatus === '紧急' ? 1 : 0)
}

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
  { id: 8, name: 'API网关服务', alertStatus: '正常', identifier: 'api-gw-prod-08', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '平台组', source: '运营', type: 'app', metrics: { cpu: 56, memory: 68, requests: 2300, errorRate: 0.8, responseTime: 42, connections: 156 } },
  { id: 9, name: '缓存集群管理', alertStatus: '正常', identifier: 'redis-cluster-09', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: 'DBA团队', source: '运营', type: 'app', metrics: { cpu: 38, memory: 82, requests: 8900, errorRate: 0.0, responseTime: 3, connections: 320 } },
  { id: 10, name: '搜索引擎服务', alertStatus: '正常', identifier: 'es-search-10', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '搜索团队', source: '运营', type: 'app', metrics: { cpu: 62, memory: 75, requests: 3400, errorRate: 0.2, responseTime: 28, connections: 98 } },
  { id: 11, name: '文件存储网关', alertStatus: '紧急', identifier: 'file-gw-11', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '--', source: '运营', type: 'app', metrics: { cpu: 91, memory: 88, requests: 560, errorRate: 5.1, responseTime: 890, connections: 45 } },
  { id: 12, name: '邮件通知服务', alertStatus: '正常', identifier: 'email-notify-12', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 5, memory: 18, requests: 120, errorRate: 0.0, responseTime: 220, connections: 12 } },
  { id: 13, name: '定时任务调度器', alertStatus: '正常', identifier: 'scheduler-13', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '平台组', source: '运营', type: 'app', metrics: { cpu: 28, memory: 42, requests: 890, errorRate: 0.1, responseTime: 12, connections: 34 } },
  { id: 14, name: '监控数据采集', alertStatus: '正常', identifier: 'monitor-collector-14', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '运维团队', source: '运营', type: 'app', metrics: { cpu: 45, memory: 56, requests: 4500, errorRate: 0.0, responseTime: 8, connections: 67 } },
  { id: 15, name: '告警聚合引擎', alertStatus: '正常', identifier: 'alert-engine-15', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '运维团队', source: '运营', type: 'app', metrics: { cpu: 32, memory: 48, requests: 1200, errorRate: 0.3, responseTime: 35, connections: 45 } },
  { id: 16, name: '审批流程服务', alertStatus: '正常', identifier: 'approval-svc-16', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 15, memory: 28, requests: 340, errorRate: 0.0, responseTime: 95, connections: 23 } },
  { id: 17, name: '工单系统服务', alertStatus: '正常', identifier: 'ticket-svc-17', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 22, memory: 35, requests: 450, errorRate: 0.1, responseTime: 68, connections: 34 } },
  { id: 18, name: '知识图谱引擎', alertStatus: '正常', identifier: 'kg-engine-18', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: 'AI团队', source: '运营', type: 'app', metrics: { cpu: 78, memory: 85, requests: 670, errorRate: 0.8, responseTime: 340, connections: 56 } },
  { id: 19, name: '实时流处理', alertStatus: '紧急', identifier: 'stream-proc-19', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-SH-02', owner: '大数据团队', source: '运营', type: 'app', metrics: { cpu: 95, memory: 91, requests: 12000, errorRate: 2.1, responseTime: 15, connections: 234 } },
  { id: 20, name: '报表生成服务', alertStatus: '正常', identifier: 'report-gen-20', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 18, memory: 32, requests: 230, errorRate: 0.0, responseTime: 450, connections: 18 } },
  { id: 21, name: '消息队列管理', alertStatus: '正常', identifier: 'mq-admin-21', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '平台组', source: '运营', type: 'app', metrics: { cpu: 42, memory: 65, requests: 8900, errorRate: 0.0, responseTime: 2, connections: 189 } },
  { id: 22, name: 'CDN调度服务', alertStatus: '正常', identifier: 'cdn-dispatch-22', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '网络团队', source: '运营', type: 'app', metrics: { cpu: 35, memory: 48, requests: 5600, errorRate: 0.1, responseTime: 8, connections: 456 } },
  { id: 23, name: '负载均衡控制器', alertStatus: '正常', identifier: 'lb-controller-23', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '网络团队', source: '运营', type: 'app', metrics: { cpu: 28, memory: 42, requests: 23000, errorRate: 0.0, responseTime: 1, connections: 1234 } },
  { id: 24, name: 'SSL证书管理', alertStatus: '正常', identifier: 'ssl-mgr-24', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 3, memory: 12, requests: 45, errorRate: 0.0, responseTime: 120, connections: 8 } },
  { id: 25, name: '容器镜像仓库', alertStatus: '正常', identifier: 'registry-25', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-SH-02', owner: '容器团队', source: '运营', type: 'app', metrics: { cpu: 48, memory: 72, requests: 1800, errorRate: 0.2, responseTime: 85, connections: 67 } },
  { id: 26, name: 'CI/CD流水线', alertStatus: '正常', identifier: 'cicd-pipeline-26', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: 'DevOps团队', source: '运营', type: 'app', metrics: { cpu: 55, memory: 68, requests: 340, errorRate: 1.2, responseTime: 1200, connections: 23 } },
  { id: 27, name: '配置下发中心', alertStatus: '正常', identifier: 'config-dispatch-27', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 12, memory: 25, requests: 560, errorRate: 0.0, responseTime: 18, connections: 45 } },
  { id: 28, name: '服务注册发现', alertStatus: '正常', identifier: 'service-discovery-28', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '平台组', source: '运营', type: 'app', metrics: { cpu: 32, memory: 45, requests: 12000, errorRate: 0.0, responseTime: 2, connections: 567 } },
  { id: 29, name: '链路追踪系统', alertStatus: '正常', identifier: 'trace-sys-29', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '运维团队', source: '运营', type: 'app', metrics: { cpu: 42, memory: 58, requests: 3400, errorRate: 0.1, responseTime: 12, connections: 89 } },
  { id: 30, name: '审计日志服务', alertStatus: '正常', identifier: 'audit-log-30', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '安全团队', source: '运营', type: 'app', metrics: { cpu: 28, memory: 42, requests: 2100, errorRate: 0.0, responseTime: 25, connections: 34 } },
  { id: 31, name: '权限管理中心', alertStatus: '正常', identifier: 'perm-mgr-31', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '安全团队', source: '运营', type: 'app', metrics: { cpu: 18, memory: 32, requests: 890, errorRate: 0.0, responseTime: 15, connections: 56 } },
  { id: 32, name: '数据脱敏服务', alertStatus: '正常', identifier: 'mask-svc-32', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '安全团队', source: '运营', type: 'app', metrics: { cpu: 35, memory: 48, requests: 450, errorRate: 0.3, responseTime: 68, connections: 23 } },
  { id: 33, name: '备份恢复服务', alertStatus: '正常', identifier: 'backup-svc-33', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '存储团队', source: '运营', type: 'app', metrics: { cpu: 22, memory: 38, requests: 180, errorRate: 0.5, responseTime: 2400, connections: 12 } },
  { id: 34, name: '数据湖查询引擎', alertStatus: '正常', identifier: 'lake-query-34', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '大数据团队', source: '运营', type: 'app', metrics: { cpu: 72, memory: 85, requests: 2300, errorRate: 0.8, responseTime: 560, connections: 78 } },
  { id: 35, name: '机器学习平台', alertStatus: '正常', identifier: 'ml-platform-35', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: 'AI团队', source: '运营', type: 'app', metrics: { cpu: 88, memory: 92, requests: 560, errorRate: 1.5, responseTime: 1200, connections: 34 } },
  { id: 36, name: '物联网接入网关', alertStatus: '正常', identifier: 'iot-gw-36', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: 'IoT团队', source: '运营', type: 'app', metrics: { cpu: 45, memory: 58, requests: 34000, errorRate: 0.0, responseTime: 5, connections: 2345 } },
  { id: 37, name: '消息推送服务', alertStatus: '正常', identifier: 'push-svc-37', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 25, memory: 38, requests: 1200, errorRate: 0.2, responseTime: 45, connections: 56 } },
  { id: 38, name: '国际化服务', alertStatus: '正常', identifier: 'i18n-svc-38', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 8, memory: 18, requests: 340, errorRate: 0.0, responseTime: 12, connections: 23 } },
  { id: 39, name: '灰度发布控制器', alertStatus: '正常', identifier: 'canary-ctrl-39', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: 'DevOps团队', source: '运营', type: 'app', metrics: { cpu: 18, memory: 32, requests: 230, errorRate: 0.0, responseTime: 25, connections: 18 } },
  { id: 40, name: '自动化运维平台', alertStatus: '正常', identifier: 'autoops-40', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '运维团队', source: '运营', type: 'app', metrics: { cpu: 52, memory: 65, requests: 1800, errorRate: 0.1, responseTime: 35, connections: 89 } },
]

const obsData = [
  { id: 101, name: 'OBS-生产存储', alertStatus: '正常', identifier: 'obs-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '11.68 TB', vdc: 'VDC-BJ-01', owner: '存储团队', source: '云服务', type: 'obs', obs: { buckets: 8, objects: '1,285,432', usedStorage: '4.28 TB', availStorage: '92.78 TB', totalRequests: '3,450,892', readRequests: '2,180,456', writeRequests: '1,270,436', downTraffic: '2.57 GB/s', upTraffic: '530 KB/s', storageUtil: 78, topBuckets: [{ name: 'bucket-data-01', size: '4.28 TB', pct: 78 }, { name: 'bucket-log-01', size: '2.15 TB', pct: 45 }, { name: 'bucket-backup-01', size: '1.87 TB', pct: 38 }, { name: 'bucket-media-01', size: '1.24 TB', pct: 26 }, { name: 'bucket-archive-01', size: '0.89 TB', pct: 18 }] } },
  { id: 102, name: 'OBS-灾备存储', alertStatus: '正常', identifier: 'obs-dr-02', runStatus: '运行中', appLevel: '核心服务', storageSize: '8.45 TB', vdc: 'VDC-SH-02', owner: '存储团队', source: '云服务', type: 'obs', obs: { buckets: 5, objects: '654,321', usedStorage: '2.87 TB', availStorage: '45.22 TB', totalRequests: '892,156', readRequests: '534,289', writeRequests: '357,867', downTraffic: '890 MB/s', upTraffic: '210 KB/s', storageUtil: 32, topBuckets: [{ name: 'bucket-dr-data-01', size: '1.45 TB', pct: 52 }, { name: 'bucket-dr-log-01', size: '0.78 TB', pct: 28 }, { name: 'bucket-dr-backup-01', size: '0.64 TB', pct: 22 }] } },
  { id: 103, name: 'OBS-日志归档', alertStatus: '紧急', identifier: 'obs-log-03', runStatus: '运行中', appLevel: '基础服务', storageSize: '6.12 TB', vdc: 'VDC-GZ-03', owner: '--', source: '云服务', type: 'obs', obs: { buckets: 3, objects: '456,789', usedStorage: '3.56 TB', availStorage: '35.78 TB', totalRequests: '1,234,567', readRequests: '723,456', writeRequests: '511,111', downTraffic: '1.2 GB/s', upTraffic: '340 KB/s', storageUtil: 85, topBuckets: [{ name: 'bucket-log-access', size: '2.15 TB', pct: 85 }, { name: 'bucket-log-audit', size: '0.98 TB', pct: 42 }, { name: 'bucket-log-ops', size: '0.43 TB', pct: 18 }] } },
  { id: 104, name: 'OBS-媒体存储', alertStatus: '正常', identifier: 'obs-media-04', runStatus: '运行中', appLevel: '基础服务', storageSize: '3.78 TB', vdc: 'VDC-BJ-01', owner: '媒体团队', source: '云服务', type: 'obs', obs: { buckets: 4, objects: '345,678', usedStorage: '1.89 TB', availStorage: '28.56 TB', totalRequests: '2,345,678', readRequests: '1,567,890', writeRequests: '777,788', downTraffic: '3.2 GB/s', upTraffic: '890 KB/s', storageUtil: 45, topBuckets: [{ name: 'bucket-media-images', size: '0.89 TB', pct: 45 }, { name: 'bucket-media-videos', size: '0.67 TB', pct: 34 }, { name: 'bucket-media-audio', size: '0.33 TB', pct: 16 }] } },
]

const cloudResData = [
  { id: 201, name: '弹性云服务器-集群A', alertStatus: '正常', identifier: 'ecs-cluster-a', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '云平台团队', source: '云资源', type: 'cloud-resource' },
  { id: 202, name: '弹性云服务器-集群B', alertStatus: '紧急', identifier: 'ecs-cluster-b', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-SH-02', owner: '云平台团队', source: '云资源', type: 'cloud-resource' },
  { id: 203, name: '裸金属服务器-计算池', alertStatus: '正常', identifier: 'bm-compute-01', runStatus: '运行中', appLevel: '重要服务', storageSize: '--', vdc: 'VDC-GZ-03', owner: '--', source: '云资源', type: 'cloud-resource' },
  { id: 204, name: 'GPU云服务器-训练节点', alertStatus: '正常', identifier: 'gpu-train-01', runStatus: '运行中', appLevel: '重要服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: 'AI团队', source: '云资源', type: 'cloud-resource' },
  { id: 205, name: '裸金属服务器-存储节点', alertStatus: '正常', identifier: 'bm-storage-02', runStatus: '运行中', appLevel: '基础服务', storageSize: '--', vdc: 'VDC-SH-02', owner: '--', source: '云资源', type: 'cloud-resource' },
]

const virtualData = [
  { id: 301, name: 'Kubernetes集群-生产', alertStatus: '正常', identifier: 'k8s-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '容器团队', source: '虚拟资源池', type: 'virtual' },
  { id: 302, name: 'Kubernetes集群-测试', alertStatus: '紧急', identifier: 'k8s-test-02', runStatus: '运行中', appLevel: '普通服务', storageSize: '--', vdc: 'VDC-SH-02', owner: '容器团队', source: '虚拟资源池', type: 'virtual' },
  { id: 303, name: '容器实例池-边缘', alertStatus: '正常', identifier: 'ci-edge-01', runStatus: '运行中', appLevel: '普通服务', storageSize: '--', vdc: 'VDC-GZ-03', owner: '--', source: '虚拟资源池', type: 'virtual' },
  { id: 304, name: 'Serverless函数-网关', alertStatus: '正常', identifier: 'faas-gw-01', runStatus: '运行中', appLevel: '普通服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '无服务器团队', source: '虚拟资源池', type: 'virtual' },
]

const physicalData = [
  { id: 401, name: '物理服务器-机柜A-01', alertStatus: '正常', identifier: 'phy-rackA-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '基础设施团队', source: '物理资源', type: 'physical' },
  { id: 402, name: '物理服务器-机柜B-02', alertStatus: '紧急', identifier: 'phy-rackB-02', runStatus: '运行中', appLevel: '重要服务', storageSize: '--', vdc: 'VDC-SH-02', owner: '基础设施团队', source: '物理资源', type: 'physical' },
  { id: 403, name: '核心交换机-S7600', alertStatus: '正常', identifier: 'sw-core-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-GZ-03', owner: '网络团队', source: '物理资源', type: 'physical' },
  { id: 404, name: '存储设备-SAN存储', alertStatus: '正常', identifier: 'san-store-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '存储团队', source: '物理资源', type: 'physical' },
  { id: 405, name: '物理服务器-机柜C-03', alertStatus: '正常', identifier: 'phy-rackC-03', runStatus: '运行中', appLevel: '基础服务', storageSize: '--', vdc: 'VDC-SH-02', owner: '--', source: '物理资源', type: 'physical' },
  { id: 406, name: '出口路由器-ISP01', alertStatus: '紧急', identifier: 'rt-edge-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '网络团队', source: '物理资源', type: 'physical' },
]

const filteredData = computed(() => {
  let base
  if (mainTab.value === 'all') base = [...appData, ...obsData, ...cloudResData, ...virtualData, ...physicalData]
  else if (mainTab.value === 'app') base = appData
  else if (mainTab.value === 'cloud') base = obsData
  else if (mainTab.value === 'cloud-resource') base = cloudResData
  else if (mainTab.value === 'virtual') base = virtualData
  else if (mainTab.value === 'physical') base = physicalData
  else base = appData
  if (!searchText.value) return base
  const kw = searchText.value.toLowerCase()
  return base.filter(item =>
    item.name.toLowerCase().includes(kw) || (item.identifier || '').toLowerCase().includes(kw)
  )
})

const cardGroups = [
  { key: 'app', label: '业务应用', icon: 'fa-solid fa-circle-nodes', items: appData },
  { key: 'cloud', label: '云服务', icon: 'fa-solid fa-cloud', items: obsData },
  { key: 'cloud-resource', label: '云资源', icon: 'fa-solid fa-server', items: cloudResData },
  { key: 'virtual', label: '虚拟资源池', icon: 'fa-solid fa-layer-group', items: virtualData },
  { key: 'physical', label: '物理资源', icon: 'fa-solid fa-microchip', items: physicalData },
]

const cardGroupsComputed = computed(() => {
  let groups = cardGroups
  if (mainTab.value !== 'all') {
    groups = cardGroups.filter(g => g.key === mainTab.value)
  }
  return groups.map(g => {
    const items = g.items
      .filter(item =>
        !searchText.value || item.name.toLowerCase().includes(searchText.value.toLowerCase()) || (item.identifier || '').toLowerCase().includes(searchText.value.toLowerCase())
      )
      .sort((a, b) => (b.alertStatus === '紧急' ? 1 : 0) - (a.alertStatus === '紧急' ? 1 : 0))
    const alertCount = items.filter(item => item.alertStatus === '紧急').length
    return { ...g, items, alertCount }
  })
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

.monitor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0 8px;
}
.monitor-header .category-tabs {
  flex: 1;
  min-width: 0;
}
.monitor-header :deep(.category-tabs .ant-tabs-nav) {
  margin-bottom: 0;
}
.monitor-header :deep(.category-tabs .ant-tabs-nav::before) {
  border-bottom: none;
}
.monitor-header :deep(.category-tabs .ant-tabs-tab) {
  font-size: 14px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.card-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}
.card-group {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 16px;
}
.group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  margin-bottom: 16px;
}
.group-arrow {
  font-size: 12px;
  color: #8c8c8c;
  width: 12px;
}
.group-icon {
  font-size: 16px;
  color: #1890ff;
  width: 20px;
  text-align: center;
}
.group-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}
.group-badge {
  font-size: 12px;
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
  border-radius: 10px;
  padding: 1px 10px;
}
.group-badge.alert {
  color: #f5222d;
  background: rgba(245, 34, 45, 0.1);
}
.group-total {
  margin-left: auto;
  font-size: 12px;
  color: #8c8c8c;
}

.card-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: repeat(auto-fill, 210px);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
}
.carousel-wrap {
  position: relative;
  overflow: hidden;
  max-height: 128px;
}
.carousel-wrap:hover .carousel-btn { opacity: 1; }
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background: rgba(255,255,255,0.92);
  color: #666;
  font-size: 11px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.carousel-btn:hover { background: #fff; color: #1890ff; border-color: #1890ff; }
.carousel-prev { left: 6px; }
.carousel-next { right: 6px; }
.res-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.04);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.res-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-color: #1890ff;
}
.res-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.res-icon.alert {
  background: rgba(245, 34, 45, 0.1);
  color: #f5222d;
}
.res-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.res-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.res-alert {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.alert-label { color: #8c8c8c; }
.alert-count { color: #f5222d; font-weight: 500; }

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

.sub-tabs {
  margin-bottom: 16px;
}
.sub-category-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}
.sub-category-tabs :deep(.ant-tabs-nav::before) {
  border-bottom: none;
}
.sub-category-tabs :deep(.ant-tabs-tab) {
  font-size: 13px;
  color: #8c8c8c;
}
.sub-category-tabs :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #1890ff;
  font-weight: 500;
}
.sub-category-tabs :deep(.ant-tabs-ink-bar) {
  background: #1890ff;
}
.sub-category-tabs i {
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
  .monitor-header { padding: 12px 0; flex-wrap: wrap; }
  .monitor-header .header-actions { width: 100%; }
  .alert-cards { flex-wrap: wrap; }
  .alert-card { min-width: calc(50% - 8px); flex: none; }
  .sub-tabs { overflow-x: auto; }
  .table-section { padding: 12px; }
  .metric-grid { grid-template-columns: 1fr; }
  .carousel-wrap { max-height: 154px; }
}
</style>
