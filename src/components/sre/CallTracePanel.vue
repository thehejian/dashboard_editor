<template>
  <div class="call-trace-panel">
    <div class="ctp-header">
      <span class="ctp-title"><i class="fa-solid fa-route"></i> 分布式核心接口调用链路 (Call Trace)</span>
      <span class="ctp-count">{{ traces.length }} 条链路</span>
    </div>
    <div class="ctp-list">
      <div v-for="trace in traces" :key="trace.id" class="ctp-trace" :class="'trace-' + trace.status">
        <div class="ctp-trace-header">
          <span class="ctp-trace-name">{{ trace.name }}</span>
          <span class="ctp-trace-service">{{ trace.service }}</span>
          <span class="ctp-trace-status" :class="'ts-' + trace.status">
            {{ trace.status === 'error' ? '异常' : '正常' }}
          </span>
          <span class="ctp-trace-duration">{{ trace.duration }}ms</span>
          <span class="ctp-trace-time">{{ trace.timestamp }}</span>
        </div>
        <div class="ctp-spans">
          <div v-for="(span, si) in trace.spans" :key="si" class="ctp-span">
            <span class="ctp-span-indent" :style="{ width: span.service === trace.service ? '0px' : (si * 12) + 'px' }"></span>
            <span class="ctp-span-bar" :style="{ width: Math.max(8, (span.duration / trace.duration) * 100) + '%' }" :class="'span-' + span.status"></span>
            <span class="ctp-span-label">{{ span.service }} → {{ span.operation }}</span>
            <span class="ctp-span-dur">{{ span.duration }}ms</span>
          </div>
        </div>
      </div>
      <a-empty v-if="!traces.length" description="暂无调用链路数据" :image-style="{ height: '40px' }" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  traces: { type: Array, default: () => [] },
})
</script>

<style scoped>
.call-trace-panel {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.ctp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.ctp-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.ctp-title i { color: #722ED1; margin-right: 6px; }
.ctp-count { font-size: 12px; color: #8c8c8c; }
.ctp-list { flex: 1; overflow-y: auto; }
.ctp-trace {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.ctp-trace.trace-error { border-left: 3px solid #F5222D; }
.ctp-trace.trace-ok { border-left: 3px solid #52c41a; }
.ctp-trace-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ctp-trace-name { font-size: 13px; font-weight: 600; color: #1a1a1a; font-family: 'SF Mono', monospace; }
.ctp-trace-service { font-size: 11px; color: #8c8c8c; background: #f5f5f5; padding: 1px 6px; border-radius: 3px; }
.ctp-trace-status { font-size: 11px; font-weight: 500; }
.ts-error { color: #F5222D; }
.ts-ok { color: #52c41a; }
.ctp-trace-duration { font-size: 12px; font-weight: 600; color: #FF7D00; margin-left: auto; }
.ctp-trace-time { font-size: 11px; color: #8c8c8c; }
.ctp-spans { margin-top: 8px; }
.ctp-span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  line-height: 1.8;
}
.ctp-span-indent { flex-shrink: 0; }
.ctp-span-bar {
  height: 6px;
  border-radius: 3px;
  flex-shrink: 0;
  min-width: 8px;
}
.span-error { background: #F5222D; }
.span-ok { background: #52c41a; }
.ctp-span-label { color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ctp-span-dur { font-size: 10px; color: #8c8c8c; flex-shrink: 0; font-family: monospace; }

@media (max-width: 768px) {
  .call-trace-panel { padding: 10px; border-radius: 0; border-left: none; border-right: none; }
  .ctp-title { font-size: 12px; }
  .ctp-trace { padding: 8px; }
  .ctp-trace-name { font-size: 11px; }
  .ctp-span { font-size: 10px; }
}
</style>
