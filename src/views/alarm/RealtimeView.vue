<template>
  <div class="page-view">
    <div class="page-header"><h2>实时告警</h2></div>
    <div class="alert-stats">
      <div class="stat-item critical"><span class="stat-value">{{ getCountByLevel('critical') }}</span><span class="stat-label">紧急</span></div>
      <div class="stat-item warning"><span class="stat-value">{{ getCountByLevel('warning') }}</span><span class="stat-label">重要</span></div>
      <div class="stat-item info"><span class="stat-value">{{ getCountByLevel('info') }}</span><span class="stat-label">次要</span></div>
      <div class="stat-item all"><span class="stat-value">{{ realtimeAlerts.length }}</span><span class="stat-label">全部</span></div>
    </div>
    <div class="alert-list">
      <div class="alert-item" v-for="alert in realtimeAlerts" :key="alert.id" :class="alert.level">
        <div class="alert-icon"><i class="fa-solid" :class="{ 'fa-circle-exclamation': alert.level === 'critical', 'fa-triangle-exclamation': alert.level === 'warning', 'fa-circle-info': alert.level === 'info' }"></i></div>
        <div class="alert-content">
          <div class="alert-title">{{ alert.title }}</div>
          <div class="alert-meta"><span class="alert-resource">{{ alert.resource }}</span><span class="alert-time">触发于 {{ alert.triggerTime }}</span></div>
        </div>
        <div class="alert-actions">
          <button class="action-btn" @click="handleAlert(alert.id)"><i class="fa-solid fa-check"></i></button>
          <button class="action-btn"><i class="fa-solid fa-eye"></i></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const realtimeAlerts = ref([
  { id: 1, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)', triggerTime: '10:32' },
  { id: 2, level: 'critical', title: '磁盘空间不足', resource: 'db-primary (华东区域)', triggerTime: '10:28' },
  { id: 3, level: 'warning', title: '内存使用率偏高', resource: 'app-server-03 (华南区域)', triggerTime: '10:15' },
])

const getCountByLevel = (level) => realtimeAlerts.value.filter(a => a.level === level).length
const handleAlert = (id) => { realtimeAlerts.value = realtimeAlerts.value.filter(a => a.id !== id) }
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.alert-stats { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-item { flex: 1; padding: 16px; background: var(--bg-card); border-radius: 8px; text-align: center; }
.stat-item.critical { border-left: 3px solid #f5222d; }
.stat-item.warning { border-left: 3px solid #fa8c16; }
.stat-item.info { border-left: 3px solid #1890ff; }
.stat-value { display: block; font-size: 28px; font-weight: 600; }
.stat-label { font-size: 12px; color: var(--text-secondary); }
.alert-list { display: flex; flex-direction: column; gap: 12px; }
.alert-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-card); border-radius: 8px; border-left: 4px solid; }
.alert-item.critical { border-left-color: #f5222d; }
.alert-item.warning { border-left-color: #fa8c16; }
.alert-item.info { border-left-color: #1890ff; }
.alert-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.alert-item.critical .alert-icon { background: #fff1f0; color: #f5222d; }
.alert-item.warning .alert-icon { background: #fff7e6; color: #fa8c16; }
.alert-item.info .alert-icon { background: #e6f7ff; color: #1890ff; }
.alert-content { flex: 1; }
.alert-title { font-weight: 500; margin-bottom: 4px; }
.alert-meta { font-size: 12px; color: var(--text-secondary); display: flex; gap: 16px; }
.alert-actions { display: flex; gap: 8px; }
.action-btn { width: 32px; height: 32px; border: 1px solid var(--border); background: var(--bg); border-radius: 6px; cursor: pointer; color: var(--text-secondary); }
.action-btn:hover { border-color: var(--brand); color: var(--brand); }
</style>