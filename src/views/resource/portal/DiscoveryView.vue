<template>
  <div>
    <div class="page-header"><h3>资源发现</h3></div>

    <div class="section-card">
      <div class="section-title"><i class="fa-solid fa-plug"></i> 资源对接</div>
      <div class="integration-grid">
        <div v-for="item in integrations" :key="item.platform" class="integration-card">
          <div class="integration-header">
            <div class="integration-icon"><i :class="item.icon"></i></div>
            <div class="integration-name">{{ item.platform }}</div>
            <a-tag :color="item.connected ? 'success' : 'default'">{{ item.connected ? '已连接' : '未连接' }}</a-tag>
          </div>
          <div v-if="item.connected" class="integration-body">
            <div class="integration-row"><span class="label">账号</span><span>{{ item.account }}</span></div>
            <div class="integration-row"><span class="label">同步方式</span><span>{{ item.syncMethod }}</span></div>
            <div class="integration-row"><span class="label">最近同步</span><span>{{ item.lastSync }}</span></div>
            <div class="integration-row"><span class="label">资源数</span><span>{{ item.resourceCount }}</span></div>
          </div>
          <div v-else class="integration-body integration-empty">
            <a-button type="dashed" block><i class="fa-solid fa-plus"></i> 配置对接</a-button>
          </div>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title"><i class="fa-solid fa-ghost"></i> 未纳管资源扫描</div>
      <div class="scan-bar">
        <a-button type="primary" @click="doScan" :loading="scanning"><i class="fa-solid fa-radar"></i> 扫描影子资源</a-button>
        <span class="scan-hint">自动对比云厂商API真实资源与平台已纳管资源</span>
      </div>
      <a-table :columns="columns" :data-source="shadowResources" :pagination="{ pageSize: 10 }" row-key="id" :loading="scanning">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small">一键纳管</a-button>
            <a-button type="link" size="small">自动打标</a-button>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const scanning = ref(false)

const integrations = ref([
  { platform: '华为云', icon: 'fa-solid fa-cloud', connected: true, account: 'hw-ops-01', syncMethod: '实时回调', lastSync: '2026-06-15 10:30', resourceCount: 1245 },
  { platform: 'AWS', icon: 'fa-solid fa-cloud', connected: true, account: 'aws-prod', syncMethod: '定时同步', lastSync: '2026-06-15 08:00', resourceCount: 856 },
  { platform: '阿里云', icon: 'fa-solid fa-cloud', connected: false },
  { platform: 'VMware', icon: 'fa-solid fa-server', connected: false },
])

const shadowResources = ref([
  { id: 1, name: 'unknown-vm-01', ip: '10.0.5.99', type: '云VM', vendor: '华为云', region: '华北一', reason: '未录入CMDB' },
  { id: 2, name: 'orphan-ebs-03', ip: '--', type: '云硬盘', vendor: 'AWS', region: 'us-east-1', reason: '无挂载实例' },
  { id: 3, name: 'stale-ecs-07', ip: '10.0.3.45', type: '云VM', vendor: '阿里云', region: '华东一', reason: '标签缺失' },
])

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: 'IP', dataIndex: 'ip' },
  { title: '类型', dataIndex: 'type' },
  { title: '厂商', dataIndex: 'vendor' },
  { title: '区域', dataIndex: 'region' },
  { title: '原因', dataIndex: 'reason' },
  { title: '操作', key: 'action', width: 180 },
]

function doScan() {
  scanning.value = true
  setTimeout(() => { scanning.value = false }, 2000)
}
</script>

<style scoped>
.section-card { background: var(--bg); border: 1px solid var(--border); border-radius: var(--rl); padding: 20px; margin-bottom: 20px; }
.section-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.section-title i { color: var(--brand); }

.integration-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.integration-card { background: var(--bg-sec); border: 1px solid var(--border); border-radius: var(--rl); padding: 16px; }
.integration-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.integration-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--brand-subtle); display: flex; align-items: center; justify-content: center; color: var(--brand); font-size: 16px; }
.integration-name { font-size: 14px; font-weight: 600; color: var(--text); flex: 1; }
.integration-body { border-top: 1px solid var(--border); padding-top: 12px; }
.integration-row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: var(--text-sec); }
.integration-row .label { color: var(--text-ter); }
.integration-empty { display: flex; align-items: center; justify-content: center; min-height: 80px; }

.scan-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.scan-hint { font-size: 12px; color: var(--text-ter); }

@media (max-width: 768px) {
  .integration-grid { grid-template-columns: 1fr; }
}
</style>
