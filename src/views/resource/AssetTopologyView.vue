<template>
  <div class="page-view">
    <div class="page-header">
      <h2>资产拓扑</h2>
      <a-select v-model:value="topoType" style="width: 160px">
        <a-select-option value="physical">物理拓扑</a-select-option>
        <a-select-option value="service">服务拓扑</a-select-option>
      </a-select>
    </div>
    <div class="topology-canvas" ref="canvasRef">
      <div class="topology-node" style="top: 40px; left: 50%; transform: translateX(-50%);">
        <i class="fa-solid fa-network-wired"></i><span>核心交换机</span>
      </div>
      <div class="topology-node" style="top: 150px; left: 20%;">
        <i class="fa-solid fa-server"></i><span>Web服务器集群</span>
      </div>
      <div class="topology-node" style="top: 150px; left: 50%; transform: translateX(-50%);">
        <i class="fa-solid fa-server"></i><span>应用服务器</span>
      </div>
      <div class="topology-node" style="top: 150px; left: 80%; transform: translateX(-50%);">
        <i class="fa-solid fa-database"></i><span>数据库主库</span>
      </div>
      <div class="topology-node" style="top: 280px; left: 35%;">
        <i class="fa-solid fa-hard-drive"></i><span>NAS存储</span>
      </div>
      <div class="topology-node" style="top: 280px; left: 65%; transform: translateX(-50%);">
        <i class="fa-solid fa-cloud"></i><span>云服务网关</span>
      </div>
      <svg class="topology-lines" viewBox="0 0 800 400">
        <line x1="400" y1="80" x2="160" y2="150" stroke="#d9d9d9" stroke-width="2" />
        <line x1="400" y1="80" x2="400" y2="150" stroke="#d9d9d9" stroke-width="2" />
        <line x1="400" y1="80" x2="640" y2="150" stroke="#d9d9d9" stroke-width="2" />
        <line x1="160" y1="190" x2="280" y2="280" stroke="#d9d9d9" stroke-width="2" />
        <line x1="640" y1="190" x2="520" y2="280" stroke="#d9d9d9" stroke-width="2" />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const topoType = ref('physical')
const canvasRef = ref(null)
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.topology-canvas {
  height: 400px;
  background: var(--bg-card, var(--bg));
  border: 1px solid var(--border);
  border-radius: var(--rl);
  position: relative;
  overflow: hidden;
}
.topology-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.topology-node {
  position: absolute;
  padding: 12px 20px;
  background: var(--bg);
  border: 2px solid var(--border);
  border-radius: 8px;
  text-align: center;
  z-index: 1;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.topology-node:hover {
  border-color: var(--brand);
  box-shadow: var(--shadow-md);
}
.topology-node i {
  display: block;
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--brand);
}
.topology-node span {
  font-size: 12px;
  color: var(--text);
}

@media (max-width: 768px) {
  .page-view { padding: 16px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .page-header .ant-select { width: 100% !important; }
  .topology-canvas { height: 300px; }
  .topology-node { padding: 8px 12px; }
  .topology-node i { font-size: 18px; }
}
</style>
