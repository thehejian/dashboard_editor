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
          <button class="icon-btn"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn danger"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const rules = ref([
  { id: 1, name: 'CPU告警', description: 'CPU使用率超过阈值时触发', level: 'critical', target: 'CPU使用率', condition: '> 90%', enabled: true },
  { id: 2, name: '内存告警', description: '内存使用率超过阈值时触发', level: 'warning', target: '内存使用率', condition: '> 80%', enabled: true },
])
const getLevelColor = (l) => ({ critical: 'red', warning: 'orange', info: 'blue' }[l])
const getLevelText = (l) => ({ critical: '紧急', warning: '重要', info: '次要' }[l])
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.rules-list { display: flex; flex-direction: column; gap: 12px; }
.rule-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-card); border-radius: 8px; }
.rule-name { font-weight: 500; margin-bottom: 4px; }
.rule-desc { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.rule-meta { display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--text-secondary); }
.rule-actions { display: flex; gap: 12px; align-items: center; }
.icon-btn { width: 32px; height: 32px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 6px; }
.icon-btn:hover { background: var(--bg-sec); }
.icon-btn.danger:hover { color: #f5222d; }
</style>