<template>
  <div class="topology-panel">
    <div class="tp-header">
      <div class="tp-header-left">
        <span class="tp-title"><i class="fa-solid fa-diagram-project"></i> 系统应用全链路拓扑图</span>
        <span class="tp-hint">点击拓扑节点触发联动：查看详情并智能过滤日志与调用链</span>
      </div>
      <button class="tp-fullscreen-btn" @click="openFullscreen" title="全屏查看"><i class="fa-solid fa-expand"></i></button>
    </div>
    <div class="tp-toolbar">
      <span class="tp-legend">
        <span class="tp-legend-item"><span class="tp-dot dot-normal"></span> 正常</span>
        <span class="tp-legend-item"><span class="tp-dot dot-critical"></span> 核心故障</span>
      </span>
    </div>
    <div ref="container" class="tp-canvas"></div>
    <div class="tp-tip-text">提示: 点击上图任意圆圈，可查看下游影响范围。</div>

    <div v-if="impact.visible" class="tp-impact">
      <i class="fa-solid fa-sitemap"></i> 影响 <strong>{{ impact.count }}</strong> 个下游节点:
      <span class="tp-impact-nodes">{{ impact.nodes.join(', ') }}</span>
    </div>

    <div v-if="tooltip.visible" class="tp-tooltip" :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }">
      <div class="tp-tip-name">{{ tooltip.label }}</div>
      <div class="tp-tip-row" v-if="tooltip.ip"><span class="tp-tip-label">IP</span><span class="tp-tip-value">{{ tooltip.ip }}</span></div>
      <div class="tp-tip-row"><span class="tp-tip-label">状态</span><span class="tp-tip-value" :class="'tp-tip-' + tooltip.status">{{ statusText(tooltip.status) }}</span></div>
      <div class="tp-tip-row" v-if="tooltip.metrics"><span class="tp-tip-label">指标</span><span class="tp-tip-value">{{ tooltip.metrics }}</span></div>
    </div>
  </div>

  <a-modal v-model:open="fullscreenVisible" title="系统应用全链路拓扑图" :footer="null" width="90vw" class="tp-fullscreen-modal" :bodyStyle="{ padding: 0, height: 'calc(90vh - 56px)' }">
    <div ref="fullscreenContainer" class="tp-fullscreen-canvas"></div>
  </a-modal>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Graph } from '@antv/g6'

const props = defineProps({
  data: { type: Object, default: () => ({ nodes: [], edges: [] }) },
  selectedNodeId: { type: String, default: '' },
  highlightAppNodeId: { type: String, default: '' },
})

const emit = defineEmits(['node-click'])

const container = ref(null)
const fullscreenContainer = ref(null)
const fullscreenVisible = ref(false)
let graph = null
let fullscreenGraph = null
const tooltip = reactive({ visible: false, label: '', ip: '', status: 'normal', metrics: '', x: 0, y: 0 })
const impact = reactive({ visible: false, count: 0, nodes: [] })
let hideTimer = null

const STATUS_COLORS = { normal: '#1890ff', warning: '#fa8c16', error: '#f5222d', critical: '#f5222d' }
const ICON_MAP = { service: '\uf0e7', gateway: '\uf0e7', cache: '\uf538', database: '\uf1c0', mq: '\uf0e7', lb: '\uf0e7', access: '\uf0ac', security: '\uf3ed' }

