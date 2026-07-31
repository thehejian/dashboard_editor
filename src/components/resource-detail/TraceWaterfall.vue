<template>
  <div class="trace-wrap">
    <div class="trace-header">
      <div class="trace-info">
        <span class="trace-id">Trace: {{ data.traceId }}</span>
        <a-tag color="blue" size="small">{{ data.spanCount }} spans</a-tag>
        <a-tag :color="hasError ? 'red' : 'green'" size="small">{{ hasError ? '有错误' : '正常' }}</a-tag>
      </div>
      <div class="trace-meta">
        <span>{{ data.rootOperation }}</span>
        <span class="trace-duration">{{ data.duration }}</span>
        <span class="trace-start">{{ data.startTime }}</span>
      </div>
    </div>

    <div class="tw-minimap">
      <div class="tw-minimap-bar" v-for="span in data.spans" :key="'m-' + span.id"
        :style="{ left: (span.startTime / totalDuration * 100) + '%', width: Math.max((span.duration / totalDuration * 100), 0.5) + '%', background: span.status === 'error' ? '#f5222d' : span.color }">
      </div>
      <div class="tw-minimap-cursor" :style="{ left: cursorPos + '%' }"></div>
    </div>

    <div class="tw-legend">
      <span v-for="svc in uniqueServices" :key="svc.name" class="tw-legend-item">
        <span class="tw-legend-dot" :style="{ background: svc.color }"></span>
        {{ svc.name }}
      </span>
    </div>

    <div class="tw-spans">
      <div v-for="span in data.spans" :key="span.id" class="tw-span-row" :class="{ 'tw-span-error': span.status === 'error', 'tw-span-selected': selectedSpan?.id === span.id }" @click="selectSpan(span)">
        <div class="tw-span-label" :style="{ paddingLeft: (span.depth * 20 + 8) + 'px' }">
          <span class="tw-span-expand" v-if="span.depth === 0"><i class="fa-solid fa-chevron-down"></i></span>
          <span class="tw-span-op">{{ span.operation }}</span>
          <a-tag size="small" :style="{ background: span.color + '18', color: span.color, borderColor: span.color + '40' }">{{ span.service }}</a-tag>
        </div>
        <div class="tw-span-bar-wrap">
          <div class="tw-span-bar" :style="{ left: (span.startTime / totalDuration * 100) + '%', width: Math.max((span.duration / totalDuration * 100), 0.5) + '%', background: span.status === 'error' ? '#f5222d' : span.color }">
            <span class="tw-span-dur">{{ span.duration }}ms</span>
          </div>
        </div>
      </div>
    </div>

    <a-drawer :open="!!selectedSpan" :title="selectedSpan?.operation || 'Span 详情'" :width="440" @close="selectedSpan = null" placement="right" :get-container="() => document.body" :style="{ zIndex: 1100 }">
      <template v-if="selectedSpan">
        <div class="tw-detail">
          <div class="tw-d-row"><span class="tw-dl">Span ID</span><span class="tw-dv tw-mono">{{ selectedSpan.id }}</span></div>
          <div class="tw-d-row"><span class="tw-dl">服务</span><span class="tw-dv"><a-tag :style="{ background: selectedSpan.color + '18', color: selectedSpan.color, borderColor: selectedSpan.color + '40' }" size="small">{{ selectedSpan.service }}</a-tag></span></div>
          <div class="tw-d-row"><span class="tw-dl">耗时</span><span class="tw-dv tw-dv-bold">{{ selectedSpan.duration }}ms</span></div>
          <div class="tw-d-row"><span class="tw-dl">开始</span><span class="tw-dv tw-mono">+{{ selectedSpan.startTime }}ms</span></div>
          <div class="tw-d-row"><span class="tw-dl">状态</span><span class="tw-dv"><a-tag :color="selectedSpan.status === 'error' ? 'red' : 'green'" size="small">{{ selectedSpan.status }}</a-tag></span></div>
          <div class="tw-d-row" v-if="selectedSpan.parent"><span class="tw-dl">父 Span</span><span class="tw-dv tw-mono">{{ selectedSpan.parent }}</span></div>
          <a-divider style="margin: 10px 0" />
          <div v-if="selectedSpan.error" class="tw-error-box">
            <h4><i class="fa-solid fa-triangle-exclamation"></i> 错误信息</h4>
            <pre class="tw-error-msg">{{ selectedSpan.error }}</pre>
          </div>
          <div class="tw-d-section">
            <h4>操作名称</h4>
            <pre class="tw-d-code">{{ selectedSpan.operation }}</pre>
          </div>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ data: { type: Object, default: () => ({}) } })

