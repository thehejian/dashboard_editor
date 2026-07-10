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
      <div class="topology-title">
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
          <h2>{{ selectedNodeName }}</h2>
          <div v-if="topoInfo" class="topo-highlight-bar">
            <i class="fa-solid fa-wand-magic-sparkles" style="color:#722ED1"></i>
            <span>AI 分析高亮：</span>
            <a-tag v-for="n in topoInfo.nodes" :key="n" color="purple" style="margin-right:4px">{{ n }}</a-tag>
            <a-button type="text" size="small" style="margin-left:8px;color:#8c8c8c" @click="clearTopoHighlight(); topoInfo = null">
              <i class="fa-solid fa-xmark"></i>
            </a-button>
          </div>
        </div>
      </div>

      <div class="topology-header">
        <div v-if="activeNav === 'cloud-system'" class="topology-tabs">
          <button class="tab-btn" :class="{ active: topoTab === 'resource' }" @click="switchTopoTab('resource')">资源拓扑</button>
          <button class="tab-btn" :class="{ active: topoTab === 'network' }" @click="switchTopoTab('network')">网络拓扑</button>
        </div>
        <div v-else-if="activeNav === 'app'" class="topology-tabs">
          <button v-for="t in APP_TABS" :key="t.key" class="tab-btn" :class="{ active: appTab === t.key }" @click="switchAppTab(t.key)">{{ t.label }}</button>
        </div>
        <div class="topology-toolbar">
          <div class="toolbar-left">
            <a-select v-if="topoTab === 'network'" v-model:value="groupMode" size="small" style="width: 126px">
              <a-select-option value="single">单核心组网</a-select-option>
              <a-select-option value="dual">双核心组网</a-select-option>
              <a-select-option value="three">三层组网</a-select-option>
            </a-select>
            <a-input-search v-model:value="searchText" placeholder="搜索节点..." style="width: 180px" size="small" />
            <a-button size="small">导出PNG</a-button>
            <a-button size="small">刷新</a-button>
            <a-button size="small">帮助</a-button>
            <a-button size="small" :type="anomalyMode ? 'primary' : 'default'" :danger="anomalyMode" @click="toggleAnomalyMode">
              <i class="fa-solid fa-wand-magic-sparkles" style="margin-right:4px"></i> {{ anomalyMode ? '退出异常模式' : '异常检测' }}
            </a-button>
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
              <a-button type="text" size="small" @click="resetView"><i class="fa-solid fa-maximize"></i></a-button>
            </a-tooltip>
            <a-tooltip title="全部收起">
              <a-button type="text" size="small"><i class="fa-solid fa-angles-up"></i></a-button>
            </a-tooltip>
            <a-tooltip title="全部展开">
              <a-button type="text" size="small"><i class="fa-solid fa-angles-down"></i></a-button>
            </a-tooltip>
            <a-dropdown :trigger="['click']">
              <a-tooltip title="设置">
                <a-button type="text" size="small"><i class="fa-solid fa-gear"></i></a-button>
              </a-tooltip>
              <template #overlay>
                <div class="sd-popup">
                  <template v-if="topoTab === 'network'">
                    <div class="sd-section">网络图例</div>
                    <div class="sd-item"><span class="lg-line solid-red"></span> 云骨干/管理通道</div>
                    <div class="sd-item"><span class="lg-line dashed-black"></span> Region专线/AZ互通</div>
                    <div class="sd-item"><span class="lg-line solid-orange"></span> 网关/路由连接</div>
                    <div class="sd-item"><span class="lg-line solid-blue"></span> 内网/核心层</div>
                    <div class="sd-item"><span class="lg-line solid-green"></span> 业务网络/子网</div>
                    <div class="sd-section" style="margin-top:8px;border-top:1px solid #f0f0f0;padding-top:8px;">对象类型</div>
                    <div class="sd-item"><i class="fa-solid fa-cloud" style="width:14px;text-align:center;color:#8c8c8c"></i> 云系统</div>
                    <div class="sd-item"><i class="fa-solid fa-route" style="width:14px;text-align:center;color:#8c8c8c"></i> 路由器</div>
                    <div class="sd-item"><i class="fa-solid fa-right-left" style="width:14px;text-align:center;color:#8c8c8c"></i> 网关</div>
                    <div class="sd-item"><i class="fa-solid fa-code-branch" style="width:14px;text-align:center;color:#8c8c8c"></i> 交换机</div>
                    <div class="sd-item"><i class="fa-solid fa-server" style="width:14px;text-align:center;color:#8c8c8c"></i> 主机组</div>
                  </template>
                  <template v-else>
                    <div class="sd-section">图例</div>
                    <div class="sd-item"><span class="status-dot dot-normal" style="margin-right:8px"></span> 正常</div>
                    <div class="sd-item"><span class="status-dot dot-warning" style="margin-right:8px"></span> 警告</div>
                    <div class="sd-item"><span class="status-dot dot-error" style="margin-right:8px"></span> 异常</div>
                  </template>
                </div>
              </template>
            </a-dropdown>
          </div>
        </div>
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
          <div class="region-card" @click="openNodeDetail('华东1')" style="cursor:pointer">
            <div class="rc-header">
                <h3><span class="rc-badge rc-badge-green"></span>华东1</h3>
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

          <div class="region-card" @click="openNodeDetail('华北2')" style="cursor:pointer">
            <div class="rc-header">
                <h3><span class="rc-badge rc-badge-orange"></span>华北2</h3>
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

          <div v-if="['cloud-system', 'app', 'service'].includes(activeNav)" class="network-topology">
            <div v-if="topoTab === 'network'" ref="networkContainer" class="network-canvas"></div>
            <div v-if="topoTab === 'application'" ref="appContainer" class="network-canvas"></div>
          </div>
        </div>
      </div>


      <div class="node-detail-panel" :class="{ open: nodeDetailPanelOpen }">
        <div class="node-detail-mask" @click="closeNodeDetailPanel"></div>
        <div class="node-detail-content">
          <div class="node-detail-header">
            <h3>{{ nodeDetailData?.name || '' }}</h3>
            <a-button type="text" class="close-btn" @click="closeNodeDetailPanel"><i class="fa-solid fa-xmark"></i></a-button>
          </div>
          <div class="node-detail-body">
            <div class="nd-section">
              <h4 class="nd-section-title">基本信息</h4>
              <div class="nd-info-grid">
                <div class="nd-info-row"><span class="nd-label">类型</span><span class="nd-value">{{ nodeDetailData?.type }}</span></div>
                <div class="nd-info-row"><span class="nd-label">ID</span><span class="nd-value">{{ nodeDetailData?.id }}</span></div>
                <div class="nd-info-row"><span class="nd-label">状态</span><span class="nd-value"><span class="status-tag-sm" :class="'status-nd-' + nodeDetailData?.status">{{ statusLabel(nodeDetailData?.status) }}</span></span></div>
              </div>
            </div>

            <div class="nd-section">
              <h4 class="nd-section-title nd-collapsible" @click="ndSectionOpen.svc = !ndSectionOpen.svc">
                <i class="fa-solid" :class="ndSectionOpen.svc ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                云服务 (<span class="nd-abnormal-count">{{ abnormalCount(nodeDetailData?.services) }}</span>/{{ nodeDetailData?.services?.length || 0 }})
              </h4>
              <template v-if="ndSectionOpen.svc">
                <a-input-search v-model:value="ndServiceSearch" placeholder="搜索服务..." class="nd-search" />
                <table class="nd-table">
                  <thead><tr><th>服务名称</th><th>部署主机/POD</th><th>状态</th><th>描述</th></tr></thead>
                  <tbody>
                    <tr v-for="svc in paginatedServiceData" :key="svc.name">
                      <td><a class="nd-link">{{ svc.name }}</a></td>
                      <td>{{ svc.host }}</td>
                      <td><span class="status-tag-sm" :class="'status-nd-' + svc.status">{{ statusLabel(svc.status) }}</span></td>
                      <td class="nd-desc">{{ svc.desc }}</td>
                    </tr>
                  </tbody>
                </table>
                <a-pagination v-model:current="ndServicePage" :total="filteredServiceData.length" :pageSize="5" size="small" showSizeChanger :pageSizeOptions="['5', '10']" style="margin-top:8px;text-align:right" />
              </template>
            </div>

            <div class="nd-section">
              <h4 class="nd-section-title nd-collapsible" @click="ndSectionOpen.az = !ndSectionOpen.az">
                <i class="fa-solid" :class="ndSectionOpen.az ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                可用分区 (<span class="nd-abnormal-count">{{ abnormalCount(getAzListFromRegion(nodeDetailData?.name || '')) }}</span>/{{ getAzListFromRegion(nodeDetailData?.name || '').length }})
              </h4>
              <template v-if="ndSectionOpen.az">
                <a-input-search v-model:value="ndAzSearch" placeholder="搜索可用分区..." class="nd-search" />
                <table class="nd-table">
                  <thead><tr><th>可用分区名称</th><th>状态</th><th>描述</th></tr></thead>
                  <tbody>
                    <tr v-for="az in paginatedAzData" :key="az.name">
                      <td><a class="nd-link">{{ az.name }}</a></td>
                      <td><span class="status-tag-sm" :class="'status-nd-' + az.status">{{ statusLabel(az.status) }}</span></td>
                      <td class="nd-desc">{{ az.desc }}</td>
                    </tr>
                  </tbody>
                </table>
                <a-pagination v-model:current="ndAzPage" :total="filteredAzData.length" :pageSize="5" size="small" showSizeChanger :pageSizeOptions="['5', '10']" style="margin-top:8px;text-align:right" />
              </template>
            </div>

            <div class="nd-section">
              <h4 class="nd-section-title nd-collapsible" @click="ndSectionOpen.phy = !ndSectionOpen.phy">
                <i class="fa-solid" :class="ndSectionOpen.phy ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                物理资源 (<span class="nd-abnormal-count">{{ abnormalCount(nodeDetailData?.physicalServers) }}</span>/{{ nodeDetailData?.physicalServers?.length || 0 }})
              </h4>
              <template v-if="ndSectionOpen.phy">
                <a-input-search v-model:value="ndPhysicalSearch" placeholder="搜索物理服务器..." class="nd-search" />
                <table class="nd-table">
                  <thead><tr><th>名称</th><th>IP地址</th><th>状态</th></tr></thead>
                  <tbody>
                    <tr v-for="s in paginatedPhysicalData" :key="s.name">
                      <td><a class="nd-link">{{ s.name }}</a></td>
                      <td>{{ s.ip }}</td>
                      <td><span class="status-tag-sm" :class="'status-nd-' + s.status">{{ statusLabel(s.status) }}</span></td>
                    </tr>
                  </tbody>
                </table>
                <a-pagination v-model:current="ndPhysicalPage" :total="filteredPhysicalData.length" :pageSize="5" size="small" showSizeChanger :pageSizeOptions="['5', '10']" style="margin-top:8px;text-align:right" />
              </template>
            </div>
          </div>
          <div class="node-detail-footer">
            <a-button type="primary">下钻查看</a-button>
            <a-button>查看详情</a-button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Graph } from '@antv/g6'
