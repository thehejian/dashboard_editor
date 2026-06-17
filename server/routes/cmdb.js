import express from 'express'

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

// ============ Special Endpoints (before generic :table routes) ============

// GET /api/cmdb/tables
router.get('/tables', async (req, res) => {
  try {
    const pool = req.app.locals.pool
    const result = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY($1::text[])
      ORDER BY table_name, ordinal_position
    `, [CMDB_TABLES])

    const grouped = {}
    for (const row of result.rows) {
      if (!grouped[row.table_name]) grouped[row.table_name] = []
      grouped[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES'
      })
    }

    const tableList = CMDB_TABLES.map(t => ({
      name: t,
      columns: grouped[t] || []
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
    const pool = req.app.locals.pool
    const result = await pool.query(`
      SELECT t.id as type_id, t.code, t.name as type_name, t.icon,
             json_agg(json_build_object(
               'id', c.id, 'name', c.name, 'identifier', c.identifier,
               'ip', c.ip, 'status', c.status, 'region', c.region
             ) ORDER BY c.name) as items
      FROM ci c
      JOIN ci_types t ON t.id = c.ci_type_id
      GROUP BY t.id, t.code, t.name, t.icon
      ORDER BY t.name
    `)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('获取CI树失败:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cmdb/alerts/stats
router.get('/alerts/stats', async (req, res) => {
  try {
    const pool = req.app.locals.pool
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'firing') as firing_count,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
        COUNT(*) FILTER (WHERE status = 'suppressed') as suppressed_count,
        COUNT(*) FILTER (WHERE level = 'critical' AND status = 'firing') as critical_firing,
        COUNT(*) FILTER (WHERE level = 'warning' AND status = 'firing') as warning_firing,
        COUNT(*) FILTER (WHERE level = 'info' AND status = 'firing') as info_firing
      FROM alerts
    `)

    const levelResult = await pool.query(`
      SELECT level, COUNT(*) as count
      FROM alerts WHERE status = 'firing'
      GROUP BY level ORDER BY level
    `)

    const topnResult = await pool.query(`
      SELECT metric, COUNT(*) as count
      FROM alerts WHERE status = 'firing'
      GROUP BY metric ORDER BY count DESC LIMIT 5
    `)

    res.json({
      success: true,
      data: {
        summary: result.rows[0],
        byLevel: levelResult.rows,
        topMetrics: topnResult.rows
      }
    })
  } catch (err) {
    console.error('获取告警统计失败:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cmdb/dashboard/overview
router.get('/dashboard/overview', async (req, res) => {
  try {
    const pool = req.app.locals.pool
    const [ciCount, alertCount, userCount, jobCount, changeCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM ci'),
      pool.query('SELECT COUNT(*) as count FROM alerts WHERE status = $1', ['firing']),
      pool.query('SELECT COUNT(*) as count FROM users WHERE enabled = true'),
      pool.query('SELECT COUNT(*) as count FROM jobs WHERE status = $1', ['running']),
      pool.query('SELECT COUNT(*) as count FROM resource_changes WHERE time >= NOW() - INTERVAL \'7 days\''),
    ])

    res.json({
      success: true,
      data: {
        ciTotal: parseInt(ciCount.rows[0].count),
        firingAlerts: parseInt(alertCount.rows[0].count),
        activeUsers: parseInt(userCount.rows[0].count),
        runningJobs: parseInt(jobCount.rows[0].count),
        recentChanges: parseInt(changeCount.rows[0].count),
      }
    })
  } catch (err) {
    console.error('获取概览失败:', err)
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
    const pool = req.app.locals.pool
    const { page = 1, pageSize = 50, sort, order = 'ASC', ...filters } = req.query

    const whereClauses = []
    const params = []
    let idx = 1
    for (let [key, val] of Object.entries(filters)) {
      if (key === 'page' || key === 'pageSize' || key === 'sort' || key === 'order') continue
      whereClauses.push(`"${toSnake(key)}" = $${idx}`)
      params.push(val)
      idx++
    }

    let orderClause = `"id" ASC`
    if (sort) {
      const sortCol = toSnake(sort)
      const dir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      orderClause = `"${sortCol}" ${dir}`
    }

    const countQuery = `SELECT COUNT(*) as total FROM "${table}"${whereClauses.length ? ' WHERE ' + whereClauses.join(' AND ') : ''}`
    const countResult = await pool.query(countQuery, params)
    const total = parseInt(countResult.rows[0].total)

    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const dataQuery = `SELECT * FROM "${table}"${whereClauses.length ? ' WHERE ' + whereClauses.join(' AND ') : ''} ORDER BY ${orderClause} LIMIT $${idx} OFFSET $${idx + 1}`
    const dataResult = await pool.query(dataQuery, [...params, parseInt(pageSize), offset])

    res.json({
      success: true,
      data: dataResult.rows,
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
    const pool = req.app.locals.pool
    const result = await pool.query(`SELECT * FROM "${table}" WHERE id = $1`, [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' })
    }
    res.json({ success: true, data: result.rows[0] })
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
    const pool = req.app.locals.pool
    const body = req.body
    const keys = Object.keys(body)
    const values = Object.values(body)
    const cols = keys.map(k => `"${toSnake(k)}"`).join(', ')
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const result = await pool.query(
      `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`,
      values
    )
    res.status(201).json({ success: true, data: result.rows[0] })
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
    const pool = req.app.locals.pool
    const body = req.body
    const keys = Object.keys(body)
    const values = Object.values(body)
    const setClause = keys.map((k, i) => `"${toSnake(k)}" = $${i + 1}`).join(', ')
    const result = await pool.query(
      `UPDATE "${table}" SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' })
    }
    res.json({ success: true, data: result.rows[0] })
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
    const pool = req.app.locals.pool
    const result = await pool.query(`DELETE FROM "${table}" WHERE id = $1 RETURNING id`, [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' })
    }
    res.json({ success: true, message: '删除成功' })
  } catch (err) {
    console.error(`删除 ${table}/${id} 失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

export default router
