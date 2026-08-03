<template>
  <div class="mini-topo">
    <div class="mt-toolbar">
      <a-tooltip title="放大"><a-button type="text" size="small" @click="zoomIn"><i class="fa-solid fa-plus"></i></a-button></a-tooltip>
      <a-tooltip title="缩小"><a-button type="text" size="small" @click="zoomOut"><i class="fa-solid fa-minus"></i></a-button></a-tooltip>
      <a-tooltip title="适应视图"><a-button type="text" size="small" @click="fitView"><i class="fa-solid fa-maximize"></i></a-button></a-tooltip>
      <span class="mt-legend">
        <span class="mt-legend-item"><span class="mt-dot dot-normal"></span> 正常</span>
        <span class="mt-legend-item"><span class="mt-dot dot-warning"></span> 警告</span>
        <span class="mt-legend-item"><span class="mt-dot dot-error"></span> 异常</span>
      </span>
    </div>
    <div ref="container" class="mt-canvas"></div>

    <div v-if="tooltip.visible" class="mt-tip" :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }" @mouseenter="cancelHide" @mouseleave="hideTooltip">
      <div class="mt-tip-name">{{ tooltip.label }}</div>
      <div class="mt-tip-row" v-if="tooltip.ip"><span class="mt-tip-label">IP</span><span class="mt-tip-value">{{ tooltip.ip }}</span></div>
      <div class="mt-tip-row"><span class="mt-tip-label">状态</span><span class="mt-tip-value" :class="'mt-tip-' + tooltip.status">{{ statusText(tooltip.status) }}</span></div>
      <div class="mt-tip-row" v-if="tooltip.metrics"><span class="mt-tip-label">指标</span><span class="mt-tip-value">{{ tooltip.metrics }}</span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Graph } from '@antv/g6'

const props = defineProps({
  data: { type: Object, default: () => ({ nodes: [], edges: [] }) },
  currentId: { type: String, default: '' },
})

const container = ref(null)
let graph = null
const zoomLevel = ref(1)

const tooltip = reactive({ visible: false, label: '', ip: '', status: 'normal', metrics: '', x: 0, y: 0 })
let hideTimer = null

const STATUS_COLORS = { normal: '#1890ff', warning: '#fa8c16', error: '#f5222d', critical: '#f5222d' }
const ICON_MAP = { service: '\uf0e7', gateway: '\uf0e7', cache: '\uf538', database: '\uf1c0', mq: '\uf0e7', storage: '\uf1c0', infra: '\uf0ac' }

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
      stroke: 'transparent',
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
    data: { label: e.label },
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
        selected: { fill: '#1890ff', stroke: '#1890ff', lineWidth: 3, shadowColor: 'rgba(24,144,255,0.4)', shadowBlur: 12 },
        dimmed: { opacity: 0.25, labelOpacity: 0.25, labelBackgroundOpacity: 0.1 },
      },
    },
    edge: {
      type: 'cubic-vertical',
      style: {
        labelText: '',
      },
      state: {
        active: { stroke: '#1890ff', lineWidth: 2 },
        dimmed: { opacity: 0.15 },
      },
    },
    layout: {
      type: 'dagre',
      rankdir: 'TB',
      nodesep: 30,
      ranksep: 80,
    },
    behaviors: [
      'drag-canvas',
      'zoom-canvas',
      'drag-element',
    ],
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

  graph.on('node:pointerleave', (e) => {
    scheduleHide()
  })

  graph.on('node:click', (e) => {
    const id = e.target?.id
    if (!id || !graph) return
    tooltip.visible = false
    graph.getNodeData().forEach(n => graph.setElementState(n.id, []))
    graph.setElementState(id, 'selected')
    graph.focusElement(id, { animation: { duration: 400 } })
  })

  await graph.render()
  graph.fitView({ padding: 40 })
}

function zoomIn() { if (graph) { zoomLevel.value = Math.min(zoomLevel.value + 0.2, 3); graph.zoomTo(zoomLevel.value) } }
function zoomOut() { if (graph) { zoomLevel.value = Math.max(zoomLevel.value - 0.2, 0.3); graph.zoomTo(zoomLevel.value) } }
function fitView() { if (graph) { zoomLevel.value = 1; graph.fitView({ padding: 40 }) } }

function statusText(s) { return { normal: '正常', warning: '警告', error: '异常', critical: '异常' }[s] || s }
function scheduleHide() { hideTimer = setTimeout(() => { tooltip.visible = false }, 150) }
function cancelHide() { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null } }
function hideTooltip() { tooltip.visible = false }

onMounted(() => {
  setTimeout(() => initGraph(), 100)
})

onBeforeUnmount(() => {
  if (graph) { graph.destroy(); graph = null }
  if (hideTimer) clearTimeout(hideTimer)
})

watch(() => props.data, () => {
  nextTick(() => { setTimeout(() => initGraph(), 100) })
}, { deep: true })
</script>

<style scoped>
.mini-topo { display: flex; flex-direction: column; height: 100%; }
.mt-toolbar { display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.mt-legend { display: flex; gap: 12px; margin-left: auto; font-size: 11px; color: #8c8c8c; }
.mt-legend-item { display: flex; align-items: center; gap: 4px; }
.mt-dot { width: 6px; height: 6px; border-radius: 50%; }
.mt-dot.dot-normal { background: #1890ff; }
.mt-dot.dot-warning { background: #fa8c16; }
.mt-dot.dot-error { background: #f5222d; }
.mt-canvas { flex: 1; min-height: 300px; height: calc(100vh - 200px); }
.mt-tip { position: fixed; background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 8px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 9999; pointer-events: auto; min-width: 140px; }
.mt-tip-name { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.mt-tip-row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 3px; }
.mt-tip-label { color: #8c8c8c; min-width: 32px; }
.mt-tip-value { color: #1a1a1a; }
.mt-tip-normal { color: #1890ff; font-weight: 500; }
.mt-tip-warning { color: #fa8c16; font-weight: 500; }
.mt-tip-error { color: #f5222d; font-weight: 500; }
</style>
