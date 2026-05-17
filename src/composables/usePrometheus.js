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
  '集群节点数': p => `count(kube_node_info)`,
  'Pod总数': p => `count(kube_pod_info)`,
  '运行中Pod': p => `count(kube_pod_status_phase{phase="Running"})`,
  '异常Pod': p => `count(kube_pod_status_phase{phase!="Running"})`,
  '节点CPU使用率': p => `1 - avg(rate(node_cpu_seconds_total{mode="idle"}[${p}])) * 100`,
  '节点内存使用率': p => `(1 - sum(node_memory_MemAvailable_bytes) / sum(node_memory_MemTotal_bytes)) * 100`,
  '节点磁盘使用率': p => `(1 - sum(node_filesystem_avail_bytes{mountpoint="/"}) / sum(node_filesystem_size_bytes{mountpoint="/"})) * 100`,
  '节点网络流入': p => `sum(rate(node_network_receive_bytes_total[${p}]))`,
  '节点网络流出': p => `sum(rate(node_network_transmit_bytes_total[${p}]))`,
  '节点负载': p => `avg(node_load1)`,
  'Pod运行数': p => `count(kube_pod_status_phase{phase="Running"})`,
  'Pod等待数': p => `count(kube_pod_status_phase{phase="Pending"})`,
  'Pod终止数': p => `count(kube_pod_status_phase{phase="Failed"})`,
  'Pod重启次数': p => `sum(increase(kube_pod_container_status_restarts_total[${p}]))`,
  'OOMKill次数': p => `sum(increase(container_restart_count[${p}]))`,
  'CPUThrottling': p => `sum(rate(container_cpu_cfs_throttled_periods_total[${p}]))`,
  '容器CPU使用率': p => `avg(rate(container_cpu_usage_seconds_total[${p}])) * 100`,
  '容器内存使用率': p => `avg(container_memory_working_set_bytes / container_spec_memory_limit_bytes) * 100`,
  '容器网络流入': p => `sum(rate(container_network_receive_bytes_total[${p}]))`,
  '容器网络流出': p => `sum(rate(container_network_transmit_bytes_total[${p}]))`,
  '容器磁盘读取': p => `sum(rate(container_fs_reads_bytes_total[${p}]))`,
  '容器磁盘写入': p => `sum(rate(container_fs_writes_bytes_total[${p}]))`,
  'Pod网络流入速率': p => `sum(rate(pod_network_receive_bytes_total[${p}]))`,
  'Pod网络流出速率': p => `sum(rate(pod_network_transmit_bytes_total[${p}]))`,
  'Service入口流量': p => `sum(rate(service_cpu_usage_seconds_total[${p}]))`,
  'IngressQPS': p => `sum(rate(nginx_ingress_controller_requests[${p}]))`,
  'Ingress延迟': p => `histogram_quantile(0.99, sum(rate(nginx_ingress_controller_request_duration_seconds_bucket[${p}])) by (le)) * 1000`,
  'Ingress错误率': p => `sum(rate(nginx_ingress_controller_requests{status=~"5.."}[${p}])) / sum(rate(nginx_ingress_controller_requests[${p}])) * 100`,
  'PVC已用容量': p => `sum(kube_persistentvolumeclaim_resource_requests_storage_bytes)`,
  'PVC可用容量': p => `sum(kube_persistentvolumeclaim_status_capacity_storage_bytes) - sum(kube_persistentvolumeclaim_resource_requests_storage_bytes)`,
  '存储请求量': p => `sum(kube_persistentvolumeclaim_resource_requests_storage_bytes)`,
  '存储利用率': p => `sum(kube_persistentvolumeclaim_resource_requests_storage_bytes) / sum(kube_persistentvolumeclaim_status_capacity_storage_bytes) * 100`,
  'Deployment数量': p => `count(kube_deployment_labels)`,
  'StatefulSet数量': p => `count(kube_statefulset_labels)`,
  'DaemonSet数量': p => `count(kube_daemonset_labels)`,
  '滚动更新中': p => `count(kube_workload_metadata_generation > 0)`,
  '就绪副本数': p => `sum(kube_pod_status_ready{condition="true"})`,
  '期望副本数': p => `sum(kube_replicaset_spec_replicas)`,
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

function fmtTime(ts, period = '24h') {
  const d = new Date(ts * 1000)
  if (period === '7d' || period === '30d') {
    const m = d.getMonth() + 1
    const day = d.getDate()
    return `${m}/${day}`
  }
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function unitOf(metric) {
  if (metric.includes('速率') || metric.includes('读取') || metric.includes('写入') || metric.includes('流量') || metric.includes('容量') || metric.includes('网络流入') || metric.includes('网络流出')) return 'MB/s'
  if (metric === '运行时间' || metric.includes('延迟')) return 's'
  if (metric === '系统负载' || metric === '节点负载') return ''
  if (metric.includes('数量') || metric.includes('数') || metric === 'Pod总数' || metric === '运行中Pod' || metric === '异常Pod' || metric === 'Pod运行数' || metric === 'Pod等待数' || metric === 'Pod终止数' || metric === 'Pod重启次数' || metric === 'OOMKill次数' || metric === 'CPUThrottling' || metric === 'Deployment数量' || metric === 'StatefulSet数量' || metric === 'DaemonSet数量' || metric === '滚动更新中' || metric === '就绪副本数' || metric === '期望副本数' || metric === '集群节点数') return ''
  if (metric.includes('延迟')) return 'ms'
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
    time: fmtTime(t, period),
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