import TreeNode from './TreeNode.vue'
import { topoHighlight, clearTopoHighlight, topoRefreshTrigger, intelligentState, setAnomalyMode, setPropagationPath } from '../../composables/useEditorState.js'

const navItems = [
  { key: 'cloud-system', label: '云系统拓扑', icon: 'fa-cloud' },
  { key: 'app', label: '应用拓扑', icon: 'fa-cube' },
  { key: 'service', label: '云服务拓扑', icon: 'fa-cubes' },
]
const activeNav = ref('cloud-system')
const navCollapsed = ref(false)
const cloudViewCollapsed = ref(false)
const selectedNodeName = ref('应用拓扑')
const nodeDetailPanelOpen = ref(false)
const nodeDetailData = ref(null)

const statusOrder = { error: 0, warning: 1, normal: 2 }

const ndSectionOpen = reactive({ phy: true, az: true, svc: true })
const ndPhysicalSearch = ref('')
const ndAzSearch = ref('')
const ndServiceSearch = ref('')
const ndPhysicalPage = ref(1)
const ndAzPage = ref(1)
const ndServicePage = ref(1)

const filteredPhysicalData = computed(() => {
  const list = nodeDetailData.value?.physicalServers || []
  const kw = ndPhysicalSearch.value.toLowerCase()
  return kw ? list.filter(s => s.name.toLowerCase().includes(kw) || s.ip.includes(kw)) : list
})
const sortedPhysicalData = computed(() =>
  filteredPhysicalData.value.slice().sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
)
function getAzListFromRegion(regionName) {
  const region = treeData.flatMap(c => c.children || []).find(r => r.name === regionName)
  return (region?.children || [])
    .filter(c => c.name.startsWith('可用区'))
    .map(c => ({ name: c.name, status: c.status, desc: `${regionName}-${c.name}` }))
}

