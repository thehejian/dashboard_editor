<template>
  <div class="vm-dashboard">
    <div class="vm-toolbar">
      <div class="vm-toolbar-right">
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
        <i class="fa-solid fa-server"></i>
        <p>点击"手动刷新"获取 NAS 数据</p>
      </div>
    </template>

    <template v-if="data">
      <div class="vm-row">
        <div class="vm-card summary-card" v-for="s in summaryCards" :key="s.label">
          <div class="vm-card-icon" :style="{ background: s.bg }"><i :class="s.icon"></i></div>
          <div class="vm-card-body">
            <div class="vm-card-value" :style="{ color: s.color }">{{ s.value }}</div>
            <div class="vm-card-label">{{ s.label }}</div>
            <div v-if="s.sub" class="vm-card-sub">{{ s.sub }}</div>
          </div>
        </div>
      </div>

      <div class="vm-row">
        <div class="vm-card compact-card">
          <div class="card-hdr"><span>CPU 负载</span></div>
          <div class="cpu-grid">
            <div class="cpu-item"><div class="cpu-label">1 分钟</div><div class="cpu-value">{{ data.load_1min || '--' }}</div></div>
            <div class="cpu-item"><div class="cpu-label">5 分钟</div><div class="cpu-value">{{ data.load_5min || '--' }}</div></div>
            <div class="cpu-item"><div class="cpu-label">15 分钟</div><div class="cpu-value">{{ data.load_15min || '--' }}</div></div>
          </div>
        </div>
        <div class="vm-card compact-card">
          <div class="card-hdr"><span>内存使用</span></div>
          <div class="mem-progress">
            <div class="mem-stats">
              <span class="mem-stat"><span class="mem-stat-dot used"></span>已用 {{ fmtSize(data.mem_used) }}</span>
              <span class="mem-stat"><span class="mem-stat-dot free"></span>空闲 {{ fmtSize(data.mem_free) }}</span>
              <span class="mem-stat">总计 {{ fmtSize(data.mem_total) }}</span>
            </div>
            <a-progress :percent="data.mem_usage_pct" :stroke-color="data.mem_usage_pct > 80 ? '#f5222d' : data.mem_usage_pct > 60 ? '#fa8c16' : '#52c41a'" :show-info="false" />
            <div class="mem-pct">{{ data.mem_usage_pct }}%</div>
          </div>
        </div>
        <div class="vm-card compact-card" v-if="mainDisk">
          <div class="card-hdr"><span>{{ mainDisk.mounted }}</span></div>
          <div class="disk-info">
            <div class="disk-row">
              <span class="disk-label">已用 {{ mainDisk.used }}</span>
              <span class="disk-pct">{{ mainDisk.use_percent }}</span>
            </div>
            <a-progress :percent="mainDiskPct" :stroke-color="mainDiskPct > 80 ? '#f5222d' : mainDiskPct > 60 ? '#fa8c16' : '#1890ff'" :show-info="false" />
          </div>
        </div>
      </div>

      <div class="vm-row">
        <div class="vm-card">
          <div class="card-hdr"><span>Docker 容器</span></div>
          <div class="table-wrap">
            <table class="simple-table">
              <thead><tr><th>名称</th><th>状态</th><th>端口</th></tr></thead>
              <tbody>
                <tr v-for="(c, i) in dockerContainers" :key="i">
                  <td class="td-ellipsis" :title="c.name">{{ c.name }}</td>
                  <td><span class="status-dot" :class="c.status.includes('Up') ? 'green' : 'red'"></span>{{ c.status }}</td>
                  <td class="td-ellipsis" :title="c.ports">{{ c.ports || '--' }}</td>
                </tr>
                <tr v-if="!dockerContainers.length"><td colspan="3" class="td-empty">{{ data.docker_installed ? '无运行容器' : 'Docker 未安装' }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="vm-card">
          <div class="card-hdr"><span>容器内存</span></div>
          <div class="table-wrap">
            <table class="simple-table">
              <thead><tr><th>名称</th><th>内存</th><th>占比</th></tr></thead>
              <tbody>
                <tr v-for="(c, i) in dockerMemory" :key="i">
                  <td class="td-ellipsis" :title="c.name">{{ c.name }}</td>
                  <td>{{ c.mem_usage }}</td>
                  <td>{{ c.mem_perc }}</td>
                </tr>
                <tr v-if="!dockerMemory.length"><td colspan="3" class="td-empty">无数据</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="vm-card">
          <div class="card-hdr"><span>TOP 内存进程</span></div>
          <div class="table-wrap">
            <table class="simple-table">
              <thead><tr><th>PID</th><th>RSS</th><th>占比</th><th>命令</th></tr></thead>
              <tbody>
                <tr v-for="(p, i) in topMem" :key="i">
                  <td>{{ p.pid }}</td>
                  <td>{{ p.rss }}</td>
                  <td>{{ p.mem_perc }}</td>
                  <td class="td-ellipsis" :title="p.command">{{ p.command }}</td>
                </tr>
                <tr v-if="!topMem.length"><td colspan="4" class="td-empty">无数据</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="vm-row vm-row-bottom">
        <div class="vm-card">
          <div class="card-hdr"><span>存储详情</span></div>
          <div class="disk-list">
            <div class="disk-item" v-for="(d, i) in data.disks" :key="i">
              <div class="disk-row">
                <span class="disk-label">{{ d.mounted }}</span>
                <span class="disk-pct">{{ d.used }}/{{ d.size }} ({{ d.use_percent }})</span>
              </div>
              <a-progress :percent="parseFloat(d.use_percent)" :stroke-color="parseFloat(d.use_percent) > 80 ? '#f5222d' : parseFloat(d.use_percent) > 60 ? '#fa8c16' : '#1890ff'" :show-info="false" />
            </div>
          </div>
        </div>
        <div class="vm-card">
          <div class="card-hdr"><span>共享文件夹</span></div>
          <div class="shared-list">
            <div class="shared-item" v-if="shares">
              <div class="shared-name"><i class="fa-solid fa-folder"></i> Public</div>
              <div class="shared-row">
                <span class="shared-label">已用</span>
                <span class="shared-val">{{ shares.public || '--' }}</span>
              </div>
              <div class="shared-row">
                <span class="shared-label">存储池</span>
                <span class="shared-val">cachedev2: {{ shares.cachedev2?.used || '--' }}/{{ shares.cachedev2?.size || '--' }} ({{ shares.cachedev2?.pct || '--' }})</span>
              </div>
            </div>
            <div class="shared-divider"></div>
            <div class="shared-item">
              <div class="shared-name"><i class="fa-solid fa-folder"></i> Public02</div>
              <div class="shared-row">
                <span class="shared-label">存储池</span>
                <span class="shared-val">cachedev1: {{ shares.cachedev1?.used || '--' }}/{{ shares.cachedev1?.size || '--' }} ({{ shares.cachedev1?.pct || '--' }})</span>
              </div>
            </div>
          </div>
        </div>
        <div class="vm-card assess-card">
          <div class="card-hdr"><span>系统评估</span></div>
          <div class="assess-grid">
            <div class="assess-item">
              <div class="assess-label">内存使用</div>
              <div class="assess-badge" :class="memColor">{{ memStatus }}</div>
              <div class="assess-detail">{{ data.mem_usage_pct }}%</div>
            </div>
            <div class="assess-item">
              <div class="assess-label">存储 (/mnt/ext)</div>
              <div class="assess-badge" :class="diskColor">{{ diskStatus }}</div>
              <div class="assess-detail">{{ mainDisk?.use_percent || '--' }}</div>
            </div>
          </div>
        </div>
        <div class="vm-card">
          <div class="card-hdr"><span>固件信息</span></div>
          <div class="firmware-grid">
            <div class="fw-item"><span class="fw-label">型号</span><span class="fw-val">{{ data.model || '--' }}</span></div>
            <div class="fw-item"><span class="fw-label">固件</span><span class="fw-val">{{ data.firmware_version || '--' }}</span></div>
            <div class="fw-item"><span class="fw-label">Build</span><span class="fw-val">{{ data.firmware_build || '--' }}</span></div>
            <div class="fw-item"><span class="fw-label">主机名</span><span class="fw-val">{{ data.hostname || '--' }}</span></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

let nasDataCache = null

const data = ref(nasDataCache)
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

function fmtSize(gb) {
  if (gb == null || gb === '') return '--'
  const v = parseFloat(gb)
  if (v >= 1024) return (v / 1024).toFixed(1) + ' TB'
  return v.toFixed(1) + ' GB'
}

const summaryCards = computed(() => {
  const d = data.value
  if (!d) return []
  return [
    { label: 'NAS 型号', value: d.model || '--', icon: 'fa-solid fa-server', bg: 'linear-gradient(135deg, #1890ff, #096dd9)', color: '#1890ff', sub: d.hostname || '' },
    { label: '运行时间', value: d.uptime || '--', icon: 'fa-solid fa-clock', bg: 'linear-gradient(135deg, #52c41a, #389e0d)', color: '#52c41a' },
    { label: 'CPU 负载', value: d.load_1min || '--', icon: 'fa-solid fa-microchip', bg: 'linear-gradient(135deg, #13c2c2, #08979c)', color: '#13c2c2' },
    { label: '容器运行', value: d.docker_installed ? (d.docker_running + '/' + d.docker_total) : '未安装', icon: 'fa-brands fa-docker', bg: 'linear-gradient(135deg, #722ed1, #531dab)', color: '#722ed1' },
  ]
})

const mainDisk = computed(() => {
  if (!data.value?.disks?.length) return null
  return data.value.disks[0]
})

const mainDiskPct = computed(() => {
  if (!mainDisk.value) return 0
  return parseFloat(mainDisk.value.use_percent)
})

const dockerContainers = computed(() => {
  if (!data.value?.docker_containers?.length) return []
  return [...data.value.docker_containers].sort((a, b) => {
    const aUp = a.status.toLowerCase().includes('up') ? 0 : 1
    const bUp = b.status.toLowerCase().includes('up') ? 0 : 1
    return aUp - bUp
  })
})

const dockerMemory = computed(() => {
  if (!data.value?.docker_memory?.length) return []
  return data.value.docker_memory
})

const topMem = computed(() => {
  if (!data.value?.top_mem_processes?.length) return []
  return data.value.top_mem_processes
})

const memPct = computed(() => data.value?.mem_usage_pct || 0)
const memColor = computed(() => memPct.value > 80 ? 'red' : memPct.value > 60 ? 'yellow' : 'green')
const memStatus = computed(() => memPct.value > 80 ? '危险' : memPct.value > 60 ? '警告' : '正常')

const diskPct = computed(() => mainDiskPct.value)
const diskColor = computed(() => diskPct.value > 80 ? 'red' : diskPct.value > 60 ? 'yellow' : 'green')
const diskStatus = computed(() => diskPct.value > 80 ? '危险' : diskPct.value > 60 ? '警告' : '正常')

const shares = computed(() => data.value?.shares || null)

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/api/nas/sysinfo')
    const json = await res.json()
    if (json.success) {
      nasDataCache = json.data
      data.value = nasDataCache
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
  if (!nasDataCache) refresh()
})

