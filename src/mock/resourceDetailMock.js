export const TOPO_MOCK = {
  nodes: [
    { id: 'current', label: '订单服务中心', type: 'service', status: 'warning', ip: '10.0.1.15', metrics: { cpu: '87%', mem: '92%', latency: '245ms' } },
    { id: 'gateway', label: 'API 网关', type: 'gateway', status: 'normal', ip: '10.0.3.11' },
    { id: 'auth', label: '用户认证中心', type: 'service', status: 'normal', ip: '10.0.1.20' },
    { id: 'payment', label: '支付网关', type: 'service', status: 'normal', ip: '10.0.1.30' },
    { id: 'redis', label: 'Redis 缓存', type: 'cache', status: 'normal', ip: '10.0.4.20' },
    { id: 'mysql', label: 'MySQL 主库', type: 'database', status: 'warning', ip: '10.0.2.31' },
    { id: 'kafka', label: 'Kafka MQ', type: 'mq', status: 'normal', ip: '10.0.6.70' },
    { id: 'cdn', label: 'CDN', type: 'infra', status: 'normal' },
    { id: 'slb', label: 'SLB', type: 'infra', status: 'normal' },
    { id: 'oss', label: 'OBS 存储', type: 'storage', status: 'normal' },
  ],
  edges: [
    { source: 'cdn', target: 'slb', label: 'HTTPS' },
    { source: 'slb', target: 'gateway', label: 'HTTP' },
    { source: 'gateway', target: 'current', label: 'REST' },
    { source: 'gateway', target: 'auth', label: 'gRPC' },
    { source: 'current', target: 'redis', label: 'TCP 6379' },
    { source: 'current', target: 'mysql', label: 'TCP 3306' },
    { source: 'current', target: 'payment', label: 'gRPC' },
    { source: 'current', target: 'kafka', label: 'TCP 9092' },
    { source: 'current', target: 'oss', label: 'HTTPS' },
  ],
}

export const ALARM_MOCK = [
  { id: 1, level: 'critical', title: 'CPU使用率超过90%', resource: '订单服务中心', metric: 'CPU使用率', currentValue: '95%', threshold: '> 90%', duration: '5分钟', triggerTime: '2026-07-31 10:32:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查异常进程\n2. 查看慢查询\n3. 重启服务' },
  { id: 2, level: 'critical', title: '内存使用率超过90%', resource: '订单服务中心', metric: '内存使用率', currentValue: '92%', threshold: '> 90%', duration: '20分钟', triggerTime: '2026-07-31 10:15:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查JVM堆内存\n2. 分析内存泄漏\n3. 调整限制' },
  { id: 3, level: 'critical', title: '响应时间严重超时', resource: '订单服务中心', metric: '响应时间', currentValue: '245ms', threshold: '> 200ms', duration: '35分钟', triggerTime: '2026-07-31 09:57:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查下游服务延迟\n2. 分析慢请求链路\n3. 扩容实例' },
]

export const TRACE_MOCK = {
  traceId: 'abc123def456',
  rootOperation: 'POST /api/order/create',
  service: 'order-service',
  duration: '245ms',
  spanCount: 12,
  startTime: '2026-07-31 10:32:00.123',
  spans: [
    { id: 's1', operation: 'POST /api/order/create', service: 'order-service', duration: 245, startTime: 0, status: 'ok', color: '#1890ff', depth: 0 },
    { id: 's2', operation: 'auth.validate', service: 'auth-center', duration: 32, startTime: 5, status: 'ok', color: '#52c41a', parent: 's1', depth: 1 },
    { id: 's3', operation: 'redis.get session', service: 'redis-cluster', duration: 3, startTime: 8, status: 'ok', color: '#fa8c16', parent: 's2', depth: 2 },
    { id: 's4', operation: 'mysql.query user', service: 'mysql-primary', duration: 12, startTime: 12, status: 'ok', color: '#f5222d', parent: 's2', depth: 2 },
    { id: 's5', operation: 'inventory.check', service: 'inventory-service', duration: 45, startTime: 40, status: 'ok', color: '#722ed1', parent: 's1', depth: 1 },
    { id: 's6', operation: 'redis.get stock', service: 'redis-cluster', duration: 4, startTime: 42, status: 'ok', color: '#fa8c16', parent: 's5', depth: 2 },
    { id: 's7', operation: 'mysql.query sku', service: 'mysql-primary', duration: 18, startTime: 48, status: 'ok', color: '#f5222d', parent: 's5', depth: 2 },
    { id: 's8', operation: 'payment.charge', service: 'payment-gw', duration: 120, startTime: 90, status: 'ok', color: '#13c2c2', parent: 's1', depth: 1 },
    { id: 's9', operation: 'http POST /pay/execute', service: 'payment-gw', duration: 95, startTime: 95, status: 'ok', color: '#13c2c2', parent: 's8', depth: 2 },
    { id: 's10', operation: 'mysql.insert order', service: 'mysql-primary', duration: 25, startTime: 215, status: 'ok', color: '#f5222d', parent: 's1', depth: 1 },
    { id: 's11', operation: 'kafka.produce order.created', service: 'kafka-mq', duration: 8, startTime: 220, status: 'ok', color: '#eb2f96', parent: 's1', depth: 1 },
    { id: 's12', operation: 'http.notify callback', service: 'callback-service', duration: 15, startTime: 230, status: 'error', color: '#ff4d4f', parent: 's1', depth: 1, error: 'Connection refused: callback-service:8080' },
  ],
}

