<template>
  <div class="fault-summary-card">
    <div class="fsc-badge">
      <span class="fsc-severity" :class="'sev-' + incident.severity">{{ incident.severity }}</span>
      <span class="fsc-id">{{ incident.id }}</span>
    </div>
    <h3 class="fsc-title">{{ incident.title }}</h3>
    <p class="fsc-desc">{{ incident.description }}</p>
    <div class="fsc-metrics">
      <div class="fsc-metric">
        <span class="fsc-metric-label">{{ incident.metrics.p99.unit === 'ms' ? 'P99响应时延' : 'P99' }}</span>
        <span class="fsc-metric-value">{{ incident.metrics.p99.current.toLocaleString() }}<span class="fsc-metric-unit">{{ incident.metrics.p99.unit }}</span></span>
        <span class="fsc-metric-change">{{ incident.metrics.p99.multiplier }}</span>
      </div>
      <div class="fsc-metric">
        <span class="fsc-metric-label">接口失败率</span>
        <span class="fsc-metric-value">{{ incident.metrics.failureRate.current }}<span class="fsc-metric-unit">{{ incident.metrics.failureRate.unit }}</span></span>
        <span class="fsc-metric-change">{{ incident.metrics.failureRate.label }}</span>
      </div>
    </div>
    <div class="fsc-extra">
      <div class="fsc-extra-row">
        <span class="fsc-extra-item" v-if="incident.appName"><i class="fa-solid fa-cube"></i> {{ incident.appName }}<span class="fsc-app-service"> / {{ incident.service }}</span></span>
        <span class="fsc-extra-item"><i class="fa-solid fa-bolt"></i> 熔断</span>
        <span class="fsc-extra-item"><i class="fa-solid fa-fire"></i> 大量 HTTP 504</span>
      </div>
      <div class="fsc-impact" v-if="incident.impactScope">
        <i class="fa-solid fa-sitemap"></i> {{ incident.impactScope }}
      </div>
    </div>
    <div class="fsc-timeline" v-if="incident.timeline?.length">
      <div class="fsc-tl-title"><i class="fa-solid fa-clock-rotate-left"></i> 处理时间线</div>
      <div class="fsc-tl-list">
        <div v-for="(item, i) in incident.timeline" :key="i" class="fsc-tl-item">
          <span class="fsc-tl-dot" :class="'tl-' + item.type"></span>
          <span class="fsc-tl-time">{{ item.time }}</span>
          <span class="fsc-tl-event">{{ item.event }}</span>
          <span class="fsc-tl-detail">{{ item.detail }}</span>
        </div>
      </div>
    </div>
    <div class="fsc-footer">
      <span class="fsc-duration"><i class="fa-solid fa-clock"></i> 持续时长: {{ incident.duration }}</span>
      <span class="fsc-status"><i class="fa-solid fa-satellite-dish"></i> 监控引擎激活</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  incident: { type: Object, required: true },
})
</script>

<style scoped>
.fault-summary-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
}
.fsc-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.fsc-severity {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}
.sev-P1 { background: #F5222D; }
.sev-P2 { background: #FF7D00; }
.sev-P3 { background: #FAAD14; }
.fsc-id { font-size: 12px; color: #8c8c8c; font-family: monospace; }
.fsc-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 3px;
  line-height: 1.3;
}
.fsc-desc {
  font-size: 12px;
  color: #666;
  margin: 0 0 6px;
  line-height: 1.4;
}
.fsc-metrics {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  margin-top: 20px;
}
.fsc-metric {
  flex: 1;
  background: #fafafa;
  border-radius: 6px;
  padding: 6px 8px;
  text-align: center;
}
.fsc-metric-label {
  display: block;
  font-size: 10px;
  color: #8c8c8c;
  margin-bottom: 1px;
}
.fsc-metric-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #F5222D;
  line-height: 1.2;
}
.fsc-metric-unit {
  font-size: 10px;
  font-weight: 400;
  color: #8c8c8c;
  margin-left: 2px;
}
.fsc-metric-change {
  display: block;
  font-size: 10px;
  color: #FF7D00;
  margin-top: 1px;
}
.fsc-extra {
  margin-bottom: 6px;
}
.fsc-extra-row {
  display: flex;
  gap: 8px;
}
.fsc-extra-item {
  font-size: 11px;
  color: #666;
  background: #fafafa;
  padding: 2px 8px;
  border-radius: 4px;
}
.fsc-extra-item i { margin-right: 3px; color: #FF7D00; }
.fsc-app-service { font-size: 10px; color: #8c8c8c; }
.fsc-impact { font-size: 11px; color: #FF7D00; margin-top: 4px; }
.fsc-impact i { margin-right: 4px; }
.fsc-timeline { margin: 6px 0; padding: 6px 8px; background: #fafafa; border-radius: 6px; }
.fsc-tl-title { font-size: 11px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
.fsc-tl-title i { margin-right: 4px; color: #722ED1; }
.fsc-tl-list { max-height: 100px; overflow-y: auto; }
.fsc-tl-item { display: flex; align-items: center; gap: 6px; font-size: 11px; line-height: 1.8; }
.fsc-tl-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.tl-alert { background: #F5222D; }
.tl-detection { background: #722ED1; }
.tl-action { background: #1890ff; }
.tl-recovery { background: #52c41a; }
.fsc-tl-time { font-family: monospace; color: #8c8c8c; font-size: 10px; flex-shrink: 0; }
.fsc-tl-event { font-weight: 500; color: #1a1a1a; flex-shrink: 0; }
.fsc-tl-detail { color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fsc-footer {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: #8c8c8c;
  margin-top: auto;
  padding-top: 4px;
  border-top: 1px solid #f0f0f0;
}
.fsc-footer i { margin-right: 4px; }

@media (max-width: 768px) {
  .fault-summary-card { padding: 8px 10px; }
  .fsc-title { font-size: 13px; }
  .fsc-desc { font-size: 11px; margin-bottom: 4px; }
  .fsc-metrics { gap: 4px; margin-top: 20px; }
  .fsc-metric { padding: 4px 6px; }
  .fsc-metric-value { font-size: 16px; }
  .fsc-footer { font-size: 10px; gap: 8px; }
}
</style>
