<template>
  <div class="page-view">
    <div class="page-header">
      <h2>巡检报告</h2>
      <a-button type="primary">新建巡检计划</a-button>
    </div>
    <div class="inspect-stats">
      <div class="stat-item"><span class="stat-value">{{ stats.total }}</span><span class="stat-label">巡检计划</span></div>
      <div class="stat-item"><span class="stat-value">{{ stats.running }}</span><span class="stat-label">执行中</span></div>
      <div class="stat-item"><span class="stat-value">{{ stats.done }}</span><span class="stat-label">已完成</span></div>
      <div class="stat-item"><span class="stat-value">{{ stats.issues }}</span><span class="stat-label">发现问题</span></div>
    </div>
    <div class="plan-list">
      <div class="plan-card" v-for="plan in plans" :key="plan.id">
        <div class="plan-header">
          <h4>{{ plan.name }}</h4>
          <a-tag :color="plan.status === 'running' ? 'orange' : 'blue'">{{ plan.status === 'running' ? '执行中' : '已计划' }}</a-tag>
        </div>
        <p>{{ plan.description }}</p>
        <div class="plan-meta"><span><i class="fa-regular fa-clock"></i> {{ plan.schedule }}</span><span>目标: {{ plan.targetCount }}</span></div>
        <div class="plan-actions">
          <a-button size="small">立即执行</a-button>
          <a-button size="small">查看报告</a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const stats = ref({ total: 5, running: 1, done: 12, issues: 3 })
const plans = ref([
  { id: 1, name: '每日巡检', description: '数据库每日健康巡检', schedule: '每天 09:00', targetCount: 5, status: 'active' },
  { id: 2, name: '安全合规巡检', description: '安全基线检查', schedule: '每周一 10:00', targetCount: 20, status: 'active' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/inspection_plans?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      plans.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          schedule: item.schedule,
          targetCount: item.target_count,
          status: item.status,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.inspect-stats { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-item { flex: 1; padding: 16px; background: var(--bg-card); border-radius: 8px; text-align: center; }
.stat-value { display: block; font-size: 28px; font-weight: 600; }
.stat-label { font-size: 12px; color: var(--text-secondary); }
.plan-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
.plan-card { background: var(--bg-card); border-radius: 8px; padding: 20px; }
.plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.plan-header h4 { margin: 0; }
.plan-card p { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.plan-meta { display: flex; gap: 16px; font-size: 12px; color: var(--text-ter); margin-bottom: 12px; }
.plan-actions { display: flex; gap: 8px; }

@media (max-width: 768px) {
  .page-view { padding: 16px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .page-header .ant-btn { width: 100%; }
  .inspect-stats { flex-wrap: wrap; }
  .stat-item { min-width: calc(50% - 8px); flex: none; }
  .plan-list { grid-template-columns: 1fr; }
}
</style>