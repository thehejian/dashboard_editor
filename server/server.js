import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { exec } from 'child_process'
import cmdbRouter from './routes/cmdb.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// NOTE: 数据全部使用 mock（内存），无 PostgreSQL 连接。
// CMDB 数据见 server/db/mockData.js。

// ==================== VM Sysinfo ====================

const VM_CONFIG = {
  host: '8.147.132.193',
  port: 1222,
  user: 'root',
  password: 'Hjian!745544752',
}

let vmCache = { data: null, time: 0 }
const VM_CACHE_TTL = 60_000

app.get('/api/vm/sysinfo', async (req, res) => {
  // ... cached or fetch from VM
  const now = Date.now()
  if (vmCache.data && now - vmCache.time < VM_CACHE_TTL) {
    return res.json({ success: true, data: vmCache.data, cached: true })
  }

  const scriptPath = '/Users/mac/.qclaw/workspace/006-vm/sysinfo.sh'
  const sshBase = `/opt/homebrew/bin/sshpass -p '${VM_CONFIG.password}' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p ${VM_CONFIG.port} ${VM_CONFIG.user}@${VM_CONFIG.host}`

  const cmd = `${sshBase} 'cat > /root/sysinfo.sh && chmod +x /root/sysinfo.sh' < "${scriptPath}" && ${sshBase} 'bash /root/sysinfo.sh --json'`

  exec(cmd, { timeout: 20000, maxBuffer: 1024 * 1024 }, (err, stdout) => {
    if (err || !stdout.trim()) {
      const retry = `${sshBase} 'bash /root/sysinfo.sh --json'`
      exec(retry, { timeout: 15000 }, (err2, stdout2) => {
        if (err2 || !stdout2.trim()) {
          return res.json({ success: false, error: 'SSH 连接失败', detail: err2?.message || '无输出' })
        }
        try {
          const parsed = JSON.parse(stdout2)
          vmCache = { data: parsed, time: Date.now() }
          res.json({ success: true, data: parsed, cached: false })
        } catch { res.json({ success: false, error: '数据解析失败', raw: stdout2 }) }
      })
      return
    }
    try {
      const parsed = JSON.parse(stdout)
      vmCache = { data: parsed, time: Date.now() }
      res.json({ success: true, data: parsed, cached: false })
    } catch { res.json({ success: false, error: '数据解析失败', raw: stdout }) }
  })
})

// ==================== NAS Sysinfo ====================

const NAS_CONFIG = {
  host: '8.147.132.193',
  port: 62222,
  user: 'admin',
  password: 'Hjian!745544752',
}

const DOCKER_PATH = '/share/CACHEDEV2_DATA/.qpkg/container-station/usr/bin/.libs/docker'

let nasCache = { data: null, time: 0 }
const NAS_CACHE_TTL = 60_000

app.get('/api/nas/sysinfo', async (req, res) => {
  const now = Date.now()
  if (nasCache.data && now - nasCache.time < NAS_CACHE_TTL) {
    return res.json({ success: true, data: nasCache.data, cached: true })
  }

  const sshBase = `/opt/homebrew/bin/sshpass -p '${NAS_CONFIG.password}' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p ${NAS_CONFIG.port} ${NAS_CONFIG.user}@${NAS_CONFIG.host}`

  const cmd = `${sshBase} '
echo "===MEM==="
free -k
echo "===LOAD==="
cat /proc/loadavg
echo "===UPTIME==="
cat /proc/uptime
echo "===DF==="
df -h | grep -E "^(/dev|overlay|tmpfs)"
echo "===DOCKER_PS==="
'${DOCKER_PATH}' ps -a --format "{{.Names}}\\t{{.Status}}\\t{{.Ports}}" 2>/dev/null || echo "DOCKER_NA"
echo "===DOCKER_STATS==="
'${DOCKER_PATH}' stats --no-stream --format "{{.Name}}\\t{{.MemUsage}}\\t{{.MemPerc}}" 2>/dev/null || echo "DOCKER_NA"
echo "===TOP==="
ps -o pid,rss,args 2>/dev/null | tail -n +2 | sort -k2 -rn | head -12
echo "===SHARED==="
echo "PUBLIC_SIZE"
du -shL /share/Public 2>/dev/null
echo "CACHE1"
df -h /share/CACHEDEV1_DATA 2>/dev/null | tail -1
echo "CACHE2"
df -h /share/CACHEDEV2_DATA 2>/dev/null | tail -1
echo "===MODEL==="
getcfg System Model 2>/dev/null || echo "NA"
echo "===HOSTNAME==="
cat /etc/hostname 2>/dev/null || echo "NA"
echo "===FW_VER==="
getcfg System Version -f /etc/config/uLinux.conf 2>/dev/null || echo "NA"
echo "===FW_BUILD==="
getcfg System Build Number -f /etc/config/uLinux.conf 2>/dev/null || echo "NA"
'`

  exec(cmd, { timeout: 25000, maxBuffer: 1024 * 1024 }, (err, stdout) => {
    if (err || !stdout.trim()) {
      return res.json({ success: false, error: 'SSH 连接失败', detail: err?.message || '无输出' })
    }
    try {
      const parsed = parseNasOutput(stdout)
      if (!parsed) {
        return res.json({ success: false, error: '数据解析失败', raw: stdout.slice(0, 500) })
      }
      nasCache = { data: parsed, time: Date.now() }
      res.json({ success: true, data: parsed, cached: false })
    } catch (e) {
      res.json({ success: false, error: '解析异常: ' + e.message })
    }
  })
})

function parseNasOutput(text) {
  const sections = {}
  let current = null
  for (const line of text.split('\n')) {
    const m = line.match(/^===(.+)===/)
    if (m) { current = m[1]; sections[current] = []; continue }
    if (current) sections[current].push(line)
  }

  const getVal = (key) => (sections[key] || []).filter(l => l.trim()).join('\n').trim()

  // Memory
  const memLines = (sections['MEM'] || []).filter(l => l.includes('Mem:') || l.includes('Swap:'))
  let memTotal = 0, memUsed = 0, memFree = 0, memPct = 0, swapTotal = 0, swapUsed = 0
  for (const l of memLines) {
    if (l.startsWith('Mem:')) {
      const p = l.split(/\s+/)
      memTotal = Math.round(parseInt(p[1]) / 1024 / 1024 * 10) / 10
      memUsed = Math.round(parseInt(p[2]) / 1024 / 1024 * 10) / 10
      memFree = Math.round((parseInt(p[1]) - parseInt(p[2])) / 1024 / 1024 * 10) / 10
      memPct = Math.round(parseInt(p[2]) / parseInt(p[1]) * 100)
    }
    if (l.startsWith('Swap:')) {
      const p = l.split(/\s+/)
      swapTotal = Math.round(parseInt(p[1]) / 1024 / 1024 * 10) / 10
      swapUsed = Math.round(parseInt(p[2]) / 1024 / 1024 * 10) / 10
    }
  }

  // Load
  const loadStr = (getVal('LOAD') || '').split(/\s+/)
  const load1 = loadStr[0] || '--', load5 = loadStr[1] || '--', load15 = loadStr[2] || '--'

  // Uptime
  const uptimeSecs = parseFloat((getVal('UPTIME') || '0').split(/\s+/)[0])
  let uptime = '--'
  if (uptimeSecs) {
    const d = Math.floor(uptimeSecs / 86400), h = Math.floor((uptimeSecs % 86400) / 3600), m = Math.floor((uptimeSecs % 3600) / 60)
    uptime = (d > 0 ? d + '天, ' : '') + h + '小时, ' + m + '分钟'
  }

  // Disks - filter meaningful mounts, put critical ones first
  const IMPORTANT_MOUNTS = ['/mnt/ext', '/mnt/HDA_ROOT', '/share/CACHEDEV2_DATA', '/mnt/boot_config']
  const rawDisks = (sections['DF'] || []).filter(l => l.trim())
    .map(l => {
      const p = l.trim().split(/\s+/)
      if (p.length < 6) return null
      return { mounted: p[5] || p[0], size: p[1] || '--', used: p[2] || '--', use_percent: p[4] || '0%' }
    }).filter(Boolean)

  const importantDisks = rawDisks.filter(d => IMPORTANT_MOUNTS.some(m => d.mounted.startsWith(m)))
  const mergedDisks = []
  const seen = {}
  for (const d of rawDisks) {
    if (d.mounted.startsWith('/share/CACHEDEV2_DATA') && d.mounted.includes('overlay')) continue
    if (d.mounted.startsWith('/tmp') || d.mounted.startsWith('/dev/shm')) continue
    if (d.mounted.startsWith('/samba') || d.mounted.includes('msg.')) continue
    if (!seen[d.mounted]) { mergedDisks.push(d); seen[d.mounted] = true }
  }
  // Deduplicate
  const deduped = []
  const seen2 = {}
  for (const d of mergedDisks) {
    const key = d.mounted + d.size + d.use_percent
    if (!seen2[key]) { deduped.push(d); seen2[key] = true }
  }
  // Sort: critical first, then by mounted path
  const criticalOrder = ['/mnt/ext', '/mnt/HDA_ROOT', '/mnt/boot_config']
  deduped.sort((a, b) => {
    const ai = criticalOrder.indexOf(a.mounted)
    const bi = criticalOrder.indexOf(b.mounted)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.mounted.localeCompare(b.mounted)
  })
  const disks = deduped

  // Docker containers
  const dockerContainers = []
  if (getVal('DOCKER_PS') !== 'DOCKER_NA') {
    for (const l of (sections['DOCKER_PS'] || [])) {
      const p = l.trim().split('\t')
      if (p.length >= 2) dockerContainers.push({ name: p[0], status: p[1], ports: p[2] || '' })
    }
  }

  // Docker memory
  const dockerMemory = []
  if (getVal('DOCKER_STATS') !== 'DOCKER_NA') {
    for (const l of (sections['DOCKER_STATS'] || [])) {
      const p = l.trim().split('\t')
      if (p.length >= 2) dockerMemory.push({ name: p[0], mem_usage: p[1] || '--', mem_perc: p[2] || '--' })
    }
  }

  // Top processes (ps -o pid,rss,args, sorted by RSS desc)
  const memTotalKb = memTotal * 1024 * 1024
  const topMem = (sections['TOP'] || []).filter(l => l.trim() && !l.includes('PID'))
    .map(l => {
      const p = l.trim().split(/\s+/)
      if (p.length < 3 || !/^\d+$/.test(p[0])) return null
      const rssKb = parseInt(p[1]) || 0
      const rssFormatted = rssKb >= 1048576 ? (rssKb / 1048576).toFixed(1) + 'g' : rssKb >= 1024 ? (rssKb / 1024).toFixed(0) + 'm' : rssKb + 'k'
      const memPercStr = memTotalKb > 0 ? ((rssKb / memTotalKb) * 100).toFixed(1) + '%' : '--'
      return { pid: p[0], rss: rssFormatted, mem_perc: memPercStr, command: p.slice(2).join(' ') || '--' }
    }).filter(Boolean)

  // Shared folders
  const sharedLines = sections['SHARED'] || []
  let publicSize = '--', cachedev1Size = '--', cachedev1Used = '--', cachedev1Pct = '--', cachedev2Size = '--', cachedev2Used = '--', cachedev2Pct = '--'
  for (let i = 0; i < sharedLines.length; i++) {
    const t = sharedLines[i].trim()
    if (t === 'PUBLIC_SIZE') {
      const val = (sharedLines[i + 1] || '').trim().split(/\s+/)[0] || ''
      if (val && val !== '0') publicSize = val
      i++
    } else if (t === 'CACHE1') {
      const p = (sharedLines[i + 1] || '').trim().split(/\s+/)
      // df output: Size Used Avail Use% Mounted
      if (p.length >= 4) { cachedev1Size = p[0]; cachedev1Used = p[1]; cachedev1Pct = p[3]; }
      i++
    } else if (t === 'CACHE2') {
      const p = (sharedLines[i + 1] || '').trim().split(/\s+/)
      if (p.length >= 4) { cachedev2Size = p[0]; cachedev2Used = p[1]; cachedev2Pct = p[3]; }
      i++
    }
  }

  const dockerRunning = dockerContainers.filter(c => c.status.toLowerCase().includes('up')).length
  const dockerTotal = dockerContainers.length

  return {
    model: getVal('MODEL') || '--',
    hostname: getVal('HOSTNAME') || '--',
    firmware_version: getVal('FW_VER') || '--',
    firmware_build: getVal('FW_BUILD') || '--',
    uptime,
    load_1min: load1, load_5min: load5, load_15min: load15,
    mem_total: memTotal, mem_used: memUsed, mem_free: memFree,
    mem_usage_pct: memPct,
    swap_total: swapTotal, swap_used: swapUsed,
    disks,
    docker_installed: dockerContainers.length > 0 || getVal('DOCKER_PS') !== 'DOCKER_NA',
    docker_containers: dockerContainers,
    docker_memory: dockerMemory,
    docker_running: dockerRunning,
    docker_total: dockerTotal,
    top_mem_processes: topMem,
    shares: { public: publicSize, cachedev1: { size: cachedev1Size, used: cachedev1Used, pct: cachedev1Pct }, cachedev2: { size: cachedev2Size, used: cachedev2Used, pct: cachedev2Pct } },
  }
}

