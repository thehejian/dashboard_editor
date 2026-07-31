<template>
  <div class="log-list-wrap">
    <div class="ll-toolbar">
      <a-range-picker v-model:value="timeRange" size="small" style="width: 240px" />
      <a-input-search v-model:value="searchText" placeholder="搜索日志内容" style="width: 200px" size="small" allowClear />
      <div class="ll-level-filters">
        <a-tag v-for="lv in levels" :key="lv.key" :color="levelFilter === lv.key ? lv.color : 'default'" class="ll-level-tag" @click="toggleLevel(lv.key)">
          {{ lv.label }}
        </a-tag>
      </div>
    </div>
    <div class="ll-list">
      <div v-for="log in filteredData" :key="log.id" class="ll-row" :class="'ll-' + log.level" @click="expandLog(log)">
        <span class="ll-level-dot" :class="'lld-' + log.level"></span>
        <span class="ll-time">{{ log.time }}</span>
        <span class="ll-service">{{ log.service }}</span>
        <span class="ll-message">{{ log.message }}</span>
        <i v-if="log.traceId" class="fa-solid fa-link ll-trace-icon" title="有关联调用链"></i>
      </div>
      <a-empty v-if="!filteredData.length" description="暂无日志" style="margin: 40px 0" />
    </div>

    <a-drawer :open="detailOpen" title="日志详情" :width="'80vw'" @close="detailOpen = false" placement="right" :get-container="() => document.body" :style="{ zIndex: 1100 }">
      <template v-if="selectedLog">
        <div class="ll-detail">
          <div class="ll-d-row"><span class="ll-dl">级别</span><a-tag :color="getLevelColor(selectedLog.level)" size="small">{{ selectedLog.level.toUpperCase() }}</a-tag></div>
          <div class="ll-d-row"><span class="ll-dl">时间</span><span class="ll-dv">{{ selectedLog.time }}</span></div>
          <div class="ll-d-row"><span class="ll-dl">服务</span><span class="ll-dv">{{ selectedLog.service }}</span></div>
          <div class="ll-d-row"><span class="ll-dl">主机</span><span class="ll-dv">{{ selectedLog.host }}</span></div>
          <div class="ll-d-row" v-if="selectedLog.traceId"><span class="ll-dl">Trace ID</span><span class="ll-dv ll-trace-id">{{ selectedLog.traceId }}</span></div>
          <a-divider style="margin: 10px 0" />
          <div class="ll-d-section">
            <h4>消息</h4>
            <pre class="ll-d-message">{{ selectedLog.message }}</pre>
          </div>
          <div class="ll-d-section" v-if="selectedLog.extra">
            <h4>附加字段</h4>
            <div class="ll-d-extra">
              <div v-for="(v, k) in selectedLog.extra" :key="k" class="ll-d-extra-row">
                <span class="ll-dk">{{ k }}</span>
                <span class="ll-dval">{{ v }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ data: { type: Array, default: () => [] } })

const searchText = ref('')
const timeRange = ref(null)
const levelFilter = ref(null)
const detailOpen = ref(false)
const selectedLog = ref(null)

const levels = [
  { key: 'error', label: 'Error', color: 'red' },
  { key: 'warn', label: 'Warn', color: 'orange' },
  { key: 'info', label: 'Info', color: 'blue' },
  { key: 'debug', label: 'Debug', color: 'default' },
]

const filteredData = computed(() => {
  let list = props.data
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(l => l.message.toLowerCase().includes(kw) || l.service?.toLowerCase().includes(kw))
  }
  if (levelFilter.value) list = list.filter(l => l.level === levelFilter.value)
  return list
})

function toggleLevel(lv) {
  levelFilter.value = levelFilter.value === lv ? null : lv
}

function expandLog(log) {
  selectedLog.value = log
  detailOpen.value = true
}

function getLevelColor(level) {
  return { error: 'red', warn: 'orange', info: 'blue', debug: 'default' }[level] || 'default'
}
</script>

<style scoped>
.log-list-wrap { padding: 12px 16px; }
.ll-toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; }
.ll-level-filters { display: flex; gap: 4px; }
.ll-level-tag { cursor: pointer; user-select: none; }
.ll-list { display: flex; flex-direction: column; gap: 2px; }
.ll-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: background 0.12s; }
.ll-row:hover { background: #f5f5f5; }
.ll-row.ll-error { background: #fff1f0; }
.ll-row.ll-error:hover { background: #ffe7e6; }
.ll-level-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.lld-error { background: #f5222d; }
.lld-warn { background: #fa8c16; }
.lld-info { background: #1890ff; }
.lld-debug { background: #d9d9d9; }
.ll-time { color: #8c8c8c; white-space: nowrap; flex-shrink: 0; font-family: 'SF Mono', Monaco, monospace; font-size: 11px; }
.ll-service { color: #595959; font-weight: 500; white-space: nowrap; flex-shrink: 0; min-width: 90px; }
.ll-message { color: #1a1a1a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.ll-trace-icon { color: #1890ff; font-size: 10px; flex-shrink: 0; opacity: 0.6; }
.ll-detail { display: flex; flex-direction: column; gap: 10px; }
.ll-d-row { display: flex; align-items: center; gap: 10px; }
.ll-dl { font-size: 12px; color: #8c8c8c; min-width: 60px; flex-shrink: 0; }
.ll-dv { font-size: 13px; color: #1a1a1a; }
.ll-trace-id { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; color: #1890ff; }
.ll-d-section h4 { font-size: 13px; font-weight: 600; margin: 0 0 6px; }
.ll-d-message { font-size: 12px; color: #595959; white-space: pre-wrap; line-height: 1.6; background: #fafafa; padding: 10px; border-radius: 6px; margin: 0; font-family: 'SF Mono', Monaco, monospace; }
.ll-d-extra { display: flex; flex-direction: column; gap: 6px; }
.ll-d-extra-row { display: flex; gap: 8px; }
.ll-dk { font-size: 12px; color: #8c8c8c; min-width: 80px; flex-shrink: 0; font-family: 'SF Mono', Monaco, monospace; }
.ll-dval { font-size: 12px; color: #1a1a1a; font-family: 'SF Mono', Monaco, monospace; }
</style>
