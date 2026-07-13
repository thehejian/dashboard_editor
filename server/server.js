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
    anomalyScore: 0, history: genHistory(2.0, 2.4) },
  { id: 'waf', label: 'WAF', type: 'security', status: 'normal', layer: 'access',
    metrics: { blocked: '1.2k/min', rules: 847 },
    baseline: { blocked: 800, rules: 847 },
    anomalyScore: 0, history: genHistory(800, 1200) },
  { id: 'slb', label: 'SLB', type: 'lb', status: 'normal', layer: 'access',
    metrics: { qps: '45k', connections: '12k' },
    baseline: { qps: 40000, connections: 10000 },
    anomalyScore: 0, history: genHistory(40000, 45000) },
  // 网关层
  { id: 'lb-api', label: 'API Gateway', type: 'gateway', status: 'warning', layer: 'gateway',
    metrics: { latency: '12ms', errorRate: '2.3%' },
    baseline: { latency: 8, errorRate: 0.1 },
    anomalyScore: 0.62, history: genHistory(8, 12) },
  // 服务层
  { id: 'prod-order-01', label: '订单服务-01', type: 'service', status: 'critical', layer: 'service',
    metrics: { cpu: '97%', memory: '94%', latency: '3200ms' },
    baseline: { cpu: 45, memory: 60, latency: 200 },
    anomalyScore: 0.95, history: genHistory(45, 97) },
  { id: 'prod-order-02', label: '订单服务-02', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '45%', memory: '62%', latency: '85ms' },
    baseline: { cpu: 42, memory: 58, latency: 80 },
    anomalyScore: 0.08, history: genHistory(42, 45) },
  { id: 'prod-order-03', label: '订单服务-03', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '42%', memory: '58%', latency: '80ms' },
    baseline: { cpu: 40, memory: 55, latency: 75 },
    anomalyScore: 0.05, history: genHistory(40, 42) },
  { id: 'prod-user-01', label: '用户服务-01', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '38%', memory: '55%', latency: '45ms' },
    baseline: { cpu: 35, memory: 50, latency: 40 },
    anomalyScore: 0.03, history: genHistory(35, 38) },
  { id: 'prod-user-02', label: '用户服务-02', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '35%', memory: '52%', latency: '42ms' },
    baseline: { cpu: 33, memory: 50, latency: 40 },
    anomalyScore: 0.02, history: genHistory(33, 35) },
  { id: 'prod-pay-01', label: '支付服务-01', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '32%', memory: '48%', latency: '120ms' },
    baseline: { cpu: 30, memory: 45, latency: 100 },
    anomalyScore: 0.04, history: genHistory(30, 32) },
  { id: 'prod-pay-02', label: '支付服务-02', type: 'service', status: 'normal', layer: 'service',
    metrics: { cpu: '30%', memory: '45%', latency: '115ms' },
    baseline: { cpu: 28, memory: 43, latency: 100 },
    anomalyScore: 0.03, history: genHistory(28, 30) },
  { id: 'prod-inventory-01', label: '库存服务-01', type: 'service', status: 'warning', layer: 'service',
    metrics: { cpu: '72%', memory: '68%', latency: '180ms' },
    baseline: { cpu: 40, memory: 55, latency: 60 },
    anomalyScore: 0.71, history: genHistory(40, 72) },
  // 中间件层
  { id: 'redis-cache', label: 'Redis Cluster', type: 'cache', status: 'warning', layer: 'middleware',
    metrics: { hitRate: '72%', memory: '78%', connections: '4.5k' },
    baseline: { hitRate: 95, memory: 55, connections: 3000 },
    anomalyScore: 0.82, history: genHistory(95, 72) },
  { id: 'mysql-master', label: 'MySQL主库', type: 'database', status: 'warning', layer: 'middleware',
    metrics: { qps: '8.5k', connections: '450', ioWait: '65%' },
    baseline: { qps: 6000, connections: 300, ioWait: 15 },
    anomalyScore: 0.68, history: genHistory(15, 65) },
  { id: 'mysql-slave', label: 'MySQL从库', type: 'database', status: 'normal', layer: 'middleware',
    metrics: { qps: '4.2k', connections: '200', replicationLag: '2s' },
    baseline: { qps: 4000, connections: 180, replicationLag: 0.5 },
    anomalyScore: 0.15, history: genHistory(4000, 4200) },
  { id: 'mongodb', label: 'MongoDB', type: 'database', status: 'normal', layer: 'middleware',
    metrics: { connections: '850', oplog: '12k', storage: '45%' },
    baseline: { connections: 800, oplog: 10000, storage: 40 },
    anomalyScore: 0.05, history: genHistory(800, 850) },
  { id: 'nacos', label: 'Nacos', type: 'service', status: 'normal', layer: 'middleware',
    metrics: { services: 42, instances: 128, configHits: '99.8%' },
    baseline: { services: 40, instances: 120, configHits: 99.9 },
    anomalyScore: 0.02, history: genHistory(40, 42) },
  { id: 'mq-order', label: 'RocketMQ', type: 'mq', status: 'normal', layer: 'middleware',
    metrics: { tps: '12k', backlog: '2.3k', consumers: 16 },
    baseline: { tps: 10000, backlog: 500, consumers: 16 },
    anomalyScore: 0.12, history: genHistory(500, 2300) },
  { id: 'es-cluster', label: 'Elasticsearch', type: 'search', status: 'normal', layer: 'middleware',
    metrics: { nodes: 3, indices: 28, queryRate: '5.2k' },
    baseline: { nodes: 3, indices: 25, queryRate: 5000 },
    anomalyScore: 0.04, history: genHistory(5000, 5200) },
  // 基础设施层
  { id: 'k8s-master', label: 'K8s Master', type: 'infra', status: 'normal', layer: 'infra',
    metrics: { cpu: '25%', memory: '40%', pods: 86 },
    baseline: { cpu: 20, memory: 35, pods: 80 },
    anomalyScore: 0.06, history: genHistory(20, 25) },
  { id: 'k8s-node-1', label: 'K8s Node-1', type: 'infra', status: 'normal', layer: 'infra',
    metrics: { cpu: '55%', memory: '68%', pods: 32 },
    baseline: { cpu: 50, memory: 60, pods: 30 },
    anomalyScore: 0.10, history: genHistory(50, 55) },
  { id: 'k8s-node-2', label: 'K8s Node-2', type: 'infra', status: 'warning', layer: 'infra',
    metrics: { cpu: '72%', memory: '85%', pods: 35 },
    baseline: { cpu: 50, memory: 60, pods: 30 },
    anomalyScore: 0.73, history: genHistory(60, 85) },
  { id: 'k8s-node-3', label: 'K8s Node-3', type: 'infra', status: 'normal', layer: 'infra',
    metrics: { cpu: '48%', memory: '58%', pods: 28 },
    baseline: { cpu: 50, memory: 60, pods: 30 },
    anomalyScore: 0.04, history: genHistory(50, 48) },
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

