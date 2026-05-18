<template>
  <div class="topology-layout">
    <aside class="sidebar-nav" :class="{ collapsed: navCollapsed }">
      <div class="sidebar-header">
        <i class="fa-solid fa-bars"></i>
        <span v-show="!navCollapsed">拓扑视图</span>
        <a-button type="text" size="small" class="collapse-btn" @click="navCollapsed = !navCollapsed">
          <i class="fa-solid" :class="navCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
        </a-button>
      </div>
      <div v-show="!navCollapsed" class="nav-list">
        <div v-for="item in navItems" :key="item.key"
          class="nav-item"
          :class="{ active: activeNav === item.key }"
          @click="activeNav = item.key">
          <i class="fa-solid" :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </aside>

    <main class="topology-main">
      <div class="topology-header">
        <div class="topology-tabs">
          <button class="tab-btn" :class="{ active: topoTab === 'resource' }" @click="topoTab = 'resource'">资源拓扑</button>
          <button class="tab-btn" :class="{ active: topoTab === 'network' }" @click="topoTab = 'network'" disabled>网络拓扑</button>
        </div>
        <div class="topology-toolbar">
          <div class="toolbar-left">
            <a-input-search v-model:value="searchText" placeholder="搜索节点..." style="width: 180px" size="small" />
            <a-button size="small">导出PNG</a-button>
            <a-button size="small">刷新</a-button>
            <a-button size="small">帮助</a-button>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-right">
            <a-tooltip title="放大">
              <a-button type="text" size="small" @click="zoomIn"><i class="fa-solid fa-plus"></i></a-button>
            </a-tooltip>
            <a-tooltip title="缩小">
              <a-button type="text" size="small" @click="zoomOut"><i class="fa-solid fa-minus"></i></a-button>
            </a-tooltip>
            <a-tooltip title="适应视图">
              <a-button type="text" size="small" @click="resetView"><i class="fa-solid fa-expand"></i></a-button>
            </a-tooltip>
            <a-tooltip title="全部收起">
              <a-button type="text" size="small"><i class="fa-solid fa-compress"></i></a-button>
            </a-tooltip>
            <a-tooltip title="全部展开">
              <a-button type="text" size="small"><i class="fa-solid fa-expand"></i></a-button>
            </a-tooltip>
            <a-tooltip title="设置">
              <a-button type="text" size="small"><i class="fa-solid fa-gear"></i></a-button>
            </a-tooltip>
          </div>
        </div>
      </div>

      <div class="topology-title">
        <h2>{{ selectedNodeName }}</h2>
      </div>

      <div class="topology-body">
        <aside v-if="activeNav === 'cloud-system'" class="sidebar-cloud" :class="{ collapsed: cloudViewCollapsed }">
          <div class="sidebar-header">
            <i class="fa-solid fa-diagram-project"></i>
            <span v-show="!cloudViewCollapsed">云系统视图</span>
            <a-button type="text" size="small" class="collapse-btn" @click="cloudViewCollapsed = !cloudViewCollapsed">
              <i class="fa-solid" :class="cloudViewCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
            </a-button>
          </div>
          <div v-show="!cloudViewCollapsed" class="cloud-tree">
            <TreeNode v-for="node in treeData" :key="node.name" :node="node" :selected="selectedNodeName" @select="onNodeSelect" />
          </div>
        </aside>

        <div class="topology-content">
          <div v-if="activeNav === 'cloud-system' && topoTab === 'resource'" class="region-cards">
            <div class="region-card region-card-green">
              <div class="rc-header">
                <h3>华东1</h3>
                <span class="status-tag status-normal">正常</span>
              </div>
              <div class="rc-body">
                <div class="rc-section">
                  <h4 class="rc-section-title">云服务</h4>
                  <div class="service-grid">
                    <span v-for="svc in regionEast.services" :key="svc.name" class="service-item" :class="'svc-' + svc.status">
                      <span class="status-dot" :class="'dot-' + svc.status"></span>
                      {{ svc.name }}
                    </span>
                  </div>
                </div>
                <div class="rc-section">
                  <h4 class="rc-section-title">可用区 ({{ regionEast.az.length }})</h4>
                  <div class="az-grid">
                    <div v-for="az in regionEast.az" :key="az.name" class="az-card" :class="'az-' + az.status">
                      <div class="az-header">
                        <span class="az-name">{{ az.name }}</span>
                        <span class="az-status" :class="'azs-' + az.status">{{ az.statusLabel }}</span>
                      </div>
                      <div class="az-metrics">
                        <span>CPU: {{ az.cpu }}%</span>
                        <span>内存: {{ az.mem }}%</span>
                        <span>存储: {{ az.storage }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="rc-section">
                  <h4 class="rc-section-title">物理资源</h4>
                  <div class="phy-grid">
                    <div class="phy-item">
                      <span class="phy-label">物理服务器</span>
                      <span class="phy-count">{{ regionEast.phy.server.count }} 台</span>
                      <div class="phy-bars">
                        <span v-for="(b, j) in regionEast.phy.server.bars" :key="j" class="phy-bar" :style="{ background: b.color }" :title="b.label">{{ b.count }}</span>
                      </div>
                    </div>
                    <div class="phy-item">
                      <span class="phy-label">网络设备</span>
                      <span class="phy-count">{{ regionEast.phy.network.count }} 台</span>
                      <div class="phy-bars">
                        <span v-for="(b, j) in regionEast.phy.network.bars" :key="j" class="phy-bar" :style="{ background: b.color }" :title="b.label">{{ b.count }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="region-card region-card-orange">
              <div class="rc-header">
                <h3>华北2</h3>
                <span class="status-tag status-warning">警告</span>
              </div>
              <div class="rc-body">
                <div class="rc-section">
                  <h4 class="rc-section-title">云服务</h4>
                  <div class="service-grid">
                    <span v-for="svc in regionNorth.services" :key="svc.name" class="service-item" :class="'svc-' + svc.status">
                      <span class="status-dot" :class="'dot-' + svc.status"></span>
                      {{ svc.name }}
                    </span>
                  </div>
                </div>
                <div class="rc-section">
                  <h4 class="rc-section-title">可用区 ({{ regionNorth.az.length }})</h4>
                  <div class="az-grid">
                    <div v-for="az in regionNorth.az" :key="az.name" class="az-card" :class="'az-' + az.status">
                      <div class="az-header">
                        <span class="az-name">{{ az.name }}</span>
                        <span class="az-status" :class="'azs-' + az.status">{{ az.statusLabel }}</span>
                      </div>
                      <div class="az-metrics">
                        <span>CPU: {{ az.cpu }}%</span>
                        <span>内存: {{ az.mem }}%</span>
                        <span>存储: {{ az.storage }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="rc-section">
                  <h4 class="rc-section-title">物理资源</h4>
                  <div class="phy-grid">
                    <div class="phy-item">
                      <span class="phy-label">物理服务器</span>
                      <span class="phy-count">{{ regionNorth.phy.server.count }} 台</span>
                      <div class="phy-bars">
                        <span v-for="(b, j) in regionNorth.phy.server.bars" :key="j" class="phy-bar" :style="{ background: b.color }" :title="b.label">{{ b.count }}</span>
                      </div>
                    </div>
                    <div class="phy-item">
                      <span class="phy-label">网络设备</span>
                      <span class="phy-count">{{ regionNorth.phy.network.count }} 台</span>
                      <div class="phy-bars">
                        <span v-for="(b, j) in regionNorth.phy.network.bars" :key="j" class="phy-bar" :style="{ background: b.color }" :title="b.label">{{ b.count }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeNav !== 'cloud-system'" class="placeholder-content">
            <p>{{ placeholderText }}</p>
          </div>

          <div v-else class="placeholder-content">
            <p>网络拓扑开发中...</p>
          </div>
        </div>
      </div>

      <div class="legend-float" v-if="legendVisible">
        <div class="legend-header">
          <span>状态图例</span>
          <a-button type="text" size="small" @click="legendVisible = false"><i class="fa-solid fa-xmark"></i></a-button>
        </div>
        <div class="legend-body">
          <div class="legend-item"><span class="status-dot dot-normal"></span> 正常</div>
          <div class="legend-item"><span class="status-dot dot-warning"></span> 警告</div>
          <div class="legend-item"><span class="status-dot dot-error"></span> 异常</div>
        </div>
      </div>

      <div class="minimap-float" v-if="minimapVisible">
        <div class="minimap-header">
          <span>缩略图</span>
          <a-button type="text" size="small" @click="minimapVisible = false"><i class="fa-solid fa-xmark"></i></a-button>
        </div>
        <div class="minimap-body">
          <div class="minimap-dot"></div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Graph } from '@antv/g6'
import TreeNode from './TreeNode.vue'

const navItems = [
  { key: 'cloud-system', label: '云系统拓扑', icon: 'fa-cloud' },
  { key: 'app', label: '应用拓扑', icon: 'fa-cube' },
  { key: 'service', label: '云服务拓扑', icon: 'fa-cubes' },
]
const activeNav = ref('cloud-system')
const navCollapsed = ref(false)
const cloudViewCollapsed = ref(false)
const selectedNodeName = ref('生产云')

function onNodeSelect(name) {
  selectedNodeName.value = name
}

const placeholderText = computed(() => {
  const map = { app: '应用拓扑开发中...', service: '云服务拓扑开发中...' }
  return map[activeNav.value] || ''
})

const topoTab = ref('resource')
const searchText = ref('')
const legendVisible = ref(true)
const minimapVisible = ref(true)

const treeData = [
  {
    name: '生产云', status: 'normal', icon: 'fa-cloud',
    children: [
      {
        name: '华东1', status: 'normal', icon: 'fa-location-dot',
        children: [
          {
            name: '可用区A', status: 'normal',
            children: [
              { name: 'Web服务器组', status: 'normal' },
              { name: '应用服务器组', status: 'warning' },
            ]
          },
          { name: '可用区B', status: 'normal' },
        ]
      },
      {
        name: '华北2', status: 'warning',
        children: [
          { name: '可用区A', status: 'warning' },
        ]
      }
    ]
  },
  { name: '测试云', status: 'normal' },
]

const regionEast = {
  services: [
    { name: 'ECS', status: 'normal' },
    { name: 'RDS', status: 'normal' },
    { name: 'OSS', status: 'normal' },
    { name: 'SLB', status: 'warning' },
    { name: 'Redis', status: 'normal' },
  ],
  az: [
    { name: '可用区A', status: 'normal', statusLabel: '正常', cpu: 60, mem: 60, storage: 50 },
    { name: '可用区B', status: 'normal', statusLabel: '正常', cpu: 56, mem: 56, storage: 50 },
  ],
  phy: {
    server: { count: 14, bars: [{ count: 7, color: '#52c41a', label: '正常' }, { count: 1, color: '#fa8c16', label: '警告' }, { count: 2, color: '#f5222d', label: '异常' }] },
    network: { count: 8, bars: [{ count: 8, color: '#52c41a', label: '正常' }, { count: 0, color: '#8c8c8c', label: '异常' }] },
  }
}

const regionNorth = {
  services: [
    { name: 'ECS', status: 'warning' },
    { name: 'RDS', status: 'normal' },
    { name: 'OSS', status: 'normal' },
    { name: 'Kafka', status: 'error' },
  ],
  az: [
    { name: '可用区A', status: 'warning', statusLabel: '警告', cpu: 60, mem: 60, storage: 50 },
  ],
  phy: {
    server: { count: 10, bars: [{ count: 7, color: '#52c41a', label: '正常' }, { count: 1, color: '#fa8c16', label: '警告' }, { count: 2, color: '#f5222d', label: '异常' }] },
    network: { count: 5, bars: [{ count: 5, color: '#52c41a', label: '正常' }, { count: 0, color: '#8c8c8c', label: '异常' }] },
  }
}

const zoom = ref(1)
function zoomIn() { zoom.value = Math.min(zoom.value + 0.1, 3) }
function zoomOut() { zoom.value = Math.max(zoom.value - 0.1, 0.3) }
function resetView() { zoom.value = 1 }

const g6Container = ref(null)
let graph = null

const g6Data = {
  id: 'root',
  children: [
    { id: 'east', children: [{ id: 'east-az-a' }, { id: 'east-az-b' }] },
    { id: 'north', children: [{ id: 'north-az-a' }] },
  ]
}

onMounted(() => {
  if (g6Container.value) {
    graph = new Graph({
      container: g6Container.value,
      width: 600,
      height: 300,
      autoFit: 'view',
      data: g6Data,
      node: {
        style: {
          labelText: (d) => ({ root: '云系统', east: '华东1', north: '华北2', 'east-az-a': '可用区A', 'east-az-b': '可用区B', 'north-az-a': '可用区A' }[d.id] || d.id),
          size: [100, 36],
          radius: 6,
          fill: '#fff',
          stroke: '#d9d9d9',
          lineWidth: 1.5,
          fontSize: 12,
        }
      },
      edge: {
        style: { stroke: '#d9d9d9', lineWidth: 1.5, endArrow: true },
      },
      layout: {
        type: 'dendrogram',
        direction: 'LR',
        nodeSep: 40,
        rankSep: 100,
      },
      behaviors: ['drag-canvas', 'zoom-canvas'],
    })
    graph.render()
  }
})

onBeforeUnmount(() => {
  if (graph) graph.destroy()
})
</script>

<style scoped>
.topology-layout {
  display: flex;
  height: 100%;
  min-height: 0;
  background: #f5f7fa;
}

/* ── sidebar nav ── */
.sidebar-nav {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: width 0.25s ease;
}
.sidebar-nav.collapsed { width: 44px; }
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  border-bottom: 1px solid #e8e8e8;
}
.sidebar-header .collapse-btn {
  margin-left: auto;
  color: var(--text-sec);
  font-size: 12px;
  flex-shrink: 0;
}
.nav-list { padding: 8px 0; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  user-select: none;
  border-left: 3px solid transparent;
  white-space: nowrap;
}
.nav-item:hover { background: #f5f7fa; }
.nav-item.active {
  background: #e6f7ff;
  color: #1890ff;
  border-left-color: #1890ff;
  font-weight: 500;
}
.nav-item i { width: 16px; text-align: center; font-size: 14px; }

/* ── main ── */
.topology-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

/* ── header ── */
.topology-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
  gap: 12px;
}
.topology-tabs { display: flex; gap: 0; flex-shrink: 0; }
.topology-tabs .tab-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--text-sec);
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.topology-tabs .tab-btn.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 500;
}
.topology-tabs .tab-btn:disabled { color: #d9d9d9; cursor: not-allowed; }
.topology-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}
.toolbar-left, .toolbar-right {
  display: flex; align-items: center; gap: 4px;
}
.toolbar-divider {
  width: 1px; height: 20px; background: #e8e8e8; flex-shrink: 0;
}

