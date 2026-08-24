<template>
  <div class="aiops-healing-records">
    <div class="aa-table-header">
      <span class="aa-table-title">自动修复记录 · 近7天</span>
      <router-link to="/alarm/current" class="aa-table-link">查看全部 <i class="fa-solid fa-arrow-right"></i></router-link>
    </div>
    <div class="smart-remed-list" v-if="records.length">
      <div v-for="(r, i) in records" :key="i" class="smart-remed-item" @click="$emit('record-click', r)">
        <span class="smart-remed-result" :class="'res-' + r.result">
          <i class="fa-solid" :class="r.result === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'"></i>
        </span>
        <div class="smart-remed-body">
          <div class="smart-remed-line1">
            <span class="smart-remed-node">{{ r.nodeLabel || r.resource || r.alert }}</span>
            <span class="smart-remed-action">{{ r.action }}</span>
            <span class="smart-remed-time">{{ r.time }}</span>
          </div>
          <div class="smart-remed-line2">{{ r.detail }}</div>
        </div>
        <span class="smart-item-arrow"><i class="fa-solid fa-angle-right"></i></span>
      </div>
    </div>
    <div v-else class="aa-empty-text" style="padding:24px">暂无自动修复记录</div>
  </div>
</template>

<script setup>
defineProps({
  records: { type: Array, default: () => [] },
})
defineEmits(['record-click'])
</script>

<style>
.aiops-healing-records .aa-table-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.aiops-healing-records .aa-table-title { font-size: 14px; font-weight: 600; color: #1A1A1A; display: flex; align-items: center; gap: 6px; }
.smart-remed-list { display: flex; flex-direction: column; gap: 8px; }
.smart-remed-item { display: flex; gap: 8px; align-items: flex-start; background: #fff; border: 1px solid #F0F0F0; border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: all 0.2s; }
.smart-remed-item:hover { border-color: #007DFF; box-shadow: 0 4px 12px rgba(0,125,255,0.12); }
.smart-remed-result { font-size: 14px; margin-top: 1px; flex-shrink: 0; }
.smart-remed-result.res-success { color: #07C160; }
.smart-remed-result.res-failed { color: #F5222D; }
.smart-remed-body { flex: 1; min-width: 0; }
.smart-remed-line1 { display: flex; align-items: center; gap: 8px; }
.smart-remed-node { font-size: 12px; font-weight: 600; color: #007DFF; }
.smart-remed-action { font-size: 11px; color: #007DFF; background: #F0F5FF; padding: 1px 6px; border-radius: 8px; }
.smart-remed-time { font-size: 11px; color: #BFBFBF; margin-left: auto; }
.smart-remed-line2 { font-size: 11px; color: #6B7280; margin-top: 3px; }
.smart-item-arrow { font-size: 12px; color: #BFBFBF; margin-top: 2px; }
.aa-table-link { font-size: 12px; color: #007DFF; cursor: pointer; text-decoration: none; }
.aa-table-link:hover { text-decoration: underline; }
</style>