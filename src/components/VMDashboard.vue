<template>
  <div class="vm-dashboard">
    <div class="vm-toolbar">
      <div class="vm-toolbar-right">
        <a-dropdown :trigger="['click']" class="refresh-dropdown">
          <button class="header-btn refresh-btn">
            <i class="fa-solid fa-rotate" :class="{ spinning: loading }"></i>
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
        <p>点击"手动刷新"获取虚拟机数据</p>
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
        <div class="vm-card">
          <div class="card-hdr"><span>CPU 负载</span></div>
          <div class="cpu-grid">
            <div class="cpu-item"><div class="cpu-label">1 分钟</div><div class="cpu-value">{{ data.load_1min || '--' }}</div></div>
            <div class="cpu-item"><div class="cpu-label">5 分钟</div><div class="cpu-value">{{ data.load_5min || '--' }}</div></div>
            <div class="cpu-item"><div class="cpu-label">15 分钟</div><div class="cpu-value">{{ data.load_15min || '--' }}</div></div>
          </div>
        </div>
        <div class="vm-card">
          <div class="card-hdr"><span>内存使用</span></div>
          <div class="mem-progress">
            <div class="mem-stats">
              <span class="mem-stat"><span class="mem-stat-dot used"></span>已用 {{ fmtBytes(data.mem_used) }}</span>
              <span class="mem-stat"><span class="mem-stat-dot free"></span>空闲 {{ fmtBytes(data.mem_free) }}</span>
              <span class="mem-stat">总计 {{ fmtBytes(data.mem_total) }}</span>
            </div>
            <a-progress :percent="data.mem_usage_pct" :stroke-color="data.mem_usage_pct > 80 ? '#f5222d' : data.mem_usage_pct > 60 ? '#fa8c16' : '#52c41a'" :show-info="false" />
            <div class="mem-pct">{{ data.mem_usage_pct }}%</div>
          </div>
        </div>
        <div class="vm-card">
          <div class="card-hdr"><span>磁盘使用</span></div>
          <div class="disk-info">
            <div v-for="(disk, i) in data.disks || []" :key="i" class="disk-item">
              <div class="disk-row">
                <span class="disk-label">{{ disk.mounted }}</span>
                <span class="disk-pct">{{ disk.use_percent }}</span>
              </div>
              <a-progress :percent="parseFloat(disk.use_percent)" stroke-color="#1890ff" :show-info="false" />
            </div>
          </div>
          <div ref="diskRef" class="chart-box"></div>
        </div>
      </div>

      <div class="vm-row">
        <div class="vm-card">
          <div class="card-hdr"><span>CPU Top 5 进程</span></div>
          <div class="table-wrap">
            <table class="simple-table">
              <thead><tr><th>进程</th><th>CPU%</th></tr></thead>
              <tbody>
                <tr v-for="(p, i) in topCpu" :key="i">
                  <td class="td-ellipsis" :title="p.command">{{ p.command }}</td>
                  <td>{{ p.cpu }}%</td>
                </tr>
                <tr v-if="!topCpu.length"><td colspan="2" class="td-empty">无数据</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="vm-card">
          <div class="card-hdr"><span>内存 Top 5 进程</span></div>
          <div class="table-wrap">
            <table class="simple-table">
              <thead><tr><th>进程</th><th>MEM%</th></tr></thead>
              <tbody>
                <tr v-for="(p, i) in topMem" :key="i">
                  <td class="td-ellipsis" :title="p.command">{{ p.command }}</td>
                  <td>{{ p.mem }}%</td>
                </tr>
                <tr v-if="!topMem.length"><td colspan="2" class="td-empty">无数据</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="vm-card">
          <div class="card-hdr"><span>Docker 容器</span></div>
          <div class="table-wrap">
            <table class="simple-table">
              <thead><tr><th>名称</th><th>状态</th></tr></thead>
              <tbody>
                <tr v-for="(c, i) in dockerContainers" :key="i">
                  <td class="td-ellipsis" :title="c.name">{{ c.name }}</td>
                  <td><span class="status-dot" :class="c.status.includes('Up') ? 'green' : 'red'"></span>{{ c.status }}</td>
                </tr>
                <tr v-if="!dockerContainers.length"><td colspan="2" class="td-empty">{{ !data.docker_installed ? 'Docker 未安装' : '无运行容器' }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="vm-row vm-row-bottom">
        <div class="vm-card">
          <div class="card-hdr"><span>SSH 安全</span></div>
          <div class="ssh-grid">
            <div class="ssh-item"><span class="ssh-label">失败登录</span><span class="ssh-val danger">{{ data.ssh_failed_logins || 0 }} 次</span></div>
            <div class="ssh-item"><span class="ssh-label">成功登录</span><span class="ssh-val">{{ data.ssh_successful_logins || 0 }} 次</span></div>
            <div class="ssh-item"><span class="ssh-label">暴力破解 TOP</span></div>
          </div>
          <div class="table-wrap">
            <table class="simple-table">
              <thead><tr><th>IP</th><th>次数</th></tr></thead>
              <tbody>
                <tr v-for="(b, i) in bruteForceTop" :key="i">
                  <td>{{ b.ip }}</td><td>{{ b.count }} 次</td>
                </tr>
                <tr v-if="!bruteForceTop.length"><td colspan="2" class="td-empty">无暴力破解记录</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="vm-card">
          <div class="card-hdr"><span>系统评估</span></div>
          <div class="assess-grid">
            <div class="assess-item">
              <div class="assess-label">CPU 负载</div>
              <div class="assess-badge" :class="data.load_color?.toLowerCase()">{{ data.load_status || '--' }}</div>
              <div class="assess-detail">load/core = {{ data.load_threshold || '--' }}</div>
            </div>
            <div class="assess-item">
              <div class="assess-label">内存使用</div>
              <div class="assess-badge" :class="data.mem_color?.toLowerCase()">{{ data.mem_status || '--' }}</div>
              <div class="assess-detail">{{ data.mem_usage_pct || '--' }}%</div>
            </div>
          </div>
        </div>
        <div class="vm-card">
          <div class="card-hdr"><span>网络</span></div>
          <div class="net-grid">
            <div class="net-item"><span class="net-label">公网 IP</span><span class="net-val">{{ data.public_ip || '--' }}</span></div>
            <div class="net-item"><span class="net-label">监听端口</span><span class="net-val">{{ data.listen_ports || '--' }}</span></div>
            <div class="net-item"><span class="net-label">ESTABLISHED</span><span class="net-val">{{ data.established_count || 0 }}</span></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Chart } from '@antv/g2'

