<template>
  <div class="resource-view">
    <div class="view-header">
      <h1>资源中心</h1>
    </div>

    <div class="resource-tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
        <i class="fa-solid fa-list"></i> 资产列表
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'topology' }" @click="activeTab = 'topology'">
        <i class="fa-solid fa-network-wired"></i> 资产拓扑
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'changes' }" @click="activeTab = 'changes'">
        <i class="fa-solid fa-clock-rotate-left"></i> 变更记录
      </button>
    </div>

    <!-- 资产列表 -->
    <div class="tab-content" v-if="activeTab === 'list'">
      <div class="filter-bar">
        <a-select v-model:value="filterType" placeholder="资源类型" style="width: 140px" allowClear>
          <a-select-option value="server">服务器</a-select-option>
          <a-select-option value="database">数据库</a-select-option>
          <a-select-option value="network">网络设备</a-select-option>
          <a-select-option value="storage">存储设备</a-select-option>
        </a-select>
        <a-select v-model:value="filterStatus" placeholder="状态" style="width: 120px" allowClear>
          <a-select-option value="running">运行中</a-select-option>
          <a-select-option value="stopped">已停止</a-select-option>
          <a-select-option value="maintenance">维护中</a-select-option>
        </a-select>
        <a-input-search v-model:value="searchText" placeholder="搜索名称/IP" style="width: 240px" />
      </div>

      <a-table :columns="columns" :data-source="filteredAssets" :pagination="{ pageSize: 10 }" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <span><i class="fa-solid" :class="getTypeIcon(record.type)"></i> {{ getTypeText(record.type) }}</span>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 资产拓扑 -->
    <div class="tab-content" v-if="activeTab === 'topology'">
      <div class="topology-toolbar">
        <a-select v-model:value="topologyType" style="width: 160px">
          <a-select-option value="physical">物理拓扑</a-select-option>
          <a-select-option value="service">服务拓扑</a-select-option>
          <a-select-option value="container">容器拓扑</a-select-option>
        </a-select>
        <a-button-group>
          <a-button @click="zoomIn"><i class="fa-solid fa-magnifying-glass-plus"></i></a-button>
          <a-button @click="zoomOut"><i class="fa-solid fa-magnifying-glass-minus"></i></a-button>
          <a-button @click="resetView"><i class="fa-solid fa-arrows-rotate"></i></a-button>
        </a-button-group>
      </div>
      <div class="topology-canvas" ref="topologyRef">
        <div class="topology-container" :style="{ transform: `scale(${zoom})` }">
          <div class="topology-node server" style="top: 60px; left: 280px;">
            <div class="node-icon"><i class="fa-solid fa-server"></i></div>
            <div class="node-name">核心交换机</div>
            <div class="node-ip">10.0.1.1</div>
          </div>
          <div class="topology-node server" style="top: 180px; left: 120px;">
            <div class="node-icon"><i class="fa-solid fa-server"></i></div>
            <div class="node-name">Web服务器1</div>
            <div class="node-ip">10.0.2.10</div>
          </div>
          <div class="topology-node server" style="top: 180px; left: 280px;">
            <div class="node-icon"><i class="fa-solid fa-server"></i></div>
            <div class="node-name">Web服务器2</div>
            <div class="node-ip">10.0.2.11</div>
          </div>
          <div class="topology-node database" style="top: 180px; left: 440px;">
            <div class="node-icon"><i class="fa-solid fa-database"></i></div>
            <div class="node-name">数据库主库</div>
            <div class="node-ip">10.0.3.20</div>
          </div>
          <div class="topology-node server" style="top: 300px; left: 120px;">
            <div class="node-icon"><i class="fa-solid fa-network-card"></i></div>
            <div class="node-name">负载均衡</div>
            <div class="node-ip">10.0.4.30</div>
          </div>
          <div class="topology-node container" style="top: 300px; left: 280px;">
            <div class="node-icon"><i class="fa-solid fa-box"></i></div>
            <div class="node-name">K8s集群</div>
            <div class="node-ip">10.0.5.0/16</div>
          </div>
          <div class="topology-line" style="top: 100px; left: 310px; width: 2px; height: 60px;"></div>
          <div class="topology-line" style="top: 100px; left: 310px; width: 80px; height: 2px; left: 200px; top: 160px;"></div>
          <div class="topology-line" style="top: 100px; left: 310px; width: 2px; height: 60px; left: 350px;"></div>
          <div class="topology-line" style="top: 100px; left: 310px; width: 140px; height: 2px; left: 370px; top: 160px;"></div>
          <div class="topology-line" style="top: 220px; left: 150px; width: 2px; height: 60px;"></div>
          <div class="topology-line" style="top: 220px; left: 310px; width: 2px; height: 60px;"></div>
          <div class="topology-line" style="top: 220px; left: 470px; width: 2px; height: 60px;"></div>
        </div>
      </div>
    </div>

    <!-- 变更记录 -->
    <div class="tab-content" v-if="activeTab === 'changes'">
      <div class="filter-bar">
        <a-select v-model:value="changeType" placeholder="变更类型" style="width: 140px" allowClear>
          <a-select-option value="create">新增</a-select-option>
          <a-select-option value="update">更新</a-select-option>
          <a-select-option value="delete">删除</a-select-option>
          <a-select-option value="maintenance">维护</a-select-option>
        </a-select>
        <a-range-picker v-model:value="changeRange" style="width: 240px" />
      </div>

      <a-timeline>
        <a-timeline-item v-for="change in changes" :key="change.id" :color="getChangeColor(change.type)">
          <div class="change-item">
            <div class="change-header">
              <span class="change-action" :class="change.type">{{ getChangeText(change.type) }}</span>
              <span class="change-resource">{{ change.resource }}</span>
            </div>
            <div class="change-detail">{{ change.detail }}</div>
            <div class="change-meta">
              <span>{{ change.operator }}</span>
              <span>{{ change.time }}</span>
            </div>
          </div>
        </a-timeline-item>
      </a-timeline>
    </div>

    <!-- 资产详情抽屉 -->
    <a-drawer v-model:open="detailVisible" title="资产详情" width="520">
      <div class="detail-content" v-if="currentAsset">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">名称</span><span class="value">{{ currentAsset.name }}</span></div>
            <div class="detail-item"><span class="label">IP</span><span class="value">{{ currentAsset.ip }}</span></div>
            <div class="detail-item"><span class="label">类型</span><span class="value">{{ getTypeText(currentAsset.type) }}</span></div>
            <div class="detail-item"><span class="label">状态</span><a-tag :color="getStatusColor(currentAsset.status)">{{ getStatusText(currentAsset.status) }}</a-tag></div>
            <div class="detail-item"><span class="label">地域</span><span class="value">{{ currentAsset.region }}</span></div>
            <div class="detail-item"><span class="label">创建时间</span><span class="value">{{ currentAsset.createdAt }}</span></div>
          </div>
        </div>
        <div class="detail-section">
          <h4>配置信息</h4>
          <div class="detail-grid">
            <div class="detail-item" v-for="(v, k) in currentAsset.config" :key="k">
              <span class="label">{{ k }}</span><span class="value">{{ v }}</span>
            </div>
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const activeTab = ref('list')
const searchText = ref('')
const filterType = ref(null)
const filterStatus = ref(null)
const detailVisible = ref(false)
const currentAsset = ref(null)