async function initGraph() {
  if (!container.value || !props.data.nodes?.length) return
  if (graph) { graph.destroy(); graph = null }

  await nextTick()

  const rect = container.value.getBoundingClientRect()
  const w = rect.width
  const h = rect.height
  if (w === 0 || h === 0) return

  const nodes = props.data.nodes.map(n => ({
    id: n.id,
    data: { label: n.label, ip: n.ip, status: n.status, metrics: n.metrics, type: n.type, icon: ICON_MAP[n.type] || '\uf0ac' },
    style: {
      size: [48, 48],
      fill: STATUS_COLORS[n.status] || '#d9d9d9',
      stroke: props.selectedNodeId === n.id ? '#722ED1' : 'transparent',
      lineWidth: props.selectedNodeId === n.id ? 3 : 0,
      radius: 8,
      labelText: (d) => d.data?.label || d.id,
      labelPlacement: 'bottom',
      labelOffsetY: 4,
      labelFontSize: 10,
      labelFill: '#333',
      labelFontWeight: '500',
      labelBackground: true,
      labelBackgroundFill: '#ffffff',
      labelBackgroundOpacity: 0.9,
      labelBackgroundRadius: 4,
      labelPadding: [2, 6],
      iconFontFamily: 'Font Awesome 6 Free',
      iconFontWeight: 900,
      iconFill: '#fff',
      iconFontSize: 24,
      zIndex: 10,
    },
  }))

  const edges = props.data.edges.map((e, i) => ({
    id: 'e' + i,
    source: e.source,
    target: e.target,
    style: {
      stroke: '#d9d9d9',
      lineWidth: 1.5,
      endArrow: false,
    },
  }))

  graph = new Graph({
    container: container.value,
    width: w,
    height: h,
    data: { nodes, edges },
    node: {
      style: {
        labelText: (d) => d.data?.label || d.id,
        iconText: (d) => d.data?.icon || '',
      },
      state: {
        hover: { fill: '#1890ff', stroke: '#1890ff', lineWidth: 2 },
        selected: { fill: '#722ED1', stroke: '#722ED1', lineWidth: 3, shadowColor: 'rgba(114,46,209,0.4)', shadowBlur: 12 },
        app: { stroke: '#1890ff', lineWidth: 3, shadowColor: 'rgba(24,144,255,0.5)', shadowBlur: 12 },
        downstream: { stroke: '#FF7D00', lineWidth: 2, shadowColor: 'rgba(255,125,0,0.3)', shadowBlur: 8, opacity: 0.85 },
        dimmed: { opacity: 0.25, labelOpacity: 0.25, labelBackgroundOpacity: 0.1 },
      },
    },
    edge: {
      type: 'cubic-vertical',
      style: { labelText: '' },
      state: {
        active: { stroke: '#1890ff', lineWidth: 2 },
        dimmed: { opacity: 0.15 },
      },
    },
    layout: {
      type: 'dagre',
      rankdir: 'TB',
      nodesep: 40,
      ranksep: 80,
    },
    behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
  })

  graph.on('node:pointerenter', (e) => {
    const id = e.target?.id
    if (!id || !graph) return
    const node = props.data.nodes.find(n => n.id === id)
    if (node) {
      tooltip.label = node.label
      tooltip.ip = node.ip || ''
      tooltip.status = node.status
      tooltip.metrics = node.metrics ? Object.entries(node.metrics).map(([k, v]) => k + ':' + v).join(' ') : ''
      const evt = e.original || e.nativeEvent || e
      tooltip.x = (evt.clientX ?? evt.pageX ?? 0) + 12
      tooltip.y = (evt.clientY ?? evt.pageY ?? 0) - 10
      tooltip.visible = true
      cancelHide()
    }
  })

  graph.on('node:pointerleave', () => { scheduleHide() })

  graph.on('node:click', (e) => {
    const id = e.target?.id
    if (!id || !graph) return
    tooltip.visible = false
    graph.getNodeData().forEach(n => graph.setElementState(n.id, []))
    graph.setElementState(id, 'selected')
    graph.focusElement(id, { animation: { duration: 400 } })
    emit('node-click', id)

    // Calculate downstream impact
    const downstreamIds = getDownstream(id, props.data.edges)
    if (downstreamIds.length) {
      downstreamIds.forEach(did => {
        if (graph.getElementType(did) === 'node') graph.setElementState(did, ['downstream'])
      })
      impact.visible = true
      impact.count = downstreamIds.length
      impact.nodes = downstreamIds.map(did => {
        const n = props.data.nodes.find(n => n.id === did)
        return n ? n.label : did
      })
      setTimeout(() => { impact.visible = false }, 8000)
    }
  })

  await graph.render()
  graph.fitView({ padding: 40 })
  if (props.highlightAppNodeId && graph.getElementType(props.highlightAppNodeId) === 'node') {
    graph.setElementState(props.highlightAppNodeId, ['app'])
  }
}

function statusText(s) { return { normal: '正常', warning: '警告', error: '异常', critical: '异常' }[s] || s }
function getDownstream(nodeId, edges) {
  const visited = new Set()
  const queue = [nodeId]
  while (queue.length) {
    const current = queue.shift()
    edges.forEach(e => {
      if (e.source === current && !visited.has(e.target)) {
        visited.add(e.target)
        queue.push(e.target)
      }
    })
  }
  return [...visited]
}
function scheduleHide() { hideTimer = setTimeout(() => { tooltip.visible = false }, 150) }
function cancelHide() { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null } }

function openFullscreen() {
  fullscreenVisible.value = true
  nextTick(() => setTimeout(() => initFullscreenGraph(), 200))
}

function closeFullscreen() {
  if (fullscreenGraph) { fullscreenGraph.destroy(); fullscreenGraph = null }
}

