<template>
  <div class="aiops-app-cards">
    <div class="aa-table-header">
      <span class="aa-table-title"><i class="fa-solid fa-server"></i> 需关注的应用 / 云服务</span>
      <div class="aa-table-actions">
        <span class="ab-badge ab-critical">严重 {{ counts.critical || 0 }}</span>
        <span class="ab-badge ab-warning">警告 {{ counts.warning || 0 }}</span>
      </div>
    </div>
    <div class="app-grid" v-if="apps.length">
      <div v-for="app in apps" :key="app.name" class="app-card" :class="'app-' + app.status" @click="$emit('app-click', app)">
        <div class="app-card-head">
          <div class="app-card-head-left">
            <span class="app-card-name">{{ app.name }}</span>
            <span v-if="app.isRoot" class="app-root-badge"><i class="fa-solid fa-circle-exclamation"></i> 根因</span>
          </div>
          <span class="app-card-type">{{ app.type }}</span>
        </div>
        <div class="app-card-main">
          <span class="app-card-score">{{ app.score }}</span>
          <span class="app-card-status">{{ { critical: '严重异常', warning: '需要关注', normal: '运行正常' }[app.status] }}</span>
        </div>
        <div class="app-card-faults" v-if="app.faultLabels?.length">
          <span v-for="f in app.faultLabels" :key="f.nodeId" class="app-fault-chip">{{ f.nodeLabel }}</span>
        </div>
      </div>
    </div>
    <div v-else class="aa-empty-text" style="padding:24px">暂无需关注的应用</div>
  </div>
</template>

<script setup>
defineProps({
  apps: { type: Array, default: () => [] },
  counts: { type: Object, default: () => ({ critical: 0, warning: 0 }) },
})
defineEmits(['app-click'])
</script>

<style>
.aiops-app-cards .aa-table-header { margin-bottom: 16px; }
.app-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; }
.app-card { border: 1px solid #E8E8E8; border-radius: 8px; padding: 10px 12px; cursor: pointer; transition: all 0.2s; }
.app-card:hover { border-color: #007DFF; box-shadow: 0 4px 12px rgba(0,125,255,0.12); transform: translateY(-2px); }
.app-card-head { display: flex; justify-content: space-between; align-items: center; }
.app-card-head-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.app-card-name { font-size: 13px; font-weight: 600; color: #1A1A1A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.app-card-type { font-size: 10px; color: #6B7280; background: #F5F5F5; padding: 1px 6px; border-radius: 8px; flex-shrink: 0; }
.app-card-main { display: flex; align-items: baseline; gap: 8px; }
.app-card-score { font-size: 22px; font-weight: 700; line-height: 1; }
.app-card-status { font-size: 11px; }
.app-card-faults { display: flex; flex-wrap: wrap; gap: 4px; min-height: 0; }
.app-fault-chip { font-size: 10px; color: #F5222D; background: #FFF1F0; padding: 1px 6px; border-radius: 8px; white-space: nowrap; }
.app-normal .app-card-score { color: #07C160; }
.app-normal .app-card-status { color: #07C160; }
.app-warning .app-card-score { color: #FF7D00; }
.app-warning .app-card-status { color: #FF7D00; }
.app-critical .app-card-score { color: #F5222D; }
.app-critical .app-card-status { color: #F5222D; }
.app-root-badge { font-size: 10px; color: #F5222D; background: #FFF1F0; padding: 1px 6px; border-radius: 8px; white-space: nowrap; }
.ab-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
.ab-critical { background: #FFF1F0; color: #F5222D; }
.ab-warning { background: #FFF7E6; color: #FA8C16; }
@media (max-width: 1200px) { .app-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 768px) { .app-grid { grid-template-columns: repeat(2, 1fr); } }
</style>