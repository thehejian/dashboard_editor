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
let resizeObserver = null
let initTimer = null
const zoomLevel = ref(1)

const tooltip = reactive({ visible: false, label: '', ip: '', status: 'normal', metrics: '', x: 0, y: 0 })
let hideTimer = null

const NODE_COLORS = { normal: '#52c41a', warning: '#fa8c16', error: '#f5222d' }
const NODE_ICONS = { service: '\uf233', gateway: '\uf0e7', cache: '\uf0a0', database: '\uf1c0', mq: '\uf0e7', storage: '\uf1c0', infra: '\uf0ac' }

function initGraph() {
  if (!container.value || !props.data.nodes?.length) return

  const w = container.value.clientWidth
  const h = container.value.clientHeight
  if (w === 0 || h === 0) return

  if (graph) { graph.destroy(); graph = null }

  const nodes = props.data.nodes.map(n => ({
    id: n.id,
    data: { label: n.label, ip: n.ip, status: n.status, metrics: n.metrics, type: n.type },
    style: {
      size: n.id === props.currentId ? 48 : 36,
      fill: NODE_COLORS[n.status] || '#d9d9d9',
      stroke: n.id === props.currentId ? '#1890ff' : 'transparent',
      lineWidth: n.id === props.currentId ? 3 : 0,
      iconText: NODE_ICONS[n.type] || '\uf233',
      iconFill: '#fff',
      labelFontSize: 11,
      labelFill: '#595959',
      labelPlacement: 'bottom',
      labelOffsetY: 4,
      shadowColor: n.id === props.currentId ? 'rgba(24,144,255,0.3)' : 'transparent',
      shadowBlur: n.id === props.currentId ? 12 : 0,
    },
  }))

  const edges = props.data.edges.map((e, i) => ({
    id: 'e' + i,
    source: e.source,
    target: e.target,
    data: { label: e.label },
    style: {
      stroke: '#d9d9d9',
      lineWidth: 1,
      endArrow: true,
      endArrowSize: 6,
      labelFontSize: 10,
      labelFill: '#8c8c8c',
      labelBackground: true,
      labelBackgroundFill: '#fff',
      labelBackgroundOpacity: 0.8,
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
      },
    },
    edge: {
      style: {
        labelText: (d) => d.data?.label || '',
      },
    },
    layout: {
      type: 'd3-force',
      preventOverlap: true,
      nodeSize: 50,
      linkDistance: 120,
      charge: -300,
    },
    behaviors: [
      'drag-canvas',
      'zoom-canvas',
      'drag-element',
    ],
  })

  graph.on('node:pointerenter', (e) => {
    const id = e.target?.id || e.target?.closest?.('[id]')?.id
    if (!id) return
    const node = props.data.nodes.find(n => n.id === id)
    if (!node) return
    tooltip.label = node.label
    tooltip.ip = node.ip || ''
    tooltip.status = node.status
    tooltip.metrics = node.metrics ? Object.entries(node.metrics).map(([k, v]) => k + ':' + v).join(' ') : ''
    tooltip.x = (e.client?.x ?? e.canvas?.x ?? 0) + 12
    tooltip.y = (e.client?.y ?? e.canvas?.y ?? 0) - 10
    tooltip.visible = true
    cancelHide()
    if (graph) graph.setItemState(id, 'active', true)
  })

  graph.on('node:pointerleave', (e) => {
    const id = e.target?.id || e.target?.closest?.('[id]')?.id
    if (id && graph) graph.setItemState(id, 'active', false)
    scheduleHide()
  })

  graph.on('node:click', (e) => {
    const id = e.target?.id || e.target?.closest?.('[id]')?.id
    if (!id) return
    tooltip.visible = false
    if (graph) {
      graph.getNodeData().forEach(n => graph.setItemState(n.id, 'selected', false))
      graph.setItemState(id, 'selected', true)
      graph.focusElement(id, { animation: { duration: 400 } })
    }
  })

  nextTick(() => {
    if (graph) graph.fitView({ padding: 40 })
  })
}

function delayedInit() {
  if (initTimer) clearTimeout(initTimer)
  initTimer = setTimeout(() => initGraph(), 350)
}

function zoomIn() { if (graph) { zoomLevel.value = Math.min(zoomLevel.value + 0.2, 3); graph.zoomTo(zoomLevel.value) } }
function zoomOut() { if (graph) { zoomLevel.value = Math.max(zoomLevel.value - 0.2, 0.3); graph.zoomTo(zoomLevel.value) } }
function fitView() { if (graph) { zoomLevel.value = 1; graph.fitView({ padding: 40 }) } }

function statusText(s) { return { normal: '正常', warning: '警告', error: '异常' }[s] || s }
function scheduleHide() { hideTimer = setTimeout(() => { tooltip.visible = false }, 150) }
function cancelHide() { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null } }
function hideTooltip() { tooltip.visible = false }

onMounted(() => {
  delayedInit()

  resizeObserver = new ResizeObserver(() => {
    if (graph && container.value) {
      const w = container.value.clientWidth
      const h = container.value.clientHeight
      if (w > 0 && h > 0) {
        graph.setSize(w, h)
        graph.fitView({ padding: 40 })
      }
    }
  })
  if (container.value) resizeObserver.observe(container.value)
})

onBeforeUnmount(() => {
  if (initTimer) clearTimeout(initTimer)
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
  if (graph) { graph.destroy(); graph = null }
  if (hideTimer) clearTimeout(hideTimer)
})

watch(() => props.data, () => {
  delayedInit()
}, { deep: true })
</script>

<style scoped>
.mini-topo { display: flex; flex-direction: column; height: 100%; }
.mt-toolbar { display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.mt-legend { display: flex; gap: 12px; margin-left: auto; font-size: 11px; color: #8c8c8c; }
.mt-legend-item { display: flex; align-items: center; gap: 4px; }
.mt-dot { width: 6px; height: 6px; border-radius: 50%; }
.mt-dot.dot-normal { background: #52c41a; }
.mt-dot.dot-warning { background: #fa8c16; }
.mt-dot.dot-error { background: #f5222d; }
.mt-canvas { flex: 1; min-height: 300px; }
.mt-tip { position: fixed; background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 8px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 9999; pointer-events: auto; min-width: 140px; }
.mt-tip-name { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.mt-tip-row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 3px; }
.mt-tip-label { color: #8c8c8c; min-width: 32px; }
.mt-tip-value { color: #1a1a1a; }
.mt-tip-normal { color: #52c41a; font-weight: 500; }
.mt-tip-warning { color: #fa8c16; font-weight: 500; }
.mt-tip-error { color: #f5222d; font-weight: 500; }
</style>
