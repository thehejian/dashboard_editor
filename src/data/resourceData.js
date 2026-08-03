export const subTabMap = {
  all: [
    { label: '全部' },
  ],
  app: [
    { label: '全部' },
    { label: '核心服务', subType: '核心服务' },
    { label: '重要应用', subType: '重要应用' },
    { label: '普通应用', subType: '普通应用' },
  ],
  cloud: [
    { label: '全部' },
    { label: '计算服务', subType: '计算服务' },
    { label: '存储服务', subType: '存储服务' },
    { label: '网络服务', subType: '网络服务' },
    { label: '数据库', subType: '数据库' },
    { label: '容器服务', subType: '容器服务' },
    { label: '中间件', subType: '中间件' },
    { label: '大数据', subType: '大数据' },
    { label: '安全服务', subType: '安全服务' },
  ],
  'cloud-resource': [
    { label: '全部' },
    { label: '弹性云服务器', subType: '弹性云服务器' },
    { label: '裸金属服务器', subType: '裸金属服务器' },
    { label: 'GPU云服务器', subType: 'GPU云服务器' },
    { label: '专属主机', subType: '专属主机' },
    { label: '弹性伸缩', subType: '弹性伸缩' },
    { label: '镜像服务', subType: '镜像服务' },
  ],
  virtual: [
    { label: '全部' },
    { label: 'Kubernetes集群', subType: 'Kubernetes集群' },
    { label: '容器实例', subType: '容器实例' },
    { label: 'Serverless函数', subType: 'Serverless函数' },
  ],
  physical: [
    { label: '全部' },
    { label: '物理服务器', subType: '物理服务器' },
    { label: '网络设备', subType: '网络设备' },
    { label: '存储设备', subType: '存储设备' },
  ],
}

export const mainTabs = [
  { key: 'all', label: '全部' },
  { key: 'app', label: '业务应用' },
  { key: 'cloud', label: '云服务' },
  { key: 'cloud-resource', label: '云资源' },
  { key: 'virtual', label: '虚拟资源池' },
  { key: 'physical', label: '物理资源' },
]

