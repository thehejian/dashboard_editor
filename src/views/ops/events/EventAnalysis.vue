<template>
  <div>
    <div class="page-header">
      <h3>事件关联分析 - {{ data?.event?.ruleName || '' }}</h3>
      <a-button @click="goBack">← 返回</a-button>
    </div>
    <div v-if="data" class="event-info-bar">
      <span class="info-item">事件 ID: {{ data.event.id }}</span>
      <span class="info-item">级别：<a-tag :color="EVENT_LEVEL_COLORS[data.event.level]">{{ EVENT_LEVELS[data.event.level] }}</a-tag></span>
      <span class="info-item">资源：{{ data.event.ciName }}</span>
      <span class="info-item">时间：{{ data.event.eventTime }}</span>
    </div>
    <div class="time-range-bar">
      <span>时间范围：</span>
      <a-radio-group v-model:value="timeRange" size="small" button-style="solid">
        <a-radio-button value="1h">近 1 小时</a-radio-button>
        <a-radio-button value="6h">近 6 小时</a-radio-button>
        <a-radio-button value="24h">近 24 小时</a-radio-button>
        <a-radio-button value="3d">近 3 天</a-radio-button>
      </a-radio-group>
    </div>
    <div class="topology-desc">
      <span>上游对象 {{ data.upstream.length }} 个，共 {{ upstreamEventCount }} 个事件 → </span>
      <span class="current-highlight">{{ data.current.objName }} ({{ data.current.objType }}) {{ data.current.events.length }} 个事件</span>
      <span> → 下游对象 {{ data.downstream.length }} 个，共 {{ downstreamEventCount }} 个事件</span>
      <span class="time-range">| {{ data.event.eventTime.slice(0, 10) }} 08:00 - 15:00</span>
    </div>
    <div class="swimlane-container">
      <div class="swimlane-header">
        <div class="swimlane-label-area"></div>
        <div class="swimlane-timeline">
          <div v-for="t in timeLabels" :key="t" class="time-label" :style="{ left: t.pos + '%' }">{{ t.label }}</div>
          <div class="now-line" :style="{ left: '85%' }"><span class="now-text">现在</span></div>
          <div v-for="g in 5" :key="'g'+g" class="grid-line" :style="{ left: (g * 16.67) + '%' }"></div>
        </div>
      </div>
      <div class="swimlane-row" v-for="(obj, idx) in swimlaneData" :key="obj.objId" :class="{ 'current-row': obj.depth === 0 }">
        <div class="swimlane-label">
          <div class="obj-name">{{ obj.objName }}</div>
          <div class="obj-type">{{ obj.objType }}</div>
          <div class="obj-relation" :class="relationClass(obj.depth)">{{ relationText(obj.depth) }}</div>
        </div>
        <div class="swimlane-track">
          <div v-for="evt in obj.events" :key="evt.id" class="event-dot" :class="'level-' + evt.level" :style="{ left: eventPos(evt) + '%' }" :title="evt.ruleName + ' | ' + EVENT_LEVELS[evt.level] + ' | ' + evt.time" @mouseenter="hoveredEvent = evt" @mouseleave="hoveredEvent = null">
            <span class="dot-label">{{ EVENT_LEVELS[evt.level] }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="legend-bar">
      <span class="legend-title">图例：</span>
      <span v-for="[level, color] in legendItems" :key="level" class="legend-item">
        <span class="legend-dot" :style="{ background: color }"></span>{{ level }}
      </span>
      <span class="legend-item">
        <span class="legend-dot current-dot"></span>当前事件
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MOCK_ANALYSIS, EVENT_LEVELS, EVENT_LEVEL_COLORS } from './mockData.js'

const router = useRouter()
const data = MOCK_ANALYSIS
const timeRange = ref('6h')
const hoveredEvent = ref(null)

const legendItems = Object.entries({ 紧急: '#ff4d4f', 重要: '#fa8c16', 次要: '#faad14', 提示: '#1890ff', 信息: '#999' })

const upstreamEventCount = computed(() => data.upstream.reduce((s, o) => s + o.events.length, 0))
const downstreamEventCount = computed(() => data.downstream.reduce((s, o) => s + o.events.length, 0))

const timeLabels = ['08:00', '09:15', '10:30', '11:45', '13:00', '14:15', '15:00'].map((label, i) => ({ label, pos: i * 16.67 }))

