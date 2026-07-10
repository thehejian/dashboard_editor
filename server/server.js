import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { exec } from 'child_process'
import cmdbRouter from './routes/cmdb.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || '192.168.0.155',
  port: process.env.DB_PORT || 54321,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '745544752',
  database: process.env.DB_NAME || 'mydb'
})

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ 数据库连接成功'))
  .catch(err => console.error('❌ 数据库连接失败:', err))

// Share pool with route modules
app.locals.pool = pool

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

// Run CMDB migration on startup
async function runMigrations() {
  try {
    const migrationResult = await pool.query(`
      SELECT to_regclass('public.ci_types') IS NOT NULL as exists
    `)
    if (!migrationResult.rows[0].exists) {
      console.log('📦 运行 CMDB 迁移...')
      const migrationSql = readFileSync(new URL('./db/001_cmdb_schema.sql', import.meta.url), 'utf-8')
      await pool.query(migrationSql)
      console.log('✅ CMDB 表结构创建成功')
    } else {
      console.log('✅ CMDB 表结构已存在')
    }
  } catch (err) {
    console.error('❌ CMDB 迁移失败:', err)
  }
}
runMigrations()

// ==================== API Routes ====================

// 1. 代码片段搜索
app.post('/api/code-search', async (req, res) => {
  try {
    const { query, limit = 5, threshold = 0.5 } = req.body

    if (!query) {
      return res.status(400).json({ error: '缺少查询内容' })
    }

    // 检查是否有数据
    const countResult = await pool.query('SELECT COUNT(*) as count FROM code_snippets')
    if (parseInt(countResult.rows[0].count) === 0) {
      return res.json({
        success: true,
        data: [],
        message: '暂无数据，请先添加代码片段',
        count: 0
      })
    }

    const embedding = await getEmbedding(query)

    const result = await pool.query(`
      SELECT id, title, description, code_content, language, metadata,
             1 - (embedding <=> $1::vector) as similarity
      FROM code_snippets
      WHERE 1 - (embedding <=> $1::vector) > $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `, [embedding, threshold, limit])

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    })
  } catch (err) {
    console.error('代码搜索错误:', err)
    res.status(500).json({ error: '搜索失败' })
  }
})

// 添加测试数据
app.post('/api/seed-data', async (req, res) => {
  try {
    // Check if CMDB data already exists
    const ciCheck = await pool.query('SELECT COUNT(*) as count FROM ci_types')
    if (parseInt(ciCheck.rows[0].count) > 0) {
      return res.json({ success: true, message: 'CMDB 数据已存在，跳过 seed' })
    }

    // Seed CMDB data
    const seedSql = readFileSync(new URL('./db/002_seed_data.sql', import.meta.url), 'utf-8')
    await pool.query(seedSql)
    console.log('✅ CMDB seed 完成')

    res.json({ success: true, message: 'CMDB 数据初始化完成' })
  } catch (err) {
    console.error('Seed 错误:', err)
    res.status(500).json({ error: err.message })
  }
})

// 2. 代码模板推荐
app.post('/api/code-recommend', async (req, res) => {
  try {
    const { input, limit = 3 } = req.body

    if (!input) {
      return res.status(400).json({ error: '缺少输入内容' })
    }

    const embedding = await getEmbedding(input)

    const result = await pool.query(`
      SELECT id, name, trigger_keyword, template_content, category, usage_count,
             1 - (embedding <=> $1::vector) as similarity
      FROM code_templates
      ORDER BY embedding <=> $1::vector, usage_count DESC
      LIMIT $2
    `, [embedding, limit])

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    })
  } catch (err) {
    console.error('模板推荐错误:', err)
    res.status(500).json({ error: '推荐失败' })
  }
})