export const appData = [
  { id: 1, name: '订单服务中心', alertStatus: '紧急', identifier: 'order-svc-prod-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '张伟', source: '运营', type: 'app', metrics: { cpu: 87, memory: 92, requests: 1560, errorRate: 3.2, responseTime: 245, connections: 128 } },
  { id: 2, name: '用户认证中心', alertStatus: '正常', identifier: 'auth-center-prod-02', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '李娜', source: '运营', type: 'app', metrics: { cpu: 23, memory: 45, requests: 420, errorRate: 0.1, responseTime: 32, connections: 56 } },
  { id: 3, name: '支付网关服务', alertStatus: '正常', identifier: 'payment-gw-prod-03', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '--', source: '运营', type: 'app', metrics: { cpu: 45, memory: 62, requests: 780, errorRate: 0.5, responseTime: 68, connections: 89 } },
  { id: 4, name: '消息推送平台', alertStatus: '正常', identifier: 'push-platform-prod-04', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '王强', source: '运营', type: 'app', metrics: { cpu: 12, memory: 34, requests: 230, errorRate: 0.0, responseTime: 18, connections: 34 } },
  { id: 5, name: '日志采集服务', alertStatus: '正常', identifier: 'log-collector-prod-05', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '--', source: '运营', type: 'app', metrics: { cpu: 67, memory: 78, requests: 1100, errorRate: 1.8, responseTime: 120, connections: 92 } },
  { id: 6, name: '数据同步引擎', alertStatus: '正常', identifier: 'data-sync-prod-06', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '赵敏', source: '运营', type: 'app', metrics: { cpu: 34, memory: 51, requests: 560, errorRate: 0.3, responseTime: 45, connections: 67 } },
  { id: 7, name: '配置管理中心', alertStatus: '正常', identifier: 'config-center-prod-07', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 8, memory: 22, requests: 180, errorRate: 0.0, responseTime: 15, connections: 28 } },
  { id: 8, name: 'API网关服务', alertStatus: '正常', identifier: 'api-gw-prod-08', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '平台组', source: '运营', type: 'app', metrics: { cpu: 56, memory: 68, requests: 2300, errorRate: 0.8, responseTime: 42, connections: 156 } },
  { id: 9, name: '缓存集群管理', alertStatus: '正常', identifier: 'redis-cluster-09', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: 'DBA团队', source: '运营', type: 'app', metrics: { cpu: 38, memory: 82, requests: 8900, errorRate: 0.0, responseTime: 3, connections: 320 } },
  { id: 10, name: '搜索引擎服务', alertStatus: '正常', identifier: 'es-search-10', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '搜索团队', source: '运营', type: 'app', metrics: { cpu: 62, memory: 75, requests: 3400, errorRate: 0.2, responseTime: 28, connections: 98 } },
  { id: 11, name: '文件存储网关', alertStatus: '紧急', identifier: 'file-gw-11', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '--', source: '运营', type: 'app', metrics: { cpu: 91, memory: 88, requests: 560, errorRate: 5.1, responseTime: 890, connections: 45 } },
  { id: 12, name: '邮件通知服务', alertStatus: '正常', identifier: 'email-notify-12', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 5, memory: 18, requests: 120, errorRate: 0.0, responseTime: 220, connections: 12 } },
  { id: 13, name: '定时任务调度器', alertStatus: '正常', identifier: 'scheduler-13', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '平台组', source: '运营', type: 'app', metrics: { cpu: 28, memory: 42, requests: 890, errorRate: 0.1, responseTime: 12, connections: 34 } },
  { id: 14, name: '监控数据采集', alertStatus: '正常', identifier: 'monitor-collector-14', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '运维团队', source: '运营', type: 'app', metrics: { cpu: 45, memory: 56, requests: 4500, errorRate: 0.0, responseTime: 8, connections: 67 } },
  { id: 15, name: '告警聚合引擎', alertStatus: '正常', identifier: 'alert-engine-15', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '运维团队', source: '运营', type: 'app', metrics: { cpu: 32, memory: 48, requests: 1200, errorRate: 0.3, responseTime: 35, connections: 45 } },
  { id: 16, name: '审批流程服务', alertStatus: '正常', identifier: 'approval-svc-16', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 15, memory: 28, requests: 340, errorRate: 0.0, responseTime: 95, connections: 23 } },
  { id: 17, name: '工单系统服务', alertStatus: '正常', identifier: 'ticket-svc-17', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 22, memory: 35, requests: 450, errorRate: 0.1, responseTime: 68, connections: 34 } },
  { id: 18, name: '知识图谱引擎', alertStatus: '正常', identifier: 'kg-engine-18', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: 'AI团队', source: '运营', type: 'app', metrics: { cpu: 78, memory: 85, requests: 670, errorRate: 0.8, responseTime: 340, connections: 56 } },
  { id: 19, name: '实时流处理', alertStatus: '紧急', identifier: 'stream-proc-19', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-SH-02', owner: '大数据团队', source: '运营', type: 'app', metrics: { cpu: 95, memory: 91, requests: 12000, errorRate: 2.1, responseTime: 15, connections: 234 } },
  { id: 20, name: '报表生成服务', alertStatus: '正常', identifier: 'report-gen-20', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 18, memory: 32, requests: 230, errorRate: 0.0, responseTime: 450, connections: 18 } },
  { id: 21, name: '消息队列管理', alertStatus: '正常', identifier: 'mq-admin-21', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '平台组', source: '运营', type: 'app', metrics: { cpu: 42, memory: 65, requests: 8900, errorRate: 0.0, responseTime: 2, connections: 189 } },
  { id: 22, name: 'CDN调度服务', alertStatus: '正常', identifier: 'cdn-dispatch-22', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '网络团队', source: '运营', type: 'app', metrics: { cpu: 35, memory: 48, requests: 5600, errorRate: 0.1, responseTime: 8, connections: 456 } },
  { id: 23, name: '负载均衡控制器', alertStatus: '正常', identifier: 'lb-controller-23', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '网络团队', source: '运营', type: 'app', metrics: { cpu: 28, memory: 42, requests: 23000, errorRate: 0.0, responseTime: 1, connections: 1234 } },
  { id: 24, name: 'SSL证书管理', alertStatus: '正常', identifier: 'ssl-mgr-24', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 3, memory: 12, requests: 45, errorRate: 0.0, responseTime: 120, connections: 8 } },
  { id: 25, name: '容器镜像仓库', alertStatus: '正常', identifier: 'registry-25', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-SH-02', owner: '容器团队', source: '运营', type: 'app', metrics: { cpu: 48, memory: 72, requests: 1800, errorRate: 0.2, responseTime: 85, connections: 67 } },
  { id: 26, name: 'CI/CD流水线', alertStatus: '正常', identifier: 'cicd-pipeline-26', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: 'DevOps团队', source: '运营', type: 'app', metrics: { cpu: 55, memory: 68, requests: 340, errorRate: 1.2, responseTime: 1200, connections: 23 } },
  { id: 27, name: '配置下发中心', alertStatus: '正常', identifier: 'config-dispatch-27', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 12, memory: 25, requests: 560, errorRate: 0.0, responseTime: 18, connections: 45 } },
  { id: 28, name: '服务注册发现', alertStatus: '正常', identifier: 'service-discovery-28', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '平台组', source: '运营', type: 'app', metrics: { cpu: 32, memory: 45, requests: 12000, errorRate: 0.0, responseTime: 2, connections: 567 } },
  { id: 29, name: '链路追踪系统', alertStatus: '正常', identifier: 'trace-sys-29', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '运维团队', source: '运营', type: 'app', metrics: { cpu: 42, memory: 58, requests: 3400, errorRate: 0.1, responseTime: 12, connections: 89 } },
  { id: 30, name: '审计日志服务', alertStatus: '正常', identifier: 'audit-log-30', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '安全团队', source: '运营', type: 'app', metrics: { cpu: 28, memory: 42, requests: 2100, errorRate: 0.0, responseTime: 25, connections: 34 } },
  { id: 31, name: '权限管理中心', alertStatus: '正常', identifier: 'perm-mgr-31', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '安全团队', source: '运营', type: 'app', metrics: { cpu: 18, memory: 32, requests: 890, errorRate: 0.0, responseTime: 15, connections: 56 } },
  { id: 32, name: '数据脱敏服务', alertStatus: '正常', identifier: 'mask-svc-32', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '安全团队', source: '运营', type: 'app', metrics: { cpu: 35, memory: 48, requests: 450, errorRate: 0.3, responseTime: 68, connections: 23 } },
  { id: 33, name: '备份恢复服务', alertStatus: '正常', identifier: 'backup-svc-33', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '存储团队', source: '运营', type: 'app', metrics: { cpu: 22, memory: 38, requests: 180, errorRate: 0.5, responseTime: 2400, connections: 12 } },
  { id: 34, name: '数据湖查询引擎', alertStatus: '正常', identifier: 'lake-query-34', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '大数据团队', source: '运营', type: 'app', metrics: { cpu: 72, memory: 85, requests: 2300, errorRate: 0.8, responseTime: 560, connections: 78 } },
  { id: 35, name: '机器学习平台', alertStatus: '正常', identifier: 'ml-platform-35', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: 'AI团队', source: '运营', type: 'app', metrics: { cpu: 88, memory: 92, requests: 560, errorRate: 1.5, responseTime: 1200, connections: 34 } },
  { id: 36, name: '物联网接入网关', alertStatus: '正常', identifier: 'iot-gw-36', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: 'IoT团队', source: '运营', type: 'app', metrics: { cpu: 45, memory: 58, requests: 34000, errorRate: 0.0, responseTime: 5, connections: 2345 } },
  { id: 37, name: '消息推送服务', alertStatus: '正常', identifier: 'push-svc-37', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 25, memory: 38, requests: 1200, errorRate: 0.2, responseTime: 45, connections: 56 } },
  { id: 38, name: '国际化服务', alertStatus: '正常', identifier: 'i18n-svc-38', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '--', source: '运营', type: 'app', metrics: { cpu: 8, memory: 18, requests: 340, errorRate: 0.0, responseTime: 12, connections: 23 } },
  { id: 39, name: '灰度发布控制器', alertStatus: '正常', identifier: 'canary-ctrl-39', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: 'DevOps团队', source: '运营', type: 'app', metrics: { cpu: 18, memory: 32, requests: 230, errorRate: 0.0, responseTime: 25, connections: 18 } },
  { id: 40, name: '自动化运维平台', alertStatus: '正常', identifier: 'autoops-40', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '运维团队', source: '运营', type: 'app', metrics: { cpu: 52, memory: 65, requests: 1800, errorRate: 0.1, responseTime: 35, connections: 89 } },
]