const data = ref(null)
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

const diskRef = ref(null)
let diskChart = null
let refreshTimer = null

function setRefreshRate(rate) {
  refreshRate.value = rate
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  if (rate !== '0') {
    refreshTimer = setInterval(refresh, parseInt(rate) * 1000)
  }
}

function fmtBytes(b) {
  if (!b || b === '0') return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = parseInt(b)
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return v.toFixed(1) + ' ' + units[i]
}

const summaryCards = computed(() => {
  const d = data.value
  if (!d) return []
  return [
    { label: '主机名', value: d.hostname || '--', icon: 'fa-solid fa-server', bg: 'linear-gradient(135deg, #1890ff, #096dd9)', color: '#1890ff', sub: d.public_ip || '' },
    { label: '运行时间', value: d.uptime || '--', icon: 'fa-solid fa-clock', bg: 'linear-gradient(135deg, #52c41a, #389e0d)', color: '#52c41a' },
    { label: 'CPU 核心', value: d.cpu_cores || '--', icon: 'fa-solid fa-microchip', bg: 'linear-gradient(135deg, #13c2c2, #08979c)', color: '#13c2c2' },
    { label: 'Docker 运行', value: d.docker_installed ? (d.docker_running ?? 0) : '未安装', icon: 'fa-brands fa-docker', bg: 'linear-gradient(135deg, #722ed1, #531dab)', color: '#722ed1' },
  ]
})

const topCpu = computed(() => {
  if (!data.value?.top_cpu_processes?.length) return []
  return data.value.top_cpu_processes.slice(0, 5)
})

