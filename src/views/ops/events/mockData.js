export const EVENT_LEVELS = { critical: '紧急', major: '重要', minor: '次要', warning: '提示', info: '信息' }
export const EVENT_LEVEL_COLORS = { critical: '#ff4d4f', major: '#fa8c16', minor: '#1890ff', warning: '#faad14', info: '#999' }
export const SOURCE_TYPES = { 0: '运行日志', 1: '操作日志', 2: '告警', 3: '巡检' }
export const STATUS_MAP = { unprocessed: '未处理', processed: '已处理', ignored: '已忽略' }
export const STATUS_COLORS = { unprocessed: '#fa8c16', processed: '#52c41a', ignored: '#999' }
export const TASK_STATUS = { pending: '待执行', running: '执行中', completed: '已完成', failed: '失败', no_log: '日志不存在', stopped: '已停止' }
export const TASK_STATUS_COLORS = { pending: '#fa8c16', running: '#1890ff', completed: '#52c41a', failed: '#ff4d4f', no_log: '#ff4d4f', stopped: '#999' }

export const MOCK_EVENTS = [
  { id: 'EVT-001', level: 'critical', sourceType: '0', ruleName: 'GaussDB OOM 检测', ciType: 'CLOUD_GAUSSDB_INSTANCE', ciIndex: 'GaussDB', ciName: 'gaussdb-prod-01', sourceHost: 'gaussdb-01', sourceIp: '192.168.1.100', status: 'unprocessed', eventTime: '2026-08-12 14:23:40', rawLog: '2026-08-12 14:23:40 ERROR [worker-1] OutOfMemoryError: Java heap space\n  at com.gaussdb.core.MemoryPool.allocate(MemoryPool.java:128)', logFile: '/var/log/gaussdb/gaussdb.log', lineNum: 128 },
  { id: 'EVT-002', level: 'major', sourceType: '1', ruleName: 'RDS 连接数超限', ciType: 'CLOUD_VM', ciIndex: 'RDS', ciName: 'rds-mysql-01', sourceHost: 'rds-db-01', sourceIp: '192.168.1.101', status: 'processed', eventTime: '2026-08-12 12:10:30', rawLog: '2026-08-12 12:10:30 WARN [conn-pool] Connection pool exhausted: maxActive=100, currentActive=100', logFile: '/data/logs/mysql/mysql.log', lineNum: 2456 },
  { id: 'EVT-003', level: 'minor', sourceType: '2', ruleName: 'ECS 磁盘空间不足', ciType: 'CLOUD_VM', ciIndex: 'ECS', ciName: 'ecs-app-01', sourceHost: 'ecs-host-01', sourceIp: '192.168.1.102', status: 'ignored', eventTime: '2026-08-12 10:05:00', rawLog: '2026-08-12 10:05:00 ALERT Disk usage: /data 88% (threshold: 85%)', logFile: '/var/log/syslog', lineNum: 8921 },
  { id: 'EVT-004', level: 'warning', sourceType: '3', ruleName: '慢查询检测', ciType: 'CLOUD_GAUSSDB_INSTANCE', ciIndex: 'GaussDB', ciName: 'gaussdb-prod-02', sourceHost: 'gaussdb-02', sourceIp: '192.168.1.110', status: 'unprocessed', eventTime: '2026-08-12 09:45:22', rawLog: '2026-08-12 09:45:22 SLOW_QUERY duration=12.34s sql="SELECT * FROM orders WHERE status=1 ORDER BY create_time DESC"', logFile: '/var/log/gaussdb/slow.log', lineNum: 567 },
  { id: 'EVT-005', level: 'critical', sourceType: '0', ruleName: '服务宕机检测', ciType: 'SYS_DeployComponent', ciIndex: '微服务', ciName: 'payment-service', sourceHost: 'k8s-node-01', sourceIp: '192.168.1.200', status: 'unprocessed', eventTime: '2026-08-11 22:15:00', rawLog: '2026-08-11 22:15:00 FATAL Health check failed: payment-service not responding for 30s', logFile: '/var/log/k8s/pod.log', lineNum: 34567 },
  { id: 'EVT-006', level: 'major', sourceType: '0', ruleName: '非法操作检测', ciType: 'SYS_DeployComponent', ciIndex: '微服务', ciName: 'auth-service', sourceHost: 'k8s-node-02', sourceIp: '192.168.1.201', status: 'processed', eventTime: '2026-08-11 18:30:45', rawLog: '2026-08-11 18:30:45 AUDIT Unauthorized access attempt: user=unknown, action=DELETE, resource=/api/admin/users', logFile: '/var/log/auth/audit.log', lineNum: 789 },
  { id: 'EVT-007', level: 'warning', sourceType: '2', ruleName: '内存使用率过高', ciType: 'CLOUD_VM', ciIndex: 'ECS', ciName: 'ecs-mon-01', sourceHost: 'ecs-host-02', sourceIp: '192.168.1.103', status: 'unprocessed', eventTime: '2026-08-11 14:20:00', rawLog: '2026-08-11 14:20:00 WARN Memory usage: 92% (threshold: 90%)', logFile: '/var/log/syslog', lineNum: 15678 },
  { id: 'EVT-008', level: 'minor', sourceType: '1', ruleName: '配置变更检测', ciType: 'SYS_DeployComponent', ciIndex: '微服务', ciName: 'config-service', sourceHost: 'cfg-srv-01', sourceIp: '192.168.1.50', status: 'processed', eventTime: '2026-08-11 11:00:00', rawLog: '2026-08-11 11:00:00 INFO Config changed: db.connection.pool.size 50 -> 100 by admin', logFile: '/var/log/config/change.log', lineNum: 234 },
  { id: 'EVT-009', level: 'critical', sourceType: '0', ruleName: 'GaussDB OOM 检测', ciType: 'CLOUD_GAUSSDB_INSTANCE', ciIndex: 'GaussDB', ciName: 'gaussdb-prod-01', sourceHost: 'gaussdb-01', sourceIp: '192.168.1.100', status: 'unprocessed', eventTime: '2026-08-12 14:25:00', rawLog: '2026-08-12 14:25:00 ERROR [worker-3] OutOfMemoryError: GC overhead limit exceeded', logFile: '/var/log/gaussdb/gaussdb.log', lineNum: 156 },
  { id: 'EVT-010', level: 'major', sourceType: '3', ruleName: 'FusionCare 健康检查异常', ciType: 'CLOUD_GAUSSDB_INSTANCE', ciIndex: 'GaussDB', ciName: 'gaussdb-prod-01', sourceHost: 'gaussdb-01', sourceIp: '192.168.1.100', status: 'unprocessed', eventTime: '2026-08-12 08:30:00', rawLog: '2026-08-12 08:30:00 HEALTH_CHECK FusionCare report: GaussDB instance gaussdb-prod-01 replication lag 120s', logFile: '/var/log/fusioncare/health.log', lineNum: 45 },
  { id: 'EVT-011', level: 'warning', sourceType: '0', ruleName: '连接数增长检测', ciType: 'CLOUD_GAUSSDB_INSTANCE', ciIndex: 'GaussDB', ciName: 'gaussdb-prod-01', sourceHost: 'gaussdb-01', sourceIp: '192.168.1.100', status: 'ignored', eventTime: '2026-08-12 07:15:00', rawLog: '2026-08-12 07:15:00 INFO Connection count: 85, increasing 15% in last 5min', logFile: '/var/log/gaussdb/gaussdb.log', lineNum: 89 },
  { id: 'EVT-012', level: 'minor', sourceType: '2', ruleName: '备份失败检测', ciType: 'CLOUD_VM', ciIndex: 'ECS', ciName: 'ecs-backup-01', sourceHost: 'bk-host-01', sourceIp: '192.168.1.150', status: 'processed', eventTime: '2026-08-11 04:00:00', rawLog: '2026-08-11 04:00:00 ERROR Backup failed: /data/backup disk full, requires 50GB free', logFile: '/var/log/backup/backup.log', lineNum: 321 },
]