const topologyType = ref('physical')
const zoom = ref(1)

const changeType = ref(null)
const changeRange = ref(null)

const assets = ref([])
const changes = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const [assetsRes, changesRes] = await Promise.all([
      fetch('/api/cmdb/ci?sort=id&order=ASC'),
      fetch('/api/cmdb/resource_changes?sort=id&order=ASC'),
    ])
    const assetsJson = await assetsRes.json()
    const changesJson = await changesRes.json()
    if (assetsJson.success) {
      assets.value = assetsJson.data.map(function(item) {
        var typeMap = { 1: 'server', 2: 'database', 3: 'middleware', 4: 'network' }
        return {
          id: item.id,
          name: item.name,
          ip: item.ip,
          type: typeMap[item.ci_type_id] || 'server',
          status: item.status,
          region: item.region,
          createdAt: item.created_at,
          config: { cpu: item.metadata ? item.metadata.cpu || 4 : 4, memory: item.metadata ? item.metadata.memory || 16 : 16, disk: item.metadata ? item.metadata.disk || 500 : 500 },
        }
      })
    }
    if (changesJson.success) {
      changes.value = changesJson.data.map(function(item) {
        return {
          id: item.id,
          type: item.type,
          resource: item.resource,
          detail: item.detail,
          operator: item.operator,
          time: item.time,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: 'IP', dataIndex: 'ip', key: 'ip' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '地域', dataIndex: 'region', key: 'region' },
  { title: '操作', key: 'action', width: 100 },
]

const filteredAssets = computed(() => {
  return assets.value.filter(a => {
    if (filterType.value && a.type !== filterType.value) return false
    if (filterStatus.value && a.status !== filterStatus.value) return false
    if (searchText.value && !a.name.includes(searchText.value) && !a.ip.includes(searchText.value)) return false
    return true
  })
})

const getTypeIcon = (type) => ({ server: 'fa-server', database: 'fa-database', network: 'fa-network-wired', storage: 'fa-boxes-stacked' }[type])
const getTypeText = (type) => ({ server: '服务器', database: '数据库', network: '网络设备', storage: '存储设备' }[type])
const getStatusColor = (s) => ({ running: 'green', stopped: 'red', maintenance: 'orange' }[s])
const getStatusText = (s) => ({ running: '运行中', stopped: '已停止', maintenance: '维护中' }[s])
const getChangeColor = (t) => ({ create: 'green', update: 'blue', delete: 'red', maintenance: 'orange' }[t])
const getChangeText = (t) => ({ create: '新增', update: '更新', delete: '删除', maintenance: '维护' }[t])

const viewDetail = (asset) => { currentAsset.value = asset; detailVisible.value = true }
const zoomIn = () => { zoom.value = Math.min(zoom.value + 0.1, 2) }
const zoomOut = () => { zoom.value = Math.max(zoom.value - 0.1, 0.5) }
const resetView = () => { zoom.value = 1 }
</script>

<style scoped>
.resource-view { padding: 24px; max-width: 1400px; margin: 0 auto; }
.view-header { margin-bottom: 20px; }
.view-header h1 { font-size: 24px; font-weight: 600; margin: 0; }

.resource-tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
.tab-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border: none; background: transparent; font-size: 14px; color: var(--text-secondary); cursor: pointer; border-radius: 6px; transition: all 0.15s; }
.tab-btn:hover { background: var(--bg-sec); color: var(--text); }
.tab-btn.active { background: var(--brand-subtle); color: var(--brand); font-weight: 500; }

.filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }

.topology-toolbar { display: flex; justify-content: space-between; margin-bottom: 20px; }
.topology-canvas { height: 400px; background: var(--bg-card); border-radius: 8px; overflow: auto; position: relative; }
.topology-container { position: relative; width: 600px; height: 400px; transform-origin: center; transition: transform 0.2s; }
.topology-node { position: absolute; width: 100px; padding: 12px; background: var(--bg); border: 2px solid var(--border); border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s; }
.topology-node:hover { border-color: var(--brand); box-shadow: var(--shadow-md); }
.topology-node.server { border-left: 3px solid #1890ff; }
.topology-node.database { border-left: 3px solid #52c41a; }
.topology-node.container { border-left: 3px solid #722ed1; }
.node-icon { font-size: 24px; margin-bottom: 8px; color: var(--brand); }
.node-name { font-size: 12px; font-weight: 500; margin-bottom: 4px; }
.node-ip { font-size: 11px; color: var(--text-secondary); }
.topology-line { position: absolute; background: var(--border); }

.change-item { padding-bottom: 8px; }
.change-header { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
.change-action { font-size: 12px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.change-action.create { background: #f6ffed; color: #52c41a; }
.change-action.update { background: #e6f7ff; color: #1890ff; }
.change-action.delete { background: #fff1f0; color: #f5222d; }
.change-action.maintenance { background: #fff7e6; color: #fa8c16; }
.change-resource { font-weight: 500; }
.change-detail { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.change-meta { font-size: 12px; color: var(--text-ter); display: flex; gap: 16px; }

.detail-content { display: flex; flex-direction: column; gap: 24px; }
.detail-section h4 { font-size: 14px; font-weight: 600; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-item .label { font-size: 12px; color: var(--text-secondary); }
.detail-item .value { font-size: 14px; }
</style>