// 3. 文档问答 (RAG)
app.post('/api/doc-qa', async (req, res) => {
  try {
    const { question, limit = 3 } = req.body

    if (!question) {
      return res.status(400).json({ error: '缺少问题' })
    }

    const questionEmbedding = await getEmbedding(question)

    // 检索相关文档
    const docs = await pool.query(`
      SELECT id, title, chunk_text, chunk_index,
             1 - (embedding <=> $1::vector) as similarity
      FROM docs
      WHERE 1 - (embedding <=> $1::vector) > 0.7
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `, [questionEmbedding, limit])

    // 如果有 OpenAI API，可以调用 LLM 生成回答
    // 这里先返回检索到的文档
    res.json({
      success: true,
      question,
      context: docs.rows.map(d => ({
        title: d.title,
        chunk_text: d.chunk_text,
        similarity: d.similarity
      })),
      // 如果有 LLM 回答
      // answer: await generateAnswer(question, docs.rows)
      count: docs.rows.length
    })
  } catch (err) {
    console.error('文档问答错误:', err)
    res.status(500).json({ error: '问答失败' })
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

const MOCK_TOPO_NODES = [
  // 接入层
  { id: 'cdn', label: 'CDN', type: 'access', status: 'normal', layer: 'access', metrics: { bandwidth: '2.4Gbps', hitRate: '94%' } },
  { id: 'waf', label: 'WAF', type: 'security', status: 'normal', layer: 'access', metrics: { blocked: '1.2k/min', rules: 847 } },
  { id: 'slb', label: 'SLB', type: 'lb', status: 'normal', layer: 'access', metrics: { qps: '45k', connections: '12k' } },
  // 网关层
  { id: 'lb-api', label: 'API Gateway', type: 'gateway', status: 'normal', layer: 'gateway', metrics: { latency: '12ms', errorRate: '0.1%' } },
  // 服务层
  { id: 'prod-order-01', label: '订单服务-01', type: 'service', status: 'critical', layer: 'service', metrics: { cpu: '97%', memory: '94%', latency: '3200ms' } },
  { id: 'prod-order-02', label: '订单服务-02', type: 'service', status: 'normal', layer: 'service', metrics: { cpu: '45%', memory: '62%', latency: '85ms' } },
  { id: 'prod-order-03', label: '订单服务-03', type: 'service', status: 'normal', layer: 'service', metrics: { cpu: '42%', memory: '58%', latency: '80ms' } },
  { id: 'prod-user-01', label: '用户服务-01', type: 'service', status: 'normal', layer: 'service', metrics: { cpu: '38%', memory: '55%', latency: '45ms' } },
  { id: 'prod-user-02', label: '用户服务-02', type: 'service', status: 'normal', layer: 'service', metrics: { cpu: '35%', memory: '52%', latency: '42ms' } },
  { id: 'prod-pay-01', label: '支付服务-01', type: 'service', status: 'normal', layer: 'service', metrics: { cpu: '32%', memory: '48%', latency: '120ms' } },
  { id: 'prod-pay-02', label: '支付服务-02', type: 'service', status: 'normal', layer: 'service', metrics: { cpu: '30%', memory: '45%', latency: '115ms' } },
  { id: 'prod-inventory-01', label: '库存服务-01', type: 'service', status: 'warning', layer: 'service', metrics: { cpu: '72%', memory: '68%', latency: '180ms' } },
  // 中间件层
  { id: 'redis-cache', label: 'Redis Cluster', type: 'cache', status: 'warning', layer: 'middleware', metrics: { hitRate: '72%', memory: '78%', connections: '4.5k' } },
]

const MOCK_TOPO_EDGES = [
  // 接入层链路
  { id: 'e-cdn-waf', source: 'cdn', target: 'waf' },
  { id: 'e-waf-slb', source: 'waf', target: 'slb' },
  { id: 'e-slb-gw', source: 'slb', target: 'lb-api' },
  // 网关→服务
  { id: 'e-gw-order1', source: 'lb-api', target: 'prod-order-01' },
  { id: 'e-gw-order2', source: 'lb-api', target: 'prod-order-02' },
  { id: 'e-gw-order3', source: 'lb-api', target: 'prod-order-03' },
  { id: 'e-gw-user1', source: 'lb-api', target: 'prod-user-01' },
  { id: 'e-gw-user2', source: 'lb-api', target: 'prod-user-02' },
  { id: 'e-gw-pay1', source: 'lb-api', target: 'prod-pay-01' },
  { id: 'e-gw-pay2', source: 'lb-api', target: 'prod-pay-02' },
  // 服务间调用
  { id: 'e-order1-inventory', source: 'prod-order-01', target: 'prod-inventory-01' },
  // 服务→Redis
  { id: 'e-order1-redis', source: 'prod-order-01', target: 'redis-cache' },
  { id: 'e-order2-redis', source: 'prod-order-02', target: 'redis-cache' },
  { id: 'e-order3-redis', source: 'prod-order-03', target: 'redis-cache' },
  { id: 'e-user2-redis', source: 'prod-user-02', target: 'redis-cache' },
  { id: 'e-pay1-redis', source: 'prod-pay-01', target: 'redis-cache' },
  { id: 'e-pay2-redis', source: 'prod-pay-02', target: 'redis-cache' },
  { id: 'e-inventory-redis', source: 'prod-inventory-01', target: 'redis-cache' },
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

// ==================== AI Chat ====================

const AGNES_API_KEY = 'sk-YjJnlziWMJgYHmiJiX8peB5PtNx1hInu7SQnivjeavaN4Ect'
const AGNES_BASE_URL = 'https://apihub.agnes-ai.com/v1'

const ZHIPU_API_KEY = '8329553cf0bd83a57bd45502d80688b7.MoH21npPA0tXNPfw'
const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'
const ZHIPU_MODEL = 'glm-4.7-flash'

async function callProvider(apiKey, baseUrl, model, messages, extraParams) {
  const bodyObj = { model, messages, stream: false, ...extraParams }
  const bodyStr = JSON.stringify(bodyObj)
  const curl = `curl -s --max-time 120 '${baseUrl}/chat/completions' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${apiKey}' -d '${bodyStr.replace(/'/g, "'\\''")}'`

  for (let i = 0; i <= 2; i++) {
    if (i > 0) {
      console.log(`[AI Chat] ${model} 重试 #${i}`)
      await new Promise(r => setTimeout(r, 1000))
    }
    try {
      const stdout = await new Promise((resolve, reject) => {
        exec(curl, { timeout: 130000, maxBuffer: 1024 * 1024 }, (err, stdout) => {
          if (err || !stdout.trim()) return reject(err || new Error('无响应'))
          resolve(stdout)
        })
      })
      const data = JSON.parse(stdout)
      const raw = data.choices?.[0]?.message?.content
      if (raw) {
        return { raw, usage: data.usage }
      }
      console.error(`[AI Chat] ${model} 空回复 attempt=${i} usage=${JSON.stringify(data.usage)}`)
    } catch (e) {
      console.error(`[AI Chat] ${model} 异常 attempt=${i}:`, e.message)
    }
  }
  return null
}

app.post('/api/ai/chat', async (req, res) => {
  const { messages, context } = req.body
  const systemMsg = {
    role: 'system',
    content: `你是一个专业的运维 AI 助手，帮助用户分析监控数据、故障排查、生成查询语句。回答简洁专业，用中文回复。如果建议用户执行某个操作，在末尾用格式 [[action:按钮文字:发送给AI的补充内容]] 标记，例如建议查告警详情用 [[action:查看8条告警详情:列出当前8条触发告警的详细信息]]。当分析结果涉及特定拓扑节点（如 prod-order-01、redis-cache、mysql-master、prod-user-01、prod-pay-01、lb-api、cdn、waf、slb、nacos、k8s-master）时，添加一个 [[action:查看XX拓扑:跳转到该节点的拓扑高亮页面]] 按钮，XX替换为节点名。对于根因节点，额外添加一个 [[action:查看XX详情:查看该节点的详细指标和修复建议]] 按钮。最多标记4个action。不要写多余格式。当用户请求整理故障处理经验时，生成结构化报告，包含：故障概述、影响范围、根因分析、处理步骤、恢复结果、经验总结、预防建议。`
      + (context ? '\n当前页面上下文：' + JSON.stringify(context) : '')
  }
  const fullMessages = [systemMsg, ...(messages || [])]

  let result = await callProvider(ZHIPU_API_KEY, ZHIPU_BASE_URL, ZHIPU_MODEL, fullMessages, { thinking: { type: 'enabled' } })
  if (!result) {
    console.log('[AI Chat] GLM 全部失败, 切换至 Agnes')
    result = await callProvider(AGNES_API_KEY, AGNES_BASE_URL, 'agnes-2.0-flash', fullMessages)
  }

  if (result) {
    const actions = []
    const clean = result.raw.replace(/\[\[action:([^\]]+)\]\]/g, (_, m) => {
      const parts = m.split(':')
      actions.push({ label: parts[0], prompt: parts.slice(1).join(':') || '' })
      return ''
    })
    const replyText = clean.trim() || (actions.length ? `推荐操作：${actions.map(a => a.label).join('、')}` : '')
    return res.json({ reply: replyText, actions: actions.length ? actions : undefined, usage: result.usage })
  }

  res.json({ reply: '', usage: null })
})

// ==================== Helper Functions ====================

// 获取 Embedding 向量
async function getEmbedding(text) {
  // 这里应该调用 OpenAI Embedding API
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  // const response = await openai.embeddings.create({
  //   model: 'text-embedding-3-small',
  //   input: text
  // })
  // return response.data[0].embedding

  // 暂时返回模拟向量 (1536 维)
  const dim = 1536
  const vector = new Array(dim).fill(0).map(() => (Math.random() * 2 - 1) * 0.1)
  return vector
}

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`🚀 服务启动: http://localhost:${PORT}`)
})