const filteredAzData = computed(() => {
  const list = getAzListFromRegion(nodeDetailData.value?.name || '')
  const kw = ndAzSearch.value.toLowerCase()
  return kw ? list.filter(a => a.name.toLowerCase().includes(kw) || a.desc.toLowerCase().includes(kw)) : list
})
const sortedAzData = computed(() =>
  filteredAzData.value.slice().sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
)
const paginatedAzData = computed(() => {
  const start = (ndAzPage.value - 1) * 5
  return sortedAzData.value.slice(start, start + 5)
})

const filteredServiceData = computed(() => {
  const list = nodeDetailData.value?.services || []
  const kw = ndServiceSearch.value.toLowerCase()
  return kw ? list.filter(s => s.name.toLowerCase().includes(kw) || s.desc.includes(kw)) : list
})
const sortedServiceData = computed(() =>
  filteredServiceData.value.slice().sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
)

const paginatedPhysicalData = computed(() => {
  const start = (ndPhysicalPage.value - 1) * 5
  return sortedPhysicalData.value.slice(start, start + 5)
})
const paginatedServiceData = computed(() => {
  const start = (ndServicePage.value - 1) * 5
  return sortedServiceData.value.slice(start, start + 5)
})

function abnormalCount(list) {
  return list?.filter(s => s.status === 'error' || s.status === 'warning').length || 0
}

const nodeDetailMap = {
  华东1: {
    name: '华东1', type: '节点', id: 'region-huadong1', status: 'normal',
    physicalServers: [
      { name: 'mq-server-01', ip: '192.168.1.109', status: 'error' },
      { name: 'app-server-02', ip: '192.168.1.104', status: 'warning' },
      { name: 'web-server-01', ip: '192.168.1.101', status: 'normal' },
      { name: 'db-master-01', ip: '192.168.1.201', status: 'normal' },
      { name: 'cache-node-01', ip: '192.168.1.50', status: 'normal' },
      { name: 'lb-01', ip: '192.168.1.10', status: 'normal' },
      { name: 'monitor-01', ip: '192.168.1.200', status: 'normal' },
    ],
    services: [
      { name: 'SLB', host: 'slb-controller-01', status: 'warning', desc: '负载均衡服务' },
      { name: 'ECS', host: 'ecs-controller-01', status: 'normal', desc: '弹性计算服务' },
      { name: 'RDS', host: 'rds-manager-01', status: 'normal', desc: '关系型数据库服务' },
      { name: 'OSS', host: 'oss-server-01', status: 'normal', desc: '对象存储服务' },
      { name: 'Redis', host: 'redis-cluster-01', status: 'normal', desc: '缓存服务' },
      { name: 'MNS', host: 'mns-server-01', status: 'normal', desc: '消息通知服务' },
      { name: 'DTS', host: 'dts-worker-01', status: 'normal', desc: '数据传输服务' },
      { name: 'CDN', host: 'cdn-edge-01', status: 'normal', desc: '内容分发服务' },
    ],
  },
  华北2: {
    name: '华北2', type: '节点', id: 'region-huabei2', status: 'warning',
    physicalServers: [
      { name: 'db-server-01', ip: '192.168.2.201', status: 'error' },
      { name: 'web-server-01', ip: '192.168.2.101', status: 'warning' },
      { name: 'web-server-02', ip: '192.168.2.102', status: 'normal' },
      { name: 'app-node-01', ip: '192.168.2.50', status: 'normal' },
      { name: 'cache-01', ip: '192.168.2.60', status: 'normal' },
      { name: 'gw-01', ip: '192.168.2.1', status: 'normal' },
    ],
    services: [
      { name: 'Kafka', host: 'kafka-huabei-01', status: 'error', desc: '消息队列服务' },
      { name: 'ECS', host: 'ecs-huabei-01', status: 'warning', desc: '弹性计算服务' },
      { name: 'RDS', host: 'rds-huabei-01', status: 'normal', desc: '关系型数据库服务' },
      { name: 'OSS', host: 'oss-huabei-01', status: 'normal', desc: '对象存储服务' },
      { name: 'Redis', host: 'redis-huabei-01', status: 'normal', desc: '缓存服务' },
      { name: 'SLB', host: 'slb-huabei-01', status: 'normal', desc: '负载均衡服务' },
    ],
  },
}

function statusLabel(s) {
  return ({ normal: '正常', warning: '警告', error: '异常' })[s] || s || ''
}

const route = useRoute()
const router = useRouter()
const topoTab = computed(() => activeNav.value === 'app' ? 'application' : (route.query.tab || 'resource'))
function switchTopoTab(tab) {
  router.push({ query: { ...route.query, tab } })
}

watch(() => route.query.tab, (tab) => {
  if (tab === 'application') activeNav.value = 'app'
}, { immediate: true })

watch(topoRefreshTrigger, () => {
  if (activeNav.value === 'app') {
    destroyAppGraph()
    nextTick(() => initAppGraph(appTab.value))
  }
})