const selectedSpan = ref(null)
const cursorPos = ref(50)

const totalDuration = computed(() => {
  if (!props.data.spans?.length) return 1
  return Math.max(...props.data.spans.map(s => s.startTime + s.duration))
})

const hasError = computed(() => props.data.spans?.some(s => s.status === 'error'))

const uniqueServices = computed(() => {
  const map = new Map()
  props.data.spans?.forEach(s => { if (!map.has(s.service)) map.set(s.service, s.color) })
  return Array.from(map.entries()).map(([name, color]) => ({ name, color }))
})

function selectSpan(span) {
  selectedSpan.value = selectedSpan.value?.id === span.id ? null : span
}
</script>

<style scoped>
.trace-wrap { padding: 12px 16px; }
.trace-header { margin-bottom: 12px; }
.trace-info { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.trace-id { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; color: #8c8c8c; }
.trace-meta { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #595959; }
.trace-duration { font-weight: 600; color: #1a1a1a; }
.trace-start { font-size: 11px; color: #8c8c8c; font-family: 'SF Mono', Monaco, monospace; }

.tw-minimap { height: 24px; background: #fafafa; border-radius: 4px; position: relative; margin-bottom: 8px; overflow: hidden; border: 1px solid #f0f0f0; }
.tw-minimap-bar { position: absolute; top: 4px; height: 16px; border-radius: 2px; opacity: 0.7; }
.tw-minimap-cursor { position: absolute; top: 0; bottom: 0; width: 1px; background: #1890ff; }

.tw-legend { display: flex; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.tw-legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #8c8c8c; }
.tw-legend-dot { width: 8px; height: 8px; border-radius: 2px; }

.tw-spans { display: flex; flex-direction: column; }
.tw-span-row { display: flex; align-items: center; height: 30px; cursor: pointer; border-radius: 3px; transition: background 0.1s; }
.tw-span-row:hover { background: #f5f5f5; }
.tw-span-row.tw-span-selected { background: #e6f7ff; }
.tw-span-row.tw-span-error { background: #fff1f0; }
.tw-span-row.tw-span-error:hover { background: #ffe7e6; }
.tw-span-label { display: flex; align-items: center; gap: 6px; min-width: 240px; flex-shrink: 0; }
.tw-span-expand { font-size: 8px; color: #8c8c8c; width: 12px; }
.tw-span-op { font-size: 12px; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
.tw-span-bar-wrap { flex: 1; position: relative; height: 100%; display: flex; align-items: center; }
.tw-span-bar { position: absolute; height: 16px; border-radius: 3px; min-width: 2px; display: flex; align-items: center; padding-left: 4px; }
.tw-span-dur { font-size: 10px; color: #fff; white-space: nowrap; font-weight: 500; }

.tw-detail { display: flex; flex-direction: column; gap: 10px; }
.tw-d-row { display: flex; align-items: center; gap: 10px; }
.tw-dl { font-size: 12px; color: #8c8c8c; min-width: 60px; flex-shrink: 0; }
.tw-dv { font-size: 13px; color: #1a1a1a; }
.tw-dv-bold { font-weight: 600; font-size: 15px; }
.tw-mono { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; }
.tw-error-box { background: #fff1f0; border: 1px solid #ffa39e; border-radius: 6px; padding: 10px 12px; }
.tw-error-box h4 { font-size: 12px; font-weight: 600; color: #f5222d; margin: 0 0 6px; display: flex; align-items: center; gap: 4px; }
.tw-error-msg { font-size: 11px; color: #cf1322; white-space: pre-wrap; margin: 0; font-family: 'SF Mono', Monaco, monospace; }
.tw-d-section h4 { font-size: 13px; font-weight: 600; margin: 0 0 6px; }
.tw-d-code { font-size: 12px; color: #595959; background: #fafafa; padding: 8px 10px; border-radius: 4px; margin: 0; font-family: 'SF Mono', Monaco, monospace; }
</style>
