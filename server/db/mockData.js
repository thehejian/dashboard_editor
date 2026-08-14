// ============================================================
// In-memory mock database for CMDB — replaces PostgreSQL.
// Data extracted from server/db/002_seed_data.sql (originally
// the mock data shown across all views).
// NOTE: CRUD mutations live in memory and reset on restart.
// ============================================================

const data = {
  // ---- 1. CI Core ----
  ci_types: [
    { id: 1, code: 'server', name: '服务器', icon: 'fa-server', description: '物理/虚拟服务器' },
    { id: 2, code: 'database', name: '数据库', icon: 'fa-database', description: '数据库实例' },
    { id: 3, code: 'middleware', name: '中间件', icon: 'fa-layer-group', description: '中间件服务' },
    { id: 4, code: 'network_device', name: '网络设备', icon: 'fa-network-wired', description: '交换机/路由器/LB' },
    { id: 5, code: 'application', name: '应用', icon: 'fa-circle-nodes', description: '业务应用/微服务' },
    { id: 6, code: 'cloud_service', name: '云服务', icon: 'fa-cloud', description: '云平台服务' },
    { id: 7, code: 'container', name: '容器', icon: 'fa-cubes', description: 'K8s/Docker 容器' },
    { id: 8, code: 'storage', name: '存储', icon: 'fa-hdd', description: '存储设备' },
    { id: 9, code: 'security', name: '安全设备', icon: 'fa-shield-halved', description: '防火墙/WAF' },
    { id: 10, code: 'log_collector', name: '日志采集器', icon: 'fa-rotate-left', description: '日志采集节点' },
  ],
  ci: [
    { id: 1, ci_type_id: 1, name: 'server-001', identifier: 'srv-prod-001', ip: '10.0.1.10', status: 'running', region: '华北区域一', vdc: 'VDC-BJ-01', app_level: '核心', owner: '张伟', source: '自动发现', os_type: 'CentOS 7.9', db_type: null, mw_type: null },
    { id: 2, ci_type_id: 1, name: 'app-server-03', identifier: 'srv-prod-003', ip: '10.0.1.30', status: 'running', region: '华南区域', vdc: 'VDC-GZ-03', app_level: '重要', owner: '张伟', source: '运营', os_type: 'Ubuntu 22.04', db_type: null, mw_type: null },
    { id: 3, ci_type_id: 1, name: 'k8s-node-02', identifier: 'k8s-node-002', ip: '10.0.4.12', status: 'running', region: '华北区域一', vdc: 'VDC-BJ-01', app_level: '核心', owner: '李娜', source: '自动发现', os_type: 'Debian 11', db_type: null, mw_type: null },
    { id: 4, ci_type_id: 2, name: 'db-primary', identifier: 'db-master-01', ip: '10.0.3.20', status: 'running', region: '华东区域一', vdc: 'VDC-SH-02', app_level: '核心', owner: '赵敏', source: '运营', os_type: 'CentOS 7.9', db_type: 'MySQL 8.0', mw_type: null },
    { id: 5, ci_type_id: 2, name: 'db-replica-02', identifier: 'db-slave-02', ip: '10.0.3.21', status: 'running', region: '华东区域一', vdc: 'VDC-SH-02', app_level: '核心', owner: '赵敏', source: '运营', os_type: 'CentOS 7.9', db_type: 'MySQL 8.0', mw_type: null },
    { id: 6, ci_type_id: 2, name: 'redis-cluster', identifier: 'redis-prod-01', ip: '10.0.5.10', status: 'running', region: '华东区域一', vdc: 'VDC-SH-02', app_level: '核心', owner: '王强', source: '运营', os_type: 'Alpine 3.18', db_type: null, mw_type: 'Redis 7.0' },
    { id: 7, ci_type_id: 3, name: 'kafka-consumer-group', identifier: 'kafka-prod-01', ip: '10.0.6.10', status: 'running', region: '华北区域一', vdc: 'VDC-BJ-01', app_level: '核心', owner: '王强', source: '自动发现', os_type: null, db_type: null, mw_type: 'Kafka 3.5' },
    { id: 8, ci_type_id: 4, name: 'switch-01', identifier: 'net-sw-001', ip: '10.0.254.1', status: 'running', region: '华北区域一', vdc: null, app_level: null, owner: null, source: '自动发现', os_type: null, db_type: null, mw_type: null },
    { id: 9, ci_type_id: 4, name: 'lb-001', identifier: 'slb-prod-01', ip: '10.0.0.10', status: 'running', region: '华北区域一', vdc: null, app_level: null, owner: null, source: '自动发现', os_type: null, db_type: null, mw_type: null },
    { id: 10, ci_type_id: 4, name: 'api-gateway', identifier: 'gw-prod-01', ip: '10.0.0.20', status: 'running', region: '华北区域一', vdc: 'VDC-BJ-01', app_level: '核心', owner: '李娜', source: '运营', os_type: null, db_type: null, mw_type: 'Kong 3.4' },
    { id: 11, ci_type_id: 7, name: 'payment-service', identifier: 'pay-prod-01', ip: '10.0.1.50', status: 'running', region: '华北区域一', vdc: 'VDC-BJ-01', app_level: '核心', owner: '张伟', source: '运营', os_type: null, db_type: null, mw_type: null },
    { id: 12, ci_type_id: 1, name: 'ntp-server', identifier: 'ntp-prod-01', ip: '10.0.254.100', status: 'running', region: '华北区域一', vdc: null, app_level: null, owner: null, source: '自动发现', os_type: 'Debian 11', db_type: null, mw_type: null },
    { id: 13, ci_type_id: 5, name: '订单服务中心', identifier: 'order-svc-prod-01', ip: '10.0.2.10', status: 'running', region: '华北区域一', vdc: 'VDC-BJ-01', app_level: '重要应用', owner: '张伟', source: '运营', os_type: null, db_type: null, mw_type: null },
    { id: 14, ci_type_id: 5, name: '用户认证中心', identifier: 'auth-center-prod-02', ip: '10.0.2.11', status: 'running', region: '华北区域一', vdc: 'VDC-BJ-01', app_level: '重要应用', owner: '李娜', source: '运营', os_type: null, db_type: null, mw_type: null },
    { id: 15, ci_type_id: 5, name: '支付网关服务', identifier: 'payment-gw-prod-03', ip: '10.0.2.12', status: 'running', region: '华东区域一', vdc: 'VDC-SH-02', app_level: '重要应用', owner: '--', source: '运营', os_type: null, db_type: null, mw_type: null },
    { id: 16, ci_type_id: 5, name: '消息推送平台', identifier: 'push-platform-prod-04', ip: '10.0.2.13', status: 'running', region: '华北区域一', vdc: 'VDC-BJ-01', app_level: '普通应用', owner: '王强', source: '运营', os_type: null, db_type: null, mw_type: null },
    { id: 17, ci_type_id: 5, name: '日志采集服务', identifier: 'log-collector-prod-05', ip: '10.0.2.14', status: 'running', region: '华南区域', vdc: 'VDC-GZ-03', app_level: '普通应用', owner: '--', source: '运营', os_type: null, db_type: null, mw_type: null },
    { id: 18, ci_type_id: 5, name: '数据同步引擎', identifier: 'data-sync-prod-06', ip: '10.0.2.15', status: 'running', region: '华东区域一', vdc: 'VDC-SH-02', app_level: '重要应用', owner: '赵敏', source: '运营', os_type: null, db_type: null, mw_type: null },
    { id: 19, ci_type_id: 5, name: '配置管理中心', identifier: 'config-center-prod-07', ip: '10.0.2.16', status: 'running', region: '华北区域一', vdc: 'VDC-BJ-01', app_level: '普通应用', owner: '--', source: '运营', os_type: null, db_type: null, mw_type: null },
    { id: 20, ci_type_id: 10, name: 'log-collector', identifier: 'col-prod-01', ip: '10.0.200.10', status: 'running', region: '华北区域一', vdc: null, app_level: null, owner: null, source: '运营', os_type: 'CentOS 7.9', db_type: null, mw_type: null },
  ],
  ci_relationships: [
    { id: 1, source_ci_id: 13, target_ci_id: 4, relationship_type: '部署于', description: '订单服务中心部署于 db-primary' },
    { id: 2, source_ci_id: 14, target_ci_id: 4, relationship_type: '部署于', description: '用户认证中心部署于 db-primary' },
    { id: 3, source_ci_id: 13, target_ci_id: 3, relationship_type: '运行于', description: '订单服务中心运行于 k8s-node-02' },
    { id: 4, source_ci_id: 14, target_ci_id: 3, relationship_type: '运行于', description: '用户认证中心运行于 k8s-node-02' },
    { id: 5, source_ci_id: 15, target_ci_id: 5, relationship_type: '部署于', description: '支付网关服务使用 db-replica-02' },
    { id: 6, source_ci_id: 17, target_ci_id: 20, relationship_type: '采集于', description: '日志采集服务从 log-collector 采集' },
    { id: 7, source_ci_id: 12, target_ci_id: 10, relationship_type: '连通', description: 'api-gateway 连通 lb-001' },
  ],

  // ---- 2. IAM ----
  users: [
    { id: 1, username: 'admin', name: '管理员', email: 'admin@company.com', phone: '138****0001', role: '超级管理员', enabled: true },
    { id: 2, username: 'ops1', name: '张运维', email: 'ops1@company.com', phone: '138****0002', role: '运维工程师', enabled: true },
    { id: 3, username: 'dev1', name: '李开发', email: 'dev1@company.com', phone: '138****0003', role: '开发工程师', enabled: false },
    { id: 4, username: 'auditor', name: '王安全', email: 'audit@company.com', phone: '138****0004', role: '安全审计员', enabled: true },
  ],
  roles: [
    { id: 1, name: '超级管理员', description: '系统最高权限', user_count: 1 },
    { id: 2, name: '运维工程师', description: '日常运维操作', user_count: 1 },
    { id: 3, name: '开发工程师', description: '应用开发和部署', user_count: 1 },
    { id: 4, name: '安全审计员', description: '安全审计和合规', user_count: 1 },
    { id: 5, name: 'DBA', description: '数据库管理', user_count: 0 },
    { id: 6, name: '网络工程师', description: '网络设备管理', user_count: 0 },
  ],
  user_role: [
    { id: 1, user_id: 1, role_id: 1 },
    { id: 2, user_id: 2, role_id: 2 },
    { id: 3, user_id: 3, role_id: 3 },
    { id: 4, user_id: 4, role_id: 4 },
  ],
  user_groups: [
    { id: 1, name: '运维组', description: '运维工程师团队', users: 5 },
    { id: 2, name: '开发组', description: '开发工程师团队', users: 10 },
    { id: 3, name: '安全组', description: '安全审计团队', users: 3 },
    { id: 4, name: 'DBA组', description: '数据库管理团队', users: 2 },
  ],
  resource_groups: [
    { id: 1, name: '核心业务组', description: '核心业务系统资源', resources: 10 },
    { id: 2, name: '基础服务组', description: '基础组件和中间件', resources: 8 },
    { id: 3, name: '安全设备组', description: '安全相关设备', resources: 3 },
    { id: 4, name: '存储资源组', description: '存储资源集群', resources: 5 },
  ],
  policies: [
    { id: 1, name: '密码策略', type: '安全策略', description: '密码复杂度不低于 8 位，包含大小写字母和特殊字符' },
    { id: 2, name: '访问控制策略', type: '安全策略', description: '基于角色的访问控制，最小权限原则' },
    { id: 3, name: '审计策略', type: '审计策略', description: '所有操作记录审计日志，保留 180 天' },
    { id: 4, name: '数据保留策略', type: '合规策略', description: '监控数据保留 90 天，日志数据保留 180 天' },
  ],

  // ---- 3. Security / Integration ----
  applications: [
    { id: 1, name: '飞书', type: '协同办公', protocol: 'OAuth2', tenant: 'internal', status: 'active', app_id: 'feishu_app_001', has_shortcut: true, shortcut_group: '办公工具', description: '飞书消息通知与审批集成' },
    { id: 2, name: '企业微信', type: '协同办公', protocol: 'OAuth2', tenant: 'internal', status: 'active', app_id: 'wecom_app_001', has_shortcut: true, shortcut_group: '办公工具', description: '企业微信消息推送' },
    { id: 3, name: 'Jenkins', type: 'CI/CD', protocol: 'API Token', tenant: 'ops', status: 'active', app_id: 'jenkins_app_001', has_shortcut: true, shortcut_group: '运维工具', description: '自动化构建与部署' },
    { id: 4, name: 'GitLab', type: '代码仓库', protocol: 'OAuth2', tenant: 'dev', status: 'active', app_id: 'gitlab_app_001', has_shortcut: true, shortcut_group: '开发工具', description: '代码仓库与CI集成' },
    { id: 5, name: 'PagerDuty', type: '告警', protocol: 'API Key', tenant: 'ops', status: 'active', app_id: 'pd_app_001', has_shortcut: false, shortcut_group: null, description: '告警事件分发' },
    { id: 6, name: 'Grafana', type: '监控', protocol: 'API Key', tenant: 'ops', status: 'active', app_id: 'grafana_app_001', has_shortcut: true, shortcut_group: '监控工具', description: '监控大盘集成' },
    { id: 7, name: 'Zabbix', type: '监控', protocol: 'API Key', tenant: 'ops', status: 'active', app_id: 'zabbix_app_001', has_shortcut: true, shortcut_group: '监控工具', description: '传统监控集成' },
    { id: 8, name: 'Sophon', type: 'AI平台', protocol: 'OAuth2', tenant: 'ai', status: 'active', app_id: 'sophon_app_001', has_shortcut: false, shortcut_group: null, description: 'AI训练平台' },
    { id: 9, name: '堡垒机', type: '安全', protocol: 'LDAP', tenant: 'ops', status: 'active', app_id: 'bastion_app_001', has_shortcut: true, shortcut_group: '安全工具', description: '运维堡垒机' },
    { id: 10, name: 'Wiki', type: '知识库', protocol: 'OAuth2', tenant: 'internal', status: 'active', app_id: 'wiki_app_001', has_shortcut: true, shortcut_group: '办公工具', description: '内部知识库' },
  ],
  identity_providers: [
    { id: 1, name: 'LDAP', protocol: 'LDAP', status: 'active', description: '公司LDAP目录服务' },
    { id: 2, name: 'SAML2', protocol: 'SAML 2.0', status: 'active', description: '统一身份认证SAML2' },
    { id: 3, name: 'OIDC', protocol: 'OpenID Connect', status: 'active', description: '基于OIDC的单点登录' },
    { id: 4, name: 'CAS', protocol: 'CAS 3.0', status: 'inactive', description: '旧版SSO协议' },
  ],
  integration_accounts: [
    { id: 1, name: 'AWS IAM', provider: 'Amazon Web Services', status: 'active', last_sync: '2026-06-17 08:00:00+08' },
    { id: 2, name: '阿里云 RAM', provider: 'Alibaba Cloud', status: 'active', last_sync: '2026-06-17 08:00:00+08' },
    { id: 3, name: 'Azure AD', provider: 'Microsoft Azure', status: 'inactive', last_sync: '2026-06-10 08:00:00+08' },
  ],

  // ---- 4. Alert ----
  alert_rules: [
    { id: 1, name: 'CPU告警', description: 'CPU使用率超过阈值时触发', level: 'critical', target: 'CPU使用率', condition: '> 90%', enabled: true },
    { id: 2, name: '内存告警', description: '内存使用率超过阈值时触发', level: 'warning', target: '内存使用率', condition: '> 80%', enabled: true },
    { id: 3, name: '磁盘告警', description: '磁盘使用率超过阈值时触发', level: 'warning', target: '磁盘使用率', condition: '> 85%', enabled: false },
    { id: 4, name: '网络告警', description: '网络延迟超过阈值时触发', level: 'info', target: '网络延迟', condition: '> 100ms', enabled: true },
    { id: 5, name: '连接数告警', description: '数据库连接数超过阈值时触发', level: 'critical', target: '连接数', condition: '> 500', enabled: true },
    { id: 6, name: 'Pod重启告警', description: 'Pod重启次数超过阈值时触发', level: 'critical', target: 'Pod重启率', condition: '> 3次/小时', enabled: true },
    { id: 7, name: '证书过期告警', description: 'SSL证书剩余天数低于阈值时触发', level: 'warning', target: '证书剩余天数', condition: '< 30天', enabled: true },
    { id: 8, name: '日志错误告警', description: '日志ERROR级别出现频率超过阈值时触发', level: 'info', target: '错误率', condition: '> 5次/分钟', enabled: false },
  ],
  alerts: [
    { id: 1, rule_id: 1, ci_id: 1, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)', metric: 'CPU使用率', current_value: '95%', threshold: '> 90%', duration: '5分钟', display_duration: '5分钟', duration_minutes: 5, trigger_time: '2026-06-17 10:32:00+08', recovery_time: null, status: 'firing', incident_id: 'INC-2026-0720', suggestion: '1. 检查是否有异常进程占用CPU\n2. 查看应用日志定位慢查询\n3. 必要时重启相关服务' },
    { id: 2, rule_id: 3, ci_id: 4, level: 'critical', title: '磁盘空间不足', resource: 'db-primary (华东区域)', metric: '磁盘使用率', current_value: '92%', threshold: '> 90%', duration: '12分钟', display_duration: '12分钟', duration_minutes: 12, trigger_time: '2026-06-17 10:28:00+08', recovery_time: null, status: 'firing', incident_id: null, suggestion: '1. 清理过期日志文件\n2. 检查大表并归档历史数据\n3. 扩容磁盘或迁移数据' },
    { id: 3, rule_id: 5, ci_id: 5, level: 'critical', title: '数据库主从延迟', resource: 'db-replica-02 (华东区域)', metric: '复制延迟', current_value: '35s', threshold: '> 10s', duration: '37分钟', display_duration: '37分钟', duration_minutes: 37, trigger_time: '2026-06-17 09:55:00+08', recovery_time: null, status: 'firing', incident_id: 'INC-2026-0720', suggestion: '1. 检查主库写入压力\n2. 检查从库IO/SQL线程状态\n3. 确认网络带宽是否充足' },
    { id: 4, rule_id: 2, ci_id: 2, level: 'warning', title: '内存使用率偏高', resource: 'app-server-03 (华南区域)', metric: '内存使用率', current_value: '82%', threshold: '> 80%', duration: '20分钟', display_duration: '20分钟', duration_minutes: 20, trigger_time: '2026-06-17 10:15:00+08', recovery_time: null, status: 'firing', incident_id: 'INC-2026-0720', suggestion: '1. 检查JVM堆内存使用情况\n2. 分析是否有内存泄漏\n3. 调整容器内存限制' },
    { id: 5, rule_id: 4, ci_id: 10, level: 'warning', title: '响应时间超时', resource: 'api-gateway (华北区域)', metric: '响应时间', current_value: '2500ms', threshold: '> 2000ms', duration: '1小时', display_duration: '1小时', duration_minutes: 60, trigger_time: '2026-06-17 09:45:00+08', recovery_time: null, status: 'firing', incident_id: 'INC-2026-0720', suggestion: '1. 检查下游服务响应时间\n2. 分析慢请求链路\n3. 考虑增加限流或降级策略' },
    { id: 6, rule_id: 4, ci_id: 9, level: 'warning', title: 'HTTP 5xx错误率上升', resource: 'nginx-ingress (华北区域)', metric: '5xx错误率', current_value: '3.2%', threshold: '> 1%', duration: '1.5小时', display_duration: '1.5小时', duration_minutes: 90, trigger_time: '2026-06-17 09:30:00+08', recovery_time: null, status: 'suppressed', incident_id: 'INC-2026-0722', suggestion: '1. 检查后端服务健康状态\n2. 查看nginx错误日志\n3. 回滚最近变更' },
    { id: 7, rule_id: 5, ci_id: 6, level: 'info', title: '连接数接近上限', resource: 'redis-cluster (华东区域)', metric: '连接数', current_value: '85%', threshold: '> 80%', duration: '2小时', display_duration: '2小时', duration_minutes: 120, trigger_time: '2026-06-17 09:20:00+08', recovery_time: null, status: 'firing', incident_id: 'INC-2026-0718', suggestion: '1. 检查连接池配置\n2. 排查是否有连接泄漏\n3. 考虑扩容Redis节点' },
    { id: 8, rule_id: 7, ci_id: null, level: 'info', title: '证书即将过期', resource: 'cdn-domain.example.com', metric: '证书剩余天数', current_value: '15天', threshold: '< 30天', duration: '2.5小时', display_duration: '2.5小时', duration_minutes: 150, trigger_time: '2026-06-17 08:00:00+08', recovery_time: null, status: 'firing', incident_id: null, suggestion: '1. 申请新证书\n2. 更新证书配置\n3. 验证HTTPS访问正常' },
    { id: 9, rule_id: 6, ci_id: 11, level: 'critical', title: 'K8s Pod频繁重启', resource: 'payment-service (prod)', metric: 'Pod重启率', current_value: '5次/小时', threshold: '> 3次/小时', duration: '已恢复', display_duration: '已恢复', duration_minutes: 0, trigger_time: '2026-06-17 08:45:00+08', recovery_time: '2026-06-17 10:00:00+08', status: 'resolved', incident_id: 'INC-2026-0715', suggestion: '1. 查看Pod事件和日志\n2. 检查OOMKilled情况\n3. 调整resources限制' },
    { id: 10, rule_id: null, ci_id: 7, level: 'warning', title: '消息队列积压', resource: 'kafka-consumer-group order', metric: '积压量', current_value: '50000条', threshold: '> 10000条', duration: '已恢复', display_duration: '已恢复', duration_minutes: 0, trigger_time: '2026-06-17 07:30:00+08', recovery_time: '2026-06-17 10:30:00+08', status: 'resolved', incident_id: 'INC-2026-0719', suggestion: '1. 检查消费者处理逻辑\n2. 增加消费者实例数\n3. 检查生产者发送速率' },
    { id: 11, rule_id: 4, ci_id: 8, level: 'warning', title: '网络丢包率过高', resource: 'switch-01 (华北区域)', metric: '丢包率', current_value: '2.1%', threshold: '> 1%', duration: '45分钟', display_duration: '45分钟', duration_minutes: 45, trigger_time: '2026-06-17 06:30:00+08', recovery_time: null, status: 'firing', incident_id: null, suggestion: '1. 检查网络链路质量\n2. 排查交换机端口错误\n3. 联系网络运维处理' },
    { id: 12, rule_id: null, ci_id: 12, level: 'info', title: 'NTP同步偏移过大', resource: 'ntp-server', metric: '时间偏移', current_value: '850ms', threshold: '> 500ms', duration: '已恢复', display_duration: '已恢复', duration_minutes: 0, trigger_time: '2026-06-16 23:00:00+08', recovery_time: '2026-06-17 01:00:00+08', status: 'resolved', incident_id: null, suggestion: '1. 检查NTP服务状态\n2. 确认时间源可达\n3. 手动同步时间' },
  ],

  // ---- 5. Account Management ----
  account_policies: [
    { id: 1, name: 'OS默认密码策略', account_type: 'OS', min_len: 12, expire_days: 90, lock_threshold: 5, lock_duration: 30, timeout: 600, mfa: false, scope: '所有OS账号', status: 'active' },
    { id: 2, name: '数据库密码策略', account_type: 'DB', min_len: 16, expire_days: 60, lock_threshold: 3, lock_duration: 60, timeout: 300, mfa: true, scope: '所有数据库账号', status: 'active' },
    { id: 3, name: '中间件密码策略', account_type: 'MW', min_len: 12, expire_days: 90, lock_threshold: 5, lock_duration: 30, timeout: 600, mfa: false, scope: '所有中间件账号', status: 'active' },
    { id: 4, name: '设备密码策略', account_type: 'DEVICE', min_len: 14, expire_days: 120, lock_threshold: 5, lock_duration: 30, timeout: 900, mfa: false, scope: '网络设备默认', status: 'active' },
    { id: 5, name: 'OP平台密码策略', account_type: 'OP', min_len: 10, expire_days: 90, lock_threshold: 5, lock_duration: 30, timeout: 600, mfa: true, scope: '运维平台', status: 'active' },
  ],
  accounts: [
    { id: 1, name: 'root@server-001', account_type: 'OS', ci_id: 1, host: 'server-001', port: 22, instance: null, ip: '10.0.1.10', os_type: 'CentOS 7.9', db_type: null, mw_type: null, dev_type: null, system: null, status: 'active', user: 'root', role: '管理员', location: '华北机房A', last_login: '2026-06-17 09:00:00+08' },
    { id: 2, name: 'admin@db-primary', account_type: 'DB', ci_id: 4, host: 'db-primary', port: 3306, instance: 'primary', ip: '10.0.3.20', os_type: null, db_type: 'MySQL 8.0', mw_type: null, dev_type: null, system: null, status: 'active', user: 'admin', role: 'DBA', location: '华东机房B', last_login: '2026-06-17 08:30:00+08' },
    { id: 3, name: 'redis@redis-cluster', account_type: 'MW', ci_id: 6, host: 'redis-cluster', port: 6379, instance: 'cluster-01', ip: '10.0.5.10', os_type: null, db_type: null, mw_type: 'Redis 7.0', dev_type: null, system: null, status: 'active', user: 'redis', role: '应用', location: '华东机房B', last_login: '2026-06-16 22:00:00+08' },
    { id: 4, name: 'admin@switch-01', account_type: 'DEVICE', ci_id: 8, host: 'switch-01', port: 22, instance: null, ip: '10.0.254.1', os_type: null, db_type: null, mw_type: null, dev_type: '交换机', system: null, status: 'active', user: 'admin', role: '网络工程师', location: '华北机房A', last_login: '2026-06-15 14:00:00+08' },
    { id: 5, name: 'ops@api-gateway', account_type: 'OP', ci_id: 10, host: 'api-gateway', port: 22, instance: null, ip: '10.0.0.20', os_type: null, db_type: null, mw_type: 'Kong 3.4', dev_type: null, system: '运维平台', status: 'active', user: 'ops', role: '运维工程师', location: '华北机房A', last_login: '2026-06-17 10:00:00+08' },
  ],
  safeboxes: [
    { id: 1, name: '核心系统保险箱', status: 'active', scope: '华北区域一,华东区域一', permissions: '查看,使用,回收', description: '核心业务系统账号保险箱' },
    { id: 2, name: '测试环境保险箱', status: 'active', scope: '华南区域', permissions: '查看,使用', description: '测试环境账号保险箱' },
  ],
  safebox_accounts: [
    { id: 1, safebox_id: 1, account_id: 1, account_name: 'root@server-001', account_status: 'active', mgmt_status: '托管', resource_ip: '10.0.1.10', resource_name: 'server-001', device_type: '服务器', os_type: 'CentOS 7.9', region: '华北区域一', app: '核心业务', last_login: '2026-06-17 09:00:00+08' },
    { id: 2, safebox_id: 1, account_id: 2, account_name: 'admin@db-primary', account_status: 'active', mgmt_status: '托管', resource_ip: '10.0.3.20', resource_name: 'db-primary', device_type: '数据库', os_type: null, region: '华东区域一', app: '核心业务', last_login: '2026-06-17 08:30:00+08' },
    { id: 3, safebox_id: 1, account_id: 5, account_name: 'ops@api-gateway', account_status: 'active', mgmt_status: '半托管', resource_ip: '10.0.0.20', resource_name: 'api-gateway', device_type: '应用', os_type: null, region: '华北区域一', app: '核心业务', last_login: '2026-06-17 10:00:00+08' },
    { id: 4, safebox_id: 2, account_id: 3, account_name: 'redis@redis-cluster', account_status: 'active', mgmt_status: '托管', resource_ip: '10.0.5.10', resource_name: 'redis-cluster', device_type: '中间件', os_type: null, region: '华东区域一', app: '测试环境', last_login: '2026-06-16 22:00:00+08' },
  ],
  snapshots: [
    { id: 1, name: 'db-primary-20260617', ci_id: 4, snap_type: '全量备份', size: '12.5GB', creator: '自动', status: 'active' },
    { id: 2, name: 'redis-cluster-20260617', ci_id: 6, snap_type: 'RDB快照', size: '2.1GB', creator: '自动', status: 'active' },
    { id: 3, name: 'server-001-系统配置', ci_id: 1, snap_type: '配置快照', size: '45MB', creator: '管理员', status: 'active' },
    { id: 4, name: 'api-gateway-配置备份', ci_id: 10, snap_type: '配置快照', size: '8MB', creator: '张工', status: 'active' },
    { id: 5, name: 'order-svc-meta', ci_id: 13, snap_type: '元数据', size: '256KB', creator: '自动', status: 'active' },
  ],
  backup_tasks: [
    { id: 1, name: 'DB全量备份', ci_id: 4, backup_type: '全量', target: 's3://backup/db/', schedule: '每天 02:00', retention: '30天', last_backup: '2026-06-17 02:00:00+08', status: 'active' },
    { id: 2, name: 'DB增量备份', ci_id: 4, backup_type: '增量', target: 's3://backup/db/', schedule: '每6小时', retention: '7天', last_backup: '2026-06-17 06:00:00+08', status: 'active' },
    { id: 3, name: 'Redis RDB备份', ci_id: 6, backup_type: '快照', target: 's3://backup/redis/', schedule: '每小时', retention: '3天', last_backup: '2026-06-17 10:00:00+08', status: 'active' },
    { id: 4, name: '配置文件备份', ci_id: 10, backup_type: '配置', target: 'git:ops/configs', schedule: '每天 03:00', retention: '90天', last_backup: '2026-06-17 03:00:00+08', status: 'active' },
    { id: 5, name: '日志归档', ci_id: null, backup_type: '归档', target: 's3://backup/logs/', schedule: '每天 04:00', retention: '180天', last_backup: '2026-06-17 04:00:00+08', status: 'active' },
  ],

  // ---- 6. Operations ----
  jobs: [
    { id: 1, name: '数据库巡检', target: 'db-primary, db-replica-02', progress: 65, start_time: '2026-06-17 10:30:00+08', status: 'running' },
  ],
  job_history: [
    { id: 1, job_id: null, name: '全量备份', target: 'db-primary', start_time: '2026-06-17 02:00:00+08', end_time: '2026-06-17 02:45:00+08', duration: '45分钟', status: 'success' },
    { id: 2, job_id: null, name: '日志清理', target: 'log-collector', start_time: '2026-06-17 03:00:00+08', end_time: '2026-06-17 03:12:00+08', duration: '12分钟', status: 'success' },
    { id: 3, job_id: null, name: '安全扫描', target: '华北区域一', start_time: '2026-06-17 01:00:00+08', end_time: '2026-06-17 04:30:00+08', duration: '3.5小时', status: 'success' },
    { id: 4, job_id: null, name: '配置同步', target: 'all', start_time: '2026-06-17 03:00:00+08', end_time: '2026-06-17 03:05:00+08', duration: '5分钟', status: 'failed' },
  ],
  inspection_plans: [
    { id: 1, name: '每日巡检', description: '数据库每日健康巡检', schedule: '每天 09:00', target_count: 5, status: 'active' },
    { id: 2, name: '安全合规巡检', description: '安全基线检查', schedule: '每周一 10:00', target_count: 20, status: 'active' },
  ],
  resource_changes: [
    { id: 1, ci_id: 1, type: '配置变更', resource: 'server-001', detail: '内存扩容 32G→64G', operator: '张伟', time: '2026-06-15 22:00:00+08' },
    { id: 2, ci_id: 10, type: '版本升级', resource: 'api-gateway', detail: 'Kong 3.3→3.4', operator: '李娜', time: '2026-06-14 14:30:00+08' },
    { id: 3, ci_id: 13, type: '配置变更', resource: '订单服务中心', detail: 'JVM参数优化', operator: '张伟', time: '2026-06-13 11:00:00+08' },
    { id: 4, ci_id: 4, type: '扩容', resource: 'db-primary', detail: '磁盘扩容 500G→1T', operator: '赵敏', time: '2026-06-12 02:00:00+08' },
    { id: 5, ci_id: 6, type: '版本升级', resource: 'redis-cluster', detail: 'Redis 6.2→7.0', operator: '王强', time: '2026-06-11 23:00:00+08' },
    { id: 6, ci_id: 7, type: '配置变更', resource: 'kafka', detail: '分区数调整', operator: '王强', time: '2026-06-10 16:00:00+08' },
  ],

  // ---- 7. Log Management ----
  log_collect_tasks: [
    { id: 1, name: '应用日志采集', scene: '应用', enabled: true, target: '所有应用节点', region: '华北区域一', deploy_status: 'deployed', last_collect: '2026-06-17 10:30:00+08' },
    { id: 2, name: 'DB错误日志', scene: '数据库', enabled: true, target: '数据库集群', region: '华北区域一,华东区域一', deploy_status: 'deployed', last_collect: '2026-06-17 10:30:00+08' },
    { id: 3, name: '安全审计日志', scene: '安全', enabled: true, target: '所有节点', region: '全部区域', deploy_status: 'deployed', last_collect: '2026-06-17 10:30:00+08' },
    { id: 4, name: '中间件日志', scene: '中间件', enabled: false, target: 'Redis/Kafka节点', region: '华南区域', deploy_status: 'pending', last_collect: null },
    { id: 5, name: '网络设备日志', scene: '网络', enabled: true, target: '核心交换机', region: '华北区域一', deploy_status: 'deployed', last_collect: '2026-06-17 10:25:00+08' },
  ],
  log_forward_tasks: [
    { id: 1, name: '应用到日志中心', target_type: 'Kafka', target_addr: 'kafka-prod-01:9092', forward_content: ['app-*', 'nginx-*'], enabled: true, last_forward: '2026-06-17 10:30:00+08' },
    { id: 2, name: 'DB日志到ELK', target_type: 'Elasticsearch', target_addr: 'es-prod-01:9200', forward_content: ['mysql-slow', 'mysql-error'], enabled: true, last_forward: '2026-06-17 10:28:00+08' },
    { id: 3, name: '安全日志到SIEM', target_type: 'Syslog', target_addr: 'siem-01:514', forward_content: ['auth-*', 'audit-*'], enabled: true, last_forward: '2026-06-17 10:30:00+08' },
    { id: 4, name: '调试日志丢弃', target_type: 'DevNull', target_addr: 'file://dev/null', forward_content: ['debug-*'], enabled: false, last_forward: null },
  ],
  log_templates: [
    { id: 1, name: 'Nginx访问日志', scene: '应用', engine: 'iLogtail', sample: '$remote_addr - $remote_user [$time_local] "$request"', source_type: '文件' },
    { id: 2, name: 'MySQL慢查询', scene: '数据库', engine: 'Filebeat', sample: '# Time: $time\n# User@Host: $user', source_type: '文件' },
    { id: 3, name: 'Java应用日志', scene: '应用', engine: 'Logstash', sample: '%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n', source_type: '文件' },
    { id: 4, name: '系统日志', scene: '系统', engine: 'Rsyslog', sample: '%timegenerated %hostname %syslogtag %msg', source_type: 'Syslog' },
    { id: 5, name: 'K8s容器日志', scene: '容器', engine: 'Fluentd', sample: '{json结构}', source_type: '标准输出' },
  ],
  operation_logs: [
    { id: 1, hostname: 'server-001', detail: '用户admin登录系统', event: 'LOGIN', resource: '系统', level: 'INFO', result: '成功', user: 'admin', ip: '10.0.0.1', trace: 'trace-001', time: '2026-06-17 10:00:00+08', protocol: 'HTTPS' },
    { id: 2, hostname: 'api-gateway', detail: '更新路由配置', event: 'UPDATE', resource: '路由表', level: 'INFO', result: '成功', user: '张伟', ip: '10.0.0.5', trace: 'trace-002', time: '2026-06-17 09:30:00+08', protocol: 'HTTPS' },
    { id: 3, hostname: 'db-primary', detail: '执行ALTER TABLE', event: 'DDL', resource: 'orders表', level: 'WARN', result: '成功', user: '赵敏', ip: '10.0.0.8', trace: 'trace-003', time: '2026-06-17 08:00:00+08', protocol: 'MySQL' },
    { id: 4, hostname: 'k8s-node-02', detail: 'Pod重建', event: 'RESTART', resource: 'payment-service', level: 'INFO', result: '触发', user: '系统', ip: '10.0.4.12', trace: 'trace-004', time: '2026-06-17 08:45:00+08', protocol: 'K8s API' },
    { id: 5, hostname: 'server-001', detail: '密码修改', event: 'PASSWORD_CHANGE', resource: 'root', level: 'WARN', result: '成功', user: 'admin', ip: '10.0.0.1', trace: 'trace-005', time: '2026-06-16 23:00:00+08', protocol: 'SSH' },
    { id: 6, hostname: 'server-001', detail: '创建用户ops_deploy', event: 'CREATE_USER', resource: 'ops_deploy', level: 'INFO', result: '成功', user: 'admin', ip: '10.0.0.1', trace: 'trace-006', time: '2026-06-16 22:00:00+08', protocol: 'SSH' },
    { id: 7, hostname: 'api-gateway', detail: '限流策略更新', event: 'UPDATE', resource: 'rate_limit', level: 'INFO', result: '成功', user: '李娜', ip: '10.0.0.6', trace: 'trace-007', time: '2026-06-16 15:00:00+08', protocol: 'HTTPS' },
    { id: 8, hostname: 'db-primary', detail: '查询慢日志', event: 'SELECT', resource: 'slow_log', level: 'INFO', result: '成功', user: '赵敏', ip: '10.0.0.8', trace: 'trace-008', time: '2026-06-16 14:00:00+08', protocol: 'MySQL' },
  ],
  runtime_logs: [
    { id: 1, time: '2026-06-17 10:32:00+08', content: '[ERROR] cpu usage exceeds 95% on server-001', source: 'node-exporter' },
    { id: 2, time: '2026-06-17 10:30:00+08', content: '[WARN] memory usage 82% on app-server-03', source: 'node-exporter' },
    { id: 3, time: '2026-06-17 10:28:00+08', content: '[ERROR] disk usage 92% on db-primary', source: 'node-exporter' },
    { id: 4, time: '2026-06-17 10:25:00+08', content: '[INFO] nginx access log rotated', source: 'nginx' },
    { id: 5, time: '2026-06-17 10:20:00+08', content: '[ERROR] connection timeout to kafka broker 2', source: 'kafka-exporter' },
    { id: 6, time: '2026-06-17 10:15:00+08', content: '[WARN] response time 2450ms on api-gateway', source: 'kong' },
    { id: 7, time: '2026-06-17 10:00:00+08', content: '[INFO] backup task completed successfully', source: 'cron' },
    { id: 8, time: '2026-06-17 09:55:00+08', content: '[ERROR] replication lag 35s on db-replica-02', source: 'mysql-exporter' },
  ],

  // ---- 8. Application / Order Management ----
  app_orders: [
    { id: 1, order_id: 'ORD-2026-0001', title: '申请数据库账号', name: 'dev1', type: '新建', res_type: '数据库', reason: '开发环境需要', handler: '张工', applicant: '李开发', approver: '王安全', status: 'approved', status_label: '已通过', created_at: '2026-06-17 09:00:00+08', finished_at: '2026-06-17 10:00:00+08' },
    { id: 2, order_id: 'ORD-2026-0002', title: '服务器权限变更', name: 'ops1', type: '变更', res_type: '服务器', reason: '工作需要', handler: '王工', applicant: '张运维', approver: '王安全', status: 'pending', status_label: '待审批', created_at: '2026-06-17 10:00:00+08', finished_at: null },
    { id: 3, order_id: 'ORD-2026-0003', title: '申请VPN账号', name: 'auditor', type: '新建', res_type: '网络', reason: '远程审计需要', handler: null, applicant: '王安全', approver: null, status: 'pending', status_label: '待审批', created_at: '2026-06-17 11:00:00+08', finished_at: null },
  ],
  todos: [
    { id: 1, title: '处理数据库主从延迟告警', source: '告警系统', priority: 'critical', priority_label: '紧急', deadline: '2026-06-17 12:00:00+08', status: 'pending', status_label: '待处理' },
    { id: 2, title: '更新SSL证书', source: '运维计划', priority: 'high', priority_label: '高', deadline: '2026-06-20 18:00:00+08', status: 'pending', status_label: '待处理' },
    { id: 3, title: 'Q2机房巡检报告', source: '管理任务', priority: 'normal', priority_label: '普通', deadline: '2026-06-30 18:00:00+08', status: 'in_progress', status_label: '进行中' },
    { id: 4, title: '安全基线合规检查', source: '安全组', priority: 'high', priority_label: '高', deadline: '2026-06-25 18:00:00+08', status: 'pending', status_label: '待处理' },
    { id: 5, title: '升级Kong网关到3.6', source: '版本计划', priority: 'low', priority_label: '低', deadline: '2026-07-15 18:00:00+08', status: 'pending', status_label: '待处理' },
  ],

  // ---- 9. Topology ----
  topology_zones: [
    { id: 1, name: '华北区域一', status: 'normal', icon: 'fa-cloud', parent_id: null, sort_order: 1 },
    { id: 2, name: '华东区域一', status: 'normal', icon: 'fa-cloud', parent_id: null, sort_order: 2 },
    { id: 3, name: '华南区域', status: 'warning', icon: 'fa-cloud', parent_id: null, sort_order: 3 },
  ],
  topology_nodes: [
    { id: 1, zone_id: 1, label: 'SLB-prod', icon_text: 'fa-sliders-h', combo: 'region-beijing', status: 'normal', style: { x: 100, y: 50 }, sort_order: 1 },
    { id: 2, zone_id: 2, label: 'SLB-east', icon_text: 'fa-sliders-h', combo: 'region-shanghai', status: 'normal', style: { x: 600, y: 50 }, sort_order: 1 },
    { id: 3, zone_id: 1, label: 'server-001', icon_text: 'fa-server', combo: 'region-beijing', status: 'normal', style: { x: 80, y: 200 }, sort_order: 2 },
    { id: 4, zone_id: 1, label: 'app-server-02', icon_text: 'fa-server', combo: 'region-beijing', status: 'warning', style: { x: 200, y: 200 }, sort_order: 3 },
    { id: 5, zone_id: 1, label: 'db-master', icon_text: 'fa-database', combo: 'region-beijing', status: 'normal', style: { x: 80, y: 350 }, sort_order: 4 },
    { id: 6, zone_id: 2, label: 'server-east-01', icon_text: 'fa-server', combo: 'region-shanghai', status: 'normal', style: { x: 580, y: 200 }, sort_order: 2 },
    { id: 7, zone_id: 2, label: 'server-east-02', icon_text: 'fa-server', combo: 'region-shanghai', status: 'abnormal', style: { x: 680, y: 200 }, sort_order: 3 },
    { id: 8, zone_id: 2, label: 'db-replica', icon_text: 'fa-database', combo: 'region-shanghai', status: 'normal', style: { x: 600, y: 350 }, sort_order: 4 },
  ],
  topology_edges: [
    { id: 1, source_id: 1, target_id: 3, data: { label: '流量1Gbps' }, style: { stroke: '#52c41a' } },
    { id: 2, source_id: 1, target_id: 4, data: { label: '流量500Mbps' }, style: { stroke: '#fa8c16' } },
    { id: 3, source_id: 1, target_id: 2, data: { label: '跨区域1Gbps' }, style: { stroke: '#1890ff', lineDash: [5, 5] } },
    { id: 4, source_id: 2, target_id: 6, data: { label: '流量800Mbps' }, style: { stroke: '#52c41a' } },
    { id: 5, source_id: 2, target_id: 7, data: { label: '流量200Mbps' }, style: { stroke: '#f5222d' } },
    { id: 6, source_id: 3, target_id: 5, data: { label: '读写' }, style: { stroke: '#52c41a' } },
    { id: 7, source_id: 4, target_id: 5, data: { label: '读写' }, style: { stroke: '#52c41a' } },
    { id: 8, source_id: 5, target_id: 8, data: { label: '复制' }, style: { stroke: '#1890ff', lineDash: [5, 5] } },
  ],

  // ---- 10. Monitoring ----
  monitor_metrics: [
    { id: 1, name: 'CPU使用率', type: '系统指标', enabled: true },
    { id: 2, name: '内存使用率', type: '系统指标', enabled: true },
    { id: 3, name: '磁盘使用率', type: '系统指标', enabled: true },
    { id: 4, name: '网络吞吐', type: '网络指标', enabled: true },
  ],

  // ---- Application List (ops/account transfer) ----
  app_list: [
    { id: 1, name: '订单系统', type: '业务应用', region: '华北区域一', status: 'active', description: '核心订单处理系统' },
    { id: 2, name: '支付系统', type: '业务应用', region: '华东区域一', status: 'active', description: '支付网关' },
    { id: 3, name: '用户中心', type: '业务应用', region: '华北区域一', status: 'active', description: '统一认证和用户管理' },
    { id: 4, name: '消息平台', type: '消息中间件', region: '华北区域一', status: 'active', description: '消息推送服务' },
    { id: 5, name: '日志平台', type: '基础平台', region: '华北区域一', status: 'active', description: '统一日志管理平台' },
    { id: 6, name: '监控平台', type: '基础平台', region: '华北区域一', status: 'active', description: '运维监控系统' },
    { id: 7, name: '容器平台', type: '基础平台', region: '华北区域一', status: 'active', description: 'K8s容器管理' },
    { id: 8, name: 'DevOps平台', type: '基础平台', region: '华东区域一', status: 'active', description: 'CI/CD流水线' },
  ],
}

