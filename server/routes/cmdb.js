import express from 'express'
import { getTable, getSchema } from '../db/mockData.js'

const router = express.Router()

// ---- Whitelist of CMDB tables exposed via API ----
const CMDB_TABLES = [
  'ci_types', 'ci', 'ci_relationships',
  'users', 'roles', 'user_role', 'user_groups', 'resource_groups', 'policies',
  'applications', 'identity_providers', 'integration_accounts',
  'alert_rules', 'alerts',
  'account_policies', 'accounts', 'safeboxes', 'safebox_accounts',
  'snapshots', 'backup_tasks',
  'jobs', 'job_history', 'inspection_plans', 'resource_changes',
  'log_collect_tasks', 'log_forward_tasks', 'log_templates',
  'operation_logs', 'runtime_logs',
  'app_orders', 'todos',
  'topology_zones', 'topology_nodes', 'topology_edges',
  'monitor_metrics', 'app_list',
]

const validTables = new Set(CMDB_TABLES)

// ---- Helpers ----
function validateTable(table) {
  if (!validTables.has(table)) {
    return { valid: false, error: `无效表名: ${table}` }
  }
  return { valid: true }
}

function toSnake(s) {
  return s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
}

function matchesFilter(row, key, val) {
  const value = row[key]
  if (value === undefined || value === null) return false
  return String(value) === String(val)
}

function nextId(table) {
  const rows = getTable(table)
  const max = rows.reduce((m, r) => (Number(r.id) > m ? Number(r.id) : m), 0)
  return max + 1
}

function sortRows(table, rows, sort, order) {
  let col = sort ? toSnake(sort) : 'id'
  if (rows.length && !(col in rows[0])) col = Object.keys(rows[0])[0]
  const dir = order.toUpperCase() === 'DESC' ? -1 : 1
  return [...rows].sort((a, b) => {
    const av = a[col]
    const bv = b[col]
    if (av === bv) return 0
    if (av === undefined || av === null) return 1
    if (bv === undefined || bv === null) return -1
    return av > bv ? dir : -dir
  })
}

// ============ Special Endpoints (before generic :table routes) ============