export const MOCK_RULES = [
  { id: 1, name: 'GaussDB OOM 检测', template: 'GaussDB 日志采集模板', level: 'critical', sourceType: '0', source: '预置', updateTime: '2026-08-10 10:00:00', checkRules: [{ field: 'logContent', op: 'contains', value: 'OutOfMemoryError', caseSensitive: true }, { field: 'level', op: 'equals', value: 'ERROR' }] },
  { id: 2, name: 'RDS 连接数超限', template: 'RDS 微服务日志模板', level: 'major', sourceType: '0', source: '预置', updateTime: '2026-08-09 15:30:00', checkRules: [{ field: 'logContent', op: 'contains', value: 'Connection pool exhausted', caseSensitive: false }] },
  { id: 3, name: 'ECS 磁盘空间不足', template: 'ECS 主机日志模板', level: 'minor', sourceType: '0', source: '预置', updateTime: '2026-08-08 09:00:00', checkRules: [{ field: 'logContent', op: 'contains', value: 'Disk usage', caseSensitive: false }, { field: 'logFile', op: 'equals', value: '/var/log/syslog' }] },
  { id: 4, name: '慢查询检测', template: 'GaussDB 日志采集模板', level: 'warning', sourceType: '0', source: '自定义', updateTime: '2026-08-07 14:20:00', checkRules: [{ field: 'logContent', op: 'contains', value: 'SLOW_QUERY', caseSensitive: true }] },
  { id: 5, name: '服务宕机检测', template: 'RDS 微服务日志模板', level: 'critical', sourceType: '0', source: '自定义', updateTime: '2026-08-06 11:45:00', checkRules: [{ field: 'logContent', op: 'contains', value: 'Health check failed', caseSensitive: false }, { field: 'level', op: 'equals', value: 'FATAL' }] },
  { id: 6, name: '非法操作检测', template: 'RDS 微服务日志模板', level: 'major', sourceType: '1', source: '自定义', updateTime: '2026-08-05 16:00:00', checkRules: [{ field: 'logContent', op: 'contains', value: 'Unauthorized access', caseSensitive: true }, { field: 'sourceHost', op: 'startsWith', value: 'k8s' }] },
  { id: 7, name: 'FusionCare 健康检查异常', template: 'ECS 主机日志模板', level: 'warning', sourceType: '3', source: '预置', updateTime: '2026-08-04 08:30:00', checkRules: [{ field: 'logContent', op: 'contains', value: 'FusionCare', caseSensitive: true }] },
]