// ---- Table column definitions (for GET /api/cmdb/tables) ----
// name -> [column, type, nullable]
const SCHEMA = {
  ci_types: [
    ['id', 'integer', false], ['parent_id', 'integer', true], ['code', 'character varying', false],
    ['name', 'character varying', false], ['icon', 'character varying', true], ['description', 'text', true], ['created_at', 'timestamp with time zone', true],
  ],
  ci: [
    ['id', 'integer', false], ['ci_type_id', 'integer', false], ['name', 'character varying', false],
    ['identifier', 'character varying', true], ['ip', 'character varying', true], ['status', 'character varying', true],
    ['region', 'character varying', true], ['vdc', 'character varying', true], ['app_level', 'character varying', true],
    ['owner', 'character varying', true], ['source', 'character varying', true], ['os_type', 'character varying', true],
    ['db_type', 'character varying', true], ['mw_type', 'character varying', true], ['firmware', 'character varying', true],
    ['dev_type', 'character varying', true], ['metadata', 'jsonb', true], ['description', 'text', true],
    ['created_at', 'timestamp with time zone', true], ['updated_at', 'timestamp with time zone', true],
  ],
  ci_relationships: [
    ['id', 'integer', false], ['source_ci_id', 'integer', false], ['target_ci_id', 'integer', false],
    ['relationship_type', 'character varying', false], ['description', 'text', true], ['created_at', 'timestamp with time zone', true],
  ],
  users: [
    ['id', 'integer', false], ['username', 'character varying', false], ['name', 'character varying', true],
    ['email', 'character varying', true], ['phone', 'character varying', true], ['role', 'character varying', true],
    ['enabled', 'boolean', true], ['created_at', 'timestamp with time zone', true], ['updated_at', 'timestamp with time zone', true],
  ],
  roles: [
    ['id', 'integer', false], ['name', 'character varying', false], ['description', 'text', true],
    ['user_count', 'integer', true], ['created_at', 'timestamp with time zone', true],
  ],
  user_role: [
    ['user_id', 'integer', false], ['role_id', 'integer', false],
  ],
  user_groups: [
    ['id', 'integer', false], ['name', 'character varying', false], ['description', 'text', true],
    ['users', 'integer', true], ['created_at', 'timestamp with time zone', true],
  ],
  resource_groups: [
    ['id', 'integer', false], ['name', 'character varying', false], ['description', 'text', true],
    ['resources', 'integer', true], ['created_at', 'timestamp with time zone', true],
  ],
  policies: [
    ['id', 'integer', false], ['name', 'character varying', false], ['type', 'character varying', true],
    ['description', 'text', true], ['created_at', 'timestamp with time zone', true],
  ],
  applications: [
    ['id', 'integer', false], ['name', 'character varying', false], ['type', 'character varying', true],
    ['protocol', 'character varying', true], ['tenant', 'character varying', true], ['status', 'character varying', true],
    ['app_id', 'character varying', true], ['has_shortcut', 'boolean', true], ['shortcut_group', 'character varying', true],
    ['description', 'text', true], ['created_at', 'timestamp with time zone', true], ['updated_at', 'timestamp with time zone', true],
  ],
  identity_providers: [
    ['id', 'integer', false], ['name', 'character varying', false], ['protocol', 'character varying', true],
    ['status', 'character varying', true], ['description', 'text', true], ['created_at', 'timestamp with time zone', true],
    ['updated_at', 'timestamp with time zone', true],
  ],
  integration_accounts: [
    ['id', 'integer', false], ['name', 'character varying', false], ['provider', 'character varying', true],
    ['status', 'character varying', true], ['last_sync', 'timestamp with time zone', true], ['created_at', 'timestamp with time zone', true],
  ],
  alert_rules: [
    ['id', 'integer', false], ['name', 'character varying', false], ['description', 'text', true],
    ['level', 'character varying', true], ['target', 'character varying', true], ['condition', 'text', true],
    ['enabled', 'boolean', true], ['created_at', 'timestamp with time zone', true], ['updated_at', 'timestamp with time zone', true],
  ],
  alerts: [
    ['id', 'integer', false], ['rule_id', 'integer', true], ['ci_id', 'integer', true], ['level', 'character varying', false],
    ['title', 'character varying', true], ['resource', 'character varying', true], ['metric', 'character varying', true],
    ['current_value', 'character varying', true], ['threshold', 'character varying', true], ['duration', 'character varying', true],
    ['display_duration', 'character varying', true], ['duration_minutes', 'integer', true], ['trigger_time', 'timestamp with time zone', true],
    ['recovery_time', 'timestamp with time zone', true], ['status', 'character varying', true], ['incident_id', 'character varying', true],
    ['suggestion', 'text', true],
    ['operator', 'character varying', true], ['created_at', 'timestamp with time zone', true],
  ],
  account_policies: [
    ['id', 'integer', false], ['name', 'character varying', false], ['account_type', 'character varying', false],
    ['min_len', 'integer', true], ['expire_days', 'integer', true], ['lock_threshold', 'integer', true],
    ['lock_duration', 'integer', true], ['timeout', 'integer', true], ['mfa', 'boolean', true], ['scope', 'character varying', true],
    ['status', 'character varying', true], ['created_at', 'timestamp with time zone', true], ['updated_at', 'timestamp with time zone', true],
  ],
  accounts: [
    ['id', 'integer', false], ['name', 'character varying', false], ['account_type', 'character varying', false],
    ['ci_id', 'integer', true], ['host', 'character varying', true], ['port', 'integer', true], ['instance', 'character varying', true],
    ['ip', 'character varying', true], ['os_type', 'character varying', true], ['db_type', 'character varying', true],
    ['mw_type', 'character varying', true], ['dev_type', 'character varying', true], ['system', 'character varying', true],
    ['status', 'character varying', true], ['user', 'character varying', true], ['role', 'character varying', true],
    ['location', 'character varying', true], ['last_login', 'timestamp with time zone', true], ['description', 'text', true],
    ['created_at', 'timestamp with time zone', true], ['updated_at', 'timestamp with time zone', true],
  ],
  safeboxes: [
    ['id', 'integer', false], ['name', 'character varying', false], ['status', 'character varying', true],
    ['scope', 'character varying', true], ['permissions', 'text', true], ['description', 'text', true],
    ['created_at', 'timestamp with time zone', true], ['updated_at', 'timestamp with time zone', true],
  ],
  safebox_accounts: [
    ['id', 'integer', false], ['safebox_id', 'integer', false], ['account_id', 'integer', true],
    ['account_name', 'character varying', true], ['account_status', 'character varying', true], ['mgmt_status', 'character varying', true],
    ['resource_ip', 'character varying', true], ['resource_name', 'character varying', true], ['device_type', 'character varying', true],
    ['os_type', 'character varying', true], ['region', 'character varying', true], ['app', 'character varying', true],
    ['last_login', 'timestamp with time zone', true], ['description', 'text', true], ['created_at', 'timestamp with time zone', true],
  ],
  snapshots: [
    ['id', 'integer', false], ['name', 'character varying', false], ['ci_id', 'integer', true],
    ['snap_type', 'character varying', true], ['size', 'character varying', true], ['creator', 'character varying', true],
    ['status', 'character varying', true], ['created_at', 'timestamp with time zone', true],
  ],
  backup_tasks: [
    ['id', 'integer', false], ['name', 'character varying', false], ['ci_id', 'integer', true],
    ['backup_type', 'character varying', true], ['target', 'character varying', true], ['schedule', 'character varying', true],
    ['retention', 'character varying', true], ['last_backup', 'timestamp with time zone', true], ['status', 'character varying', true],
    ['created_at', 'timestamp with time zone', true],
  ],
  jobs: [
    ['id', 'integer', false], ['name', 'character varying', false], ['target', 'character varying', true],
    ['progress', 'integer', true], ['start_time', 'timestamp with time zone', true], ['status', 'character varying', true],
    ['created_at', 'timestamp with time zone', true],
  ],
  job_history: [
    ['id', 'integer', false], ['job_id', 'integer', true], ['name', 'character varying', false],
    ['target', 'character varying', true], ['start_time', 'timestamp with time zone', true], ['end_time', 'timestamp with time zone', true],
    ['duration', 'character varying', true], ['status', 'character varying', true], ['created_at', 'timestamp with time zone', true],
  ],
  inspection_plans: [
    ['id', 'integer', false], ['name', 'character varying', false], ['description', 'text', true],
    ['schedule', 'character varying', true], ['target_count', 'integer', true], ['status', 'character varying', true],
    ['created_at', 'timestamp with time zone', true],
  ],
  resource_changes: [
    ['id', 'integer', false], ['ci_id', 'integer', true], ['type', 'character varying', true],
    ['resource', 'character varying', true], ['detail', 'text', true], ['operator', 'character varying', true],
    ['time', 'timestamp with time zone', true], ['created_at', 'timestamp with time zone', true],
  ],
  log_collect_tasks: [
    ['id', 'integer', false], ['name', 'character varying', false], ['scene', 'character varying', true],
    ['enabled', 'boolean', true], ['target', 'character varying', true], ['region', 'character varying', true],
    ['deploy_status', 'character varying', true], ['last_collect', 'timestamp with time zone', true], ['created_at', 'timestamp with time zone', true],
  ],
  log_forward_tasks: [
    ['id', 'integer', false], ['name', 'character varying', false], ['target_type', 'character varying', true],
    ['target_addr', 'character varying', true], ['forward_content', 'jsonb', true], ['enabled', 'boolean', true],
    ['last_forward', 'timestamp with time zone', true], ['created_at', 'timestamp with time zone', true],
  ],
  log_templates: [
    ['id', 'integer', false], ['name', 'character varying', false], ['scene', 'character varying', true],
    ['engine', 'character varying', true], ['sample', 'text', true], ['source_type', 'character varying', true],
    ['created_at', 'timestamp with time zone', true],
  ],
  operation_logs: [
    ['id', 'integer', false], ['hostname', 'character varying', true], ['detail', 'text', true],
    ['event', 'character varying', true], ['resource', 'character varying', true], ['level', 'character varying', true],
    ['result', 'character varying', true], ['user', 'character varying', true], ['ip', 'character varying', true],
    ['trace', 'text', true], ['time', 'timestamp with time zone', true], ['protocol', 'character varying', true],
    ['created_at', 'timestamp with time zone', true],
  ],
  runtime_logs: [
    ['id', 'integer', false], ['time', 'timestamp with time zone', true], ['content', 'text', true],
    ['source', 'character varying', true], ['created_at', 'timestamp with time zone', true],
  ],
  app_orders: [
    ['id', 'integer', false], ['order_id', 'character varying', true], ['title', 'character varying', true],
    ['name', 'character varying', true], ['type', 'character varying', true], ['res_type', 'character varying', true],
    ['reason', 'text', true], ['handler', 'character varying', true], ['applicant', 'character varying', true],
    ['approver', 'character varying', true], ['status', 'character varying', true], ['status_label', 'character varying', true],
    ['created_at', 'timestamp with time zone', true], ['finished_at', 'timestamp with time zone', true],
  ],
  todos: [
    ['id', 'integer', false], ['title', 'character varying', false], ['source', 'character varying', true],
    ['priority', 'character varying', true], ['priority_label', 'character varying', true], ['deadline', 'timestamp with time zone', true],
    ['status', 'character varying', true], ['status_label', 'character varying', true], ['created_at', 'timestamp with time zone', true],
  ],
  topology_zones: [
    ['id', 'integer', false], ['name', 'character varying', false], ['status', 'character varying', true],
    ['icon', 'character varying', true], ['parent_id', 'integer', true], ['sort_order', 'integer', true],
    ['created_at', 'timestamp with time zone', true],
  ],
  topology_nodes: [
    ['id', 'integer', false], ['zone_id', 'integer', true], ['label', 'character varying', true],
    ['icon_text', 'character varying', true], ['combo', 'character varying', true], ['status', 'character varying', true],
    ['style', 'jsonb', true], ['sort_order', 'integer', true], ['created_at', 'timestamp with time zone', true],
  ],
  topology_edges: [
    ['id', 'integer', false], ['source_id', 'integer', false], ['target_id', 'integer', false],
    ['data', 'jsonb', true], ['style', 'jsonb', true], ['created_at', 'timestamp with time zone', true],
  ],
  monitor_metrics: [
    ['id', 'integer', false], ['name', 'character varying', false], ['type', 'character varying', true],
    ['enabled', 'boolean', true], ['created_at', 'timestamp with time zone', true],
  ],
  app_list: [
    ['id', 'integer', false], ['name', 'character varying', false], ['type', 'character varying', true],
    ['region', 'character varying', true], ['status', 'character varying', true], ['description', 'text', true],
    ['created_at', 'timestamp with time zone', true],
  ],
}

export function getTable(name) {
  return data[name] || []
}

export function getSchema() {
  return SCHEMA
}

export function getData() {
  return data
}

export default data