const APP_TABS = [
  { key: 'all', label: '全局视图' },
  { key: 'order', label: '订单系统' },
  { key: 'payment', label: '支付系统' },
  { key: 'user', label: '用户系统' },
]
const APP_ICON_MAP = {
  internet: '\uf0ac', access: '\uf0ac', security: '\uf132', lb: '\uf0ec', gateway: '\uf0e7',
  registry: '\uf1c0', service: '\uf233', cache: '\uf0a0', mq: '\uf0e7', search: '\uf1c0',
  database: '\uf1c0', infra: '\uf233',
}
const APP_FILTER_MAP = {
  order: new Set([
    'cdn', 'waf', 'slb', 'lb-api',
    'prod-order-01', 'prod-order-02', 'prod-order-03',
    'prod-inventory-01',
    'redis-cache',
  ]),
  payment: new Set([
    'cdn', 'waf', 'slb', 'lb-api',
    'prod-pay-01', 'prod-pay-02',
    'redis-cache',
  ]),
  user: new Set([
    'cdn', 'waf', 'slb', 'lb-api',
    'prod-user-01', 'prod-user-02',
    'redis-cache',
  ]),
}
const appTab = computed(() => route.query.appTab || 'order')
function switchAppTab(tab) {
  router.push({ query: { ...route.query, tab: 'application', appTab: tab } })
}

function onNodeSelect(name) {
  selectedNodeName.value = name
}

function openNodeDetail(name) {
  if (nodeDetailMap[name]) {
    nodeDetailData.value = nodeDetailMap[name]
    nodeDetailPanelOpen.value = true
  }
}

function closeNodeDetailPanel() {
  nodeDetailPanelOpen.value = false
}

const placeholderText = computed(() => {
  })

const topoInfo = ref(null)

const searchText = ref('')
const groupMode = ref('single')
const networkContainer = ref(null)
let networkGraph = null
const appContainer = ref(null)
let appGraph = null

const anomalyMode = ref(false)
const anomalyData = ref([])

async function toggleAnomalyMode() {
  anomalyMode.value = !anomalyMode.value
  setAnomalyMode(anomalyMode.value)
  if (!anomalyMode.value) {
    anomalyData.value = []
    setPropagationPath([], [])
    clearAllAnomalyStates()
    return
  }
  try {
    const res = await fetch('/api/intelligent/detect', { method: 'POST' })
    const data = await res.json()
    anomalyData.value = data.data?.anomalies || []
    applyAnomalyStates()
  } catch {}
}

function clearAllAnomalyStates() {
  if (networkGraph) {
    networkGraph.getNodeData().forEach(n => {
      networkGraph.setItemState(n.id, 'anomaly-highlight', false)
      networkGraph.setItemState(n.id, 'dimmed', false)
    })
  }
  if (appGraph) {
    appGraph.getNodeData().forEach(n => {
      appGraph.setItemState(n.id, 'anomaly-highlight', false)
      appGraph.setItemState(n.id, 'dimmed', false)
    })
  }
}

function applyAnomalyStates() {
  const anomalyIds = anomalyData.value.map(a => a.nodeId)
  const rootCause = anomalyData.value.reduce((max, a) => a.score > (max?.score || 0) ? a : max, null)
  const propagationNodes = computePropagationPath(rootCause?.nodeId, anomalyIds)

  if (appGraph) {
    const gNodes = appGraph.getNodeData()
    gNodes.forEach(n => {
      if (anomalyIds.includes(n.id)) {
        appGraph.setItemState(n.id, 'anomaly-highlight', true)
        appGraph.setItemState(n.id, 'dimmed', false)
      } else {
        appGraph.setItemState(n.id, 'dimmed', true)
        appGraph.setItemState(n.id, 'anomaly-highlight', false)
      }
    })
    if (propagationNodes.length > 1) {
      const gEdges = appGraph.getEdgeData()
      gEdges.forEach(e => {
        const inPath = propagationNodes.some(n => n === e.source) && propagationNodes.some(n => n === e.target)
        if (inPath) {
          appGraph.updateEdgeData(e.id, { style: { stroke: '#F5222D', lineDash: [6, 3], lineWidth: 2.5 } })
        }
      })
      appGraph.render()
    }
    if (rootCause) {
      appGraph.focusElement(rootCause.nodeId, { animation: { duration: 800 } })
    }
  }
}

function computePropagationPath(rootId, anomalyIds) {
  if (!rootId) return []
  const edges = MOCK_TOPO_EDGES || []
  const upstreamMap = {}
  edges.forEach(e => {
    if (!upstreamMap[e.target]) upstreamMap[e.target] = []
    upstreamMap[e.target].push(e.source)
  })
  const path = []
  const visited = new Set()
  function bfs(nodeId) {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    path.push(nodeId)
    const parents = upstreamMap[nodeId] || []
    parents.forEach(p => bfs(p))
  }
  bfs(rootId)
  return path
}

watch(() => topoHighlight.active, (val) => {
  if (val && topoHighlight.nodes?.length) {
    topoInfo.value = { nodes: [...topoHighlight.nodes] }
    if (networkGraph) {
      const gNodes = networkGraph.getNodeData()
      const anyMatch = gNodes.some(n => topoHighlight.nodes.includes(n.id))
      if (anyMatch) {
        gNodes.forEach(n => {
          if (topoHighlight.nodes.includes(n.id)) {
            networkGraph.setItemState(n.id, 'ai-highlight', true)
            networkGraph.setItemState(n.id, 'dimmed', false)
            networkGraph.focusElement(n.id, { animation: { duration: 800 } })
          } else {
            networkGraph.setItemState(n.id, 'dimmed', true)
            networkGraph.setItemState(n.id, 'ai-highlight', false)
          }
        })
      }
    }
    if (appGraph) {
      const aNodes = appGraph.getNodeData()
      const anyMatch = aNodes.some(n => topoHighlight.nodes.includes(n.id))
      if (anyMatch) {
        aNodes.forEach(n => {
          if (topoHighlight.nodes.includes(n.id)) {
            appGraph.setItemState(n.id, 'ai-highlight', true)
            appGraph.setItemState(n.id, 'dimmed', false)
            appGraph.focusElement(n.id, { animation: { duration: 800 } })
          } else {
            appGraph.setItemState(n.id, 'dimmed', true)
            appGraph.setItemState(n.id, 'ai-highlight', false)
          }
        })
      }
    }
  } else {
    topoInfo.value = null
    if (networkGraph) {
      networkGraph.getNodeData().forEach(n => {
        networkGraph.setItemState(n.id, 'ai-highlight', false)
        networkGraph.setItemState(n.id, 'dimmed', false)
      })
    }
    if (appGraph) {
      appGraph.getNodeData().forEach(n => {
        appGraph.setItemState(n.id, 'ai-highlight', false)
        appGraph.setItemState(n.id, 'dimmed', false)
      })
    }
  }
}, { immediate: true })