export const MOCK_ALERTS = [
  { id: 1, alarmName: 'GaussDB 内存溢出告警', eventRuleName: 'GaussDB OOM 检测', severity: 'critical', alarmId: 'ALM-001', triggerTimes: 3, triggerPeriod: 60, enabled: true, source: '预置', description: 'GaussDB 实例内存溢出时触发告警', possibleCause: 'JVM 堆内存不足', fixSuggestion: '增加 JVM 堆内存或排查内存泄漏', impact: '数据库服务不可用' },
  { id: 2, alarmName: 'RDS 连接池耗尽告警', eventRuleName: 'RDS 连接数超限', severity: 'major', alarmId: 'ALM-002', triggerTimes: 5, triggerPeriod: 120, enabled: true, source: '预置', description: 'RDS 连接池耗尽时触发告警', possibleCause: '应用连接未释放', fixSuggestion: '检查应用连接池配置', impact: '新连接无法建立' },
  { id: 3, alarmName: 'ECS 磁盘空间告警', eventRuleName: 'ECS 磁盘空间不足', severity: 'minor', alarmId: 'ALM-003', triggerTimes: 2, triggerPeriod: 300, enabled: false, source: '预置', description: 'ECS 磁盘空间不足时触发告警', possibleCause: '日志文件未清理', fixSuggestion: '清理过期日志文件', impact: '服务可能因磁盘满而异常' },
  { id: 4, alarmName: '慢查询告警', eventRuleName: '慢查询检测', severity: 'warning', alarmId: 'ALM-004', triggerTimes: 10, triggerPeriod: 60, enabled: true, source: '自定义', description: '数据库慢查询超过阈值时触发告警', possibleCause: '缺少索引或查询效率低', fixSuggestion: '优化 SQL 或添加索引', impact: '业务响应延迟' },
  { id: 5, alarmName: '服务宕机告警', eventRuleName: '服务宕机检测', severity: 'critical', alarmId: 'ALM-005', triggerTimes: 1, triggerPeriod: 30, enabled: true, source: '自定义', description: '服务健康检查失败时触发告警', possibleCause: '服务进程异常退出', fixSuggestion: '重启服务并排查日志', impact: '业务中断' },
  { id: 6, alarmName: '非法操作告警', eventRuleName: '非法操作检测', severity: 'major', alarmId: 'ALM-006', triggerTimes: 3, triggerPeriod: 60, enabled: false, source: '自定义', description: '检测到非法操作时触发告警', possibleCause: '账号被盗用或权限配置错误', fixSuggestion: '检查账号安全并更新权限', impact: '数据安全风险' },
]