app.use('/api/cmdb', cmdbRouter)

// ==================== Portainer Container Proxy ====================

const PORTAINER_CONFIG = {
  url: 'http://8.147.132.193:9000',
  username: 'admin',
  password: 'Hjian!745544752',
}

let portainerCache = { data: null, time: 0 }
const PORTAINER_CACHE_TTL = 60_000

app.get('/api/portainer/containers', async (req, res) => {
  const now = Date.now()
  if (portainerCache.data && now - portainerCache.time < PORTAINER_CACHE_TTL) {
    return res.json({ success: true, data: portainerCache.data, cached: true })
  }

  try {
    const authRes = await fetch(`${PORTAINER_CONFIG.url}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: PORTAINER_CONFIG.username, password: PORTAINER_CONFIG.password }),
    })
    if (!authRes.ok) {
      return res.json({ success: false, error: 'Portainer 认证失败', status: authRes.status })
    }
    const { jwt } = await authRes.json()

    const endpointsRes = await fetch(`${PORTAINER_CONFIG.url}/api/endpoints`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    if (!endpointsRes.ok) {
      return res.json({ success: false, error: '获取端点列表失败', status: endpointsRes.status })
    }
    const endpoints = await endpointsRes.json()

    const devices = await Promise.all(endpoints.map(async (ep) => {
      const snapshot = ep.Snapshots?.[0]
      const device = {
        id: ep.Id,
        name: ep.Name,
        public_url: ep.PublicURL || '',
        status: ep.Status === 1 ? 'online' : 'offline',
        docker_version: snapshot?.DockerVersion || '--',
        total_cpu: snapshot?.TotalCPU || 0,
        total_memory: snapshot?.TotalMemory || 0,
        container_count: snapshot?.ContainerCount || 0,
        running_count: snapshot?.RunningContainerCount || 0,
        stopped_count: snapshot?.StoppedContainerCount || 0,
        healthy_count: snapshot?.HealthyContainerCount || 0,
        unhealthy_count: snapshot?.UnhealthyContainerCount || 0,
        containers: [],
      }

      if (ep.Status !== 1) return device

      try {
        const containersRes = await fetch(`${PORTAINER_CONFIG.url}/api/endpoints/${ep.Id}/docker/containers/json?all=true`, {
          headers: { Authorization: `Bearer ${jwt}` },
        })
        if (containersRes.ok) {
          const raw = await containersRes.json()
          if (Array.isArray(raw)) {
            device.containers = raw.map(c => {
              const ports = (c.Ports || []).filter(p => p.PublicPort).map(p => `${p.PublicPort}:${p.PrivatePort}/${p.Type}`)
              return {
                id: c.Id,
                name: (c.Names?.[0] || '').replace(/^\//, ''),
                image: c.Image || '',
                state: c.State || 'unknown',
                status: c.Status || '',
                ports: ports.join(', '),
                created: c.Created || 0,
                mem_usage: 0,
                mem_perc: '--',
              }
            })
            // Fetch memory stats for running containers
            const running = device.containers.filter(c => c.state === 'running')
            await Promise.all(running.map(async (c) => {
              try {
                const statsRes = await fetch(`${PORTAINER_CONFIG.url}/api/endpoints/${ep.Id}/docker/containers/${c.id}/stats?stream=false`, {
                  headers: { Authorization: `Bearer ${jwt}` },
                })
                if (statsRes.ok) {
                  const stats = await statsRes.json()
                  const usage = stats.memory_stats?.usage || 0
                  const limit = stats.memory_stats?.limit || 0
                  c.mem_usage = usage
                  c.mem_perc = limit > 0 ? ((usage / limit) * 100).toFixed(1) + '%' : '--'
                }
              } catch { }
            }))
          }
        }
      } catch { }

      return device
    }))

    const result = { devices }
    portainerCache = { data: result, time: Date.now() }
    res.json({ success: true, data: result, cached: false })
  } catch (e) {
    res.json({ success: false, error: 'Portainer 请求失败: ' + e.message })
  }
})

// ==================== Mock 故障模拟 ====================

const MOCK_ALERTS = [
  { id: 1, time: '14:22:30', node: 'prod-order-01', type: 'service', metric: 'CPU使用率', value: '97%', level: 'critical', summary: '订单服务-01 CPU 使用率 97%，持续 5 分钟', detail: 'prod-order-01 节点 CPU 使用率持续超过 95% 阈值，当前值 97%。该节点承载核心订单服务，建议立即排查。' },
  { id: 2, time: '14:23:15', node: 'prod-order-01', type: 'service', metric: '内存使用率', value: '94%', level: 'critical', summary: '订单服务-01 内存使用率 94%，接近 OOM', detail: 'prod-order-01 节点内存使用率 94%，JVM 堆内存接近上限，存在 OOM 风险。' },
  { id: 3, time: '14:24:00', node: 'prod-order-01', type: 'service', metric: '响应时间', value: '3200ms', level: 'critical', summary: '订单服务-01 响应时间 3200ms，远超 500ms 阈值', detail: 'prod-order-01 订单接口 P99 响应时间 3200ms，正常基线为 200ms。已影响上游 API Gateway 超时重试。' },
  { id: 4, time: '14:25:30', node: 'mysql-master', type: 'database', metric: 'IO等待', value: '65%', level: 'warning', summary: 'MySQL 主库 IO 等待 65%，性能下降', detail: 'mysql-master 节点磁盘 IO 等待 65%，大量慢查询堆积，导致复制延迟增大。' },
  { id: 5, time: '14:26:00', node: 'redis-cache', type: 'cache', metric: '命中率', value: '72%', level: 'warning', summary: 'Redis 缓存命中率降至 72%', detail: 'redis-cache 节点缓存命中率从基线 95% 降至 72%，大量请求穿透到数据库。' },
  { id: 6, time: '14:27:10', node: 'prod-inventory-01', type: 'service', metric: 'CPU使用率', value: '72%', level: 'warning', summary: '库存服务-01 CPU 使用率 72%，接近阈值', detail: 'prod-inventory-01 节点 CPU 使用率持续上升，可能受订单服务调用影响。' },
  { id: 7, time: '14:28:00', node: 'k8s-node-2', type: 'infra', metric: '内存使用率', value: '85%', level: 'warning', summary: 'K8s Node-2 内存使用率 85%', detail: 'k8s-node-2 节点内存使用率 85%，Pod 调度可能受影响。' },
  { id: 8, time: '14:29:15', node: 'lb-api', type: 'gateway', metric: '错误率', value: '2.3%', level: 'warning', summary: 'API Gateway 错误率 2.3%，上升明显', detail: 'lb-api 网关错误率从 0.1% 上升至 2.3%，主要为 504 超时错误。' },
]

function genHistory(base, current, points = 12) {
  const arr = []
  const step = (current - base) / points
  for (let i = 0; i < points; i++) {
    const t = Date.now() - (points - i) * 5 * 60000
    const noise = (Math.random() - 0.5) * Math.abs(base) * 0.08
    arr.push({ time: t, value: +(base + step * i + noise).toFixed(1), baseline: base })
  }
  return arr
}

const MOCK_TOPO_NODES = [
  // 接入层
  { id: 'cdn', label: 'CDN', type: 'access', status: 'normal', layer: 'access',
    metrics: { bandwidth: '2.4Gbps', hitRate: '94%' },
    baseline: { bandwidth: 2.0, hitRate: 95 },
    anomalyScore: 0, history: genHistory(2.0, 2.4), alertCount: 0 },
  { id: 'waf', label: 'WAF', type: 'security', status: 'normal', layer: 'access',
    metrics: { blocked: '1.2k/min', rules: 847 },
    baseline: { blocked: 800, rules: 847 },
    anomalyScore: 0, history: genHistory(800, 1200), alertCount: 0 },
  { id: 'slb', label: 'SLB', type: 'lb', status: 'normal', layer: 'access',
    metrics: { qps: '45k', connections: '12k' },
    baseline: { qps: 40000, connections: 10000 },
    anomalyScore: 0, history: genHistory(40000, 45000), alertCount: 0 },
  // 网关层
  { id: 'lb-api', label: 'API Gateway', type: 'gateway', status: 'warning', layer: 'gateway',
    metrics: { latency: '12ms', errorRate: '2.3%' },
    baseline: { latency: 8, errorRate: 0.1 },
    anomalyScore: 0.62, history: genHistory(8, 12), ip: '10.0.1.10', alertCount: 1 },
  // 服务层
  { id: 'prod-order-01', label: '订单服务-01', type: 'service', status: 'critical', layer: 'service',
    metrics: { cpu: '97%', memory: '94%', latency: '3200ms' },
    baseline: { cpu: 45, memory: 60, latency: 200 },
    anomalyScore: 0.95, history: genHistory(45, 97), ip: '10.0.2.10', alertCount: 3 },
  { id: 'prod-order-02', label: '订单服务-02', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '45%', memory: '62%', latency: '85ms' },
    baseline: { cpu: 42, memory: 58, latency: 80 },
    anomalyScore: 0.08, history: genHistory(42, 45), ip: '10.0.2.11', alertCount: 0 },
  { id: 'prod-order-03', label: '订单服务-03', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '42%', memory: '58%', latency: '80ms' },
    baseline: { cpu: 40, memory: 55, latency: 75 },
    anomalyScore: 0.05, history: genHistory(40, 42), ip: '10.0.2.12', alertCount: 0 },
  { id: 'prod-user-01', label: '用户服务-01', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '38%', memory: '55%', latency: '45ms' },
    baseline: { cpu: 35, memory: 50, latency: 40 },
    anomalyScore: 0.03, history: genHistory(35, 38), ip: '10.0.3.10', alertCount: 0 },
  { id: 'prod-user-02', label: '用户服务-02', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '35%', memory: '52%', latency: '42ms' },
    baseline: { cpu: 33, memory: 50, latency: 40 },
    anomalyScore: 0.02, history: genHistory(33, 35), ip: '10.0.3.11', alertCount: 0 },
  { id: 'prod-pay-01', label: '支付服务-01', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '32%', memory: '48%', latency: '120ms' },
    baseline: { cpu: 30, memory: 45, latency: 100 },
    anomalyScore: 0.04, history: genHistory(30, 32), ip: '10.0.4.10', alertCount: 0 },
  { id: 'prod-pay-02', label: '支付服务-02', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '30%', memory: '45%', latency: '115ms' },
    baseline: { cpu: 28, memory: 43, latency: 100 },
    anomalyScore: 0.03, history: genHistory(28, 30), ip: '10.0.4.11', alertCount: 0 },
  { id: 'prod-inventory-01', label: '库存服务-01', type: 'service', status: 'warning', layer: 'service',
    metrics: { cpu: '72%', memory: '68%', latency: '180ms' },
    baseline: { cpu: 40, memory: 55, latency: 60 },
    anomalyScore: 0.71, history: genHistory(40, 72), ip: '10.0.5.10', alertCount: 1 },
  // 中间件层
  { id: 'redis-cache', label: 'Redis Cluster', type: 'cache', status: 'warning', layer: 'middleware',
    metrics: { hitRate: '72%', memory: '78%', connections: '4.5k' },
    baseline: { hitRate: 95, memory: 55, connections: 3000 },
    anomalyScore: 0.82, history: genHistory(95, 72), ip: '10.0.6.10', alertCount: 1 },
  { id: 'mysql-master', label: 'MySQL主库', type: 'database', status: 'warning', layer: 'middleware',
    metrics: { qps: '8.5k', connections: '450', ioWait: '65%' },
    baseline: { qps: 6000, connections: 300, ioWait: 15 },
    anomalyScore: 0.68, history: genHistory(15, 65), ip: '10.0.6.20', alertCount: 1 },
  { id: 'mysql-slave', label: 'MySQL从库', type: 'database', status: 'normal', layer: 'middleware',
    metrics: { qps: '4.2k', connections: '200', replicationLag: '2s' },
    baseline: { qps: 4000, connections: 180, replicationLag: 0.5 },
    anomalyScore: 0.15, history: genHistory(4000, 4200), ip: '10.0.6.21', alertCount: 0 },
  { id: 'mongodb', label: 'MongoDB', type: 'database', status: 'normal', layer: 'middleware',
    metrics: { connections: '850', oplog: '12k', storage: '45%' },
    baseline: { connections: 800, oplog: 10000, storage: 40 },
    anomalyScore: 0.05, history: genHistory(800, 850), ip: '10.0.6.30', alertCount: 0 },
  { id: 'nacos', label: 'Nacos', type: 'service', status: 'normal', layer: 'middleware',
    metrics: { services: 42, instances: 128, configHits: '99.8%' },
    baseline: { services: 40, instances: 120, configHits: 99.9 },
    anomalyScore: 0.02, history: genHistory(40, 42), ip: '10.0.7.10', alertCount: 0 },
  { id: 'mq-order', label: 'RocketMQ', type: 'mq', status: 'normal', layer: 'middleware',
    metrics: { tps: '12k', backlog: '2.3k', consumers: 16 },
    baseline: { tps: 10000, backlog: 500, consumers: 16 },
    anomalyScore: 0.12, history: genHistory(500, 2300), ip: '10.0.7.20', alertCount: 0 },
  { id: 'es-cluster', label: 'Elasticsearch', type: 'search', status: 'normal', layer: 'middleware',
    metrics: { nodes: 3, indices: 28, queryRate: '5.2k' },
    baseline: { nodes: 3, indices: 25, queryRate: 5000 },
    anomalyScore: 0.04, history: genHistory(5000, 5200), ip: '10.0.7.30', alertCount: 0 },
  // 基础设施层
  { id: 'k8s-master', label: 'K8s Master', type: 'infra', status: 'normal', layer: 'infra',
    metrics: { cpu: '25%', memory: '40%', pods: 86 },
    baseline: { cpu: 20, memory: 35, pods: 80 },
    anomalyScore: 0.06, history: genHistory(20, 25), ip: '192.168.0.10', alertCount: 0 },
  { id: 'k8s-node-1', label: 'K8s Node-1', type: 'infra', status: 'normal', layer: 'infra',
    metrics: { cpu: '55%', memory: '68%', pods: 32 },
    baseline: { cpu: 50, memory: 60, pods: 30 },
    anomalyScore: 0.10, history: genHistory(50, 55), ip: '192.168.0.11', alertCount: 0 },
  { id: 'k8s-node-2', label: 'K8s Node-2', type: 'infra', status: 'warning', layer: 'infra',
    metrics: { cpu: '72%', memory: '85%', pods: 35 },
    baseline: { cpu: 50, memory: 60, pods: 30 },
    anomalyScore: 0.73, history: genHistory(60, 85), ip: '192.168.0.12', alertCount: 1 },
  { id: 'k8s-node-3', label: 'K8s Node-3', type: 'infra', status: 'normal', layer: 'infra',
    metrics: { cpu: '48%', memory: '58%', pods: 28 },
    baseline: { cpu: 50, memory: 60, pods: 30 },
    anomalyScore: 0.04, history: genHistory(50, 48), ip: '192.168.0.13', alertCount: 0 },
]

const MOCK_TOPO_NODES_INITIAL = JSON.parse(JSON.stringify(MOCK_TOPO_NODES))

function resetMockData() {
  MOCK_TOPO_NODES.length = 0
  MOCK_TOPO_NODES_INITIAL.forEach(n => MOCK_TOPO_NODES.push(JSON.parse(JSON.stringify(n))))
  FIX_HISTORY.length = 0
}

const MOCK_TOPO_EDGES = [
  { id: 'e-cdn-waf', source: 'cdn', target: 'waf' },
  { id: 'e-waf-slb', source: 'waf', target: 'slb' },
  { id: 'e-slb-gw', source: 'slb', target: 'lb-api' },
  { id: 'e-gw-order1', source: 'lb-api', target: 'prod-order-01' },
  { id: 'e-gw-order2', source: 'lb-api', target: 'prod-order-02' },
  { id: 'e-gw-order3', source: 'lb-api', target: 'prod-order-03' },
  { id: 'e-gw-user1', source: 'lb-api', target: 'prod-user-01' },
  { id: 'e-gw-user2', source: 'lb-api', target: 'prod-user-02' },
  { id: 'e-gw-pay1', source: 'lb-api', target: 'prod-pay-01' },
  { id: 'e-gw-pay2', source: 'lb-api', target: 'prod-pay-02' },
  { id: 'e-order1-inventory', source: 'prod-order-01', target: 'prod-inventory-01' },
  { id: 'e-order1-redis', source: 'prod-order-01', target: 'redis-cache' },
  { id: 'e-order2-redis', source: 'prod-order-02', target: 'redis-cache' },
  { id: 'e-order3-redis', source: 'prod-order-03', target: 'redis-cache' },
  { id: 'e-user1-redis', source: 'prod-user-01', target: 'redis-cache' },
  { id: 'e-user2-redis', source: 'prod-user-02', target: 'redis-cache' },
  { id: 'e-pay1-redis', source: 'prod-pay-01', target: 'redis-cache' },
  { id: 'e-pay2-redis', source: 'prod-pay-02', target: 'redis-cache' },
  { id: 'e-inventory-redis', source: 'prod-inventory-01', target: 'redis-cache' },
  { id: 'e-order1-mysql', source: 'prod-order-01', target: 'mysql-master' },
  { id: 'e-order2-mysql', source: 'prod-order-02', target: 'mysql-master' },
  { id: 'e-user1-mysql', source: 'prod-user-01', target: 'mysql-master' },
  { id: 'e-pay1-mysql', source: 'prod-pay-01', target: 'mysql-master' },
  { id: 'e-mysql-slave', source: 'mysql-master', target: 'mysql-slave' },
  { id: 'e-order1-mq', source: 'prod-order-01', target: 'mq-order' },
  { id: 'e-inventory-mq', source: 'prod-inventory-01', target: 'mq-order' },
  { id: 'e-order1-es', source: 'prod-order-01', target: 'es-cluster' },
  { id: 'e-order1-mongo', source: 'prod-order-01', target: 'mongodb' },
]

// 获取当前活跃告警列表
app.get('/api/mock/alerts', (req, res) => {
  res.json({ success: true, data: MOCK_ALERTS })
})

// 获取拓扑节点+边（含实时状态）
app.get('/api/mock/topology', (req, res) => {
  res.json({ success: true, data: { nodes: MOCK_TOPO_NODES, edges: MOCK_TOPO_EDGES } })
})

// 获取节点详细指标
app.get('/api/mock/node/:id/metrics', (req, res) => {
  const node = MOCK_TOPO_NODES.find(n => n.id === req.params.id)
  if (!node) return res.status(404).json({ success: false, message: '节点不存在' })

  const alerts = MOCK_ALERTS.filter(a => a.node === node.id)
  const incoming = MOCK_TOPO_EDGES.filter(e => e.target === node.id).map(e => e.source)
  const outgoing = MOCK_TOPO_EDGES.filter(e => e.source === node.id).map(e => e.target)

  res.json({
    success: true,
    data: {
      ...node,
      alerts,
      dependencies: { upstream: incoming, downstream: outgoing }
    }
  })
})

// 执行修复动作
const FIX_HISTORY = []
app.post('/api/mock/fix/:action', (req, res) => {
  const { action } = req.params
  const { nodeId } = req.body
  const node = MOCK_TOPO_NODES.find(n => n.id === nodeId)
  if (!node) return res.status(404).json({ success: false, message: '节点不存在' })

  const before = { ...node.metrics, status: node.status }

  const delays = { restart: 2500, scale: 2000, ratelimit: 1500, 'flush-cache': 1200 }
  setTimeout(() => {
    if (action === 'restart') {
      node.metrics = { cpu: '45%', memory: '62%', latency: '85ms' }
      node.status = 'normal'
    } else if (action === 'scale') {
      node.metrics = { cpu: '28%', memory: '45%', latency: '60ms' }
      node.status = 'normal'
    } else if (action === 'ratelimit') {
      node.metrics = { ...node.metrics, latency: '120ms' }
      if (node.type === 'gateway') node.status = 'normal'
    } else if (action === 'flush-cache') {
      node.metrics = { hitRate: '96%', memory: '65%', connections: '3.2k' }
      node.status = 'normal'
    }

    MOCK_TOPO_NODES.forEach(n => {
      if (n.status !== 'normal') {
        n.status = 'normal'
        if (n.metrics) {
          if (n.metrics.cpu) n.metrics.cpu = '45%'
          if (n.metrics.memory) n.metrics.memory = '62%'
          if (n.metrics.latency) n.metrics.latency = '85ms'
          if (n.metrics.connections) n.metrics.connections = '3.2k'
          if (n.metrics.hitRate) n.metrics.hitRate = '92%'
          if (n.metrics.qps) n.metrics.qps = '8.0k'
        }
      }
    })

    const record = { nodeId, action, before, after: { ...node.metrics, status: node.status }, timestamp: new Date().toISOString() }
    FIX_HISTORY.push(record)

    res.json({ success: true, data: record })
  }, delays[action] || 2000)
})

// 验证修复结果
app.get('/api/mock/verify/:nodeId', (req, res) => {
  const node = MOCK_TOPO_NODES.find(n => n.id === req.params.nodeId)
  if (!node) return res.status(404).json({ success: false, message: '节点不存在' })

  const lastFix = [...FIX_HISTORY].reverse().find(h => h.nodeId === req.params.nodeId)

  setTimeout(() => {
    res.json({
      success: true,
      data: {
        nodeId: node.id,
        status: node.status,
        metrics: { ...node.metrics },
        before: lastFix?.before || null,
        verifiedAt: new Date().toISOString()
      }
    })
  }, 1500)
})

// ==================== 智能检测 Mock ====================

const MOCK_INTELLIGENT_ALERTS = [
  { id: 'ia-001', nodeId: 'prod-order-01', nodeLabel: '订单服务-01', metric: 'CPU使用率',
    currentValue: 97, baseline: 45, deviation: 115, score: 0.95,
    level: 'critical', type: 'spike',
    time: '2026-07-10 14:22:30', status: 'active',
    detail: 'CPU从基线45%突增至97%，Z-Score=4.2，偏离度115%',
    evidence: { zScore: 4.2, ewmaSlope: 3.2, deviation: 115, historicalSimilarity: 0.87, duration: '13分钟', confidence: '极高' } },
  { id: 'ia-002', nodeId: 'prod-order-01', nodeLabel: '订单服务-01', metric: '内存使用率',
    currentValue: 94, baseline: 60, deviation: 56.7, score: 0.88,
    level: 'critical', type: 'spike',
    time: '2026-07-10 14:22:45', status: 'active',
    detail: '内存持续上升，EWMA斜率+3.2%/min，预测10分钟后达OOM阈值',
    evidence: { zScore: 3.8, ewmaSlope: 3.2, deviation: 56.7, historicalSimilarity: 0.72, duration: '13分钟', confidence: '高' } },
  { id: 'ia-003', nodeId: 'redis-cache', nodeLabel: 'Redis Cluster', metric: '命中率',
    currentValue: 72, baseline: 95, deviation: -24.2, score: 0.82,
    level: 'warning', type: 'drop',
    time: '2026-07-10 14:23:15', status: 'active',
    detail: '命中率从95%降至72%，大量请求穿透到数据库',
    evidence: { zScore: 2.5, ewmaSlope: -1.8, deviation: -24.2, historicalSimilarity: 0.65, duration: '12分钟', confidence: '中' } },
  { id: 'ia-004', nodeId: 'prod-inventory-01', nodeLabel: '库存服务-01', metric: 'CPU使用率',
    currentValue: 72, baseline: 40, deviation: 80, score: 0.71,
    level: 'warning', type: 'trend',
    time: '2026-07-10 14:24:00', status: 'active',
    detail: 'CPU呈持续上升趋势，EWMA斜率+1.8%/min，受上游订单服务调用影响',
    evidence: { zScore: 2.1, ewmaSlope: 1.8, deviation: 80, historicalSimilarity: 0.58, duration: '11分钟', confidence: '中' } },
  { id: 'ia-005', nodeId: 'mysql-master', nodeLabel: 'MySQL主库', metric: 'IO等待',
    currentValue: 65, baseline: 15, deviation: 333, score: 0.68,
    level: 'warning', type: 'spike',
    time: '2026-07-10 14:25:30', status: 'active',
    detail: 'IO等待从15%突增至65%，慢查询堆积导致复制延迟',
    evidence: { zScore: 3.1, ewmaSlope: 2.5, deviation: 333, historicalSimilarity: 0.62, duration: '10分钟', confidence: '中' } },
  { id: 'ia-006', nodeId: 'k8s-node-2', nodeLabel: 'K8s Node-2', metric: '内存使用率',
    currentValue: 85, baseline: 60, deviation: 41.7, score: 0.73,
    level: 'warning', type: 'trend',
    time: '2026-07-10 14:26:10', status: 'active',
    detail: '内存持续上升，Pod调度可能受影响',
    evidence: { zScore: 2.3, ewmaSlope: 1.5, deviation: 41.7, historicalSimilarity: 0.55, duration: '9分钟', confidence: '中' } },
  { id: 'ia-007', nodeId: 'lb-api', nodeLabel: 'API Gateway', metric: '错误率',
    currentValue: 2.3, baseline: 0.1, deviation: 2200, score: 0.62,
    level: 'warning', type: 'spike',
    time: '2026-07-10 14:27:00', status: 'active',
    detail: '5xx错误率从0.1%升至2.3%，主要为504超时，与订单服务异常关联',
    evidence: { zScore: 4.5, ewmaSlope: 0.8, deviation: 2200, historicalSimilarity: 0.6, duration: '8分钟', confidence: '中' } },
  { id: 'ia-008', nodeId: 'mq-order', nodeLabel: 'RocketMQ', metric: '积压量',
    currentValue: 2300, baseline: 500, deviation: 360, score: 0.55,
    level: 'info', type: 'trend',
    time: '2026-07-10 14:28:30', status: 'active',
    detail: '消息积压持续上升，消费者处理速度低于生产速度',
    evidence: null },
]

const MOCK_KPI_BASELINES = {
  anomalyCount: { value: 8, baseline: 5, trend: 60, trendText: '较昨日 +60%' },
  healthScore: { value: 87, baseline: 92, trend: -5.4, trendText: '较昨日 -5.4%' },
  predictedAlerts: { value: 3, baseline: 2, trend: 50, trendText: '较昨日 +50%' },
  autoRemediationRate: { value: 92, baseline: 85, trend: 8.2, trendText: '较昨日 +8.2%' },
}

const MOCK_APP_HEALTH = [
  { name: '订单服务', type: '应用', status: 'critical', score: 15, affectedUsers: 2300, affectedSessions: 2500, nodes: ['prod-order-01', 'lb-api', 'redis-cache'], history: [88,85,82,78,75,60,40,22,15] },
  { name: '支付服务', type: '应用', status: 'normal', score: 95, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [94,94,95,95,95,95,95,95,95] },
  { name: '用户服务', type: '应用', status: 'normal', score: 93, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [93,93,94,93,93,93,93,93,93] },
  { name: '库存服务', type: '应用', status: 'warning', score: 68, affectedUsers: 340, affectedSessions: 400, nodes: ['prod-inventory-01', 'mysql-master'], history: [90,88,85,80,76,72,70,68,68] },
  { name: 'MySQL 主库', type: '云服务', status: 'warning', score: 55, affectedUsers: 1200, affectedSessions: 1400, nodes: ['mysql-master'], history: [90,88,85,80,72,65,60,57,55] },
  { name: 'Redis 集群', type: '云服务', status: 'warning', score: 68, affectedUsers: 0, affectedSessions: 0, nodes: ['redis-cache'], history: [94,93,90,86,80,74,70,69,68] },
  { name: 'API 网关', type: '云服务', status: 'warning', score: 62, affectedUsers: 0, affectedSessions: 0, nodes: ['lb-api'], history: [92,90,86,80,74,68,65,63,62] },
  { name: 'K8s Node-2', type: '云服务', status: 'warning', score: 61, affectedUsers: 0, affectedSessions: 0, nodes: ['k8s-node-2'], history: [90,88,86,82,76,70,66,63,61] },
  { name: '商品服务', type: '应用', status: 'normal', score: 91, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [90,91,91,92,92,91,91,91,91] },
  { name: '搜索服务', type: '应用', status: 'normal', score: 90, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [89,90,90,90,90,91,90,90,90] },
  { name: '消息服务', type: '应用', status: 'normal', score: 88, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [87,88,88,89,88,88,88,88,88] },
  { name: '优惠券服务', type: '应用', status: 'normal', score: 94, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [93,93,94,94,94,94,94,94,94] },
  { name: '物流服务', type: '应用', status: 'normal', score: 92, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [91,92,92,92,92,92,92,92,92] },
  { name: '客服服务', type: '应用', status: 'normal', score: 96, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [95,95,96,96,96,96,96,96,96] },
  { name: '报表服务', type: '应用', status: 'warning', score: 72, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [88,86,84,80,76,74,73,72,72] },
  { name: '任务调度', type: '应用', status: 'normal', score: 89, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [88,89,89,89,89,89,89,89,89] },
  { name: 'PostgreSQL', type: '云服务', status: 'normal', score: 90, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [90,90,90,90,90,90,90,90,90] },
  { name: 'MongoDB', type: '云服务', status: 'normal', score: 92, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [91,92,92,92,92,92,92,92,92] },
  { name: 'Elasticsearch', type: '云服务', status: 'warning', score: 74, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [88,86,84,80,78,76,75,74,74] },
  { name: 'Kafka', type: '云服务', status: 'normal', score: 91, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [90,90,91,91,91,91,91,91,91] },
  { name: 'K8s Node-1', type: '云服务', status: 'normal', score: 93, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [92,92,93,93,93,93,93,93,93] },
  { name: 'K8s Node-3', type: '云服务', status: 'normal', score: 94, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [93,93,94,94,94,94,94,94,94] },
  { name: '对象存储', type: '云服务', status: 'normal', score: 97, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [96,96,97,97,97,97,97,97,97] },
  { name: 'CDN', type: '云服务', status: 'normal', score: 95, affectedUsers: 0, affectedSessions: 0, nodes: [], history: [94,94,95,95,95,95,95,95,95] },
]

const MOCK_RECOMMENDATIONS = [
  { id: 'rec-001', action: 'restart', label: '重启订单服务-01', desc: '预计恢复CPU至45%',
    icon: 'fa-solid fa-rotate-right', priority: 'urgent', targetNode: 'prod-order-01' },
  { id: 'rec-002', action: 'scale', label: '扩容订单服务实例', desc: '从3副本扩至5副本',
    icon: 'fa-solid fa-expand', priority: 'urgent', targetNode: 'prod-order-01' },
  { id: 'rec-003', action: 'ratelimit', label: '限流降级 API网关', desc: '保护下游服务',
    icon: 'fa-solid fa-gauge-high', priority: 'urgent', targetNode: 'lb-api' },
  { id: 'rec-004', action: 'view-topology', label: '查看拓扑影响范围', desc: '分析传播路径',
    icon: 'fa-solid fa-diagram-project', priority: 'diagnostic', targetNode: null },
  { id: 'rec-005', action: 'report', label: '生成故障处理报告', desc: '结构化报告含根因分析',
    icon: 'fa-solid fa-file-lines', priority: 'diagnostic', targetNode: null },
  { id: 'rec-006', action: 'restart', label: '重启MySQL主库', desc: '清除慢查询堆积',
    icon: 'fa-solid fa-rotate-right', priority: 'normal', targetNode: 'mysql-master' },
  { id: 'rec-007', action: 'view-baseline', label: '查看基线偏离详情', desc: '对比历史基线',
    icon: 'fa-solid fa-chart-line', priority: 'diagnostic', targetNode: null },
  { id: 'rec-008', action: 'flush-cache', label: '清除Redis缓存', desc: '重建缓存索引',
    icon: 'fa-solid fa-broom', priority: 'normal', targetNode: 'redis-cache' },
]

const MOCK_TREND_24H = [
  { hour: '00:00', critical: 0, warning: 2, info: 1 },
  { hour: '01:00', critical: 0, warning: 1, info: 0 },
  { hour: '02:00', critical: 0, warning: 1, info: 1 },
  { hour: '03:00', critical: 0, warning: 0, info: 0 },
  { hour: '04:00', critical: 0, warning: 1, info: 1 },
  { hour: '05:00', critical: 0, warning: 2, info: 1 },
  { hour: '06:00', critical: 1, warning: 3, info: 2 },
  { hour: '07:00', critical: 1, warning: 4, info: 3 },
  { hour: '08:00', critical: 2, warning: 6, info: 4 },
  { hour: '09:00', critical: 2, warning: 8, info: 5 },
  { hour: '10:00', critical: 3, warning: 7, info: 4 },
  { hour: '11:00', critical: 2, warning: 5, info: 3 },
  { hour: '12:00', critical: 1, warning: 3, info: 2 },
  { hour: '13:00', critical: 1, warning: 4, info: 3 },
  { hour: '14:00', critical: 5, warning: 12, info: 6 },
  { hour: '15:00', critical: 0, warning: 0, info: 0 },
  { hour: '16:00', critical: 0, warning: 0, info: 0 },
  { hour: '17:00', critical: 0, warning: 0, info: 0 },
  { hour: '18:00', critical: 0, warning: 0, info: 0 },
  { hour: '19:00', critical: 0, warning: 0, info: 0 },
  { hour: '20:00', critical: 0, warning: 0, info: 0 },
  { hour: '21:00', critical: 0, warning: 0, info: 0 },
  { hour: '22:00', critical: 0, warning: 0, info: 0 },
  { hour: '23:00', critical: 0, warning: 0, info: 0 },
]

// GET /api/intelligent/anomalies
app.get('/api/intelligent/anomalies', (req, res) => {
  const { nodeId } = req.query
  let alerts = MOCK_INTELLIGENT_ALERTS
  if (nodeId) alerts = alerts.filter(a => a.nodeId === nodeId)
  const summary = {
    total: alerts.length,
    critical: alerts.filter(a => a.level === 'critical').length,
    warning: alerts.filter(a => a.level === 'warning').length,
    info: alerts.filter(a => a.level === 'info').length,
  }
  res.json({ success: true, data: alerts, summary })
})

// GET /api/intelligent/health
app.get('/api/intelligent/health', (req, res) => {
  res.json({ success: true, data: {
    score: 87, apps: MOCK_APP_HEALTH, trend: -5.4,
    businessImpact: {
      affectedUsers: 2300,
      affectedSessions: 2500,
      affectedServices: 3,
    },
    kpiHistory: {
      anomalyCount: [2,3,1,4,5,3,6,8,7,5,4,3,2,4,6,8,10,12,8,6,5,3,2,1],
      healthScore: [93,92,91,90,89,88,87,86,85,86,87,87,88,88,87,86,85,84,85,86,87,87,87,87],
      predictedAlerts: [1,1,0,2,2,1,3,3,2,2,1,1,2,3,4,3,3,2,1,1,0,0,1,1],
      autoRemediationRate: [85,86,87,88,89,90,91,92,92,92,91,91,90,90,91,92,93,93,92,92,92,92,92,92],
    }
  }})
})

// GET /api/intelligent/predictions
app.get('/api/intelligent/predictions', (req, res) => {
  res.json({ success: true, data: { count: 3, items: [
    { nodeId: 'prod-order-01', nodeLabel: '订单服务-01', metric: 'CPU使用率', predicted: 99, confidence: 0.88, eta: '10分钟', level: 'critical', time: '14:22:00' },
    { nodeId: 'redis-cache', nodeLabel: 'Redis Cluster', metric: '命中率', predicted: 55, confidence: 0.75, eta: '25分钟', level: 'warning', time: '14:25:30' },
    { nodeId: 'mysql-master', nodeLabel: 'MySQL主库', metric: 'IO等待', predicted: 80, confidence: 0.65, eta: '45分钟', level: 'warning', time: '14:28:15' },
  ]}})
})

// GET /api/intelligent/remediation
app.get('/api/intelligent/remediation', (req, res) => {
  res.json({ success: true, data: { rate: 92, total: 8, success: 7, records: [
    { nodeId: 'prod-order-01', nodeLabel: '订单服务-01', action: '重启服务', time: '14:30', result: 'success', detail: 'CPU 97%→45%' },
    { nodeId: 'redis-cache', nodeLabel: 'Redis Cluster', action: '清理缓存', time: '14:28', result: 'success', detail: '命中率 72%→95%' },
    { nodeId: 'mysql-master', nodeLabel: 'MySQL主库', action: 'kill慢查询', time: '14:25', result: 'failed', detail: '需人工介入' },
  ]}})
})

// GET /api/intelligent/baseline/:metric
app.get('/api/intelligent/baseline/:metric', (req, res) => {
  const { metric } = req.params
  const { nodeId } = req.query
  const node = MOCK_TOPO_NODES.find(n => n.id === nodeId)
  if (!node) return res.status(404).json({ success: false, message: '节点不存在' })
  const baselineVal = node.baseline?.[metric]
  const history = node.history || []
  res.json({
    success: true,
    data: {
      metric,
      nodeId: node.id,
      baseline: baselineVal ?? null,
      current: node.metrics?.[metric] ?? null,
      history,
    }
  })
})

// POST /api/intelligent/detect
app.post('/api/intelligent/detect', (req, res) => {
  const anomalies = MOCK_TOPO_NODES
    .filter(n => n.anomalyScore > 0.1)
    .map(n => ({ nodeId: n.id, label: n.label, score: n.anomalyScore, status: n.status }))
    .sort((a, b) => b.score - a.score)
  res.json({ success: true, data: { anomalies, detectedAt: new Date().toISOString() } })
})

// GET /api/intelligent/trend
app.get('/api/intelligent/trend', (req, res) => {
  res.json({
    success: true, data: MOCK_TREND_24H,
    predicted: [
      { hour: '15:00', value: 3 }, { hour: '16:00', value: 2 },
      { hour: '17:00', value: 1 }, { hour: '18:00', value: 0 },
    ],
    events: [
      { hour: '14:00', label: '故障爆发', type: 'incident' },
      { hour: '08:30', label: '版本发布', type: 'deploy' },
      { hour: '12:00', label: '配置变更', type: 'config' },
    ],
  })
})

// GET /api/intelligent/golden-signals
app.get('/api/intelligent/golden-signals', (req, res) => {
  const { nodeId } = req.query
  const signalsByNode = {
    'prod-order-01': [
      { key: 'latency', label: '延迟', unit: 'ms', value: 3200, baseline: 200, deviation: 1500, icon: 'fa-solid fa-clock', status: 'critical', history: [180,195,210,3200,3100,3050,3000] },
      { key: 'traffic', label: '流量', unit: 'QPS', value: 12000, baseline: 8000, deviation: 50, icon: 'fa-solid fa-arrow-right-arrow-left', status: 'warning', history: [7500,7800,8200,11000,12000,11800,11500] },
      { key: 'errors', label: '错误率', unit: '%', value: 2.3, baseline: 0.1, deviation: 2200, icon: 'fa-solid fa-circle-exclamation', status: 'critical', history: [0.08,0.09,0.1,2.3,2.1,1.8,1.5] },
    ],
    'redis-cache': [
      { key: 'latency', label: '延迟', unit: 'ms', value: 45, baseline: 5, deviation: 800, icon: 'fa-solid fa-clock', status: 'warning', history: [3,4,5,38,42,45,43] },
      { key: 'traffic', label: '流量', unit: 'QPS', value: 15000, baseline: 12000, deviation: 25, icon: 'fa-solid fa-arrow-right-arrow-left', status: 'warning', history: [11000,11500,12000,14000,15000,14800,14500] },
      { key: 'errors', label: '错误率', unit: '%', value: 0.8, baseline: 0.05, deviation: 1500, icon: 'fa-solid fa-circle-exclamation', status: 'warning', history: [0.03,0.04,0.05,0.6,0.7,0.8,0.75] },
    ],
    'prod-inventory-01': [
      { key: 'latency', label: '延迟', unit: 'ms', value: 850, baseline: 120, deviation: 608, icon: 'fa-solid fa-clock', status: 'warning', history: [100,110,120,680,750,850,820] },
      { key: 'traffic', label: '流量', unit: 'QPS', value: 5500, baseline: 4000, deviation: 37, icon: 'fa-solid fa-arrow-right-arrow-left', status: 'normal', history: [3800,3900,4000,5000,5500,5300,5200] },
      { key: 'errors', label: '错误率', unit: '%', value: 0.3, baseline: 0.05, deviation: 500, icon: 'fa-solid fa-circle-exclamation', status: 'normal', history: [0.03,0.04,0.05,0.2,0.25,0.3,0.28] },
    ],
    'mysql-master': [
      { key: 'latency', label: '延迟', unit: 'ms', value: 580, baseline: 50, deviation: 1060, icon: 'fa-solid fa-clock', status: 'critical', history: [40,45,50,420,500,580,560] },
      { key: 'traffic', label: '流量', unit: 'QPS', value: 8000, baseline: 6000, deviation: 33, icon: 'fa-solid fa-arrow-right-arrow-left', status: 'warning', history: [5500,5800,6000,7200,8000,7800,7600] },
      { key: 'errors', label: '错误率', unit: '%', value: 1.2, baseline: 0.02, deviation: 5900, icon: 'fa-solid fa-circle-exclamation', status: 'critical', history: [0.01,0.01,0.02,0.8,1.0,1.2,1.1] },
    ],
    'k8s-node-2': [
      { key: 'latency', label: '延迟', unit: 'ms', value: 35, baseline: 10, deviation: 250, icon: 'fa-solid fa-clock', status: 'normal', history: [8,9,10,28,32,35,33] },
      { key: 'traffic', label: '流量', unit: 'QPS', value: 3000, baseline: 2500, deviation: 20, icon: 'fa-solid fa-arrow-right-arrow-left', status: 'normal', history: [2300,2400,2500,2800,3000,2900,2850] },
      { key: 'errors', label: '错误率', unit: '%', value: 0.1, baseline: 0.02, deviation: 400, icon: 'fa-solid fa-circle-exclamation', status: 'normal', history: [0.01,0.01,0.02,0.08,0.09,0.1,0.09] },
    ],
    'lb-api': [
      { key: 'latency', label: '延迟', unit: 'ms', value: 320, baseline: 30, deviation: 967, icon: 'fa-solid fa-clock', status: 'critical', history: [25,28,30,240,280,320,310] },
      { key: 'traffic', label: '流量', unit: 'QPS', value: 18000, baseline: 15000, deviation: 20, icon: 'fa-solid fa-arrow-right-arrow-left', status: 'normal', history: [14000,14500,15000,17000,18000,17500,17200] },
      { key: 'errors', label: '错误率', unit: '%', value: 2.3, baseline: 0.1, deviation: 2200, icon: 'fa-solid fa-circle-exclamation', status: 'critical', history: [0.08,0.09,0.1,1.8,2.0,2.3,2.2] },
    ],
  }
  if (nodeId) {
    const signals = signalsByNode[nodeId] || signalsByNode['prod-order-01']
    res.json({ success: true, data: { nodeId, signals } })
  } else {
    const all = Object.entries(signalsByNode).map(([id, signals]) => ({ nodeId: id, signals }))
    res.json({ success: true, data: { nodes: all } })
  }
})

// GET /api/intelligent/recommendations
app.get('/api/intelligent/recommendations', (req, res) => {
  const active = MOCK_INTELLIGENT_ALERTS.filter(a => a.status === 'active')
  const recs = []
  const confByScore = (s) => s >= 0.9 ? 92 + Math.round(Math.random() * 6) : s >= 0.7 ? 75 + Math.round(Math.random() * 13) : 60 + Math.round(Math.random() * 10)
  active.filter(a => a.level === 'critical').forEach(a => {
    recs.push({ id: 'rec-' + recs.length, action: 'restart', label: `重启${a.nodeLabel}`, desc: `${a.metric} ${a.currentValue}，偏离 +${a.deviation}%`, priority: 'urgent', targetNode: a.nodeId, confidence: confByScore(a.score) })
    recs.push({ id: 'rec-' + recs.length, action: 'scale', label: `扩容${a.nodeLabel}`, desc: '增加冗余分散负载', priority: 'urgent', targetNode: a.nodeId, confidence: confByScore(a.score) })
  })
  active.filter(a => a.level === 'warning').forEach(a => {
    recs.push({ id: 'rec-' + recs.length, action: 'restart', label: `检查${a.nodeLabel}`, desc: `${a.metric} ${a.currentValue}，偏离 +${a.deviation}%`, priority: 'normal', targetNode: a.nodeId, confidence: confByScore(a.score) })
  })
  recs.push({ id: 'rec-' + recs.length, action: 'view-topology', label: '查看拓扑影响范围', desc: '分析传播路径和受影响节点', priority: 'diagnostic', targetNode: null, confidence: 65 })
  recs.push({ id: 'rec-' + recs.length, action: 'report', label: '生成故障处理报告', desc: '结构化报告含根因分析和处理步骤', priority: 'diagnostic', targetNode: null, confidence: 72 })
  res.json({ success: true, data: recs.slice(0, 8) })
})

// ==================== 故障时间轴 Mock ====================

const MOCK_INCIDENT_TIMELINE = {
  incidentId: "inc-001",
  title: "订单服务-01 CPU异常故障传播",
  startTime: "14:22:30",
  endTime: "14:33:00",
  stages: [
    { id: "s1", time: "14:22:30", sort: 1, label: "CPU突增", desc: "prod-order-01 CPU从基线45%突增至97%，触发阈值告警", nodes: ["prod-order-01"], edges: [], type: "cause", severity: "critical", nodeMetrics: { "prod-order-01": { cpu: "97%", mem: "94%", latency: "3200ms", status: "critical" } } },
    { id: "s2", time: "14:23:00", sort: 2, label: "响应延迟", desc: "订单服务响应时间从200ms飙升至3200ms，请求开始堆积", nodes: ["prod-order-01"], edges: ["e-gw-order1"], type: "impact", severity: "critical", nodeMetrics: { "prod-order-01": { cpu: "97%", mem: "94%", latency: "3200ms", status: "critical" } } },
    { id: "s3", time: "14:23:30", sort: 3, label: "网关影响", desc: "lb-api 5xx错误率从0.1%升至2.3%，504超时增多", nodes: ["lb-api"], edges: ["e-slb-gw", "e-gw-order1"], type: "impact", severity: "warning", nodeMetrics: { "lb-api": { errRate: "2.3%", qps: "12k", latency: "320ms", status: "warning" } } },
    { id: "s4", time: "14:24:00", sort: 4, label: "数据库影响", desc: "mysql-master IO等待从15%升至65%，慢查询堆积", nodes: ["mysql-master"], edges: ["e-order1-mysql"], type: "impact", severity: "warning", nodeMetrics: { "mysql-master": { ioWait: "65%", connections: "450", status: "warning" } } },
    { id: "s5", time: "14:24:30", sort: 5, label: "缓存穿透", desc: "Redis命中率从95%降至72%，大量请求穿透到数据库", nodes: ["redis-cache"], edges: ["e-order1-redis"], type: "impact", severity: "warning", nodeMetrics: { "redis-cache": { hitRate: "72%", memory: "89%", status: "warning" } } },
    { id: "s6", time: "14:25:00", sort: 6, label: "业务受损", desc: "订单超时率>5%，部分用户下单失败，影响约2300请求", nodes: ["prod-order-01", "lb-api"], edges: ["e-slb-gw", "e-gw-order1", "e-order1-mysql", "e-order1-redis"], type: "business", severity: "critical", nodeMetrics: { "prod-order-01": { cpu: "97%", errRate: "5.2%", status: "critical" }, "lb-api": { errRate: "5.2%", status: "warning" } } },
    { id: "s7", time: "14:26:00", sort: 7, label: "AI检测", desc: "智能异常检测发现8条异常，prod-order-01得分0.95", nodes: ["prod-order-01", "lb-api", "mysql-master", "redis-cache"], edges: [], type: "detection", severity: "info", nodeMetrics: { "prod-order-01": { cpu: "97%", latency: "3200ms", errRate: "5.2%", status: "critical" }, "lb-api": { errRate: "2.3%", qps: "12k", status: "warning" }, "mysql-master": { ioWait: "65%", connections: "450", status: "warning" }, "redis-cache": { hitRate: "72%", memory: "89%", status: "warning" } } },
    { id: "s8", time: "14:27:00", sort: 8, label: "根因定位", desc: "AI拓扑分析确定根因为prod-order-01 CPU死循环/资源泄漏", nodes: ["prod-order-01"], edges: [], type: "diagnosis", severity: "info", nodeMetrics: { "prod-order-01": { cpu: "97%", status: "critical" } } },
    { id: "s9", time: "14:30:00", sort: 9, label: "执行重启", desc: "AI助手自动执行重启订单服务-01，耗时12s", nodes: ["prod-order-01"], edges: [], type: "action", severity: "info", nodeMetrics: {} },
    { id: "s10", time: "14:33:00", sort: 10, label: "服务恢复", desc: "CPU降至45%，响应时间85ms，所有指标回归基线", nodes: ["prod-order-01", "lb-api", "mysql-master", "redis-cache", "prod-inventory-01", "k8s-node-2"], edges: ["e-gw-order1", "e-order1-mysql", "e-order1-redis", "e-slb-gw"], type: "recovery", severity: "success", nodeMetrics: { "prod-order-01": { cpu: "45%", mem: "62%", latency: "85ms", status: "normal" }, "lb-api": { errRate: "0.1%", qps: "8k", status: "normal" }, "mysql-master": { ioWait: "15%", status: "normal" }, "redis-cache": { hitRate: "95%", status: "normal" }, "prod-inventory-01": { cpu: "32%", mem: "55%", status: "normal" }, "k8s-node-2": { cpu: "38%", mem: "48%", status: "normal" } } },
  ]
}

app.get('/api/intelligent/incident-timeline', (req, res) => {
  res.json({ success: true, data: MOCK_INCIDENT_TIMELINE })
})

// ==================== AI Model Connection Test (Mock) ====================

const AI_MODEL_GROUPS = [
  {
    provider: 'Agnes',
    tokenLabel: 'thehejian',
    models: ['agnes-2.0-flash', 'agnes-image-2.0-flash', 'agnes-image-2.1-flash', 'agnes-video-v2.0'],
  },
  {
    provider: 'Agnes',
    tokenLabel: 'Google',
    models: ['agnes-2.0-flash', 'agnes-image-2.0-flash', 'agnes-image-2.1-flash', 'agnes-video-v2.0'],
  },
  {
    provider: 'Agnes',
    tokenLabel: 'github',
    models: ['agnes-2.0-flash', 'agnes-image-2.0-flash', 'agnes-image-2.1-flash', 'agnes-video-v2.0'],
  },
  {
    provider: 'SenseNova',
    tokenLabel: null,
    models: ['sensenova-6.7-flash-lite', 'sensenova-u1-fast', 'deepseek-v4-flash'],
  },
  {
    provider: 'Zhipu GLM',
    tokenLabel: null,
    models: ['glm-4.7-flash'],
  },
]

const MOCK_MODEL_LATENCY = {
  'agnes-2.0-flash': 320,
  'agnes-image-2.0-flash': 680,
  'agnes-image-2.1-flash': 720,
  'agnes-video-v2.0': 950,
  'sensenova-6.7-flash-lite': 410,
  'sensenova-u1-fast': 260,
  'deepseek-v4-flash': 380,
  'glm-4.7-flash': 290,
}

// Mock: 模拟连接测试，返回随机时延，不调用真实模型 API
function mockTestModel(model) {
  const base = MOCK_MODEL_LATENCY[model] || 400
  const latencyMs = Math.round(base + (Math.random() - 0.5) * base * 0.4)
  return { status: 'success', latencyMs }
}

app.post('/api/ai/test-connection', async (_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  for (const group of AI_MODEL_GROUPS) {
    for (const model of group.models) {
      await new Promise(r => setTimeout(r, 60))
      const r = mockTestModel(model)
      res.write(`data: ${JSON.stringify({ provider: group.provider, tokenLabel: group.tokenLabel, model, ...r })}\n\n`)
    }
  }
  res.write('data: [DONE]\n\n')
  res.end()
})

app.post('/api/ai/test-single', async (req, res) => {
  const { provider, tokenLabel, model } = req.body
  if (!provider || !model) return res.status(400).json({ error: 'Missing provider or model' })
  const group = AI_MODEL_GROUPS.find(g => g.provider === provider && g.tokenLabel === tokenLabel)
  if (!group) return res.status(404).json({ error: 'Provider group not found' })
  res.json(mockTestModel(model))
})

app.post('/api/ai/chat', async (req, res) => {
  const { messages, context } = req.body
  const systemMsg = {
    role: 'system',
    content: `你是一个专业的运维 AI 助手，帮助用户分析监控数据、故障排查、生成查询语句。回答简洁专业，用中文回复。如果建议用户执行某个操作，在末尾用格式 [[action:按钮文字:发送给AI的补充内容]] 标记，例如建议查告警详情用 [[action:查看8条告警详情:列出当前8条触发告警的详细信息]]。当分析结果涉及特定拓扑节点（如 prod-order-01、redis-cache、mysql-master、prod-user-01、prod-pay-01、lb-api、cdn、waf、slb、nacos、k8s-master）时，添加一个 [[action:查看XX拓扑:跳转到该节点的拓扑高亮页面]] 按钮，XX替换为节点名。对于根因节点，额外添加一个 [[action:查看XX详情:查看该节点的详细指标和修复建议]] 按钮。最多标记4个action。不要写多余格式。当用户请求整理故障处理经验时，生成结构化报告，包含：故障概述、影响范围、根因分析、处理步骤、恢复结果、经验总结、预防建议。`
      + (context ? '\n当前页面上下文：' + JSON.stringify(context) : '')
  }
  const fullMessages = [systemMsg, ...(messages || [])]

  // Mock mode — skip real AI APIs for demo flow
  const userMsg = (messages || []).map(m => m.content).join(' ').toLowerCase()
  let mockReply = ''
  const mockActions = []
  if (userMsg.includes('整理') || userMsg.includes('经验') || userMsg.includes('故障处理报告')) {
    mockReply = '## 📋 故障处理报告\n\n**报告名称**：订单服务-01 故障处理报告\n**生成时间**：' + new Date().toLocaleString('zh-CN') + '\n\n### 一、故障概述\n\nprod-order-01（订单服务-01）于 2026-07-10 14:22 出现 CPU 异常飙升（97%，基线 45%），触发严重告警。经自动检测+人工处置，已完成修复，服务已恢复正常。\n\n### 二、影响范围\n\n- **直接影响**：订单服务-01 请求响应延迟从 200ms 上升至 3200ms，部分请求超时\n- **级联影响**：下游 mysql-master 连接数被动升高（慢查询堆积），上游 lb-api QPS 正常但响应变慢\n- **可能影响**：下游 prod-pay-01、prod-inventory-01 可能受到级联影响\n- **影响时段**：14:22 - 14:35，共约 13 分钟\n- **影响用户数**：约 2.3k 请求受影响\n\n### 三、根因分析\n\n| 维度 | 详情 |\n|---|---|\n| 根因节点 | prod-order-01（订单服务-01） |\n| 异常指标 | CPU 使用率 97%（基线 45%，偏离 +115%） |\n| 异常得分 | 0.95（严重） |\n| 传播路径 | cdn → waf → slb → lb-api → prod-order-01 → mysql-master |\n| 可能原因 | 代码死循环或资源泄漏，导致 CPU 持续飙升 |\n| 证据 | CPU 从 45% 突增至 97%，Z-Score=4.2，无突发流量增长 |\n\n### 四、处理步骤\n\n| 步骤 | 操作 | 执行人 | 状态 |\n|---|---|---|---|\n| 1 | 智能异常检测发现 prod-order-01 异常得分 0.95 | 系统 | ✅ 完成 |\n| 2 | 拓扑根因分析确认故障源头 | AI 助手 | ✅ 完成 |\n| 3 | 执行重启订单服务-01 | AI 助手 | ✅ 完成 |\n| 4 | 验证服务恢复（CPU 45%，内存 62%，响应时间 85ms） | 系统 | ✅ 完成 |\n| 5 | 通知相关方确认业务正常 | 值班人员 | ⏳ 待确认 |\n\n### 五、恢复结果\n\n| 指标 | 修复前 | 修复后 | 基线 | 状态 |\n|---|---|---|---|---|\n| CPU 使用率 | 97% | 45% | 45% | ✅ 正常 |\n| 内存使用率 | 94% | 62% | 60% | ✅ 正常 |\n| 响应时间 | 3200ms | 85ms | 200ms | ✅ 正常 |\n\n**结论**：服务已成功恢复，所有指标回归基线。\n\n### 六、经验总结\n\n1. **快速定位**：智能异常检测+拓扑根因分析将 MTTR 从平均 30min 缩短至 13min\n2. **自动修复**：一键执行重启操作，无需手动登录服务器\n3. **验证闭环**：修复后自动验证指标恢复，确保服务真正可用\n\n### 七、预防建议\n\n1. **代码层面**：排查死循环/资源泄漏根因，添加 CPU 熔断机制\n2. **监控层面**：对 prod-order-01 设置 CPU 预警告警（≥70% 即告警），提前干预\n3. **容量层面**：评估是否需从 3 副本扩容至 5 副本，增加冗余\n4. **流程层面**：建立故障处理经验库，定期复盘\n\n---\n\n*> 本报告由 AI 运维助手自动生成*'
    mockActions.push(
      { label: '下载故障处理报告', prompt: mockReply },
    )
  } else if (userMsg.includes('根因') && (userMsg.includes('prod-order') || userMsg.includes('order'))) {
    mockReply = '## prod-order-01 根因分析\n\n**根因节点**：prod-order-01\n**异常得分**：0.95（最高）\n**问题指标**：CPU 使用率 92%（基线 45%，偏离 +104%）\n\n**传播路径**：\n`cdn → waf → slb → lb-api → prod-order-01 → mysql-master`\n\n**分析结论**：故障源头为 prod-order-01，CPU 异常飙升（疑似死循环或资源泄漏），导致请求处理延迟增大。下游 mysql-master 连接数被动升高（慢查询堆积），上游 lb-api QPS 正常但响应变慢。\n\n**影响范围**：下游 prod-pay-01、prod-inventory-01 可能受到级联影响。\n\n请点击下方按钮查看节点详情并执行修复：'
    mockActions.push(
      { label: '查看 prod-order-01 详情', prompt: '查看 prod-order-01 详细指标和修复建议' },
      { label: '重启订单服务-01', prompt: '执行重启 prod-order-01' },
      { label: '扩容订单服务实例', prompt: '从 3 副本扩至 5 副本' },
    )
  } else if (userMsg.includes('订单') || userMsg.includes('order')) {
    resetMockData()
    mockReply = '## 订单服务告警分析\n\n**异常检测**：prod-order-01 节点 CPU 使用率达 92%，超出基线(45%) +104%，异常得分 0.95（严重）。\n\n**根因定位**：订单服务 01 实例在 10:15 开始出现 CPU 飙升，疑似存在死循环或资源泄漏。拓扑分析显示上游 lb-api → prod-order-01 → mysql-master 链路正常，故障集中在 prod-order-01 自身。\n\n**影响范围**：下游 prod-pay-01、prod-inventory-01 可能受到级联影响。\n\n**处置建议**：'
    mockActions.push(
      { label: '查看 prod-order-01 拓扑', prompt: '分析 prod-order-01 的根因和影响范围' },
      { label: '重启订单服务-01', prompt: '执行重启 prod-order-01，预计恢复 CPU 至 45%' },
      { label: '扩容订单服务实例', prompt: '从 3 副本扩至 5 副本，分散负载' },
    )
  } else if (userMsg.includes('告警') || userMsg.includes('alert')) {
    mockReply = '## 当前告警概况\n\n检测到 **8 条异常**，其中严重 3 条、警告 5 条：\n\n| 节点 | 指标 | 当前值 | 基线 | 偏离 | 得分 |\n|---|---|---|---|---|---|\n| prod-order-01 | CPU | 92% | 45% | +104% | 0.95 |\n| redis-cache | 内存 | 89% | 65% | +37% | 0.82 |\n| mysql-master | 连接数 | 450 | 200 | +125% | 0.78 |\n| lb-api | QPS | 12000 | 8000 | +50% | 0.72 |\n| prod-user-01 | 响应时间 | 2.3s | 0.5s | +360% | 0.88 |\n\n**根因分析**：prod-order-01 为最高异常得分节点(0.95)，疑似死循环导致 CPU 飙升，请求堆积引发下游链路级联告警。\n\n**建议优先处理**：'
    mockActions.push(
      { label: '重启订单服务-01', prompt: '执行重启 prod-order-01' },
      { label: '查看拓扑影响范围', prompt: '分析告警传播路径' },
      { label: '查看 prod-order-01 详情', prompt: '查看 prod-order-01 详细指标和修复建议' },
    )
  } else {
    mockReply = '## 分析结果\n\n已收到您的问题，正在为您进行智能分析。当前系统检测到以下关键信息：\n\n- **异常检测**：8 条异常（3 严重 + 5 警告）\n- **健康度**：87%\n- **最高风险节点**：prod-order-01（得分 0.95）\n\n如需进一步分析，请点击下方按钮：'
    mockActions.push(
      { label: '智能异常分析', prompt: '执行智能异常分析，逐条分析异常原因和处理建议' },
      { label: '告警根因定位', prompt: '执行告警根因分析，定位最高异常得分节点' },
    )
  }
  return res.json({ reply: mockReply, actions: mockActions.length ? mockActions : undefined, usage: null })
})

// ==================== SRE 自愈系统 Mock 数据 ====================

const MOCK_INCIDENTS = [
  {
    id: 'INC-2026-0720',
    title: '购物车核心交易链路数据库连接耗尽',
    description: '受大促极速加购业务流冲击，微服务实例瞬间耗尽其数据库连接资源，引发全链级联雪崩。',
    status: 'healing',
    severity: 'P1',
    appName: '订单服务',
    appNodeId: 'prod-order-01',
    service: 'cart-service',
    startTime: '2026-07-20 08:58:00',
    endTime: null,
    duration: '12min',
    metrics: {
      p99: { current: 3500, baseline: 20, unit: 'ms', multiplier: '175x 突增' },
      failureRate: { current: 85.4, unit: '%', label: '大量 HTTP 504 熔断' },
      affectedUsers: { current: 2300, label: '受影响用户' },
      affectedSessions: { current: 2500, label: '受影响会话' },
    },
    healingProgress: 15,
    topologyNodeIds: ['lb-api', 'prod-order-01', 'redis-cache', 'mysql-master', 'mysql-slave'],
    impactScope: '影响 2 个下游服务: redis-cache(缓存命中率↓45%), mysql-master(连接数↑120%)',
    timeline: [
      { time: '08:58', event: '告警触发', type: 'alert', detail: 'P99 响应时间 3500ms 触发阈值告警' },
      { time: '09:00', event: 'AI 检测', type: 'detection', detail: '根因定位: 数据库连接池耗尽' },
      { time: '09:02', event: '流量隔离', type: 'action', detail: 'cart-service-v1 切至稳定容器组' },
      { time: '09:05', event: '扩容连接池', type: 'action', detail: 'HikariCP 50 → 250' },
      { time: '09:15', event: '指标恢复', type: 'recovery', detail: '错误率 0%, P99 22ms' },
    ],
  },
  {
    id: 'INC-2026-0718',
    title: '用户服务登录鉴权超时',
    description: '用户服务因 Redis 缓存击穿导致大量请求穿透至数据库，登录接口超时率飙升。',
    status: 'resolved',
    severity: 'P2',
    appName: '用户服务',
    appNodeId: 'prod-user-01',
    service: 'user-service',
    startTime: '2026-07-18 10:15:00',
    endTime: '2026-07-18 10:28:00',
    duration: '13min',
    metrics: {
      p99: { current: 2800, baseline: 40, unit: 'ms', multiplier: '70x 突增' },
      failureRate: { current: 62.1, unit: '%', label: '大量 HTTP 503 超时' },
      affectedUsers: { current: 1200, label: '受影响用户' },
      affectedSessions: { current: 1350, label: '受影响会话' },
    },
    healingProgress: 100,
    topologyNodeIds: ['lb-api', 'prod-user-01', 'redis-cache', 'mysql-master'],
  },
  {
    id: 'INC-2026-0715',
    title: '支付回调链路 MQ 消息堆积',
    description: '支付回调消息消费线程池耗尽，导致 MQ 队列堆积，回调延迟增大。',
    status: 'resolved',
    severity: 'P2',
    appName: '支付服务',
    appNodeId: 'prod-pay-01',
    service: 'pay-service',
    startTime: '2026-07-15 14:30:00',
    endTime: '2026-07-15 14:45:00',
    duration: '15min',
    metrics: {
      p99: { current: 5200, baseline: 100, unit: 'ms', multiplier: '52x 突增' },
      failureRate: { current: 45.3, unit: '%', label: '回调超时' },
      affectedUsers: { current: 890, label: '受影响用户' },
      affectedSessions: { current: 1020, label: '受影响会话' },
    },
    healingProgress: 100,
    topologyNodeIds: ['lb-api', 'prod-pay-01', 'mq-order', 'redis-cache'],
  },
]

const MOCK_HEALING_PLAYBOOK = {
  'INC-2026-0720': {
    agentStatus: 'executing',
    steps: [
      {
        id: 1,
        name: '故障节点网络隔离',
        nameEn: 'Traffic Isolation',
        config: 'Dynamic Router Update',
        description: '隔离故障的 cart-service-v1 灰度实例，将流量切至稳定容器组',
        mode: 'auto',
        status: 'running',
        progress: 25,
        logs: [
          { time: '18:02:24', message: '执行进度: 25%' },
          { time: '18:02:24', message: '注入脚本中...' },
        ],
        result: { before: '85%', after: '60%', metric: '错误率', status: 'improving' },
        skippable: false,
      },
      {
        id: 2,
        name: '连接池容量扩容',
        nameEn: 'Pool Resize',
        config: 'HikariCP Config Map',
        description: '动态修改配置中心，将 user-db 的 HikariCP MaxActive 提升至 250',
        mode: 'confirm',
        status: 'pending',
        progress: 0,
        logs: [],
        result: null,
        skippable: true,
      },
      {
        id: 3,
        name: 'MySQL 连接刷新与备库倒换',
        nameEn: 'DB Engine Control',
        config: 'DB Engine Control',
        description: '执行僵死连接清理 (FLUSH HOSTS)，必要时进行数据库主备自动倒换',
        mode: 'manual',
        status: 'pending',
        progress: 0,
        logs: [],
        result: null,
        skippable: false,
      },
      {
        id: 4,
        name: '全链路监控与业务健康拨测',
        nameEn: 'Health Probe',
        config: 'Synthetics Canary',
        description: '发起端到端模拟结账压力测试，验证耗时和连接池水位',
        mode: 'manual',
        status: 'pending',
        progress: 0,
        logs: [],
        result: null,
        skippable: false,
      },
    ],
    validation: {
      totalSteps: 4,
      completedSteps: 0,
      http200Status: '暂未恢复',
    },
  },
  'INC-2026-0718': {
    agentStatus: 'completed',
    steps: [
      { id: 1, name: 'Redis 缓存预热', nameEn: 'Cache Warmup', config: 'Redis Pipeline', description: '批量加载热点用户数据到 Redis', mode: 'auto', status: 'success', progress: 100, logs: [{ time: '10:18:00', message: '缓存预热完成，命中率恢复至 98%' }] },
      { id: 2, name: '数据库连接释放', nameEn: 'Connection Reset', config: 'HikariCP Admin', description: '清理僵死连接，释放连接池', mode: 'auto', status: 'success', progress: 100, logs: [{ time: '10:20:00', message: '连接池恢复正常水位' }] },
    ],
    validation: { totalSteps: 2, completedSteps: 2, http200Status: '已恢复' },
  },
}

const MOCK_PLAYBOOK_RECOMMENDATIONS = [
  {
    id: 'rec-001',
    title: '数据库连接池耗尽处理指南',
    tags: ['数据库', '智能推荐'],
    summary: 'HikariCP 连接池耗尽的标准处理流程，含扩容、清理、监控',
    createdAt: '2025-08-21',
    matchReason: '匹配当前故障类型：数据库连接池耗尽',
  },
  {
    id: 'rec-002',
    title: 'MySQL 慢查询排查与优化',
    tags: ['数据库', '运维'],
    summary: '慢查询定位、索引优化、连接池参数调整',
    createdAt: '2025-07-15',
    matchReason: '匹配关联节点：mysql-master',
  },
  {
    id: 'rec-003',
    title: 'Kubernetes Pod 重启排查指南',
    tags: ['容器', 'K8s'],
    summary: 'Pod CrashLoopBackOff 原因分析及修复步骤',
    createdAt: '2025-06-10',
    matchReason: '',
  },
  {
    id: 'rec-004',
    title: 'Redis 缓存击穿解决方案',
    tags: ['缓存', '智能推荐'],
    summary: '缓存击穿、缓存雪崩的预防与应急处理',
    createdAt: '2025-05-18',
    matchReason: '匹配关联节点：redis-cache',
  },
]

const MOCK_POSTMORTEM_REPORTS = {
  'INC-2026-0720': {
    title: '复盘沉淀：高并发事务连接池被打满事件',
    markdown: `## 故障全景概要 (Executive Summary)

**故障名称**：购物车微服务数据库连接池满载引发的级联高延迟事故
**发生时间**：2026-07-20 08:58:00 (北京时间)
**故障分级**：P1 (核心业务中断)
**故障服务**：\`cart-service\` (购物车微服务)
**业务影响面**：
* **核心影响**：购物车结账（Checkout）接口 P99 响应时延从正常水位的 20ms 飙升至 **3500ms**。
* **受损情况**：接口失败率高达 **85%**，导致早间业务高峰期大量用户无法完成支付转化，业务链路近乎停滞。
**恢复历时**：约 5 分钟（自愈编排链介入至指标恢复）。
**当前状态**：已恢复正常水位（P99: 20ms）。

---

## 核心技术根因探析 (Root Cause Analysis)

### 1. 连接池配额与突增流量的不匹配

\`cart-service\` 默认配置的 HikariCP \`MaxActive\` 为 50。在早间 08:58 的业务波峰期间，QPS 瞬时增长 4 倍。根据 **Little's Law (利特尔法则)**，系统所需的连接数 = 吞吐量 x 平均响应时间。当数据库底层出现轻微波动导致响应时间增加时，所需的连接数迅速穿透了 50 的阈值，导致后续请求进入 \`Connection Wait\` 状态。

### 2. 数据库层面的隐性锁等待

通过对 \`user-db\` 的状态分析，发现存在针对用户购物车表的并发写竞争。高频次的行级锁争用导致事务提交变慢，进而反向延长了数据库连接的持有时间。这种"慢查询 -> 连接持有延长 -> 线程池枯竭 -> 排队超时"的**正反馈效应**是引发 P99 飙升至 3500ms 的关键原因。

### 3. 拓扑节点的反向压力

由于 \`api-gateway\` 未能及时对 \`cart-service\` 进行有效的熔断隔离，导致上游请求源源不断地涌入已饱和的微服务，进一步压垮了数据库的监听队列（Backlog），引发了典型的微服务级联故障。

---

## 自愈编排时序线记录

| 时间点 | 编排动作 | 执行操作描述 | 生效校验指标 |
| :--- | :--- | :--- | :--- |
| **08:58:15** | **流量隔离** | 识别到灰度环境实例错误率更高，立即下线灰度节点，将 100% 流量切入经过压测验证的主集群容器组。 | 灰度节点流量清零，全局错误率下降 10%。 |
| **08:59:05** | **动态扩容连接池** | 通过配置中心下发热更新指令，将 \`cart-service\` 的 HikariCP \`maximum-pool-size\` 由 50 实时调整至 250。 | 线程等待指标由 3000ms 降至 200ms。 |
| **09:00:20** | **主备倒换与清理** | 诊断发现大量 \`Sleep\` 状态的僵死连接，执行 \`FLUSH HOSTS\` 并触发主备平滑倒换，利用只读副本分担查询压力。 | 数据库 CPU 负载由 95% 降至 40%，死锁告警消除。 |
| **09:01:45** | **健康拨测验证** | 启动四层与七层协议深度拨测，模拟结账全链路业务逻辑，验证返回码及耗时。 | **P99 响应时间恢复至 20ms**，失败率清零。 |

---

## 防线治理与长期改进项

### 1. 架构级防御优化
* **引入数据库 Proxy 层**：在应用与数据库之间部署 RDS Proxy 或中间件，实现连接多路复用与请求排队削峰。
* **读写彻底分离**：重构购物车查询逻辑，强制所有非事务性查询走只读副本，缓解主库锁竞争。

### 2. 智能限流与熔断策略
* **自适应重试**：配置 Service Mesh 层的退避重试策略 (Exponential Backoff)，防止瞬时故障引发的重试风暴。
* **并发控制**：在 API 网关层针对 \`cart-service/checkout\` 接口设置基于并发数的信号量限流。

### 3. 动态容量预计算模型
* **动态阈值**：废弃固定连接池配额，建立基于监控指标的动态调节模型。
* **容量警戒线**：设置连接池使用率 80% 为紧急预警阈值，触发自动扩容或流量降级。

### 4. 监控与可观测性增强
* **连接泄露检测**：开启 HikariCP 的 \`leak-detection-threshold\`，监控生命周期异常的长连接。
* **SQL 性能画像**：接入全链路追踪，实时捕获并告警导致连接占用的慢 SQL 语句。

---

**报告编制**：SRE 自动化运维组
**审核状态**：已归档至知识库 (Postmortem-20260720-001)`,
    createdAt: '2026-07-20 10:30:00',
    author: 'SRE 自动化运维组',
    status: '已归档至知识库 (Postmortem-20260720-001)',
  },
  'INC-2026-0718': {
    title: '复盘沉淀：Redis 缓存击穿引发登录超时事件',
    markdown: `## 故障概要

**故障名称**：用户服务登录鉴权超时
**发生时间**：2026-07-18 10:15:00
**故障分级**：P2
**恢复历时**：约 13 分钟

## 根因分析

Redis 热点 key 过期后，大量并发请求同时穿透至数据库，导致数据库连接池耗尽。

## 改进措施

1. 增加互斥锁防止缓存击穿
2. 热点数据永不过期 + 异步刷新
3. 数据库连接池扩容至 200`,
    createdAt: '2026-07-18 11:00:00',
    author: 'SRE 自动化运维组',
    status: '已归档',
  },
}

const MOCK_ERROR_RATE_TREND = {
  'INC-2026-0720': {
    data: [
      { time: '08:50', latency: 12, errorRate: 2, label: '秒杀启动' },
      { time: '08:52', latency: 15, errorRate: 3 },
      { time: '08:54', latency: 14, errorRate: 1 },
      { time: '08:56', latency: 1450, errorRate: 45 },
      { time: '08:58', latency: 3240, errorRate: 88 },
      { time: '09:00', latency: 3500, errorRate: 92, label: '错误率峰值: 92%' },
      { time: '09:02', latency: 2100, errorRate: 60 },
      { time: '09:05', latency: 800, errorRate: 15 },
      { time: '09:10', latency: 45, errorRate: 3 },
      { time: '09:15', latency: 22, errorRate: 0 },
      { time: '09:20', latency: 18, errorRate: 0 },
    ],
    annotations: [
      { time: '08:58', label: '告警触发', type: 'alert' },
      { time: '09:02', label: '流量隔离', type: 'action' },
      { time: '09:05', label: '扩容连接池', type: 'action' },
      { time: '09:15', label: '恢复', type: 'recovery' },
    ],
    executionResults: [
      { step: '流量隔离', before: 85, after: 60, unit: '%' },
      { step: '扩容连接池', before: 60, after: 15, unit: '%' },
      { step: '恢复稳定', before: 15, after: 0, unit: '%' },
    ],
  },
  'INC-2026-0718': {
    data: [
      { time: '10:15', latency: 40, errorRate: 1 },
      { time: '10:18', latency: 2800, errorRate: 62, label: '缓存击穿' },
      { time: '10:22', latency: 1200, errorRate: 30 },
      { time: '10:28', latency: 45, errorRate: 2, label: '恢复正常' },
    ],
    annotations: [
      { time: '10:18', label: '缓存击穿', type: 'alert' },
      { time: '10:28', label: '恢复', type: 'recovery' },
    ],
    executionResults: [],
  },
}

const MOCK_INCIDENT_LOGS = [
  { id: 'log-001', time: '2026-07-20 08:58:01', level: 'error', service: 'cart-service', nodeId: 'prod-order-01', host: '10.0.2.10', message: 'HikariCP Connection is not available, request timed out after 30000ms', traceId: 'trace-abc-001', extra: { pool: 'user-db', active: 50, idle: 0, waiting: 127 } },
  { id: 'log-002', time: '2026-07-20 08:58:02', level: 'error', service: 'cart-service', nodeId: 'prod-order-01', host: '10.0.2.10', message: 'Connection acquire timeout! pool: user-db, state: [active=50, idle=0, waiting=234]', traceId: 'trace-abc-002', extra: {} },
  { id: 'log-003', time: '2026-07-20 08:58:03', level: 'warn', service: 'api-gateway', nodeId: 'lb-api', host: '10.0.1.10', message: 'Upstream response time exceeded threshold: cart-service latency 3200ms', traceId: 'trace-abc-003', extra: { upstream: 'cart-service', threshold: 500 } },
  { id: 'log-004', time: '2026-07-20 08:58:05', level: 'error', service: 'cart-service', nodeId: 'prod-order-01', host: '10.0.2.10', message: 'Checkout API returned 504 Gateway Timeout, affected 156 requests in last 10s', traceId: 'trace-abc-004', extra: {} },
  { id: 'log-005', time: '2026-07-20 08:58:10', level: 'error', service: 'mysql-master', nodeId: 'mysql-master', host: '10.0.5.10', message: 'Too many connections (1024 max), connection refused for new client', traceId: null, extra: { maxConnections: 1024, current: 1024 } },
  { id: 'log-006', time: '2026-07-20 08:58:15', level: 'info', service: 'cart-service', nodeId: 'prod-order-01', host: '10.0.2.10', message: '[Self-Healing] Traffic isolation started, redirecting canary traffic to stable group', traceId: null, extra: {} },
  { id: 'log-007', time: '2026-07-20 08:59:05', level: 'info', service: 'cart-service', nodeId: 'prod-order-01', host: '10.0.2.10', message: '[Self-Healing] HikariCP config updated: maximum-pool-size 50 -> 250', traceId: null, extra: { oldValue: 50, newValue: 250 } },
  { id: 'log-008', time: '2026-07-20 08:59:10', level: 'info', service: 'mysql-master', nodeId: 'mysql-master', host: '10.0.5.10', message: 'FLUSH HOSTS executed, cleared 342 stale connections', traceId: null, extra: {} },
  { id: 'log-009', time: '2026-07-20 09:00:20', level: 'info', service: 'cart-service', nodeId: 'prod-order-01', host: '10.0.2.10', message: 'Connection pool healthy: active=45, idle=205, waiting=0', traceId: null, extra: {} },
  { id: 'log-010', time: '2026-07-20 09:01:45', level: 'info', service: 'cart-service', nodeId: 'prod-order-01', host: '10.0.2.10', message: '[Self-Healing] Health probe passed: checkout API P99=22ms, errorRate=0%', traceId: null, extra: {} },
  { id: 'log-011', time: '2026-07-20 08:57:50', level: 'info', service: 'cart-service', nodeId: 'redis-cache', host: '10.0.6.10', message: 'Redis cache hit rate dropped to 45% (baseline: 95%)', traceId: null, extra: {} },
  { id: 'log-012', time: '2026-07-20 08:57:55', level: 'warn', service: 'cart-service', nodeId: 'redis-cache', host: '10.0.6.10', message: 'Cache miss storm detected, request穿透至 database', traceId: null, extra: {} },
]

const MOCK_INCIDENT_TRACES = [
  {
    traceId: 'trace-abc-001',
    spanCount: 6,
    duration: '3520ms',
    startTime: '2026-07-20 08:58:01.100',
    rootOperation: 'POST /api/cart/checkout',
    status: 'error',
    spans: [
      { id: 's1', operation: 'POST /api/cart/checkout', service: 'api-gateway', startTime: 0, duration: 3520, depth: 0, status: 'error', color: '#FF7D00' },
      { id: 's2', operation: 'CheckoutHandler.Handle', service: 'cart-service', startTime: 10, duration: 3500, depth: 1, status: 'error', color: '#F5222D' },
      { id: 's3', operation: 'DB.GetConnection', service: 'cart-service', startTime: 20, duration: 30000, depth: 2, status: 'error', color: '#F5222D' },
      { id: 's4', operation: 'Redis.Get', service: 'redis-cache', startTime: 15, duration: 5, depth: 2, status: 'ok', color: '#1890FF' },
      { id: 's5', operation: 'MySQL.Query', service: 'mysql-master', startTime: 25, duration: 3400, depth: 3, status: 'error', color: '#F5222D' },
      { id: 's6', operation: 'MySQL.Execute', service: 'mysql-master', startTime: 3430, duration: 80, depth: 3, status: 'error', color: '#F5222D' },
    ],
  },
  {
    traceId: 'trace-abc-003',
    spanCount: 4,
    duration: '3205ms',
    startTime: '2026-07-20 08:58:03.200',
    rootOperation: 'POST /api/cart/checkout',
    status: 'error',
    spans: [
      { id: 's1', operation: 'POST /api/cart/checkout', service: 'api-gateway', startTime: 0, duration: 3205, depth: 0, status: 'error', color: '#FF7D00' },
      { id: 's2', operation: 'CheckoutHandler.Handle', service: 'cart-service', startTime: 5, duration: 3200, depth: 1, status: 'error', color: '#F5222D' },
      { id: 's3', operation: 'DB.GetConnection', service: 'cart-service', startTime: 10, duration: 3190, depth: 2, status: 'error', color: '#F5222D' },
      { id: 's4', operation: 'MySQL.Query', service: 'mysql-master', startTime: 15, duration: 3180, depth: 3, status: 'error', color: '#F5222D' },
    ],
  },
]

const MOCK_CALL_TRACE = {
  'INC-2026-0720': [
    { id: 'ct-1', name: 'POST /api/cart/checkout', service: 'api-gateway', status: 'error', duration: 3520, timestamp: '08:58:01', spans: [
      { service: 'api-gateway', operation: 'HTTP POST /api/cart/checkout', duration: 3520, status: 'error' },
      { service: 'cart-service', operation: 'CheckoutHandler.Handle', duration: 3500, status: 'error' },
      { service: 'cart-service', operation: 'DB.GetConnection', duration: 30000, status: 'error' },
      { service: 'redis-cache', operation: 'Redis.Get(cart:session:*)', duration: 5, status: 'ok' },
      { service: 'mysql-master', operation: 'MySQL.Query(SELECT * FROM orders)', duration: 3400, status: 'error' },
    ]},
    { id: 'ct-2', name: 'POST /api/cart/checkout', service: 'api-gateway', status: 'error', duration: 3205, timestamp: '08:58:03', spans: [
      { service: 'api-gateway', operation: 'HTTP POST /api/cart/checkout', duration: 3205, status: 'error' },
      { service: 'cart-service', operation: 'CheckoutHandler.Handle', duration: 3200, status: 'error' },
      { service: 'cart-service', operation: 'DB.GetConnection', duration: 3190, status: 'error' },
      { service: 'mysql-master', operation: 'MySQL.Query(SELECT * FROM orders)', duration: 3180, status: 'error' },
    ]},
    { id: 'ct-3', name: 'GET /api/cart/items', service: 'api-gateway', status: 'ok', duration: 45, timestamp: '08:57:50', spans: [
      { service: 'api-gateway', operation: 'HTTP GET /api/cart/items', duration: 45, status: 'ok' },
      { service: 'cart-service', operation: 'CartHandler.List', duration: 40, status: 'ok' },
      { service: 'redis-cache', operation: 'Redis.Get(cart:items:*)', duration: 3, status: 'ok' },
    ]},
  ],
  'INC-2026-0718': [
    { id: 'ct-4', name: 'POST /api/order/create', service: 'api-gateway', status: 'error', duration: 2800, timestamp: '10:18:00', spans: [
      { service: 'api-gateway', operation: 'HTTP POST /api/order/create', duration: 2800, status: 'error' },
      { service: 'order-service', operation: 'OrderHandler.Create', duration: 2790, status: 'error' },
      { service: 'mysql-slave', operation: 'MySQL.Query(SELECT * FROM inventory)', duration: 2780, status: 'error' },
    ]},
  ],
}

const MOCK_LINKED_LOGS = {
  'INC-2026-0720': [
    { id: 'll-1', time: '08:58:01', level: 'error', service: 'cart-service', source: 'stdout', message: 'HikariCP Connection is not available, request timed out after 30000ms', traceId: 'trace-abc-001' },
    { id: 'll-2', time: '08:58:02', level: 'error', service: 'cart-service', source: 'stdout', message: 'Connection acquire timeout! pool: user-db, state: [active=50, idle=0, waiting=234]', traceId: 'trace-abc-002' },
    { id: 'll-3', time: '08:58:03', level: 'warn', service: 'api-gateway', source: 'access.log', message: 'Upstream response time exceeded threshold: cart-service latency 3200ms', traceId: 'trace-abc-003' },
    { id: 'll-4', time: '08:58:05', level: 'error', service: 'cart-service', source: 'stdout', message: 'Checkout API returned 504 Gateway Timeout, affected 156 requests in last 10s', traceId: 'trace-abc-004' },
    { id: 'll-5', time: '08:58:10', level: 'error', service: 'mysql-master', source: 'error.log', message: 'Too many connections (1024 max), connection refused for new client', traceId: null },
    { id: 'll-6', time: '08:58:15', level: 'info', service: 'cart-service', source: 'stdout', message: '[Self-Healing] Traffic isolation started, redirecting canary traffic to stable group', traceId: null },
    { id: 'll-7', time: '08:57:50', level: 'info', service: 'redis-cache', source: 'slow.log', message: 'Redis cache hit rate dropped to 45% (baseline: 95%)', traceId: null },
    { id: 'll-8', time: '08:57:55', level: 'warn', service: 'redis-cache', source: 'stdout', message: 'Cache miss storm detected, request穿透至 database', traceId: null },
    { id: 'll-9', time: '08:59:05', level: 'info', service: 'cart-service', source: 'stdout', message: '[Self-Healing] HikariCP config updated: maximum-pool-size 50 -> 250', traceId: null },
    { id: 'll-10', time: '08:59:10', level: 'info', service: 'mysql-master', source: 'general.log', message: 'FLUSH HOSTS executed, cleared 342 stale connections', traceId: null },
  ],
  'INC-2026-0718': [
    { id: 'll-11', time: '10:18:00', level: 'error', service: 'order-service', source: 'stdout', message: 'Inventory query timeout after 2780ms', traceId: 'trace-def-001' },
    { id: 'll-12', time: '10:18:05', level: 'error', service: 'mysql-slave', source: 'error.log', message: 'Replication lag detected: 2800ms behind master', traceId: null },
  ],
}

// GET /api/sre/incidents
app.get('/api/sre/incidents', (req, res) => {
  const { appName } = req.query
  let incidents = MOCK_INCIDENTS
  if (appName) incidents = incidents.filter(i => i.appName === appName)
  res.json({ success: true, data: incidents })
})

// GET /api/sre/postmortems
app.get('/api/sre/postmortems', (req, res) => {
  const list = Object.entries(MOCK_POSTMORTEM_REPORTS).map(([incidentId, report]) => ({
    id: incidentId,
    incidentId,
    title: report.title,
    markdown: report.markdown,
    author: report.author || 'SRE 自动化运维组',
    status: report.status || '已归档',
    createdAt: report.createdAt || '2026-07-20',
  }))
  res.json({ success: true, data: list })
})

// GET /api/sre/incidents/:id
app.get('/api/sre/incidents/:id', (req, res) => {
  const incident = MOCK_INCIDENTS.find(i => i.id === req.params.id)
  if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' })
  const topoNodes = MOCK_TOPO_NODES.filter(n => incident.topologyNodeIds.includes(n.id))
  const topoEdges = MOCK_TOPO_EDGES.filter(e => incident.topologyNodeIds.includes(e.source) && incident.topologyNodeIds.includes(e.target))
  res.json({
    success: true,
    data: {
      incident,
      topology: { nodes: topoNodes, edges: topoEdges },
      playbook: MOCK_HEALING_PLAYBOOK[incident.id] || null,
      postmortem: MOCK_POSTMORTEM_REPORTS[incident.id] || null,
      errorRateTrend: MOCK_ERROR_RATE_TREND[incident.id] || { data: [], annotations: [], executionResults: [] },
    },
  })
})

// GET /api/sre/incidents/:id/logs
app.get('/api/sre/incidents/:id/logs', (req, res) => {
  const { nodeId } = req.query
  let logs = MOCK_INCIDENT_LOGS
  if (nodeId) logs = logs.filter(l => l.nodeId === nodeId)
  res.json({ success: true, data: logs })
})

// GET /api/sre/incidents/:id/traces
app.get('/api/sre/incidents/:id/traces', (req, res) => {
  res.json({ success: true, data: MOCK_INCIDENT_TRACES })
})

// GET /api/sre/incidents/:id/call-trace
app.get('/api/sre/incidents/:id/call-trace', (req, res) => {
  res.json({ success: true, data: MOCK_CALL_TRACE[req.params.id] || [] })
})

// GET /api/sre/incidents/:id/linked-logs
app.get('/api/sre/incidents/:id/linked-logs', (req, res) => {
  res.json({ success: true, data: MOCK_LINKED_LOGS[req.params.id] || [] })
})

// POST /api/sre/incidents/:id/heal/:stepIndex
app.post('/api/sre/incidents/:id/heal/:stepIndex', (req, res) => {
  const playbook = MOCK_HEALING_PLAYBOOK[req.params.id]
  if (!playbook) return res.status(404).json({ success: false, message: 'Playbook not found' })
  const step = playbook.steps[parseInt(req.params.stepIndex)]
  if (!step) return res.status(404).json({ success: false, message: 'Step not found' })
  step.status = 'running'
  step.progress = 25
  step.logs.push({ time: new Date().toTimeString().slice(0, 8), message: '执行进度: 25%' })
  setTimeout(() => { step.progress = 50; step.logs.push({ time: new Date().toTimeString().slice(0, 8), message: '执行进度: 50%' }) }, 1000)
  setTimeout(() => { step.progress = 100; step.status = 'success'; step.logs.push({ time: new Date().toTimeString().slice(0, 8), message: '执行完成' }) }, 2000)
  res.json({ success: true, data: step })
})

// POST /api/sre/reset — reset playbook to initial state (for testing)
app.post('/api/sre/reset', (req, res) => {
  const playbook = MOCK_HEALING_PLAYBOOK['INC-2026-0720']
  if (playbook) {
    playbook.agentStatus = 'executing'
    playbook.steps[0].status = 'running'
    playbook.steps[0].progress = 25
    playbook.steps[0].logs = [
      { time: '18:02:24', message: '执行进度: 25%' },
      { time: '18:02:24', message: '注入脚本中...' },
    ]
    for (let i = 1; i < playbook.steps.length; i++) {
      playbook.steps[i].status = 'pending'
      playbook.steps[i].progress = 0
      playbook.steps[i].logs = []
    }
    playbook.validation.completedSteps = 0
    playbook.validation.http200Status = '暂未恢复'
  }
  res.json({ success: true })
})

// GET /api/sre/playbook-recommendations
app.get('/api/sre/playbook-recommendations', (req, res) => {
  res.json({ success: true, data: MOCK_PLAYBOOK_RECOMMENDATIONS })
})

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`🚀 服务启动: http://localhost:${PORT}`)
})