// GET /api/cmdb/tables
router.get('/tables', async (req, res) => {
  try {
    const schema = getSchema()
    const tableList = CMDB_TABLES.map(t => ({
      name: t,
      columns: (schema[t] || []).map(([column, type, nullable]) => ({ column, type, nullable }))
    }))
    res.json({ success: true, data: tableList, count: tableList.length })
  } catch (err) {
    console.error('获取表列表失败:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cmdb/ci/tree
router.get('/ci/tree', async (req, res) => {
  try {
    const ciTypes = getTable('ci_types')
    const ci = getTable('ci')
    const grouped = {}
    for (const t of ciTypes) {
      grouped[t.id] = {
        type_id: t.id, code: t.code, type_name: t.name, icon: t.icon, items: []
      }
    }
    for (const c of ci) {
      const g = grouped[c.ci_type_id]
      if (!g) continue
      g.items.push({
        id: c.id, name: c.name, identifier: c.identifier,
        ip: c.ip, status: c.status, region: c.region
      })
    }
    for (const g of Object.values(grouped)) {
      g.items.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
    }
    const rows = Object.values(grouped).sort((a, b) => a.type_name.localeCompare(b.type_name, 'zh'))
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('获取CI树失败:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cmdb/alerts/stats
router.get('/alerts/stats', async (req, res) => {
  try {
    const alerts = getTable('alerts')
    const firing = alerts.filter(a => a.status === 'firing')
    const summary = {
      firing_count: firing.length,
      resolved_count: alerts.filter(a => a.status === 'resolved').length,
      suppressed_count: alerts.filter(a => a.status === 'suppressed').length,
      critical_firing: firing.filter(a => a.level === 'critical').length,
      warning_firing: firing.filter(a => a.level === 'warning').length,
      info_firing: firing.filter(a => a.level === 'info').length,
      unlinked_firing_count: firing.filter(a => !a.incident_id).length,
    }

    const byLevelCount = {}
    for (const a of firing) byLevelCount[a.level] = (byLevelCount[a.level] || 0) + 1
    const byLevel = Object.keys(byLevelCount)
      .sort()
      .map(level => ({ level, count: byLevelCount[level] }))

    const byMetric = {}
    for (const a of firing) {
      if (!a.metric) continue
      byMetric[a.metric] = (byMetric[a.metric] || 0) + 1
    }
    const topMetrics = Object.entries(byMetric)
      .map(([metric, count]) => ({ metric, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    res.json({
      success: true,
      data: { summary, byLevel, topMetrics }
    })
  } catch (err) {
    console.error('获取告警统计失败:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cmdb/dashboard/overview
router.get('/dashboard/overview', async (req, res) => {
  try {
    const ci = getTable('ci')
    const alerts = getTable('alerts')
    const users = getTable('users')
    const jobs = getTable('jobs')
    const changes = getTable('resource_changes')

    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
    const recentChanges = changes.filter(c => {
      const t = new Date(c.time).getTime()
      return !isNaN(t) && t >= weekAgo
    }).length

    res.json({
      success: true,
      data: {
        ciTotal: ci.length,
        firingAlerts: alerts.filter(a => a.status === 'firing').length,
        activeUsers: users.filter(u => u.enabled === true).length,
        runningJobs: jobs.filter(j => j.status === 'running').length,
        recentChanges,
      }
    })
  } catch (err) {
    console.error('获取概览失败:', err)
    res.status(500).json({ error: err.message })
  }
})

// ============ AI Aggregation Test Alerts (dynamic timestamps) ============
const AI_TEST_IDS = new Set([17, 18, 19, 20, 21, 22])
const AI_TEST_OFFSETS = { 17: 25, 18: 40, 19: 15, 20: 30, 21: 55, 22: 20 }
function freshTriggerTime(id) {
  if (!AI_TEST_IDS.has(id)) return null
  var mins = AI_TEST_OFFSETS[id] || 30
  var d = new Date(Date.now() - mins * 60000)
  var pad = function(v) { return v < 10 ? '0' + v : '' + v }
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
    pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '+08'
}

// GET /api/cmdb/alerts — overrides generic route to inject dynamic timestamps
router.get('/alerts', async (req, res) => {
  try {
    const rows = getTable('alerts').map(function(a) {
      var ts = freshTriggerTime(a.id)
      return ts ? Object.assign({}, a, { trigger_time: ts }) : a
    })
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============ Generic CRUD (must be after special endpoints) ============

// GET /api/cmdb/:table
router.get('/:table', async (req, res) => {
  const { table } = req.params
  const v = validateTable(table)
  if (!v.valid) return res.status(400).json({ error: v.error })

  try {
    const rows = getTable(table)
    const { page = 1, pageSize = 50, sort, order = 'ASC', ...filters } = req.query

    let filtered = rows
    for (let [key, val] of Object.entries(filters)) {
      if (key === 'page' || key === 'pageSize' || key === 'sort' || key === 'order') continue
      const col = toSnake(key)
      filtered = filtered.filter(r => matchesFilter(r, col, val))
    }

    const total = filtered.length
    const sorted = sortRows(table, filtered, sort, order)
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const data = sorted.slice(offset, offset + parseInt(pageSize))

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    })
  } catch (err) {
    console.error(`查询 ${table} 失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cmdb/:table/:id
router.get('/:table/:id', async (req, res) => {
  const { table, id } = req.params
  const v = validateTable(table)
  if (!v.valid) return res.status(400).json({ error: v.error })

  try {
    const row = getTable(table).find(r => String(r.id) === String(id))
    if (!row) {
      return res.status(404).json({ error: '记录不存在' })
    }
    res.json({ success: true, data: row })
  } catch (err) {
    console.error(`查询 ${table}/${id} 失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/cmdb/:table
router.post('/:table', async (req, res) => {
  const { table } = req.params
  const v = validateTable(table)
  if (!v.valid) return res.status(400).json({ error: v.error })

  try {
    const rows = getTable(table)
    const record = {}
    for (const [key, value] of Object.entries(req.body || {})) {
      record[toSnake(key)] = value
    }
    record.id = nextId(table)
    rows.push(record)
    res.status(201).json({ success: true, data: record })
  } catch (err) {
    console.error(`创建 ${table} 失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/cmdb/:table/:id
router.put('/:table/:id', async (req, res) => {
  const { table, id } = req.params
  const v = validateTable(table)
  if (!v.valid) return res.status(400).json({ error: v.error })

  try {
    const rows = getTable(table)
    const idx = rows.findIndex(r => String(r.id) === String(id))
    if (idx === -1) {
      return res.status(404).json({ error: '记录不存在' })
    }
    for (const [key, value] of Object.entries(req.body || {})) {
      rows[idx][toSnake(key)] = value
    }
    res.json({ success: true, data: rows[idx] })
  } catch (err) {
    console.error(`更新 ${table}/${id} 失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/cmdb/:table/:id
router.delete('/:table/:id', async (req, res) => {
  const { table, id } = req.params
  const v = validateTable(table)
  if (!v.valid) return res.status(400).json({ error: v.error })

  try {
    const rows = getTable(table)
    const idx = rows.findIndex(r => String(r.id) === String(id))
    if (idx === -1) {
      return res.status(404).json({ error: '记录不存在' })
    }
    rows.splice(idx, 1)
    res.json({ success: true, message: '删除成功' })
  } catch (err) {
    console.error(`删除 ${table}/${id} 失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

export default router