watch(topoTab, () => { topoInfo.value = null; clearTopoHighlight() })

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
function resetView() {
  const g = topoTab.value === 'network' ? networkGraph : graph
  if (g) g.fitView({ padding: 20 })
}

const g6Container = ref(null)
let graph = null

const g6Data = {
  id: 'root',
  children: [
    { id: 'east', children: [{ id: 'east-az-a' }, { id: 'east-az-b' }] },
    { id: 'north', children: [{ id: 'north-az-a' }] },
  ]
}



const COMBO_PAD = [30, 28, 20, 28] // [top, right, bottom, left]

const NET_LAYOUT = {
  internet: [600, 60],
  'border-leaf': [600, 180],
  'mgmt-spine-north':   [150, 340],
  'biz-spine-north':    [330, 340],
  'mgmt-tor-north':     [150, 490],
  'biz-tor-north':      [330, 490],
  'storage-tor-north':  [510, 490],
  'mgmt-nodes-north':   [150, 640],
  'network-nodes-north': [300, 640],
  'compute-nodes-north': [360, 640],
  'storage-nodes-north': [510, 640],
  'storage-tor-east':  [690, 490],
  'storage-nodes-east': [690, 640],
  'biz-spine-east':    [870, 340],
  'biz-tor-east':      [870, 490],
  'network-nodes-east': [840, 640],
  'compute-nodes-east': [900, 640],
  'mgmt-spine-east':   [1050, 340],
  'mgmt-tor-east':     [1050, 490],
  'mgmt-nodes-east':   [1050, 640],
}