function eventPos(evt) {
  const t = new Date(evt.time)
  const base = new Date('2026-08-12 08:00')
  const end = new Date('2026-08-12 15:00')
  const pct = ((t - base) / (end - base)) * 85
  return Math.min(pct, 85)
}
function relationClass(depth) {
  if (depth === 0) return 'relation-current'
  return depth > 0 ? 'relation-downstream' : 'relation-upstream'
}
function relationText(depth) {
  if (depth === 0) return '当前对象'
  return depth > 0 ? `下游 · 层级 ${depth}` : `上游 · 层级 ${Math.abs(depth)}`
}

const swimlaneData = computed(() => {
  const downstream2 = data.downstream.filter(o => o.depth === 2)
  const downstream1 = data.downstream.filter(o => o.depth === 1)
  const current = { ...data.current, depth: 0 }
  const upstream1 = data.upstream.filter(o => o.depth === 1).map(o => ({ ...o, depth: -1 }))
  const upstream2 = data.upstream.filter(o => o.depth === 2).map(o => ({ ...o, depth: -2 }))
  return [...downstream2, ...downstream1, current, ...upstream1, ...upstream2]
})

function goBack() { router.push('/ops/events/list/all') }
</script>

<style scoped>
.page-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.page-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.event-info-bar { display: flex; gap: 20px; align-items: center; padding: 8px 12px; background: #fafafa; border-radius: 6px; margin-bottom: 12px; font-size: 12px; color: #666; }
.info-item { display: flex; align-items: center; gap: 4px; }
.time-range-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 12px; color: #666; }
.topology-desc { padding: 8px 12px; background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 6px; font-size: 12px; color: #1890ff; margin-bottom: 16px; display: flex; gap: 4px; flex-wrap: wrap; }
.topology-desc .current-highlight { color: #ff4d4f; font-weight: 600; }
.topology-desc .time-range { color: #999; }
.swimlane-container { background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden; }
.swimlane-header { display: flex; border-bottom: 1px solid #e8e8e8; }
.swimlane-label-area { width: 220px; flex-shrink: 0; }
.swimlane-timeline { flex: 1; height: 30px; position: relative; overflow: hidden; }
.time-label { position: absolute; font-size: 10px; color: #999; top: 10px; transform: translateX(-50%); }
.grid-line { position: absolute; top: 0; bottom: 0; width: 1px; background: #f0f0f0; }
.now-line { position: absolute; top: 0; bottom: 0; width: 1px; background: #ff4d4f; opacity: 0.6; }
.now-text { position: absolute; top: 0; left: 4px; font-size: 9px; color: #ff4d4f; white-space: nowrap; }
.swimlane-row { display: flex; border-bottom: 1px solid #f0f0f0; }
.swimlane-row:last-child { border-bottom: none; }
.swimlane-row.current-row { background: #fff8f0; }
.swimlane-label { width: 220px; flex-shrink: 0; padding: 8px 12px; border-right: 1px solid #f0f0f0; }
.obj-name { font-size: 13px; font-weight: 600; color: #333; }
.obj-type { font-size: 11px; color: #999; }
.obj-relation { font-size: 10px; margin-top: 2px; }
.relation-upstream { color: #1890ff; }
.relation-downstream { color: #faad14; }
.relation-current { color: #ff4d4f; }
.swimlane-track { flex: 1; position: relative; min-height: 60px; padding: 8px 0; }
.event-dot { position: absolute; top: 50%; transform: translateY(-50%); padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; color: #fff; white-space: nowrap; }
.event-dot.level-critical { background: #ff4d4f; }
.event-dot.level-major { background: #fa8c16; }
.event-dot.level-minor { background: #1890ff; }
.event-dot.level-warning { background: #faad14; }
.event-dot.level-info { background: #999; }
.event-dot:hover { opacity: 0.8; transform: translateY(-50%) scale(1.05); }
.event-dot:has(.current-highlight) { border: 2px solid #000; box-shadow: 0 0 0 2px #ff4d4f; }
.dot-label { font-size: 10px; }
.legend-bar { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #fafafa; border: 1px solid #e8e8e8; border-radius: 6px; margin-top: 12px; font-size: 12px; color: #666; }
.legend-title { color: #333; font-weight: 500; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-dot { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
.current-dot { border: 2px solid #000; background: #ff4d4f; }

@media (max-width: 768px) {
  .page-header { flex-wrap: wrap; gap: 8px; }
  .event-info-bar { flex-wrap: wrap; gap: 8px 16px; }
  .time-range-bar { flex-wrap: wrap; }
  .time-range-bar :deep(.ant-radio-group) { display: flex; flex-wrap: wrap; }
  .swimlane-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .swimlane-label, .swimlane-label-area { width: 150px; }
  .swimlane-timeline { min-width: 600px; }
  .swimlane-track { min-width: 600px; }
  .legend-bar { flex-wrap: wrap; gap: 8px 12px; }
}
</style>