export const MOCK_TRACE_TASKS = [
  { id: 'TRC-001', traceType: 'event', eventId: 'EVT-001', ciType: 'CLOUD_GAUSSDB_INSTANCE', ciIndex: 'GaussDB', ciName: 'gaussdb-prod-01', logFilePath: '/var/log/gaussdb/gaussdb.log', sourceHost: 'gaussdb-01', sourceIp: '192.168.1.100', beforeLines: 5, afterLines: 5, eventTime: '2026-08-12 14:23:40', status: 'completed', resultCount: 128, errorMsg: '', createAt: '2026-08-12 14:30:00', startTime: '2026-08-12 14:30:05', endTime: '2026-08-12 14:30:08' },
  { id: 'TRC-002', traceType: 'event', eventId: 'EVT-002', ciType: 'CLOUD_VM', ciIndex: 'RDS', ciName: 'rds-mysql-01', logFilePath: '/data/logs/mysql/slow.log', sourceHost: 'rds-db-01', sourceIp: '192.168.1.101', beforeLines: 10, afterLines: 10, eventTime: '2026-08-12 12:10:30', status: 'no_log', resultCount: 0, errorMsg: '日志文件不存在或已被清理', createAt: '2026-08-12 12:15:00', startTime: '2026-08-12 12:15:05', endTime: '2026-08-12 12:15:06' },
  { id: 'TRC-003', traceType: 'realtime', eventId: '', ciType: 'CLOUD_VM', ciIndex: 'ECS', ciName: 'ecs-app-01', logFilePath: '/opt/app/logs/app.log', sourceHost: 'ecs-host-01', sourceIp: '192.168.1.102', beforeLines: 0, afterLines: 0, eventTime: '', status: 'stopped', resultCount: 67, errorMsg: '', createAt: '2026-08-12 08:00:00', startTime: '2026-08-12 08:00:10', endTime: '2026-08-12 08:15:10' },
  { id: 'TRC-004', traceType: 'event', eventId: 'EVT-005', ciType: 'SYS_DeployComponent', ciIndex: '微服务', ciName: 'payment-service', logFilePath: '/var/log/k8s/pod.log', sourceHost: 'k8s-node-01', sourceIp: '192.168.1.200', beforeLines: 20, afterLines: 20, eventTime: '2026-08-11 22:15:00', status: 'running', resultCount: 0, errorMsg: '', createAt: '2026-08-12 14:00:00', startTime: '2026-08-12 14:00:05', endTime: '' },
  { id: 'TRC-005', traceType: 'realtime', eventId: '', ciType: 'SYS_DeployComponent', ciIndex: '微服务', ciName: 'oc-service-01', logFilePath: '/home/oc/logs/service.log', sourceHost: 'oc-srv-01', sourceIp: '192.168.1.60', beforeLines: 0, afterLines: 0, eventTime: '', status: 'running', resultCount: 0, errorMsg: '', createAt: '2026-08-12 14:00:00', startTime: '2026-08-12 14:00:10', endTime: '' },
]