const NET_NODE_DEFS = ref([
  { id: 'internet', data: { label: 'Internet / 企业专线\n网络' }, iconText: '\uf0ac', style: { fill: '#1890ff', size: 48 } },
  { id: 'border-leaf', data: { label: 'Border Leaf\n192.168.0.1' }, iconText: '\uf6ff', style: { fill: '#1890ff', size: 48 } },
  { id: 'mgmt-spine-east', data: { label: '管理核心Spine\n192.1.0.1' }, iconText: '\uf126', style: { fill: '#1890ff', size: 48 }, combo: 'region-east' },
  { id: 'biz-spine-east', data: { label: '业务核心Spine\n192.1.0.2' }, iconText: '\uf126', style: { fill: '#1890ff', size: 48 }, combo: 'region-east' },
  { id: 'mgmt-tor-east', data: { label: '管理TOR\n192.1.0.11' }, iconText: '\uf126', style: { fill: '#1890ff', size: 48 }, combo: 'region-east' },
  { id: 'biz-tor-east', data: { label: '业务TOR\n192.1.0.12' }, iconText: '\uf126', style: { fill: '#1890ff', size: 48 }, combo: 'region-east' },
  { id: 'storage-tor-east', data: { label: '存储TOR\n192.1.0.13' }, iconText: '\uf126', style: { fill: '#1890ff', size: 48 }, combo: 'region-east' },
  { id: 'mgmt-nodes-east', data: { label: '管理节点\nx3' }, iconText: '\uf233', style: { fill: '#1890ff', size: 48 }, combo: 'region-east' },
  { id: 'network-nodes-east', data: { label: '网络节点\nx2' }, iconText: '\uf233', style: { fill: '#1890ff', size: 48 }, combo: 'region-east' },
  { id: 'compute-nodes-east', data: { label: '计算节点\nx2' }, iconText: '\uf2db', style: { fill: '#1890ff', size: 48 }, combo: 'region-east' },
  { id: 'storage-nodes-east', data: { label: '存储节点\nx2' }, iconText: '\uf1c0', style: { fill: '#1890ff', size: 48 }, combo: 'region-east' },
  { id: 'mgmt-spine-north', data: { label: '管理核心Spine\n192.2.0.1' }, iconText: '\uf126', style: { fill: '#1890ff', size: 48 }, combo: 'region-north' },
  { id: 'biz-spine-north', data: { label: '业务核心Spine\n192.2.0.2' }, iconText: '\uf126', style: { fill: '#f5222d', size: 48 }, combo: 'region-north' },
  { id: 'mgmt-tor-north', data: { label: '管理TOR\n192.2.0.11' }, iconText: '\uf126', style: { fill: '#1890ff', size: 48 }, combo: 'region-north' },
  { id: 'biz-tor-north', data: { label: '业务TOR\n192.2.0.12' }, iconText: '\uf126', style: { fill: '#1890ff', size: 48 }, combo: 'region-north' },
  { id: 'storage-tor-north', data: { label: '存储TOR\n192.2.0.13' }, iconText: '\uf126', style: { fill: '#1890ff', size: 48 }, combo: 'region-north' },
  { id: 'mgmt-nodes-north', data: { label: '管理节点\nx3' }, iconText: '\uf233', style: { fill: '#1890ff', size: 48 }, combo: 'region-north' },
  { id: 'network-nodes-north', data: { label: '网络节点\nx2' }, iconText: '\uf233', style: { fill: '#1890ff', size: 48 }, combo: 'region-north' },
  { id: 'compute-nodes-north', data: { label: '计算节点\nx2' }, iconText: '\uf2db', style: { fill: '#1890ff', size: 48 }, combo: 'region-north' },
  { id: 'storage-nodes-north', data: { label: '存储节点\nx2' }, iconText: '\uf1c0', style: { fill: '#1890ff', size: 48 }, combo: 'region-north' },
])
const NET_COMBO_DEFS = ref([
  { id: 'region-east', data: { label: 'Region: 华东1' } },
  { id: 'region-north', data: { label: 'Region: 华北2' } },
])
const NET_EDGES = ref([
  { source: 'internet', target: 'border-leaf', style: { stroke: '#d9d9d9', lineWidth: 2, sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'border-leaf', target: 'mgmt-spine-east', data: { label: '管理通道' }, style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'border-leaf', target: 'biz-spine-east', data: { label: '业务平面' }, style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'mgmt-spine-east', target: 'mgmt-tor-east', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'biz-spine-east', target: 'biz-tor-east', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'biz-spine-east', target: 'storage-tor-east', data: { label: '存储平面' }, style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'mgmt-tor-east', target: 'mgmt-nodes-east', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'biz-tor-east', target: 'network-nodes-east', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'biz-tor-east', target: 'compute-nodes-east', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'storage-tor-east', target: 'storage-nodes-east', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'border-leaf', target: 'mgmt-spine-north', data: { label: '管理通道' }, style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'border-leaf', target: 'biz-spine-north', data: { label: '业务平面' }, style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'mgmt-spine-north', target: 'mgmt-tor-north', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'biz-spine-north', target: 'biz-tor-north', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'biz-spine-north', target: 'storage-tor-north', data: { label: '存储平面' }, style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'mgmt-tor-north', target: 'mgmt-nodes-north', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'biz-tor-north', target: 'network-nodes-north', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'biz-tor-north', target: 'compute-nodes-north', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'storage-tor-north', target: 'storage-nodes-north', style: { sourcePort: 'bottom', targetPort: 'top' } },
  { source: 'biz-spine-east', target: 'biz-spine-north', type: 'cubic-horizontal', data: { label: 'Region互联' }, style: { lineDash: [5, 5], stroke: '#fa8c16', sourcePort: 'right', targetPort: 'left' } },
])
onMounted(function() {})

function createNetworkTopoData() {
  const nodes = NET_NODE_DEFS.value.map(n => {
    const pos = NET_LAYOUT[n.id]
    return {
      ...n,
      style: { ...n.style, x: pos ? pos[0] : (n.style?.x ?? 0), y: pos ? pos[1] : (n.style?.y ?? 0) },
    }
  })
  const combos = NET_COMBO_DEFS.value.map(c => {
    const children = nodes.filter(n => n.combo === c.id)
    if (!children.length) return c
    const gx = (d) => d.style.x
    const gy = (d) => d.style.y
    const half = (d) => (d.style?.size || 48) / 2
    const l = Math.min(...children.map(n => gx(n) - half(n)))
    const r = Math.max(...children.map(n => gx(n) + half(n)))
    const t = Math.min(...children.map(n => gy(n) - half(n)))
    const b = Math.max(...children.map(n => gy(n) + half(n)))
    return {
      ...c,
      style: {
        fill: '#fff', stroke: '#d9d9d9', lineWidth: 1.5, radius: 8,
        x: (l + r) / 2,
        y: (t + b) / 2,
        size: [r - l + COMBO_PAD[1] + COMBO_PAD[3], b - t + COMBO_PAD[0] + COMBO_PAD[2]],
      }
    }
  })
  return { nodes, combos, edges: NET_EDGES.value }
}

function initNetworkGraph() {
  if (!networkContainer.value || networkGraph) return
  const rect = networkContainer.value.getBoundingClientRect()
  networkGraph = new Graph({
    container: networkContainer.value,
    width: rect.width,
    height: rect.height,
    data: createNetworkTopoData(),
    node: {
      type: 'rect',
      state: {
        'ai-highlight': {
          fill: '#722ED1',
          stroke: '#722ED1',
          lineWidth: 3,
          shadowColor: 'rgba(114,46,209,0.4)',
          shadowBlur: 12,
          iconFill: '#fff',
        },
        'anomaly-highlight': {
          fill: '#F5222D',
          stroke: '#F5222D',
          lineWidth: 3,
          shadowColor: 'rgba(245,34,45,0.5)',
          shadowBlur: 16,
          iconFill: '#fff',
        },
        dimmed: {
          opacity: 0.25,
          labelOpacity: 0.25,
          labelBackgroundOpacity: 0.1,
        },
      },
      style: {
        size: (d) => d.style?.size || 40,
        fill: (d) => d.style?.fill === '#f5222d' ? '#f5222d' : '#1890ff',
        stroke: 'transparent',
        radius: 8,
        labelText: (d) => d.data?.label || '',
        labelPlacement: 'bottom',
        labelOffsetY: 14,
        labelFontSize: 10,
        labelLineHeight: 14,
        labelFill: '#333',
        labelFontWeight: '500',
        labelBackground: true,
        labelBackgroundFill: '#f9f9fa',
        labelBackgroundOpacity: 0.9,
        labelBackgroundRadius: 4,
        labelPadding: [2, 6],
        iconFontFamily: 'Font Awesome 6 Free',
        iconFontWeight: 900,
        iconText: (d) => d.iconText || '',
        iconFill: '#fff',
        iconFontSize: 24,
        zIndex: 10,
        ports: [
          { key: 'top', placement: [0.5, 0], r: 0 },
          { key: 'right', placement: [1, 0.5], r: 0 },
          { key: 'bottom', placement: [0.5, 1], r: 0 },
          { key: 'left', placement: [0, 0.5], r: 0 },
        ]
      }
    },
    edge: {
      type: 'cubic-vertical',
      style: {
        stroke: (d) => d.style?.stroke || '#d9d9d9',
        lineWidth: (d) => d.style?.lineWidth || 1.5,
        lineDash: (d) => d.style?.lineDash || undefined,
        labelText: (d) => d.data?.label || '',
        labelFontSize: 10,
        labelFill: '#666',
        labelBackground: true,
        labelBackgroundFill: '#f9f9fa',
        labelBackgroundOpacity: 0.9,
        labelBackgroundRadius: 4,
        labelPadding: [2, 6],
      }
    },
    combo: {
      type: 'rect',
      style: {
        fill: (d) => d.style?.fill || '#fff',
        stroke: (d) => d.style?.stroke || '#d9d9d9',
        lineWidth: (d) => d.style?.lineWidth || 1.5,
        lineDash: [5, 5],
        radius: (d) => d.style?.radius || 6,
        labelText: (d) => d.data?.label || '',
        labelFontSize: 13,
        labelFontWeight: 'bold',
        labelFill: '#333',
        labelPlacement: 'bottom',
        labelOffsetY: 10,
      }
    },
    behaviors: ['drag-canvas', 'zoom-canvas'],
    plugins: [
      {
        type: 'minimap',
        size: [180, 140],
        padding: 10,
        maskStyle: {
          fill: 'rgba(24,144,255,0.08)',
          stroke: '#1890ff',
          lineWidth: 1.5,
        },
      },
    ],
  })
  networkGraph.render().then(() => {
    networkGraph.fitView({ padding: 20 })
  })
}

function destroyNetworkGraph() {
  if (networkGraph) { networkGraph.destroy(); networkGraph = null }
}

async function initAppGraph(tab) {
  if (!appContainer.value) return
  if (appGraph) appGraph.destroy()
  let topoData = { nodes: [], edges: [] }
  try {
    const res = await fetch('/api/mock/topology')
    const d = await res.json()
    topoData = d.data || d
  } catch {}
  const filterSet = tab && tab !== 'all' ? APP_FILTER_MAP[tab] : null
  const filteredNodes = filterSet ? topoData.nodes.filter(n => filterSet.has(n.id)) : topoData.nodes
  const filteredIds = new Set(filteredNodes.map(n => n.id))
  const filteredEdges = (filterSet ? topoData.edges.filter(e => filteredIds.has(e.source) && filteredIds.has(e.target)) : topoData.edges)
  const rect = appContainer.value.getBoundingClientRect()
  appGraph = new Graph({
    container: appContainer.value,
    width: rect.width,
    height: rect.height,
    data: {
      nodes: filteredNodes.map(n => ({
        id: n.id,
        data: { label: n.label, status: n.status, type: n.type },
        iconText: APP_ICON_MAP[n.type] || '\uf233',
        ...((['prod-order-03', 'prod-pay-01', 'prod-pay-02', 'prod-user-01', 'prod-user-02'].includes(n.id)) ? { layer: 2 } : {}),
      })),
      edges: filteredEdges.map(e => ({ source: e.source, target: e.target, data: { label: e.label || '' } })),
    },
    node: {
      type: 'rect',
      state: {
        'ai-highlight': { stroke: '#722ed1', lineWidth: 3, shadowBlur: 10, shadowColor: '#d3adf7', labelFontWeight: 'bold' },
        'anomaly-highlight': { stroke: '#F5222D', lineWidth: 3, shadowBlur: 12, shadowColor: 'rgba(245,34,45,0.4)', labelFontWeight: 'bold' },
        dimmed: { opacity: 0.25, labelOpacity: 0.25 },
      },
      style: {
        size: 48,
        fill: (d) => ({ normal: '#1890ff', warning: '#fa8c16', critical: '#f5222d' })[d.data?.status] || '#1890ff',
        stroke: 'transparent',
        radius: 8,
        labelText: (d) => d.data?.label || d.id,
        labelPlacement: 'bottom',
        labelOffsetY: 14,
        labelFontSize: 10,
        labelFill: '#333',
        labelFontWeight: '500',
        labelBackground: true,
        labelBackgroundFill: '#f9f9fa',
        labelBackgroundOpacity: 0.9,
        labelBackgroundRadius: 4,
        labelPadding: [2, 6],
        iconFontFamily: 'Font Awesome 6 Free',
        iconFontWeight: 900,
        iconText: (d) => d.iconText || '',
        iconFill: '#fff',
        iconFontSize: 24,
        zIndex: 10,
        ports: [
          { key: 'top', placement: [0.5, 0], r: 0 },
          { key: 'bottom', placement: [0.5, 1], r: 0 },
        ],
      },
    },
    edge: {
      type: 'cubic-vertical',
      style: {
        stroke: '#d9d9d9',
        lineWidth: 1.5,
        endArrow: false,
      },
    },
    layout: { type: 'dagre', rankdir: 'TB', nodesep: 30, ranksep: 80 },
    behaviors: ['drag-canvas', 'zoom-canvas'],
    plugins: [
      {
        type: 'minimap',
        size: [180, 140],
        padding: 10,
        maskStyle: { fill: 'rgba(24,144,255,0.08)', stroke: '#1890ff', lineWidth: 1.5 },
      },
    ],
  })
  await appGraph.render()
  appGraph.fitView({ padding: 40 })
  // 修复竞态条件：如果 topoHighlight 已激活但 appGraph 刚初始化，手动触发高亮
  if (topoHighlight.active && topoHighlight.nodes?.length) {
    const aNodes = appGraph.getNodeData()
    const anyMatch = aNodes.some(n => topoHighlight.nodes.includes(n.id))
    if (anyMatch) {
      aNodes.forEach(n => {
        if (topoHighlight.nodes.includes(n.id)) {
          appGraph.setItemState(n.id, 'ai-highlight', true)
          appGraph.setItemState(n.id, 'dimmed', false)
          appGraph.focusElement(n.id, { animation: { duration: 800 } })
        } else {
          appGraph.setItemState(n.id, 'dimmed', true)
          appGraph.setItemState(n.id, 'ai-highlight', false)
        }
      })
    }
  }
}

function destroyAppGraph() {
  if (appGraph) { appGraph.destroy(); appGraph = null }
}

function initResourceGraph() {
  if (!g6Container.value) return
  if (graph) graph.destroy()
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

watch(topoTab, (val) => {
  if (val === 'network') nextTick(() => initNetworkGraph())
  else if (val === 'application') nextTick(() => initAppGraph(appTab.value))
  else { destroyNetworkGraph(); destroyAppGraph() }
})

watch(appTab, (val) => {
  if (topoTab.value === 'application') nextTick(() => initAppGraph(val))
})

onMounted(() => {
  initResourceGraph()
  if (topoTab.value === 'network') nextTick(() => initNetworkGraph())
  else if (topoTab.value === 'application') nextTick(() => initAppGraph(appTab.value))
})

onBeforeUnmount(() => {
  if (graph) { graph.destroy(); graph = null }
  destroyNetworkGraph()
  destroyAppGraph()
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
  padding: 12px 20px 8px;
  background: #fff;
  flex-shrink: 0;
}
.topology-title h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}
.topo-highlight-bar {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: #722ED1;
  background: #F9F0FF; padding: 4px 12px;
  border-radius: 6px; border: 1px solid #D3ADF7;
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
.region-card { background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; overflow: hidden; }
.region-card:hover { border-color: #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.08); }
.rc-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #f0f0f0; }
.rc-badge { display: inline-block; width: 4px; height: 16px; border-radius: 2px; margin-right: 8px; vertical-align: middle; }
.rc-badge-green { background: #52c41a; }
.rc-badge-orange { background: #fa8c16; }
.rc-header h3 { font-size: 15px; font-weight: 600; color: var(--text); margin: 0; display: flex; align-items: center; }
.status-tag { font-size: 12px; padding: 1px 10px; border-radius: 4px; border: 1px solid; }
.status-tag.status-normal { background: #f6ffed; color: #52c41a; border-color: #b7eb8f; }
.status-tag.status-warning { background: #fff7e6; color: #fa8c16; border-color: #ffd591; }
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

/* ── node detail panel ── */
.node-detail-panel {
  position: fixed; top: 0; right: 0; bottom: 0; left: 0;
  z-index: 1050; pointer-events: none; opacity: 0;
  transition: opacity 0.3s;
}
.node-detail-panel.open { pointer-events: auto; opacity: 1; }
.node-detail-mask {
  position: absolute; top: 0; right: 0; bottom: 0; left: 0;
  background: rgba(0,0,0,0.3);
}
.node-detail-content {
  position: absolute; top: 0; right: -500px;
  width: 500px; height: 100%; background: #fff;
  box-shadow: -2px 0 8px rgba(0,0,0,0.15);
  display: flex; flex-direction: column;
  transition: right 0.3s;
}
.node-detail-panel.open .node-detail-content { right: 0; }
.node-detail-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.node-detail-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.node-detail-header .close-btn { font-size: 16px; color: #8c8c8c; }
.node-detail-header .close-btn:hover { color: #1890ff; }
.node-detail-body { flex: 1; overflow-y: auto; padding: 20px; }
.nd-section { margin-bottom: 24px; }
.nd-section-title {
  font-size: 14px; font-weight: 600; color: var(--text); margin: 0 0 12px;
}
.nd-collapsible { cursor: pointer; user-select: none; display: flex; align-items: center; gap: 6px; }
.nd-collapsible i { font-size: 10px; color: var(--text-sec); width: 12px; flex-shrink: 0; }
.nd-collapsible:hover { color: #1890ff; }
.nd-info-grid { display: flex; flex-direction: column; gap: 8px; }
.nd-info-row { display: flex; align-items: center; gap: 12px; }
.nd-label { font-size: 12px; color: #8c8c8c; min-width: 48px; }
.nd-value { font-size: 13px; color: var(--text); }
.nd-abnormal-count { color: #f5222d; }
.nd-search { margin-bottom: 8px; width: 100%; }
.nd-link { color: #1890ff; cursor: pointer; text-decoration: none; }
.nd-link:hover { text-decoration: underline; }
.nd-table { width: 100%; border-collapse: collapse; }
.nd-table th {
  font-size: 12px; font-weight: 600; color: #8c8c8c;
  text-align: left; padding: 8px 10px; background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}
.nd-table td {
  font-size: 13px; color: var(--text); padding: 10px;
  border-bottom: 1px solid #f5f5f5;
}
.nd-table tbody tr:last-child td { border-bottom: none; }
.nd-desc { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #8c8c8c; }
.status-tag-sm {
  display: inline-block; font-size: 11px; padding: 1px 8px;
  border-radius: 4px; font-weight: 500;
}
.status-nd-normal { background: #f6ffed; color: #52c41a; }
.status-nd-warning { background: #fff7e6; color: #fa8c16; }
.status-nd-error { background: #fff1f0; color: #f5222d; }
.node-detail-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px 20px; border-top: 1px solid #f0f0f0; flex-shrink: 0;
}

/* ── network topology ── */
.network-topology {
  display: flex; height: 100%; gap: 0; position: relative;
}
.network-canvas {
  flex: 1; height: 100%; min-height: 500px; background: #fafafa;
}
.sd-popup {
  min-width: 180px; background: #fff; border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12); padding: 8px 0;
}
.sd-section {
  padding: 4px 16px; font-size: 11px; font-weight: 600; color: var(--text-sec);
}
.sd-item {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 16px 4px 24px; font-size: 12px; color: var(--text); cursor: default;
}
.sd-item:hover { background: #f5f7fa; }
.lg-line { display: inline-block; width: 28px; height: 3px; border-radius: 2px; flex-shrink: 0; }
.lg-line.solid-red { background: #f5222d; }
.lg-line.dashed-black { background: transparent; border-top: 2px dashed #333; height: 0; }
.lg-line.solid-orange { background: #fa8c16; }
.lg-line.solid-blue { background: #1890ff; }
.lg-line.solid-green { background: #52c41a; }
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
