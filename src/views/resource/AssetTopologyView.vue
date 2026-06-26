<template>
  <div class="page-view">
    <div class="page-header">
      <h2>资产拓扑</h2>
      <a-select v-model:value="topoType" style="width: 160px">
        <a-select-option value="physical">物理拓扑</a-select-option>
        <a-select-option value="service">服务拓扑</a-select-option>
      </a-select>
    </div>
    <div class="topology-canvas">
      <div class="topology-node" style="top: 60px; left: 280px;"><i class="fa-solid fa-network-wired"></i><span>核心交换机</span></div>
      <div class="topology-node" style="top: 180px; left: 120px;"><i class="fa-solid fa-server"></i><span>服务器1</span></div>
      <div class="topology-node" style="top: 180px; left: 280px;"><i class="fa-solid fa-server"></i><span>服务器2</span></div>
      <div class="topology-node" style="top: 180px; left: 440px;"><i class="fa-solid fa-database"></i><span>数据库</span></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const topoType = ref('physical')
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.topology-canvas { height: 350px; background: var(--bg-card); border-radius: 8px; position: relative; }
.topology-node { position: absolute; padding: 12px 20px; background: var(--bg); border: 2px solid var(--border); border-radius: 8px; text-align: center; }
.topology-node i { display: block; font-size: 24px; margin-bottom: 8px; color: var(--brand); }
.topology-node span { font-size: 12px; }

@media (max-width: 768px) {
  .page-view { padding: 16px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .page-header .ant-select { width: 100% !important; }
  .topology-canvas { height: 250px; }
  .topology-node { padding: 8px 12px; }
  .topology-node i { font-size: 18px; }
}
</style>