export const MOCK_TRACE_LOGS = {
  'TRC-001': [
    { lineNum: 1, content: '2026-08-12 14:23:10 INFO  [main] Starting GaussDB instance...', isEvent: false },
    { lineNum: 2, content: '2026-08-12 14:23:15 INFO  [main] Connection pool initialized', isEvent: false },
    { lineNum: 3, content: '2026-08-12 14:23:20 INFO  [scheduler] Health check passed', isEvent: false },
    { lineNum: 4, content: '2026-08-12 14:23:25 INFO  [worker-1] Processing task #8921', isEvent: false },
    { lineNum: 5, content: '2026-08-12 14:23:30 DEBUG [worker-1] Memory usage: 78%', isEvent: false },
    { lineNum: 6, content: '2026-08-12 14:23:35 INFO  [worker-2] Processing task #8922', isEvent: false },
    { lineNum: 7, content: '2026-08-12 14:23:40 ERROR [worker-1] OutOfMemoryError: Java heap space', isEvent: true },
    { lineNum: 8, content: '2026-08-12 14:23:45 ERROR [worker-1] Unable to allocate new object', isEvent: false },
    { lineNum: 9, content: '2026-08-12 14:23:50 INFO  [scheduler] Triggering OOM detection rule', isEvent: false },
    { lineNum: 10, content: '2026-08-12 14:23:55 WARN  [scheduler] Memory threshold exceeded', isEvent: false },
    { lineNum: 11, content: '2026-08-12 14:24:00 ALERT [monitor] Sending alarm notification', isEvent: false },
    { lineNum: 12, content: '2026-08-12 14:24:05 INFO  [monitor] Alarm sent to alert manager', isEvent: false },
  ],
  'TRC-003': [
    { lineNum: 1, content: '2026-08-12 08:00:10 INFO  [app] Starting real-time trace session', isEvent: false },
    { lineNum: 2, content: '2026-08-12 08:01:00 INFO  [app] Processing request GET /api/orders', isEvent: false },
    { lineNum: 3, content: '2026-08-12 08:02:00 INFO  [app] Processing request POST /api/payment', isEvent: false },
    { lineNum: 4, content: '2026-08-12 08:05:00 INFO  [app] Processing request GET /api/users', isEvent: false },
    { lineNum: 5, content: '2026-08-12 08:10:00 INFO  [app] Processing request PUT /api/config', isEvent: false },
  ],
}