const MOCK_SERVICE_HEALTH = [
  { name: '订单服务', services: [
    { name: 'order-01', status: 'critical', score: 15 },
    { name: 'order-02', status: 'normal', score: 92 },
    { name: 'order-03', status: 'normal', score: 94 },
  ]},
  { name: '支付服务', services: [
    { name: 'pay-01', status: 'normal', score: 95 },
    { name: 'pay-02', status: 'normal', score: 96 },
  ]},
  { name: '用户服务', services: [
    { name: 'user-01', status: 'normal', score: 93 },
    { name: 'user-02', status: 'normal', score: 94 },
  ]},
  { name: '库存服务', services: [
    { name: 'inventory-01', status: 'warning', score: 68 },
  ]},
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
    score: 87, services: MOCK_SERVICE_HEALTH, trend: -5.4,
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
    { metric: 'prod-order-01 CPU', predicted: 99, confidence: 0.88, eta: '10分钟' },
    { metric: 'redis-cache 命中率', predicted: 55, confidence: 0.75, eta: '25分钟' },
    { metric: 'mysql-master IO', predicted: 80, confidence: 0.65, eta: '45分钟' },
  ]}})
})

// GET /api/intelligent/remediation
app.get('/api/intelligent/remediation', (req, res) => {
  res.json({ success: true, data: { rate: 92, total: 8, success: 7 } })
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
  res.json({ success: true, data: {
    nodeId: nodeId || 'prod-order-01',
    signals: [
      { key: 'latency', label: '延迟', unit: 'ms', value: 3200, baseline: 200, deviation: 1500, icon: 'fa-solid fa-clock', status: 'critical', history: [180,195,210,3200,3100,3050,3000] },
      { key: 'traffic', label: '流量', unit: 'QPS', value: 12000, baseline: 8000, deviation: 50, icon: 'fa-solid fa-arrow-right-arrow-left', status: 'warning', history: [7500,7800,8200,11000,12000,11800,11500] },
      { key: 'errors', label: '错误率', unit: '%', value: 2.3, baseline: 0.1, deviation: 2200, icon: 'fa-solid fa-circle-exclamation', status: 'critical', history: [0.08,0.09,0.1,2.3,2.1,1.8,1.5] },
      { key: 'saturation', label: '饱和度', unit: '%', value: 97, baseline: 45, deviation: 115, icon: 'fa-solid fa-gauge-high', status: 'critical', history: [42,44,43,97,95,92,88] },
    ]
  }})
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
    { id: "s7", time: "14:26:00", sort: 7, label: "AI检测", desc: "智能异常检测发现8条异常，prod-order-01得分0.95", nodes: [], edges: [], type: "detection", severity: "info", nodeMetrics: {} },
    { id: "s8", time: "14:27:00", sort: 8, label: "根因定位", desc: "AI拓扑分析确定根因为prod-order-01 CPU死循环/资源泄漏", nodes: ["prod-order-01"], edges: [], type: "diagnosis", severity: "info", nodeMetrics: { "prod-order-01": { cpu: "97%", status: "critical" } } },
    { id: "s9", time: "14:30:00", sort: 9, label: "执行重启", desc: "AI助手自动执行重启订单服务-01，耗时12s", nodes: ["prod-order-01"], edges: [], type: "action", severity: "info", nodeMetrics: {} },
    { id: "s10", time: "14:33:00", sort: 10, label: "服务恢复", desc: "CPU降至45%，响应时间85ms，所有指标回归基线", nodes: ["prod-order-01", "lb-api", "mysql-master", "redis-cache", "prod-inventory-01", "k8s-node-2"], edges: ["e-gw-order1", "e-order1-mysql", "e-order1-redis", "e-slb-gw"], type: "recovery", severity: "success", nodeMetrics: { "prod-order-01": { cpu: "45%", mem: "62%", latency: "85ms", status: "normal" }, "lb-api": { errRate: "0.1%", qps: "8k", status: "normal" }, "mysql-master": { ioWait: "15%", status: "normal" }, "redis-cache": { hitRate: "95%", status: "normal" }, "prod-inventory-01": { cpu: "32%", mem: "55%", status: "normal" }, "k8s-node-2": { cpu: "38%", mem: "48%", status: "normal" } } },
  ]
}

app.get('/api/intelligent/incident-timeline', (req, res) => {
  res.json({ success: true, data: MOCK_INCIDENT_TIMELINE })
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
  const curl = `curl -s --max-time 5 '${baseUrl}/chat/completions' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${apiKey}' -d '${bodyStr.replace(/'/g, "'\\''")}'`

  for (let i = 0; i <= 1; i++) {
    if (i > 0) {
      console.log(`[AI Chat] ${model} 重试 #${i}`)
      await new Promise(r => setTimeout(r, 500))
    }
    try {
      const stdout = await new Promise((resolve, reject) => {
        exec(curl, { timeout: 8000, maxBuffer: 1024 * 1024 }, (err, stdout) => {
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