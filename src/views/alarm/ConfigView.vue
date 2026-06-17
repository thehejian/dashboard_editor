<template>
  <div class="page-view">
    <div class="page-header">
      <h2>告警配置</h2>
      <a-button type="primary">新建规则</a-button>
    </div>
    <div class="rules-list">
      <div class="rule-item" v-for="rule in rules" :key="rule.id">
        <div class="rule-info">
          <div class="rule-name">{{ rule.name }}</div>
          <div class="rule-desc">{{ rule.description }}</div>
          <div class="rule-meta"><a-tag :color="getLevelColor(rule.level)">{{ getLevelText(rule.level) }}</a-tag><span>{{ rule.target }}</span></div>
        </div>
        <div class="rule-actions">
          <a-switch v-model:checked="rule.enabled" />
          <a-tooltip title="编辑"><button class="icon-btn"><i class="fa-solid fa-pen"></i></button></a-tooltip>
          <a-tooltip title="删除"><button class="icon-btn danger"><i class="fa-solid fa-trash"></i></button></a-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const rules = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/alert_rules?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      rules.value = json.data
    }
  } catch (e) {
    console.error('加载告警规则失败:', e)
  } finally {
    loading.value = false
  }
})

const getLevelColor = (l) => ({ critical: 'red', warning: 'orange', info: 'blue' }[l])
const getLevelText = (l) => ({ critical: '紧急', warning: '重要', info: '次要' }[l])
</script>

<style scoped>
.page-view { display: flex; flex-direction: column; padding: 16px 24px 0; height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-shrink: 0; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.rules-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; min-height: 0; padding-bottom: 16px; }
.rule-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #fff; border-radius: 8px; border: 1px solid var(--border); }
.rule-name { font-weight: 500; margin-bottom: 4px; }
.rule-desc { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.rule-meta { display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--text-secondary); }
.rule-actions { display: flex; gap: 12px; align-items: center; flex-shrink: 0; }
.icon-btn { width: 32px; height: 32px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 6px; }
.icon-btn:hover { background: var(--bg-sec); }
.icon-btn.danger:hover { color: #f5222d; }
</style>