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
          <div class="change-header"><span class="change-action" :class="change.type">{{ getChangeText(change.type) }}</span><span>{{ change.resource }}</span></div>
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
const changes = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/resource_changes?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      changes.value = json.data.map(function(item) {
        return {
          id: item.id,
          type: item.type,
          resource: item.resource,
          detail: item.detail,
          operator: item.operator,
          time: item.time,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
const getChangeColor = (t) => ({ create: 'green', update: 'blue', delete: 'red' }[t])
const getChangeText = (t) => ({ create: '新增', update: '更新', delete: '删除' }[t])
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }
.change-item { padding-bottom: 8px; }
.change-header { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
.change-action { font-size: 12px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.change-action.create { background: #f6ffed; color: #52c41a; }
.change-action.update { background: #e6f7ff; color: #1890ff; }
.change-action.delete { background: #fff1f0; color: #f5222d; }
.change-detail { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.change-meta { font-size: 12px; color: var(--text-ter); display: flex; gap: 16px; }
</style>