export const MOCK_ANALYSIS = {
  event: { id: 'EVT-001', level: 'critical', ruleName: 'GaussDB OOM 检测', ciName: 'gaussdb-prod-01', ciType: 'CLOUD_GAUSSDB_INSTANCE', eventTime: '2026-08-12 14:23:40' },
  upstream: [
    { objId: 'vm-gaussdb-01', objName: 'vm-gaussdb-01', objType: '虚拟机', relation: '宿主', depth: 1, events: [{ id: 'AEVT-001', level: 'minor', time: '2026-08-12 14:20:00', ruleName: '内存使用率过高' }, { id: 'AEVT-002', level: 'warning', time: '2026-08-12 14:22:00', ruleName: 'CPU 负载过高' }] },
    { objId: 'pm-rack-01', objName: 'pm-rack-01', objType: '物理机', relation: '物理宿主', depth: 2, events: [{ id: 'AEVT-003', level: 'warning', time: '2026-08-12 14:18:00', ruleName: '温度异常检测' }] },
  ],
  current: { objId: 'gaussdb-prod-01', objName: 'gaussdb-prod-01', objType: 'GaussDB 实例', relation: '当前对象', depth: 0, events: [
    { id: 'EVT-011', level: 'warning', time: '2026-08-12 07:15:00', ruleName: '连接数增长检测' },
    { id: 'EVT-010', level: 'major', time: '2026-08-12 08:30:00', ruleName: 'FusionCare 健康检查异常' },
    { id: 'EVT-001', level: 'critical', time: '2026-08-12 14:23:40', ruleName: 'GaussDB OOM 检测' },
  ] },
  downstream: [
    { objId: 'rds-mysql-01', objName: 'rds-mysql-01', objType: 'RDS 实例', relation: '下游依赖', depth: 1, events: [{ id: 'AEVT-004', level: 'major', time: '2026-08-12 14:25:00', ruleName: '连接超时检测' }, { id: 'AEVT-005', level: 'minor', time: '2026-08-12 14:26:00', ruleName: '查询失败检测' }] },
    { objId: 'oc-service-01', objName: 'oc-service-01', objType: 'OC 微服务', relation: '下游依赖', depth: 2, events: [{ id: 'AEVT-006', level: 'major', time: '2026-08-12 14:28:00', ruleName: '服务调用失败' }, { id: 'AEVT-007', level: 'warning', time: '2026-08-12 14:30:00', ruleName: '响应超时检测' }] },
  ],
}

export const MOCK_CHART_DATA = {
  trend: [
    { date: '08-06', critical: 1, major: 3, minor: 8, warning: 45 },
    { date: '08-07', critical: 0, major: 5, minor: 12, warning: 62 },
    { date: '08-08', critical: 2, major: 4, minor: 10, warning: 55 },
    { date: '08-09', critical: 1, major: 6, minor: 15, warning: 78 },
    { date: '08-10', critical: 0, major: 2, minor: 9, warning: 50 },
    { date: '08-11', critical: 3, major: 8, minor: 20, warning: 120 },
    { date: '08-12', critical: 3, major: 5, minor: 18, warning: 109 },
  ],
  source: [
    { type: '运行日志', count: 520, percent: '40.4%' },
    { type: '操作日志', count: 380, percent: '29.5%' },
    { type: '告警', count: 260, percent: '20.2%' },
    { type: '巡检', count: 126, percent: '9.8%' },
  ],
  byLevel: [
    { level: '紧急', count: 3 },
    { level: '重要', count: 28 },
    { level: '次要', count: 156 },
    { level: '提示', count: 1099 },
  ],
  byResource: [
    { name: 'GaussDB 实例', count: 180 },
    { name: 'RDS 实例', count: 145 },
    { name: '微服务', count: 120 },
    { name: '虚拟机', count: 95 },
    { name: '物理机', count: 45 },
    { name: '容器', count: 38 },
    { name: '负载均衡', count: 25 },
    { name: '对象存储', count: 18 },
    { name: '云硬盘', count: 12 },
    { name: '弹性 IP', count: 8 },
  ],
  topRules: [
    { name: 'GaussDB OOM 检测', count: 156 },
    { name: 'RDS 连接数超限', count: 132 },
    { name: 'ECS 磁盘空间不足', count: 98 },
    { name: '慢查询检测', count: 87 },
    { name: '服务宕机检测', count: 65 },
    { name: '非法操作检测', count: 54 },
    { name: 'FusionCare 健康检查异常', count: 42 },
    { name: '内存使用率过高', count: 36 },
    { name: '配置变更检测', count: 28 },
    { name: '备份失败检测', count: 15 },
  ],
}