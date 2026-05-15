const INSTANCE = '192.168.0.155:9100'

const METRIC_PROMQL = {
  'CPU使用率': p => `100 - avg(rate(node_cpu_seconds_total{mode="idle",instance="${INSTANCE}"}[${p}])) * 100`,
  '内存使用率': p => `(1 - node_memory_free_bytes{instance="${INSTANCE}"} / node_memory_total_bytes{instance="${INSTANCE}"}) * 100`,
  '系统负载': p => `node_load1{instance="${INSTANCE}"}`,
  '运行时间': p => `node_time_seconds{instance="${INSTANCE}"} - node_boot_time_seconds{instance="${INSTANCE}"}`,
  '磁盘使用率': p => `(1 - node_filesystem_avail_bytes{mountpoint="/",instance="${INSTANCE}"} / node_filesystem_size_bytes{mountpoint="/",instance="${INSTANCE}"}) * 100`,
  '磁盘读取': p => `rate(node_disk_read_bytes_total{instance="${INSTANCE}"}[${p}])`,
  '磁盘写入': p => `rate(node_disk_written_bytes_total{instance="${INSTANCE}"}[${p}])`,
  '网络流入速率': p => `sum(rate(node_network_receive_bytes_total{device!="lo0",instance="${INSTANCE}"}[${p}]))`,
  '网络流出速率': p => `sum(rate(node_network_transmit_bytes_total{device!="lo0",instance="${INSTANCE}"}[${p}]))`,
}

const PERIOD_CFG = {
  now:  { range: 0,       step: 15,  rangeStr: '1m'  },
  '1h': { range: 3600,    step: 30,  rangeStr: '1h'  },
  '6h': { range: 21600,   step: 300, rangeStr: '6h'  },
  '24h':{ range: 86400,   step: 900, rangeStr: '24h' },
  '7d': { range: 604800,  step: 3600,rangeStr: '7d'  },
  '30d':{ range: 2592000, step: 21600,rangeStr:'30d' },
}

async function q(query) {
  const r = await fetch(`/api/v1/query?query=${encodeURIComponent(query)}`)
  const d = await r.json()
  if (d.status !== 'success') throw new Error(d.error || 'query failed')
  return d.data.result
}

async function qr(query, from, to, step) {
  const p = new URLSearchParams({ query, start: from.toString(), end: to.toString(), step: step.toString() })
  const r = await fetch(`/api/v1/query_range?${p}`)
  const d = await r.json()
  if (d.status !== 'success') throw new Error(d.error || 'range query failed')
  return d.data.result
}

function fmtTime(ts) {
  const d = new Date(ts * 1000)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function unitOf(metric) {
  if (metric.includes('速率') || metric.includes('读取') || metric.includes('写入')) return 'MB/s'
  if (metric === '运行时间') return 's'
  if (metric === '系统负载') return ''
  return '%'
}

export async function fetchChartData(chart, period = '24h') {
  const metrics = chart.metrics || []
  if (!metrics.length) return null

  const metricName = metrics[0]
  const fn = METRIC_PROMQL[metricName]
  if (!fn) return null

  const cfg = PERIOD_CFG[period] || PERIOD_CFG['24h']

  if (chart.type === 'numeric' || period === 'now') {
    const results = await q(fn(cfg.rangeStr))
    if (!results.length) return null
    const v = parseFloat(results[0].value[1])
    return {
      lastValue: v,
      points: [{ time: '当前', value: Math.round(v * 10) / 10 }],
      unit: unitOf(metricName),
    }
  }

  const end = Math.floor(Date.now() / 1000)
  const start = end - (cfg.range || 86400)
  const results = await qr(fn(cfg.rangeStr), start, end, cfg.step)

  if (!results.length) return null
  const points = results[0].values.map(([t, v]) => ({
    time: fmtTime(t),
    value: Math.round(parseFloat(v) * 10) / 10,
  }))

  return {
    points,
    lastValue: parseFloat(results[0].values[results[0].values.length - 1][1]),
    unit: unitOf(metricName),
  }
}

export async function fetchSingleMetric(metricName, period = '24h') {
  const fn = METRIC_PROMQL[metricName]
  if (!fn) return null
  const cfg = PERIOD_CFG[period] || PERIOD_CFG['24h']
  const results = await q(fn(cfg.rangeStr))
  if (!results.length) return null
  return parseFloat(results[0].value[1])
}
