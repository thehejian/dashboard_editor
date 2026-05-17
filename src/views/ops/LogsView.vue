<template>
  <div class="page-view">
    <div class="page-header"><h2>日志管理</h2></div>
    <div class="log-filters">
      <a-select v-model:value="level" placeholder="日志级别" style="width: 120px" allowClear>
        <a-select-option value="error">Error</a-select-option>
        <a-select-option value="warn">Warn</a-select-option>
        <a-select-option value="info">Info</a-select-option>
      </a-select>
      <a-select v-model:value="source" placeholder="来源" style="width: 140px" allowClear>
        <a-select-option value="api">API服务</a-select-option>
        <a-select-option value="worker">后台任务</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="搜索日志内容" style="width: 300px" />
    </div>
    <div class="log-list">
      <div class="log-item" v-for="log in logs" :key="log.id" :class="log.level">
        <span class="log-time">{{ log.time }}</span>
        <span class="log-level">{{ log.level.toUpperCase() }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const level = ref(null)
const source = ref(null)
const search = ref('')
const logs = ref([
  { id: 1, level: 'error', time: '14:35:20', message: 'Connection timeout to database db-primary' },
  { id: 2, level: 'warn', time: '14:34:15', message: 'Task queue is accumulating' },
  { id: 3, level: 'info', time: '14:33:10', message: 'User admin logged in' },
])
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.log-filters { display: flex; gap: 12px; margin-bottom: 20px; }
.log-list { background: var(--bg-card); border-radius: 8px; font-family: monospace; font-size: 12px; }
.log-item { padding: 8px 16px; border-bottom: 1px solid var(--border); display: flex; gap: 12px; }
.log-item:last-child { border-bottom: none; }
.log-item.error { background: #fff1f0; }
.log-item.warn { background: #fff7e6; }
.log-time { color: var(--text-ter); width: 80px; }
.log-level { font-weight: 600; width: 50px; }
.log-item.error .log-level { color: #f5222d; }
.log-item.warn .log-level { color: #fa8c16; }
.log-message { flex: 1; }
</style>