export const cloudServiceData = [
  { id: 101, name: '弹性云服务器-生产集群', alertStatus: '正常', identifier: 'ecs-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '云平台团队', source: '云服务', type: 'cloud', subType: '计算服务', metrics: { cpu: 62, memory: 71, requests: 3400, errorRate: 0.1, responseTime: 12, connections: 156 } },
  { id: 102, name: '弹性云服务器-开发集群', alertStatus: '正常', identifier: 'ecs-dev-02', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '云平台团队', source: '云服务', type: 'cloud', subType: '计算服务', metrics: { cpu: 35, memory: 48, requests: 1200, errorRate: 0.0, responseTime: 18, connections: 67 } },
  { id: 103, name: 'GPU加速云服务器-训练', alertStatus: '紧急', identifier: 'gacs-train-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-GZ-03', owner: 'AI团队', source: '云服务', type: 'cloud', subType: '计算服务', metrics: { cpu: 92, memory: 88, requests: 450, errorRate: 2.1, responseTime: 340, connections: 23 } },
  { id: 104, name: '裸金属服务器-数据库', alertStatus: '正常', identifier: 'bms-db-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-SH-02', owner: 'DBA团队', source: '云服务', type: 'cloud', subType: '计算服务', metrics: { cpu: 78, memory: 85, requests: 8900, errorRate: 0.0, responseTime: 3, connections: 320 } },
  { id: 105, name: 'OBS-生产存储', alertStatus: '正常', identifier: 'obs-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '11.68 TB', vdc: 'VDC-BJ-01', owner: '存储团队', source: '云服务', type: 'cloud', subType: '存储服务', obs: { buckets: 8, objects: '1,285,432', usedStorage: '4.28 TB', availStorage: '92.78 TB', totalRequests: '3,450,892', readRequests: '2,180,456', writeRequests: '1,270,436', downTraffic: '2.57 GB/s', upTraffic: '530 KB/s', storageUtil: 78, topBuckets: [{ name: 'bucket-data-01', size: '4.28 TB', pct: 78 }, { name: 'bucket-log-01', size: '2.15 TB', pct: 45 }, { name: 'bucket-backup-01', size: '1.87 TB', pct: 38 }, { name: 'bucket-media-01', size: '1.24 TB', pct: 26 }, { name: 'bucket-archive-01', size: '0.89 TB', pct: 18 }] } },
  { id: 106, name: 'OBS-灾备存储', alertStatus: '正常', identifier: 'obs-dr-02', runStatus: '运行中', appLevel: '核心服务', storageSize: '8.45 TB', vdc: 'VDC-SH-02', owner: '存储团队', source: '云服务', type: 'cloud', subType: '存储服务', obs: { buckets: 5, objects: '654,321', usedStorage: '2.87 TB', availStorage: '45.22 TB', totalRequests: '892,156', readRequests: '534,289', writeRequests: '357,867', downTraffic: '890 MB/s', upTraffic: '210 KB/s', storageUtil: 32, topBuckets: [{ name: 'bucket-dr-data-01', size: '1.45 TB', pct: 52 }, { name: 'bucket-dr-log-01', size: '0.78 TB', pct: 28 }, { name: 'bucket-dr-backup-01', size: '0.64 TB', pct: 22 }] } },
  { id: 107, name: 'OBS-日志归档', alertStatus: '紧急', identifier: 'obs-log-03', runStatus: '运行中', appLevel: '基础服务', storageSize: '6.12 TB', vdc: 'VDC-GZ-03', owner: '--', source: '云服务', type: 'cloud', subType: '存储服务', obs: { buckets: 3, objects: '456,789', usedStorage: '3.56 TB', availStorage: '35.78 TB', totalRequests: '1,234,567', readRequests: '723,456', writeRequests: '511,111', downTraffic: '1.2 GB/s', upTraffic: '340 KB/s', storageUtil: 85, topBuckets: [{ name: 'bucket-log-access', size: '2.15 TB', pct: 85 }, { name: 'bucket-log-audit', size: '0.98 TB', pct: 42 }, { name: 'bucket-log-ops', size: '0.43 TB', pct: 18 }] } },
  { id: 108, name: '云硬盘-EVS数据盘', alertStatus: '正常', identifier: 'evs-data-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '2.4 TB', vdc: 'VDC-BJ-01', owner: '存储团队', source: '云服务', type: 'cloud', subType: '存储服务' },
  { id: 109, name: '弹性文件服务-SFS', alertStatus: '正常', identifier: 'sfs-shared-01', runStatus: '运行中', appLevel: '普通应用', storageSize: '5.8 TB', vdc: 'VDC-BJ-01', owner: '存储团队', source: '云服务', type: 'cloud', subType: '存储服务' },
  { id: 110, name: '虚拟私有云-VPC生产', alertStatus: '正常', identifier: 'vpc-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '网络团队', source: '云服务', type: 'cloud', subType: '网络服务' },
  { id: 111, name: '弹性负载均衡-ELB', alertStatus: '正常', identifier: 'elb-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '网络团队', source: '云服务', type: 'cloud', subType: '网络服务', metrics: { cpu: 28, memory: 35, requests: 23000, errorRate: 0.0, responseTime: 1, connections: 1234 } },
  { id: 112, name: 'NAT网关-出口', alertStatus: '正常', identifier: 'nat-edge-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '网络团队', source: '云服务', type: 'cloud', subType: '网络服务', metrics: { cpu: 15, memory: 22, requests: 5600, errorRate: 0.0, responseTime: 5, connections: 456 } },
  { id: 113, name: '云数据库-RDS MySQL', alertStatus: '紧急', identifier: 'rds-mysql-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '1.2 TB', vdc: 'VDC-BJ-01', owner: 'DBA团队', source: '云服务', type: 'cloud', subType: '数据库', metrics: { cpu: 85, memory: 78, requests: 4500, errorRate: 1.8, responseTime: 28, connections: 234 } },
  { id: 114, name: '云数据库-GaussDB', alertStatus: '正常', identifier: 'gaussdb-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '2.8 TB', vdc: 'VDC-SH-02', owner: 'DBA团队', source: '云服务', type: 'cloud', subType: '数据库', metrics: { cpu: 42, memory: 56, requests: 2300, errorRate: 0.0, responseTime: 8, connections: 189 } },
  { id: 115, name: '分布式缓存-DCS Redis', alertStatus: '正常', identifier: 'dcs-redis-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '64 GB', vdc: 'VDC-BJ-01', owner: 'DBA团队', source: '云服务', type: 'cloud', subType: '数据库', metrics: { cpu: 35, memory: 62, requests: 12000, errorRate: 0.0, responseTime: 2, connections: 567 } },
  { id: 116, name: '文档数据库-DDS MongoDB', alertStatus: '正常', identifier: 'dds-mongo-01', runStatus: '运行中', appLevel: '普通应用', storageSize: '480 GB', vdc: 'VDC-SH-02', owner: 'DBA团队', source: '云服务', type: 'cloud', subType: '数据库', metrics: { cpu: 28, memory: 45, requests: 1800, errorRate: 0.1, responseTime: 15, connections: 89 } },
  { id: 117, name: '云容器引擎-CCE生产', alertStatus: '正常', identifier: 'cce-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '容器团队', source: '云服务', type: 'cloud', subType: '容器服务', metrics: { cpu: 65, memory: 72, requests: 8900, errorRate: 0.2, responseTime: 12, connections: 345 } },
  { id: 118, name: '云容器实例-CCI边缘', alertStatus: '正常', identifier: 'cci-edge-01', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '容器团队', source: '云服务', type: 'cloud', subType: '容器服务', metrics: { cpu: 18, memory: 28, requests: 560, errorRate: 0.0, responseTime: 8, connections: 45 } },
  { id: 119, name: '容器镜像仓库-SWR', alertStatus: '正常', identifier: 'swr-registry-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '容器团队', source: '云服务', type: 'cloud', subType: '容器服务', metrics: { cpu: 12, memory: 22, requests: 340, errorRate: 0.0, responseTime: 25, connections: 34 } },
  { id: 120, name: '分布式消息-DMS Kafka', alertStatus: '正常', identifier: 'dms-kafka-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '中间件团队', source: '云服务', type: 'cloud', subType: '中间件', metrics: { cpu: 45, memory: 58, requests: 8900, errorRate: 0.0, responseTime: 3, connections: 234 } },
  { id: 121, name: 'API网关-APIG', alertStatus: '正常', identifier: 'apig-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '中间件团队', source: '云服务', type: 'cloud', subType: '中间件', metrics: { cpu: 32, memory: 42, requests: 15000, errorRate: 0.1, responseTime: 8, connections: 567 } },
  { id: 122, name: '数据仓库-DWS', alertStatus: '正常', identifier: 'dws-dw-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '8.5 TB', vdc: 'VDC-SH-02', owner: '大数据团队', source: '云服务', type: 'cloud', subType: '大数据', metrics: { cpu: 72, memory: 85, requests: 2300, errorRate: 0.5, responseTime: 560, connections: 78 } },
  { id: 123, name: '数据湖探索-DLI', alertStatus: '正常', identifier: 'dli-lake-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '大数据团队', source: '云服务', type: 'cloud', subType: '大数据', metrics: { cpu: 55, memory: 68, requests: 1200, errorRate: 0.3, responseTime: 340, connections: 45 } },
  { id: 124, name: 'Web应用防火墙-WAF', alertStatus: '正常', identifier: 'waf-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '安全团队', source: '云服务', type: 'cloud', subType: '安全服务', metrics: { cpu: 22, memory: 35, requests: 23000, errorRate: 0.0, responseTime: 5, connections: 1234 } },
  { id: 125, name: '云防火墙-CFW', alertStatus: '正常', identifier: 'cfw-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '安全团队', source: '云服务', type: 'cloud', subType: '安全服务', metrics: { cpu: 18, memory: 28, requests: 5600, errorRate: 0.0, responseTime: 3, connections: 456 } },
]

export const cloudResData = [
  { id: 201, name: 'ECS-集群A-生产', alertStatus: '正常', identifier: 'ecs-cluster-a', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '云平台团队', source: '云资源', type: 'cloud-resource', subType: '弹性云服务器' },
  { id: 202, name: 'ECS-集群B-测试', alertStatus: '紧急', identifier: 'ecs-cluster-b', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-SH-02', owner: '云平台团队', source: '云资源', type: 'cloud-resource', subType: '弹性云服务器' },
  { id: 203, name: 'ECS-集群C-开发', alertStatus: '正常', identifier: 'ecs-cluster-c', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '云平台团队', source: '云资源', type: 'cloud-resource', subType: '弹性云服务器' },
  { id: 204, name: 'BMS-计算池-01', alertStatus: '正常', identifier: 'bms-compute-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '云平台团队', source: '云资源', type: 'cloud-resource', subType: '裸金属服务器' },
  { id: 205, name: 'BMS-存储节点-01', alertStatus: '正常', identifier: 'bms-storage-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '云平台团队', source: '云资源', type: 'cloud-resource', subType: '裸金属服务器' },
  { id: 206, name: 'GACS-AI训练节点', alertStatus: '正常', identifier: 'gacs-ai-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-GZ-03', owner: 'AI团队', source: '云资源', type: 'cloud-resource', subType: 'GPU云服务器' },
  { id: 207, name: 'GACS-推理节点', alertStatus: '正常', identifier: 'gacs-infer-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: 'AI团队', source: '云资源', type: 'cloud-resource', subType: 'GPU云服务器' },
  { id: 208, name: 'DeH-数据库专用', alertStatus: '正常', identifier: 'deh-db-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '云平台团队', source: '云资源', type: 'cloud-resource', subType: '专属主机' },
  { id: 209, name: 'AS-Web集群策略', alertStatus: '正常', identifier: 'as-web-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '云平台团队', source: '云资源', type: 'cloud-resource', subType: '弹性伸缩' },
  { id: 210, name: 'IMS-生产镜像仓', alertStatus: '正常', identifier: 'ims-prod-01', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '云平台团队', source: '云资源', type: 'cloud-resource', subType: '镜像服务' },
]

export const virtualData = [
  { id: 301, name: 'K8s-生产集群', alertStatus: '正常', identifier: 'k8s-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '容器团队', source: '虚拟资源池', type: 'virtual', subType: 'Kubernetes集群' },
  { id: 302, name: 'K8s-测试集群', alertStatus: '紧急', identifier: 'k8s-test-02', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '容器团队', source: '虚拟资源池', type: 'virtual', subType: 'Kubernetes集群' },
  { id: 303, name: 'K8s-边缘集群', alertStatus: '正常', identifier: 'k8s-edge-03', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '容器团队', source: '虚拟资源池', type: 'virtual', subType: 'Kubernetes集群' },
  { id: 304, name: '容器实例池-边缘', alertStatus: '正常', identifier: 'ci-edge-01', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: '--', source: '虚拟资源池', type: 'virtual', subType: '容器实例' },
  { id: 305, name: '容器实例池-AI', alertStatus: '正常', identifier: 'ci-ai-01', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-GZ-03', owner: 'AI团队', source: '虚拟资源池', type: 'virtual', subType: '容器实例' },
  { id: 306, name: '函数网关-生产', alertStatus: '正常', identifier: 'fg-prod-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '无服务器团队', source: '虚拟资源池', type: 'virtual', subType: 'Serverless函数' },
  { id: 307, name: '函数网关-事件触发', alertStatus: '正常', identifier: 'fg-event-01', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-BJ-01', owner: '无服务器团队', source: '虚拟资源池', type: 'virtual', subType: 'Serverless函数' },
]

export const physicalData = [
  { id: 401, name: '物理服务器-机柜A-01', alertStatus: '正常', identifier: 'phy-rackA-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '基础设施团队', source: '物理资源', type: 'physical', subType: '物理服务器' },
  { id: 402, name: '物理服务器-机柜B-02', alertStatus: '紧急', identifier: 'phy-rackB-02', runStatus: '运行中', appLevel: '重要应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '基础设施团队', source: '物理资源', type: 'physical', subType: '物理服务器' },
  { id: 403, name: '物理服务器-机柜C-03', alertStatus: '正常', identifier: 'phy-rackC-03', runStatus: '运行中', appLevel: '普通应用', storageSize: '--', vdc: 'VDC-SH-02', owner: '--', source: '物理资源', type: 'physical', subType: '物理服务器' },
  { id: 404, name: '核心交换机-S7600', alertStatus: '正常', identifier: 'sw-core-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-GZ-03', owner: '网络团队', source: '物理资源', type: 'physical', subType: '网络设备' },
  { id: 405, name: '出口路由器-ISP01', alertStatus: '紧急', identifier: 'rt-edge-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '网络团队', source: '物理资源', type: 'physical', subType: '网络设备' },
  { id: 406, name: 'SAN存储-主阵列', alertStatus: '正常', identifier: 'san-main-01', runStatus: '运行中', appLevel: '核心服务', storageSize: '--', vdc: 'VDC-BJ-01', owner: '存储团队', source: '物理资源', type: 'physical', subType: '存储设备' },
]

export function buildCascaderTree(cardGroups) {
  return cardGroups.map(group => ({
    label: group.label,
    value: group.key,
    children: (subTabMap[group.key] || []).map(sub => ({
      label: sub.label,
      value: sub.label,
      children: sub.subType
        ? group.items
            .filter(item => (item.subType || item.appLevel) === sub.subType)
            .map(item => ({ label: item.name, value: item.id, ...item }))
        : group.items.map(item => ({ label: item.name, value: item.id, ...item }))
    }))
  }))
}
