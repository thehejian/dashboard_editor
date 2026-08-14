<template>
  <div class="related-alerts-panel">
    <div class="rap-header">
      <span class="rap-title"><i class="fa-solid fa-bell"></i> 关联告警 (Related Alerts)</span>
      <span class="rap-count">{{ alerts.length }} 条</span>
    </div>
    <div class="rap-list" v-if="alerts.length">
      <div v-for="a in alerts" :key="a.id" class="rap-item" :class="'lv-' + getLevel(a.level)" @click="gotoAlert(a)">
        <span class="rap-dot" :class="'dot-' + getLevel(a.level)"></span>
        <span class="rap-title-text">{{ a.title }}</span>
        <span class="rap-resource">{{ a.resource }}</span>
        <span class="rap-time">{{ formatTime(a.trigger_time) }}</span>
        <span class="rap-current" v-if="a.current_value">{{ a.current_value }}</span>
      </div>
    </div>
    <a-empty v-else description="暂无关联告警" :image-style="{ height: '40px' }" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  alerts: { type: Array, default: () => [] },
})

const router = useRouter()

const levelMap = { critical: '紧急', warning: '重要', info: '次要' }
const getLevel = (l) => l === 'critical' || l === 'warning' || l === 'info' ? l : 'info'

function formatTime(t) {
  if (!t) return '-'
  return String(t).slice(0, 16).replace('+08:00', '').replace('T', ' ')
}

function gotoAlert(a) {
  if (!a) return
  router.push('/alarm/current?alertId=' + a.id)
}
</script>

<style scoped>
.related-alerts-panel {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.rap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.rap-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.rap-title i { color: #FA8C16; margin-right: 6px; }
.rap-count { font-size: 12px; color: #8c8c8c; }
.rap-list { flex: 1; overflow-y: auto; }
.rap-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 4px;
  border-radius: 4px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
}
.rap-item:hover { background: #e6f7ff; }
.rap-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-critical { background: #F5222D; }
.dot-warning { background: #FA8C16; }
.dot-info { background: #1890ff; }
.rap-title-text { font-size: 12px; font-weight: 500; color: #333; flex-shrink: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rap-resource { font-size: 11px; color: #8c8c8c; background: #f0f0f0; padding: 0 6px; border-radius: 2px; white-space: nowrap; }
.rap-current { font-size: 11px; font-weight: 600; color: #F5222D; white-space: nowrap; }
.rap-time { font-size: 11px; color: #8c8c8c; margin-left: auto; white-space: nowrap; }

@media (max-width: 768px) {
  .related-alerts-panel { padding: 10px; border-radius: 0; border-left: none; border-right: none; }
  .rap-title { font-size: 12px; }
  .rap-resource { display: none; }
}
</style>