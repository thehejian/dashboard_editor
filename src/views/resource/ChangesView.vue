<template>
  <div class="page-view">
    <div class="page-header"><h2>变更记录</h2></div>
    <div class="filter-bar">
      <a-select v-model:value="changeType" placeholder="变更类型" style="width: 140px" allowClear>
        <a-select-option value="create">新增</a-select-option>
        <a-select-option value="update">更新</a-select-option>
        <a-select-option value="delete">删除</a-select-option>
      </a-select>
      <a-range-picker v-model:value="range" style="width: 240px" />
    </div>
    <a-timeline>
      <a-timeline-item v-for="change in changes" :key="change.id" :color="getChangeColor(change.type)">
        <div class="change-item">
          <div class="change-header">
            <span class="change-action" :class="change.type">{{ getChangeText(change.type) }}</span>
            <span>{{ change.resource }}</span>
          </div>
          <div class="change-detail">{{ change.detail }}</div>
          <div class="change-meta"><span>{{ change.operator }}</span><span>{{ change.time }}</span></div>
        </div>
      </a-timeline-item>
    </a-timeline>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const changeType = ref(null)
const range = ref(null)
const changes = ref([
  { id: 1, type: 'create', resource: 'ecs-web-05', detail: '新增弹性云服务器 ecs-web-05，规格 4C/8G，挂载 evs-data-03', operator: '张伟', time: '2026-06-15 22:00:00' },
  { id: 2, type: 'update', resource: 'db-primary', detail: '数据库主库内存扩容 32G→64G，连接池上限调整为 500', operator: '李娜', time: '2026-06-14 14:30:00' },
  { id: 3, type: 'delete', resource: 'ecs-test-02', detail: '释放测试环境虚拟机 ecs-test-02，已清理关联快照', operator: '王磊', time: '2026-06-13 11:00:00' },
  { id: 4, type: 'update', resource: 'api-gateway', detail: 'API网关 Kong 版本升级 3.3→3.4，新增限流插件', operator: '张伟', time: '2026-06-12 09:15:00' },
  { id: 5, type: 'create', resource: 'obs-log-archive', detail: '新建OBS桶 obs-log-archive，用于日志归档存储', operator: '李娜', time: '2026-06-11 16:45:00' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/resource_changes?sort=id&order=ASC')
    const json = await res.json()
    if (json.success && json.data?.length) {
      changes.value = json.data.map(item => ({
        id: item.id,
        type: item.type,
        resource: item.resource,
        detail: item.detail,
        operator: item.operator,
        time: item.time,
      }))
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})

const getChangeColor = (t) => ({ create: 'green', update: 'blue', delete: 'red' }[t] || 'gray')
const getChangeText = (t) => ({ create: '新增', update: '更新', delete: '删除' }[t] || t)
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }
.change-item { padding-bottom: 8px; }
.change-header { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; font-weight: 500; }
.change-action { font-size: 12px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.change-action.create { background: #f6ffed; color: #52c41a; }
.change-action.update { background: #e6f7ff; color: #1890ff; }
.change-action.delete { background: #fff1f0; color: #f5222d; }
.change-detail { font-size: 13px; color: var(--text-sec); margin-bottom: 4px; }
.change-meta { font-size: 12px; color: var(--text-ter); display: flex; gap: 16px; }

@media (max-width: 768px) {
  .page-view { padding: 16px; }
  .filter-bar { flex-wrap: wrap; }
  .filter-bar .ant-select { width: 100% !important; }
  .filter-bar .ant-picker { width: 100% !important; }
}
</style>
