<template>
  <div class="ctr-dashboard">
    <div class="ctr-toolbar">
      <div class="ctr-toolbar-right">
        <button class="header-btn refresh-btn" title="手动刷新" @click="refresh">
          <i class="fa-solid fa-rotate" :class="{ spinning: loading }"></i>
        </button>
        <a-dropdown :trigger="['click']" class="refresh-dropdown">
          <button class="header-btn refresh-btn">
            <i class="fa-regular fa-clock"></i>
            <span>{{ refreshRate === '0' ? '自动刷新' : refreshOptions.find(r => r.value === refreshRate)?.label }}</span>
          </button>
          <template #overlay>
            <a-menu>
              <a-menu-item v-for="opt in refreshOptions" :key="opt.value" @click="setRefreshRate(opt.value)">
                {{ opt.label }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <span v-if="lastRefresh" class="last-refresh">最后更新: {{ lastRefresh }}</span>
      </div>
    </div>

    <template v-if="error">
      <div class="error-banner">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>获取数据失败: {{ error }}</span>
        <button class="header-btn" @click="refresh">重试</button>
      </div>
    </template>

    <template v-if="!data && !loading && !error">
      <div class="empty-state">
        <i class="fa-brands fa-docker"></i>
        <p>点击"手动刷新"获取容器数据</p>
      </div>
    </template>

    <template v-if="data">
      <div v-for="dev in data.devices" :key="dev.id" class="dev-section">
        <div class="dev-header">
          <i class="fa-solid fa-server"></i>
          <span class="dev-name">{{ dev.name }}</span>
          <span class="dev-badge" :class="dev.status === 'online' ? 'online' : 'offline'">{{ dev.status === 'online' ? '在线' : '离线' }}</span>
          <span v-if="dev.public_url" class="dev-ip">{{ dev.public_url }}</span>
        </div>

        <div v-if="dev.status === 'online'" class="ctr-row">
          <div class="ctr-card summary-card">
            <div class="ctr-card-icon" style="background:linear-gradient(135deg,#722ed1,#531dab)"><i class="fa-brands fa-docker"></i></div>
            <div class="ctr-card-body">
              <div class="ctr-card-value" style="color:#722ed1">{{ dev.running_count }}<span class="ctr-card-slash">/{{ dev.container_count }}</span></div>
              <div class="ctr-card-label">容器运行</div>
            </div>
          </div>
          <div class="ctr-card summary-card">
            <div class="ctr-card-icon" style="background:linear-gradient(135deg,#13c2c2,#08979c)"><i class="fa-solid fa-microchip"></i></div>
            <div class="ctr-card-body">
              <div class="ctr-card-value" style="color:#13c2c2">{{ dev.total_cpu }}</div>
              <div class="ctr-card-label">CPU 核心</div>
            </div>
          </div>
          <div class="ctr-card summary-card">
            <div class="ctr-card-icon" style="background:linear-gradient(135deg,#fa8c16,#d46b08)"><i class="fa-solid fa-memory"></i></div>
            <div class="ctr-card-body">
              <div class="ctr-card-value" style="color:#fa8c16">{{ fmtBytes(dev.total_memory) }}</div>
              <div class="ctr-card-label">内存</div>
            </div>
          </div>
          <div class="ctr-card summary-card">
            <div class="ctr-card-icon" style="background:linear-gradient(135deg,#1890ff,#096dd9)"><i class="fa-solid fa-tag"></i></div>
            <div class="ctr-card-body">
              <div class="ctr-card-value" style="color:#1890ff;font-size:15px">{{ dev.docker_version }}</div>
              <div class="ctr-card-label">Docker 版本</div>
            </div>
          </div>
        </div>

        <div v-if="dev.status === 'offline'" class="offline-banner">
          <i class="fa-solid fa-plug-circle-xmark"></i>
          <span>设备离线，容器数据不可用</span>
        </div>

        <div v-if="dev.status === 'online'" class="ctr-card ctr-table-card">
          <div class="card-hdr"><span>容器列表</span></div>
          <div class="table-wrap">
            <table class="simple-table">
              <thead><tr><th>名称</th><th>镜像</th><th>状态</th><th>端口</th></tr></thead>
              <tbody>
                <tr v-for="(c, i) in dev.containers" :key="i">
                  <td class="td-ellipsis" :title="c.name">{{ c.name }}</td>
                  <td class="td-ellipsis" :title="c.image">{{ c.image || '--' }}</td>
                  <td><span class="status-dot" :class="c.state === 'running' ? 'green' : c.state === 'exited' ? 'red' : 'yellow'"></span>{{ c.status || c.state }}</td>
                  <td class="td-ellipsis" :title="c.ports">{{ c.ports || '--' }}</td>
                </tr>
                <tr v-if="!dev.containers.length"><td colspan="4" class="td-empty">无容器</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

let cache = null

const data = ref(cache)
const loading = ref(false)
const error = ref(null)
const lastRefresh = ref('')
const refreshRate = ref('0')

const refreshOptions = [
  { value: '0', label: '关闭' },
  { value: '30', label: '30秒' },
  { value: '60', label: '1分钟' },
  { value: '300', label: '5分钟' },
  { value: '900', label: '15分钟' },
  { value: '1800', label: '30分钟' },
]

let refreshTimer = null

function setRefreshRate(rate) {
  refreshRate.value = rate
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  if (rate !== '0') {
    refreshTimer = setInterval(refresh, parseInt(rate) * 1000)
  }
}

function fmtBytes(b) {
  if (!b || b === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = b
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return v.toFixed(i > 1 ? 1 : 0) + ' ' + units[i]
}

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/api/portainer/containers')
    const json = await res.json()
    if (json.success) {
      cache = json.data
      data.value = cache
      lastRefresh.value = new Date().toLocaleString()
    } else {
      error.value = json.error || '未知错误'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!cache) refresh()
})