onBeforeUnmount(() => {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
})
</script>

<style scoped>
.vm-dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 12px;
}
.vm-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 0 4px;
}
.vm-toolbar-right { display: flex; align-items: center; gap: 8px; }
.vm-toolbar-right .refresh-dropdown { margin-left: 0; }

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

.vm-row {
  display: flex;
  gap: 12px;
}
.vm-row > .vm-card { flex: 1; min-width: 0; }
.vm-row-bottom { margin-top: 0; }

.vm-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.compact-card { padding: 10px 14px; }
.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
}
.vm-card-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.vm-card-icon i { font-size: 20px; color: #fff; }
.vm-card-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.vm-card-label { font-size: 12px; color: #8c8c8c; margin-top: 2px; }
.vm-card-sub { font-size: 11px; color: #8c8c8c; margin-top: 2px; }

.cpu-grid {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 4px 0;
}
.cpu-item { text-align: center; }
.cpu-label { font-size: 11px; color: #8c8c8c; margin-bottom: 2px; }
.cpu-value { font-size: 22px; font-weight: 700; color: #1890ff; }

.mem-progress { display: flex; flex-direction: column; gap: 4px; padding: 2px 0; }
.mem-stats { display: flex; gap: 10px; font-size: 11px; color: #8c8c8c; flex-wrap: wrap; }
.mem-stat { display: flex; align-items: center; gap: 3px; }
.mem-stat-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
.mem-stat-dot.used { background: #fa8c16; }
.mem-stat-dot.free { background: #52c41a; }
.mem-pct { font-size: 18px; font-weight: 700; color: #1a1a1a; text-align: center; }

.disk-info { display: flex; flex-direction: column; gap: 4px; }
.disk-row { display: flex; justify-content: space-between; font-size: 10px; }
.disk-label { color: #1a1a1a; font-weight: 500; }
.disk-pct { color: #8c8c8c; }

.card-hdr {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.table-wrap { overflow-y: auto; max-height: 180px; }
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
.td-ellipsis { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-empty { color: #8c8c8c; text-align: center; padding: 12px !important; }

.status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; }
.status-dot.green { background: #52c41a; }
.status-dot.red { background: #f5222d; }

.disk-list { display: flex; flex-direction: column; gap: 8px; }
.disk-item { display: flex; flex-direction: column; gap: 3px; }
.disk-item .disk-row { font-size: 11px; }

.assess-grid {
  display: flex;
  gap: 16px;
  padding-top: 24px;
}
.assess-card { display: flex; flex-direction: column; }
.assess-item { text-align: center; flex: 1; }
.assess-label { font-size: 13px; color: #8c8c8c; margin-bottom: 8px; }
.assess-badge {
  display: inline-block;
  padding: 6px 20px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
}
.assess-badge.green { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.assess-badge.yellow { background: #fffbe6; color: #faad14; border: 1px solid #ffe58f; }
.assess-badge.red { background: #fff1f0; color: #f5222d; border: 1px solid #ffa39e; }
.assess-detail { font-size: 11px; color: #8c8c8c; margin-top: 4px; }

.firmware-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 0;
}
.fw-item { display: flex; flex-direction: column; gap: 2px; }
.fw-label { font-size: 11px; color: #8c8c8c; }
.fw-val { font-size: 13px; font-weight: 600; color: #1a1a1a; word-break: break-all; }

.last-refresh { font-size: 11px; color: #8c8c8c; white-space: nowrap; flex-shrink: 0; }

.shared-list { display: flex; flex-direction: column; gap: 6px; }
.shared-item { display: flex; flex-direction: column; gap: 4px; }
.shared-name { font-size: 12px; font-weight: 600; color: #1a1a1a; display: flex; align-items: center; gap: 4px; }
.shared-name i { color: #1890ff; }
.shared-row { display: flex; justify-content: space-between; font-size: 11px; }
.shared-label { color: #8c8c8c; }
.shared-val { font-weight: 500; color: #1a1a1a; }
.shared-divider { height: 1px; background: #f0f0f0; margin: 2px 0; }

@media (max-width: 768px) {
  .vm-row { flex-direction: column; }
  .vm-row:has(.summary-card) { flex-direction: row; flex-wrap: wrap; }
  .vm-row .summary-card { width: calc(50% - 6px); flex: none; min-width: 0; }
  .vm-card { padding: 12px 14px; }
  .summary-card { padding: 14px 16px; }
  .vm-card-icon { width: 40px; height: 40px; }
  .vm-card-icon i { font-size: 16px; }
  .vm-card-value { font-size: 18px; }
  .table-wrap { overflow-x: auto; max-height: none; }
  .assess-grid { flex-wrap: wrap; gap: 8px; }
  .assess-item { flex: 1; min-width: 80px; }
}
@media (max-width: 420px) {
  .vm-row .summary-card { width: 100%; }
}
</style>