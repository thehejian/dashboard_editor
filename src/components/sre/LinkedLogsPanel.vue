<template>
  <div class="linked-logs-panel">
    <div class="llp-header">
      <span class="llp-title"><i class="fa-solid fa-file-lines"></i> 关联故障日志流 (Linked Logs)</span>
      <span class="llp-count">{{ logs.length }} 条</span>
    </div>
    <div class="llp-list">
      <div v-for="log in logs" :key="log.id" class="llp-log" :class="'level-' + log.level">
        <div class="llp-log-header">
          <span class="llp-log-level" :class="'lvl-' + log.level">{{ log.level.toUpperCase() }}</span>
          <span class="llp-log-service">{{ log.service }}</span>
          <span class="llp-log-source">{{ log.source }}</span>
          <span class="llp-log-time">{{ log.time }}</span>
        </div>
        <div class="llp-log-msg">{{ log.message }}</div>
        <div v-if="log.traceId" class="llp-log-trace">Trace: {{ log.traceId }}</div>
      </div>
      <a-empty v-if="!logs.length" description="暂无关联日志" :image-style="{ height: '40px' }" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  logs: { type: Array, default: () => [] },
})
</script>

<style scoped>
.linked-logs-panel {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.llp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.llp-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.llp-title i { color: #FF7D00; margin-right: 6px; }
.llp-count { font-size: 12px; color: #8c8c8c; }
.llp-list { flex: 1; overflow-y: auto; font-family: 'SF Mono', 'Fira Code', monospace; }
.llp-log {
  padding: 8px 10px;
  margin-bottom: 4px;
  border-radius: 4px;
  background: #fafafa;
  border-left: 3px solid #d9d9d9;
}
.llp-log.level-error { border-left-color: #F5222D; background: #fff1f0; }
.llp-log.level-warn { border-left-color: #FF7D00; background: #fff7e6; }
.llp-log.level-info { border-left-color: #1890ff; background: #e6f7ff; }
.llp-log-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.llp-log-level { font-size: 10px; font-weight: 700; padding: 0 4px; border-radius: 2px; }
.lvl-error { color: #F5222D; background: #fff1f0; }
.lvl-warn { color: #FF7D00; background: #fff7e6; }
.lvl-info { color: #1890ff; background: #e6f7ff; }
.llp-log-service { font-size: 11px; font-weight: 600; color: #333; }
.llp-log-source { font-size: 10px; color: #8c8c8c; background: #f0f0f0; padding: 0 4px; border-radius: 2px; }
.llp-log-time { font-size: 10px; color: #8c8c8c; margin-left: auto; }
.llp-log-msg { font-size: 11px; color: #333; line-height: 1.5; word-break: break-all; }
.llp-log-trace { font-size: 10px; color: #722ED1; margin-top: 3px; }

@media (max-width: 768px) {
  .linked-logs-panel { padding: 10px; border-radius: 0; border-left: none; border-right: none; }
  .llp-title { font-size: 12px; }
  .llp-log { padding: 6px 8px; }
  .llp-log-msg { font-size: 10px; }
}
</style>
