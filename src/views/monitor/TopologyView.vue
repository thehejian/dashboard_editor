<template>
  <div class="page-view">
    <div class="page-header">
      <h2>拓扑图</h2>
      <a-button-group>
        <a-button @click="zoom -= 0.1">放大</a-button>
        <a-button @click="zoom += 0.1">缩小</a-button>
        <a-button @click="zoom = 1">重置</a-button>
      </a-button-group>
    </div>
    <div class="topology-canvas">
      <div class="topology-container" :style="{ transform: `scale(${zoom})` }">
        <div class="node server" style="top: 60px; left: 280px;"><i class="fa-solid fa-server"></i><span>核心交换机</span></div>
        <div class="node server" style="top: 180px; left: 120px;"><i class="fa-solid fa-server"></i><span>Web服务器1</span></div>
        <div class="node server" style="top: 180px; left: 280px;"><i class="fa-solid fa-server"></i><span>Web服务器2</span></div>
        <div class="node database" style="top: 180px; left: 440px;"><i class="fa-solid fa-database"></i><span>数据库</span></div>
        <div class="node container" style="top: 300px; left: 200px;"><i class="fa-solid fa-box"></i><span>K8s集群</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const zoom = ref(1)
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.topology-canvas { height: 400px; background: var(--bg-card); border-radius: 8px; overflow: auto; }
.topology-container { position: relative; width: 600px; height: 400px; transform-origin: center; }
.node { position: absolute; padding: 12px 20px; background: var(--bg); border: 2px solid var(--border); border-radius: 8px; text-align: center; cursor: pointer; }
.node.server { border-left: 3px solid #1890ff; }
.node.database { border-left: 3px solid #52c41a; }
.node.container { border-left: 3px solid #722ed1; }
.node i { display: block; font-size: 24px; margin-bottom: 8px; color: var(--brand); }
.node span { font-size: 12px; }
</style>