const topMem = computed(() => {
  if (!data.value?.top_mem_processes?.length) return []
  return data.value.top_mem_processes.slice(0, 5)
})

const dockerContainers = computed(() => {
  if (!data.value?.docker_containers?.length) return []
  return data.value.docker_containers
})

const bruteForceTop = computed(() => {
  if (!data.value?.ssh_brute_force_top?.length) return []
  return data.value.ssh_brute_force_top
})

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/api/vm/sysinfo')
    const json = await res.json()
    if (json.success) {
      data.value = json.data
      lastRefresh.value = new Date().toLocaleString()
      nextTick(() => renderCharts())
    } else {
      error.value = json.error || '未知错误'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  renderDiskChart()
}

function renderDiskChart() {
  if (diskChart) { diskChart.destroy(); diskChart = null }
  if (!diskRef.value || !data.value?.disks?.length) return
  const disks = data.value.disks
  if (!disks.length) return
  diskChart = new Chart({ container: diskRef.value, autoFit: true, height: 160, padding: [8, 16, 16, 16] })
  diskChart.interval()
    .data(disks.map(d => ({ name: d.mounted, value: parseFloat(d.use_percent.replace('%', '')) })))
    .encode('x', 'name').encode('y', 'value').encode('color', 'name')
    .scale('color', { range: ['#1890ff', '#07C160', '#722ed1', '#13c2c2'] })
    .style('radius', [2, 2, 0, 0])
    .axis('y', { labelFormatter: (v) => v + '%' })
  diskChart.legend(false)
  diskChart.render()
}

onMounted(() => {
  refresh()
})

onBeforeUnmount(() => {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  if (diskChart) { diskChart.destroy(); diskChart = null }
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

.vm-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
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

.mem-progress { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
.mem-stats { display: flex; gap: 12px; font-size: 11px; color: #8c8c8c; flex-wrap: wrap; }
.mem-stat { display: flex; align-items: center; gap: 4px; }
.mem-stat-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.mem-stat-dot.used { background: #fa8c16; }
.mem-stat-dot.free { background: #52c41a; }
.mem-pct { font-size: 24px; font-weight: 700; color: #1a1a1a; text-align: center; }

.card-hdr {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}
.chart-box { width: 100%; height: 160px; }

.cpu-grid {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 12px 0;
}
.cpu-item { text-align: center; }
.cpu-label { font-size: 11px; color: #8c8c8c; margin-bottom: 4px; }
.cpu-value { font-size: 28px; font-weight: 700; color: #1890ff; }

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

.ssh-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.ssh-item { display: flex; justify-content: space-between; font-size: 12px; }
.ssh-label { color: #8c8c8c; }
.ssh-val { font-weight: 600; }
.ssh-val.danger { color: #f5222d; }

.assess-grid {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}
.assess-item { text-align: center; flex: 1; }
.assess-label { font-size: 11px; color: #8c8c8c; margin-bottom: 6px; }
.assess-badge {
  display: inline-block;
  padding: 3px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}
.assess-badge.green { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.assess-badge.yellow { background: #fffbe6; color: #faad14; border: 1px solid #ffe58f; }
.assess-badge.red { background: #fff1f0; color: #f5222d; border: 1px solid #ffa39e; }
.assess-detail { font-size: 11px; color: #8c8c8c; margin-top: 4px; }

.net-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 0;
}
.net-item { display: flex; flex-direction: column; gap: 2px; }
.net-label { font-size: 11px; color: #8c8c8c; }
.net-val { font-size: 13px; font-weight: 600; color: #1a1a1a; word-break: break-all; }

.last-refresh { font-size: 11px; color: #8c8c8c; white-space: nowrap; flex-shrink: 0; }

.disk-info { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
.disk-item { display: flex; flex-direction: column; gap: 2px; }
.disk-row { display: flex; justify-content: space-between; font-size: 11px; }
.disk-label { color: #1a1a1a; font-weight: 500; }
.disk-pct { color: #8c8c8c; }
</style>