/* ── page title ── */
.topology-title {
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}
.topology-title h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

/* ── body (cloud sidebar + content) ── */
.topology-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

/* ── sidebar cloud ── */
.sidebar-cloud {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: width 0.25s ease;
}
.sidebar-cloud.collapsed { width: 44px; }
.sidebar-cloud .sidebar-header { justify-content: space-between; }
.cloud-tree { padding: 4px 0 12px; }

/* ── content ── */
.topology-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  min-height: 0;
}
.placeholder-content {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-sec);
  font-size: 14px;
}

/* ── region cards ── */
.region-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.region-card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.rc-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; }
.region-card-green .rc-header { background: linear-gradient(135deg, #43a047, #66bb6a); }
.region-card-orange .rc-header { background: linear-gradient(135deg, #ef6c00, #ffa726); }
.rc-header h3 { font-size: 16px; font-weight: 600; color: #fff; margin: 0; }
.status-tag { font-size: 12px; padding: 2px 12px; border-radius: 12px; color: #fff; }
.status-tag.status-normal { background: rgba(255,255,255,0.25); }
.status-tag.status-warning { background: rgba(255,255,255,0.25); }
.rc-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 20px; }
.rc-section-title { font-size: 13px; font-weight: 600; color: var(--text); margin: 0 0 10px; }
.service-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.service-item {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; background: #f5f7fa; border-radius: 4px;
  font-size: 13px; color: var(--text);
}
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-normal { background: #52c41a; }
.dot-warning { background: #fa8c16; }
.dot-error { background: #f5222d; }
.az-grid { display: flex; gap: 12px; flex-wrap: wrap; }
.az-card { flex: 1; min-width: 200px; padding: 12px 16px; border-radius: 6px; border: 1.5px solid; }
.az-card.az-normal { border-color: #b7eb8f; background: #f6ffed; }
.az-card.az-warning { border-color: #ffd591; background: #fff7e6; }
.az-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.az-name { font-size: 13px; font-weight: 600; color: var(--text); }
.azs-normal { color: #52c41a; font-size: 12px; }
.azs-warning { color: #fa8c16; font-size: 12px; }
.az-metrics { display: flex; gap: 16px; font-size: 12px; color: var(--text-sec); }
.phy-grid { display: flex; gap: 24px; }
.phy-item { flex: 1; }
.phy-label { display: block; font-size: 12px; color: var(--text-sec); margin-bottom: 4px; }
.phy-count { font-size: 22px; font-weight: 700; color: #1890ff; display: block; margin-bottom: 8px; }
.phy-bars { display: flex; gap: 4px; }
.phy-bar {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 24px; height: 20px; padding: 0 6px; border-radius: 3px;
  font-size: 11px; color: #fff; font-weight: 600;
}

/* legend float */
.legend-float {
  position: fixed; top: 100px; right: 24px;
  background: rgba(255,255,255,0.95); border: 1px solid #e8e8e8;
  border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  width: 150px; z-index: 100;
}
.legend-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 12px; font-weight: 600; color: var(--text); }
.legend-body { padding: 8px 12px; display: flex; flex-direction: column; gap: 6px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-sec); }

/* minimap float */
.minimap-float {
  position: fixed; bottom: 24px; right: 24px;
  background: rgba(255,255,255,0.95); border: 1px solid #e8e8e8;
  border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  width: 160px; z-index: 100;
}
.minimap-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 12px; font-weight: 600; color: var(--text); }
.minimap-body { padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100px; }
.minimap-dot { width: 12px; height: 12px; border-radius: 50%; background: #1890ff; }

@media (max-width: 1024px) {
  .region-cards { grid-template-columns: 1fr; }
  .sidebar-cloud { width: 200px; }
}
@media (max-width: 768px) {
  .sidebar-nav, .sidebar-cloud { display: none; }
  .topology-header { flex-wrap: wrap; }
  .toolbar-left { display: none; }
}
</style>