async function initFullscreenGraph() {
  if (!fullscreenContainer.value || !props.data.nodes?.length) return
  if (fullscreenGraph) { fullscreenGraph.destroy(); fullscreenGraph = null }

  const rect = fullscreenContainer.value.getBoundingClientRect()
  const w = rect.width
  const h = rect.height
  if (w === 0 || h === 0) return

  const nodes = props.data.nodes.map(n => ({
    id: n.id,
    data: { label: n.label, ip: n.ip, status: n.status, metrics: n.metrics, type: n.type, icon: ICON_MAP[n.type] || '\uf0ac' },
    style: {
      size: [56, 56],
      fill: STATUS_COLORS[n.status] || '#d9d9d9',
      stroke: props.selectedNodeId === n.id ? '#722ED1' : 'transparent',
      lineWidth: props.selectedNodeId === n.id ? 3 : 0,
      radius: 8,
      labelText: (d) => d.data?.label || d.id,
      labelPlacement: 'bottom',
      labelOffsetY: 4,
      labelFontSize: 11,
      labelFill: '#333',
      labelFontWeight: '500',
      labelBackground: true,
      labelBackgroundFill: '#ffffff',
      labelBackgroundOpacity: 0.9,
      labelBackgroundRadius: 4,
      labelPadding: [2, 6],
      iconFontFamily: 'Font Awesome 6 Free',
      iconFontWeight: 900,
      iconFill: '#fff',
      iconFontSize: 28,
      zIndex: 10,
    },
  }))

  const edges = props.data.edges.map((e, i) => ({
    id: 'e' + i,
    source: e.source,
    target: e.target,
    style: { stroke: '#d9d9d9', lineWidth: 1.5, endArrow: false },
  }))

  fullscreenGraph = new Graph({
    container: fullscreenContainer.value,
    width: w,
    height: h,
    data: { nodes, edges },
    node: {
      style: {
        labelText: (d) => d.data?.label || d.id,
        iconText: (d) => d.data?.icon || '',
      },
      state: {
        hover: { fill: '#1890ff', stroke: '#1890ff', lineWidth: 2 },
        selected: { fill: '#722ED1', stroke: '#722ED1', lineWidth: 3, shadowColor: 'rgba(114,46,209,0.4)', shadowBlur: 12 },
        app: { stroke: '#1890ff', lineWidth: 3, shadowColor: 'rgba(24,144,255,0.5)', shadowBlur: 12 },
      },
    },
    edge: {
      type: 'cubic-vertical',
      style: { labelText: '' },
      state: {
        active: { stroke: '#1890ff', lineWidth: 2 },
      },
    },
    layout: { type: 'dagre', rankdir: 'TB', nodesep: 50, ranksep: 100 },
    behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
  })

  await fullscreenGraph.render()
  fullscreenGraph.fitView({ padding: 60 })
  if (props.highlightAppNodeId && fullscreenGraph.getElementType(props.highlightAppNodeId) === 'node') {
    fullscreenGraph.setElementState(props.highlightAppNodeId, ['app'])
  }
}

onMounted(() => { setTimeout(() => initGraph(), 100) })
onBeforeUnmount(() => { if (graph) { graph.destroy(); graph = null } if (fullscreenGraph) { fullscreenGraph.destroy(); fullscreenGraph = null } if (hideTimer) clearTimeout(hideTimer) })

watch(() => props.data, () => { nextTick(() => { setTimeout(() => initGraph(), 100) }) }, { deep: true })
watch(() => props.selectedNodeId, () => { nextTick(() => { setTimeout(() => initGraph(), 100) }) })
</script>

<style scoped>
.topology-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}
.tp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 16px 0;
}
.tp-header-left { flex: 1; }
.tp-fullscreen-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #666;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}
.tp-fullscreen-btn:hover { color: #722ED1; border-color: #722ED1; }
.tp-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}
.tp-title i { color: #722ED1; margin-right: 4px; }
.tp-hint {
  display: block;
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 2px;
}
.tp-toolbar {
  display: flex;
  align-items: center;
  padding: 6px 16px;
}
.tp-legend { display: flex; gap: 12px; font-size: 11px; color: #8c8c8c; }
.tp-legend-item { display: flex; align-items: center; gap: 4px; }
.tp-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-normal { background: #1890ff; }
.dot-critical { background: #f5222d; }
.tp-canvas { flex: 1; min-height: 0; }
.tp-tip-text { padding: 4px 16px; font-size: 11px; color: #8c8c8c; border-top: 1px solid #f0f0f0; }
.tp-impact { padding: 4px 16px; font-size: 11px; color: #FF7D00; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; border-top: 1px solid #f0f0f0; }
.tp-impact i { color: #FF7D00; }
.tp-impact-nodes { color: #666; }
.tp-tooltip {
  position: fixed;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 9999;
  pointer-events: none;
  min-width: 140px;
}
.tp-tip-name { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.tp-tip-row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 3px; }
.tp-tip-label { color: #8c8c8c; min-width: 32px; }
.tp-tip-value { color: #1a1a1a; }
.tp-tip-normal { color: #1890ff; font-weight: 500; }
.tp-tip-warning { color: #fa8c16; font-weight: 500; }
.tp-tip-error, .tp-tip-critical { color: #f5222d; font-weight: 500; }
.tp-fullscreen-canvas { width: 100%; height: 100%; }
.tp-fullscreen-modal .ant-modal-body { display: flex; flex-direction: column; }

@media (max-width: 768px) {
  .tp-fullscreen-btn { width: 24px; height: 24px; }
  .tp-fullscreen-btn i { font-size: 12px; }
}
</style>