export const LOG_MOCK = [
  { id: 1, level: 'error', time: '10:32:05.123', service: 'order-service', message: 'POST /api/order/create failed: Connection refused to callback-service:8080', traceId: 'abc123def456', host: '10.0.1.15', extra: { method: 'POST', path: '/api/order/create', status: 502, latency: '245ms' } },
  { id: 2, level: 'warn', time: '10:32:04.890', service: 'order-service', message: 'High memory usage detected: 92% (threshold: 80%)', traceId: 'abc123def456', host: '10.0.1.15', extra: { memUsage: '92%', threshold: '80%' } },
  { id: 3, level: 'info', time: '10:32:03.456', service: 'order-service', message: 'Order created successfully: orderId=ORD-2026-7890, amount=¥299.00', traceId: 'abc123def456', host: '10.0.1.15', extra: { orderId: 'ORD-2026-7890', amount: 299 } },
  { id: 4, level: 'info', time: '10:32:03.200', service: 'payment-gw', message: 'Payment processed: txId=TX-88901, status=success, latency=95ms', traceId: 'abc123def456', host: '10.0.1.30', extra: { txId: 'TX-88901', status: 'success' } },
  { id: 5, level: 'debug', time: '10:32:02.100', service: 'auth-center', message: 'Session validated: userId=U-5523, ttl=3600s', traceId: 'abc123def456', host: '10.0.1.20', extra: { userId: 'U-5523' } },
  { id: 6, level: 'info', time: '10:32:01.500', service: 'order-service', message: 'Request received: POST /api/order/create from 10.0.3.11', traceId: 'abc123def456', host: '10.0.1.15', extra: { clientIp: '10.0.3.11' } },
  { id: 7, level: 'warn', time: '10:31:58.200', service: 'mysql-primary', message: 'Slow query detected: SELECT * FROM orders WHERE user_id=? (18ms)', traceId: '', host: '10.0.2.31', extra: { query: 'SELECT * FROM orders', latency: '18ms' } },
  { id: 8, level: 'debug', time: '10:31:55.000', service: 'redis-cluster', message: 'Cache hit: key=session:U-5523, ttl=3598s', traceId: '', host: '10.0.4.20', extra: { key: 'session:U-5523' } },
  { id: 9, level: 'info', time: '10:31:50.100', service: 'kafka-mq', message: 'Partition assigned: topic=order-events, partition=3, consumer=order-consumer-group', traceId: '', host: '10.0.6.70', extra: { topic: 'order-events', partition: 3 } },
  { id: 10, level: 'error', time: '10:31:45.300', service: 'callback-service', message: 'Connection refused: callback-service:8080 - health check failed', traceId: '', host: '10.0.8.10', extra: { port: 8080, reason: 'health check failed' } },
]

export const OPERATIONS_MOCK = [
  { key: 'auto-job', title: '自动作业', icon: 'fa-solid fa-robot', desc: '执行预定义运维脚本',
    items: [
      { name: '重启应用服务', desc: '优雅重启当前服务实例', action: 'restart' },
      { name: '清理临时文件', desc: '清理 /tmp 和日志归档', action: 'cleanup' },
      { name: '健康检查', desc: '执行全量健康探针', action: 'healthcheck' },
    ] },
  { key: 'net-probe', title: '网络探测', icon: 'fa-solid fa-network-wired', desc: '网络连通性与延迟检测',
    items: [
      { name: 'Ping 检测', desc: 'ICMP 连通性测试', action: 'ping' },
      { name: 'Traceroute', desc: '路由追踪分析', action: 'traceroute' },
      { name: 'DNS 解析', desc: '域名解析检测', action: 'dns' },
    ] },
  { key: 'dial-test', title: '拨测任务', icon: 'fa-solid fa-tower-broadcast', desc: 'HTTP/TCP/ICMP 外部拨测',
    items: [
      { name: 'HTTP 拨测', desc: '检测接口可用性与响应时间', action: 'http-dial' },
      { name: 'TCP 端口拨测', desc: '检测端口可达性', action: 'tcp-dial' },
    ] },
  { key: 'host-locate', title: '异常主机定位', icon: 'fa-solid fa-crosshairs', desc: '基于指标偏差定位异常主机',
    items: [
      { name: 'CPU 异常定位', desc: '查找 CPU 偏离基线的主机', action: 'cpu-locate' },
      { name: '内存异常定位', desc: '查找内存泄漏主机', action: 'mem-locate' },
      { name: '磁盘异常定位', desc: '查找 IO 瓶颈主机', action: 'disk-locate' },
    ] },
]
