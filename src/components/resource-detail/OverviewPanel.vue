<template>
  <div class="overview-panel">
    <div class="ov-section">
      <h4>基本信息</h4>
      <div class="ov-info-grid">
        <div class="ov-info-item"><span class="ov-label">名称</span><span class="ov-value">{{ resource.name }}</span></div>
        <div class="ov-info-item"><span class="ov-label">标识</span><span class="ov-value ov-mono">{{ resource.identifier }}</span></div>
        <div class="ov-info-item">
          <span class="ov-label">告警状态</span>
          <span class="ov-value"><a-tag :color="resource.alertStatus === '紧急' ? 'red' : 'green'" size="small">{{ resource.alertStatus }}</a-tag></span>
        </div>
        <div class="ov-info-item">
          <span class="ov-label">运行状态</span>
          <span class="ov-value"><span class="ov-status-dot dot-running"></span> 运行中</span>
        </div>
        <div class="ov-info-item"><span class="ov-label">应用级别</span><span class="ov-value">{{ resource.appLevel }}</span></div>
        <div class="ov-info-item"><span class="ov-label">所属VDC</span><span class="ov-value">{{ resource.vdc }}</span></div>
        <div class="ov-info-item"><span class="ov-label">负责人</span><span class="ov-value">{{ resource.owner }}</span></div>
        <div class="ov-info-item"><span class="ov-label">来源</span><span class="ov-value">{{ resource.source }}</span></div>
      </div>
    </div>

    <div class="ov-section">
      <h4>监控指标</h4>
      <div class="ov-metric-grid">
        <div v-for="m in metrics" :key="m.key" class="ov-metric-card">
          <div class="ov-metric-head">
            <span class="ov-metric-label">{{ m.label }}</span>
            <span class="ov-metric-trend" :class="m.trend > 0 ? 'trend-up' : 'trend-down'">
              <i :class="m.trend > 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"></i>
              {{ Math.abs(m.trend) }}%
            </span>
          </div>
          <div class="ov-metric-value" :style="{ color: getMetricColor(m.value, m.threshold) }">{{ m.value }}<span v-if="m.unit" class="ov-metric-unit">{{ m.unit }}</span></div>
          <div class="ov-metric-bar"><div class="ov-metric-fill" :style="{ width: Math.min(m.value, 100) + '%', background: getMetricColor(m.value, m.threshold) }"></div></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  resource: { type: Object, default: () => ({
    name: '订单服务中心', identifier: 'order-svc-prod-01', alertStatus: '紧急',
    appLevel: '重要应用', vdc: 'VDC-BJ-01', owner: '张伟', source: '运营'
  })},
})

const metrics = [
  { key: 'cpu', label: 'CPU 使用率', value: 87, trend: 7.9, threshold: 80 },
  { key: 'mem', label: '内存使用率', value: 92, trend: 10.7, threshold: 80 },
  { key: 'req', label: '请求速率', value: 1560, unit: ' req/s', trend: -3.1, threshold: 2000 },
  { key: 'conn', label: '连接数', value: 128, trend: 0.7, threshold: 200 },
  { key: 'bw', label: '带宽利用率', value: 34, trend: 1.9, threshold: 80 },
  { key: 'disk', label: '磁盘使用率', value: 56, trend: -7.6, threshold: 85 },
  { key: 'diskR', label: '磁盘读速率', value: 45, unit: ' MB/s', trend: -5.8, threshold: 100 },
  { key: 'diskW', label: '磁盘写速率', value: 32, unit: ' MB/s', trend: 4.8, threshold: 100 },
  { key: 'iops', label: 'IOPS', value: 1230, trend: 5.7, threshold: 2000 },
  { key: 'err', label: '错误率', value: 3.2, unit: '%', trend: 2, threshold: 5 },
  { key: 'latency', label: '响应时间', value: 245, unit: ' ms', trend: 6.2, threshold: 500 },
  { key: 'p99', label: 'P99 延迟', value: 320, unit: ' ms', trend: -3.5, threshold: 500 },
  { key: 'gc', label: 'GC 暂停', value: 45, unit: ' ms', trend: -5.5, threshold: 100 },
  { key: 'proc', label: '进程数', value: 128, trend: -2.5, threshold: 200 },
  { key: 'thread', label: '线程数', value: 1560, trend: -3.7, threshold: 2000 },
  { key: 'fd', label: '文件描述符', value: 890, unit: ' / 65535', trend: -4.6, threshold: 50000 },
  { key: 'openFd', label: '打开文件数', value: 234, trend: 10.4, threshold: 500 },
]

function getMetricColor(value, threshold) {
  const ratio = value / threshold
  if (ratio >= 0.9) return '#f5222d'
  if (ratio >= 0.7) return '#fa8c16'
  return '#52c41a'
}
</script>

<style scoped>
.overview-panel { padding: 16px 20px; }
.ov-section { margin-bottom: 24px; }
.ov-section h4 { font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }

.ov-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.ov-info-item { display: flex; align-items: center; padding: 8px 12px; background: #fafafa; border-radius: 6px; }
.ov-label { font-size: 12px; color: #8c8c8c; min-width: 64px; flex-shrink: 0; }
.ov-value { font-size: 13px; color: #1a1a1a; font-weight: 500; }
.ov-mono { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; }
.ov-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #52c41a; display: inline-block; margin-right: 4px; }

.ov-metric-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
.ov-metric-card { background: #fafafa; border-radius: 8px; padding: 12px; }
.ov-metric-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.ov-metric-label { font-size: 12px; color: #8c8c8c; }
.ov-metric-trend { font-size: 11px; font-weight: 500; display: flex; align-items: center; gap: 2px; }
.trend-up { color: #f5222d; }
.trend-down { color: #52c41a; }
.ov-metric-value { font-size: 22px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; line-height: 1; }
.ov-metric-unit { font-size: 12px; font-weight: 400; color: #8c8c8c; }
.ov-metric-bar { height: 4px; background: #e8e8e8; border-radius: 2px; overflow: hidden; }
.ov-metric-fill { height: 100%; border-radius: 2px; transition: width 0.4s; }

@media (max-width: 768px) {
  .ov-info-grid { grid-template-columns: 1fr; }
  .ov-metric-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .ov-metric-grid { grid-template-columns: 1fr; }
}
</style>