onBeforeUnmount(() => {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
})
</script>

<style scoped>
.ctr-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 12px;
}
.ctr-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 0 4px;
}
.ctr-toolbar-right { display: flex; align-items: center; gap: 8px; }

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 8px;
  color: #cf1322;
  font-size: 13px;
}
.error-banner i { font-size: 16px; }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8c8c8c;
}
.empty-state i { font-size: 40px; margin-bottom: 12px; display: block; }
.empty-state p { font-size: 14px; margin: 0; }

.dev-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dev-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0 2px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  border-bottom: 1px solid #f0f0f0;
}
.dev-header i { color: #722ed1; font-size: 14px; }
.dev-name { color: #1a1a1a; }
.dev-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
}
.dev-badge.online { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.dev-badge.offline { background: #fff1f0; color: #f5222d; border: 1px solid #ffa39e; }
.dev-ip { font-size: 11px; color: #8c8c8c; font-weight: 400; }

.offline-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: #fafafa;
  border-radius: 8px;
  color: #8c8c8c;
  font-size: 13px;
}
.offline-banner i { font-size: 18px; color: #f5222d; }

.ctr-row {
  display: flex;
  gap: 10px;
}
.ctr-row > .ctr-card { flex: 1; min-width: 0; }

.ctr-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.ctr-table-card { padding: 10px 14px; }
.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}
.ctr-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ctr-card-icon i { font-size: 18px; color: #fff; }
.ctr-card-value { font-size: 20px; font-weight: 700; line-height: 1.2; }
.ctr-card-slash { font-size: 14px; font-weight: 400; color: #8c8c8c; }
.ctr-card-label { font-size: 11px; color: #8c8c8c; margin-top: 2px; }
.ctr-card-sub { font-size: 11px; color: #8c8c8c; margin-top: 2px; }

.card-hdr {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.table-wrap { overflow-y: auto; max-height: 280px; }
.simple-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.simple-table th {
  text-align: left;
  padding: 4px 6px;
  font-weight: 600;
  color: #8c8c8c;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}
.simple-table td { padding: 4px 6px; border-bottom: 1px solid #f5f5f5; color: #1a1a1a; }
.simple-table tbody tr:hover { background: #fafafa; }
.td-ellipsis { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-empty { color: #8c8c8c; text-align: center; padding: 12px !important; }

.status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; }
.status-dot.green { background: #52c41a; }
.status-dot.red { background: #f5222d; }
.status-dot.yellow { background: #faad14; }

.last-refresh { font-size: 11px; color: #8c8c8c; white-space: nowrap; flex-shrink: 0; }

@media (max-width: 768px) {
  .ctr-row { flex-direction: column; }
  .ctr-row:has(.summary-card) { flex-direction: row; flex-wrap: wrap; }
  .ctr-row .summary-card { width: calc(50% - 5px); flex: none; min-width: 0; }
  .ctr-card { padding: 12px 14px; }
  .summary-card { padding: 12px 14px; }
  .ctr-card-icon { width: 36px; height: 36px; }
  .ctr-card-icon i { font-size: 16px; }
  .ctr-card-value { font-size: 17px; }
  .table-wrap { overflow-x: auto; }
  .dev-header { flex-wrap: wrap; }
}
@media (max-width: 420px) {
  .ctr-row .summary-card { width: 100%; }
  .dev-ip { width: 100%; }
}
</style>