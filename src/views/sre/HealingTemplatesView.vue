<template>
  <div class="page-view">
    <div class="page-header"><h3>自愈策略模板</h3></div>
    <div v-if="loading" style="text-align:center;margin:60px 0"><a-spin /></div>
    <template v-else>
      <div class="ic-filter-bar">
        <a-button type="primary" size="small"><i class="fa-solid fa-plus"></i> 新建模板</a-button>
        <a-input-search v-model:value="search" placeholder="搜索模板名称..." style="width:280px;margin-left:auto" allow-clear />
      </div>
      <div class="tmpl-grid">
        <div v-for="t in filtered" :key="t.id" class="tmpl-card">
          <div class="tmpl-head">
            <span class="tmpl-name">{{ t.name }}</span>
            <a-switch :checked="t.enabled" size="small" />
          </div>
          <div class="tmpl-trigger">触发条件: <code>{{ t.trigger }}</code></div>
          <div class="tmpl-steps">
            <span v-for="(s, i) in t.steps" :key="i" class="tmpl-step-tag" :class="'mode-' + s.mode">{{ s.name }}</span>
          </div>
          <div class="tmpl-footer">
            <span>执行 {{ t.execCount }} 次 · 成功率 {{ t.successRate }}%</span>
            <span v-if="t.lastExecutedAt" class="tmpl-last">最近 {{ t.lastExecutedAt.slice(5) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
const loading = ref(true)
const templates = ref([])
const search = ref('')
const filtered = computed(() => {
  if (!search.value) return templates.value
  const q = search.value.toLowerCase()
  return templates.value.filter(t => t.name.toLowerCase().includes(q))
})
onMounted(async () => {
  try {
    const res = await fetch('/api/sre/healing-templates')
    const json = await res.json()
    if (json.success) templates.value = json.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>

<style scoped>
.ic-filter-bar { display:flex;gap:8px;margin-bottom:16px;align-items:center; }
.tmpl-grid { display:flex;flex-direction:column;gap:10px; }
.tmpl-card { background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:14px 16px; }
.tmpl-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:6px; }
.tmpl-name { font-size:14px;font-weight:600;color:#1a1a1a; }
.tmpl-trigger { font-size:12px;color:#8c8c8c;margin-bottom:8px; }
.tmpl-trigger code { background:#f5f5f5;padding:1px 5px;border-radius:3px;font-size:11px; }
.tmpl-steps { display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px; }
.tmpl-step-tag { font-size:11px;padding:2px 8px;border-radius:4px;background:#f0f0f0;color:#666; }
.tmpl-step-tag.mode-auto { background:#e6f7ff;color:#096dd9; }
.tmpl-step-tag.mode-confirm { background:#fff7e6;color:#d46b08; }
.tmpl-step-tag.mode-manual { background:#fff1f0;color:#cf1322; }
.tmpl-footer { font-size:11px;color:#8c8c8c;display:flex;gap:16px; }
.tmpl-last { margin-left:auto; }
</style>