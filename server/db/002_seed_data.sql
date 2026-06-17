-- ============================================================
-- Seed Data — Extracted from all views mock data
-- ============================================================

-- ============ CI Types ============
INSERT INTO ci_types (code, name, icon, description) VALUES
  ('server', '服务器', 'fa-server', '物理/虚拟服务器'),
  ('database', '数据库', 'fa-database', '数据库实例'),
  ('middleware', '中间件', 'fa-layer-group', '中间件服务'),
  ('network_device', '网络设备', 'fa-network-wired', '交换机/路由器/LB'),
  ('application', '应用', 'fa-circle-nodes', '业务应用/微服务'),
  ('cloud_service', '云服务', 'fa-cloud', '云平台服务'),
  ('container', '容器', 'fa-cubes', 'K8s/Docker 容器'),
  ('storage', '存储', 'fa-hdd', '存储设备'),
  ('security', '安全设备', 'fa-shield-halved', '防火墙/WAF'),
  ('log_collector', '日志采集器', 'fa-rotate-left', '日志采集节点');

-- ============ CI (Configuration Items) ============
INSERT INTO ci (ci_type_id, name, identifier, ip, status, region, vdc, app_level, owner, source, os_type, db_type, mw_type) VALUES
  (1, 'server-001', 'srv-prod-001', '10.0.1.10', 'running', '华北区域一', 'VDC-BJ-01', '核心', '张伟', '自动发现', 'CentOS 7.9', NULL, NULL),
  (1, 'app-server-03', 'srv-prod-003', '10.0.1.30', 'running', '华南区域', 'VDC-GZ-03', '重要', '张伟', '运营', 'Ubuntu 22.04', NULL, NULL),
  (1, 'k8s-node-02', 'k8s-node-002', '10.0.4.12', 'running', '华北区域一', 'VDC-BJ-01', '核心', '李娜', '自动发现', 'Debian 11', NULL, NULL),
  (2, 'db-primary', 'db-master-01', '10.0.3.20', 'running', '华东区域一', 'VDC-SH-02', '核心', '赵敏', '运营', 'CentOS 7.9', 'MySQL 8.0', NULL),
  (2, 'db-replica-02', 'db-slave-02', '10.0.3.21', 'running', '华东区域一', 'VDC-SH-02', '核心', '赵敏', '运营', 'CentOS 7.9', 'MySQL 8.0', NULL),
  (2, 'redis-cluster', 'redis-prod-01', '10.0.5.10', 'running', '华东区域一', 'VDC-SH-02', '核心', '王强', '运营', 'Alpine 3.18', NULL, 'Redis 7.0'),
  (3, 'kafka-consumer-group', 'kafka-prod-01', '10.0.6.10', 'running', '华北区域一', 'VDC-BJ-01', '核心', '王强', '自动发现', NULL, NULL, 'Kafka 3.5'),
  (4, 'switch-01', 'net-sw-001', '10.0.254.1', 'running', '华北区域一', NULL, NULL, NULL, '自动发现', NULL, NULL, NULL),
  (4, 'lb-001', 'slb-prod-01', '10.0.0.10', 'running', '华北区域一', NULL, NULL, NULL, '自动发现', NULL, NULL, NULL),
  (4, 'api-gateway', 'gw-prod-01', '10.0.0.20', 'running', '华北区域一', 'VDC-BJ-01', '核心', '李娜', '运营', NULL, NULL, 'Kong 3.4'),
  (7, 'payment-service', 'pay-prod-01', '10.0.1.50', 'running', '华北区域一', 'VDC-BJ-01', '核心', '张伟', '运营', NULL, NULL, NULL),
  (1, 'ntp-server', 'ntp-prod-01', '10.0.254.100', 'running', '华北区域一', NULL, NULL, NULL, '自动发现', 'Debian 11', NULL, NULL),
  (5, '订单服务中心', 'order-svc-prod-01', '10.0.2.10', 'running', '华北区域一', 'VDC-BJ-01', '重要应用', '张伟', '运营', NULL, NULL, NULL),
  (5, '用户认证中心', 'auth-center-prod-02', '10.0.2.11', 'running', '华北区域一', 'VDC-BJ-01', '重要应用', '李娜', '运营', NULL, NULL, NULL),
  (5, '支付网关服务', 'payment-gw-prod-03', '10.0.2.12', 'running', '华东区域一', 'VDC-SH-02', '重要应用', '--', '运营', NULL, NULL, NULL),
  (5, '消息推送平台', 'push-platform-prod-04', '10.0.2.13', 'running', '华北区域一', 'VDC-BJ-01', '普通应用', '王强', '运营', NULL, NULL, NULL),
  (5, '日志采集服务', 'log-collector-prod-05', '10.0.2.14', 'running', '华南区域', 'VDC-GZ-03', '普通应用', '--', '运营', NULL, NULL, NULL),
  (5, '数据同步引擎', 'data-sync-prod-06', '10.0.2.15', 'running', '华东区域一', 'VDC-SH-02', '重要应用', '赵敏', '运营', NULL, NULL, NULL),
  (5, '配置管理中心', 'config-center-prod-07', '10.0.2.16', 'running', '华北区域一', 'VDC-BJ-01', '普通应用', '--', '运营', NULL, NULL, NULL),
  (10, 'log-collector', 'col-prod-01', '10.0.200.10', 'running', '华北区域一', NULL, NULL, NULL, '运营', 'CentOS 7.9', NULL, NULL);

-- ============ CI Relationships ============
INSERT INTO ci_relationships (source_ci_id, target_ci_id, relationship_type, description) VALUES
  (13, 4, '部署于', '订单服务中心部署于 db-primary'),
  (14, 4, '部署于', '用户认证中心部署于 db-primary'),
  (13, 3, '运行于', '订单服务中心运行于 k8s-node-02'),
  (14, 3, '运行于', '用户认证中心运行于 k8s-node-02'),
  (15, 5, '部署于', '支付网关服务使用 db-replica-02'),
  (17, 20, '采集于', '日志采集服务从 log-collector 采集'),
  (12, 10, '连通', 'api-gateway 连通 lb-001');

-- ============ Users ============
INSERT INTO users (username, name, email, phone, "role", enabled) VALUES
  ('admin', '管理员', 'admin@company.com', '138****0001', '超级管理员', true),
  ('ops1', '张运维', 'ops1@company.com', '138****0002', '运维工程师', true),
  ('dev1', '李开发', 'dev1@company.com', '138****0003', '开发工程师', false),
  ('auditor', '王安全', 'audit@company.com', '138****0004', '安全审计员', true);

INSERT INTO roles (name, description, user_count) VALUES
  ('超级管理员', '系统最高权限', 1),
  ('运维工程师', '日常运维操作', 1),
  ('开发工程师', '应用开发和部署', 1),
  ('安全审计员', '安全审计和合规', 1),
  ('DBA', '数据库管理', 0),
  ('网络工程师', '网络设备管理', 0);

INSERT INTO user_role (user_id, role_id) VALUES
  (1, 1), (2, 2), (3, 3), (4, 4);

-- ============ Application Integration ============

INSERT INTO user_groups (name, description, users) VALUES
  ('运维组', '运维工程师团队', 5),
  ('开发组', '开发工程师团队', 10),
  ('安全组', '安全审计团队', 3),
  ('DBA组', '数据库管理团队', 2);

INSERT INTO resource_groups (name, description, resources) VALUES
  ('核心业务组', '核心业务系统资源', 10),
  ('基础服务组', '基础组件和中间件', 8),
  ('安全设备组', '安全相关设备', 3),
  ('存储资源组', '存储资源集群', 5);

INSERT INTO policies (name, type, description) VALUES
  ('密码策略', '安全策略', '密码复杂度不低于 8 位，包含大小写字母和特殊字符'),
  ('访问控制策略', '安全策略', '基于角色的访问控制，最小权限原则'),
  ('审计策略', '审计策略', '所有操作记录审计日志，保留 180 天'),
  ('数据保留策略', '合规策略', '监控数据保留 90 天，日志数据保留 180 天');

-- ============ Applications (Integration) ============
INSERT INTO applications (name, type, protocol, tenant, status, app_id, has_shortcut, shortcut_group, description) VALUES
  ('飞书', '协同办公', 'OAuth2', 'internal', 'active', 'feishu_app_001', true, '办公工具', '飞书消息通知与审批集成'),
  ('企业微信', '协同办公', 'OAuth2', 'internal', 'active', 'wecom_app_001', true, '办公工具', '企业微信消息推送'),
  ('Jenkins', 'CI/CD', 'API Token', 'ops', 'active', 'jenkins_app_001', true, '运维工具', '自动化构建与部署'),
  ('GitLab', '代码仓库', 'OAuth2', 'dev', 'active', 'gitlab_app_001', true, '开发工具', '代码仓库与CI集成'),
  ('PagerDuty', '告警', 'API Key', 'ops', 'active', 'pd_app_001', false, NULL, '告警事件分发'),
  ('Grafana', '监控', 'API Key', 'ops', 'active', 'grafana_app_001', true, '监控工具', '监控大盘集成'),
  ('Zabbix', '监控', 'API Key', 'ops', 'active', 'zabbix_app_001', true, '监控工具', '传统监控集成'),
  ('Sophon', 'AI平台', 'OAuth2', 'ai', 'active', 'sophon_app_001', false, NULL, 'AI训练平台'),
  ('堡垒机', '安全', 'LDAP', 'ops', 'active', 'bastion_app_001', true, '安全工具', '运维堡垒机'),
  ('Wiki', '知识库', 'OAuth2', 'internal', 'active', 'wiki_app_001', true, '办公工具', '内部知识库');

INSERT INTO identity_providers (name, protocol, status, description) VALUES
  ('LDAP', 'LDAP', 'active', '公司LDAP目录服务'),
  ('SAML2', 'SAML 2.0', 'active', '统一身份认证SAML2'),
  ('OIDC', 'OpenID Connect', 'active', '基于OIDC的单点登录'),
  ('CAS', 'CAS 3.0', 'inactive', '旧版SSO协议');

INSERT INTO integration_accounts (name, provider, status, last_sync) VALUES
  ('AWS IAM', 'Amazon Web Services', 'active', '2026-06-17 08:00:00+08'),
  ('阿里云 RAM', 'Alibaba Cloud', 'active', '2026-06-17 08:00:00+08'),
  ('Azure AD', 'Microsoft Azure', 'inactive', '2026-06-10 08:00:00+08');

-- ============ Alert Rules ============
INSERT INTO alert_rules (name, description, level, target, condition, enabled) VALUES
  ('CPU告警', 'CPU使用率超过阈值时触发', 'critical', 'CPU使用率', '> 90%', true),
  ('内存告警', '内存使用率超过阈值时触发', 'warning', '内存使用率', '> 80%', true),
  ('磁盘告警', '磁盘使用率超过阈值时触发', 'warning', '磁盘使用率', '> 85%', false),
  ('网络告警', '网络延迟超过阈值时触发', 'info', '网络延迟', '> 100ms', true),
  ('连接数告警', '数据库连接数超过阈值时触发', 'critical', '连接数', '> 500', true),
  ('Pod重启告警', 'Pod重启次数超过阈值时触发', 'critical', 'Pod重启率', '> 3次/小时', true),
  ('证书过期告警', 'SSL证书剩余天数低于阈值时触发', 'warning', '证书剩余天数', '< 30天', true),
  ('日志错误告警', '日志ERROR级别出现频率超过阈值时触发', 'info', '错误率', '> 5次/分钟', false);

-- ============ Alerts ============
INSERT INTO alerts (rule_id, ci_id, level, title, resource, metric, current_value, threshold, duration, display_duration, duration_minutes, trigger_time, recovery_time, status, suggestion) VALUES
  (1, 1, 'critical', 'CPU使用率超过90%', 'server-001 (华北区域)', 'CPU使用率', '95%', '> 90%', '5分钟', '5分钟', 5, '2026-06-17 10:32:00+08', NULL, 'firing', '1. 检查是否有异常进程占用CPU\n2. 查看应用日志定位慢查询\n3. 必要时重启相关服务'),
  (3, 4, 'critical', '磁盘空间不足', 'db-primary (华东区域)', '磁盘使用率', '92%', '> 90%', '12分钟', '12分钟', 12, '2026-06-17 10:28:00+08', NULL, 'firing', '1. 清理过期日志文件\n2. 检查大表并归档历史数据\n3. 扩容磁盘或迁移数据'),
  (5, 5, 'critical', '数据库主从延迟', 'db-replica-02 (华东区域)', '复制延迟', '35s', '> 10s', '37分钟', '37分钟', 37, '2026-06-17 09:55:00+08', NULL, 'firing', '1. 检查主库写入压力\n2. 检查从库IO/SQL线程状态\n3. 确认网络带宽是否充足'),
  (2, 2, 'warning', '内存使用率偏高', 'app-server-03 (华南区域)', '内存使用率', '82%', '> 80%', '20分钟', '20分钟', 20, '2026-06-17 10:15:00+08', NULL, 'firing', '1. 检查JVM堆内存使用情况\n2. 分析是否有内存泄漏\n3. 调整容器内存限制'),
  (4, 10, 'warning', '响应时间超时', 'api-gateway (华北区域)', '响应时间', '2500ms', '> 2000ms', '1小时', '1小时', 60, '2026-06-17 09:45:00+08', NULL, 'firing', '1. 检查下游服务响应时间\n2. 分析慢请求链路\n3. 考虑增加限流或降级策略'),
  (4, 9, 'warning', 'HTTP 5xx错误率上升', 'nginx-ingress (华北区域)', '5xx错误率', '3.2%', '> 1%', '1.5小时', '1.5小时', 90, '2026-06-17 09:30:00+08', NULL, 'suppressed', '1. 检查后端服务健康状态\n2. 查看nginx错误日志\n3. 回滚最近变更'),
  (5, 6, 'info', '连接数接近上限', 'redis-cluster (华东区域)', '连接数', '85%', '> 80%', '2小时', '2小时', 120, '2026-06-17 09:20:00+08', NULL, 'firing', '1. 检查连接池配置\n2. 排查是否有连接泄漏\n3. 考虑扩容Redis节点'),
  (7, NULL, 'info', '证书即将过期', 'cdn-domain.example.com', '证书剩余天数', '15天', '< 30天', '2.5小时', '2.5小时', 150, '2026-06-17 08:00:00+08', NULL, 'firing', '1. 申请新证书\n2. 更新证书配置\n3. 验证HTTPS访问正常'),
  (6, 11, 'critical', 'K8s Pod频繁重启', 'payment-service (prod)', 'Pod重启率', '5次/小时', '> 3次/小时', '已恢复', '已恢复', 0, '2026-06-17 08:45:00+08', '2026-06-17 10:00:00+08', 'resolved', '1. 查看Pod事件和日志\n2. 检查OOMKilled情况\n3. 调整resources限制'),
  (NULL, 7, 'warning', '消息队列积压', 'kafka-consumer-group order', '积压量', '50000条', '> 10000条', '已恢复', '已恢复', 0, '2026-06-17 07:30:00+08', '2026-06-17 10:30:00+08', 'resolved', '1. 检查消费者处理逻辑\n2. 增加消费者实例数\n3. 检查生产者发送速率'),
  (4, 8, 'warning', '网络丢包率过高', 'switch-01 (华北区域)', '丢包率', '2.1%', '> 1%', '45分钟', '45分钟', 45, '2026-06-17 06:30:00+08', NULL, 'firing', '1. 检查网络链路质量\n2. 排查交换机端口错误\n3. 联系网络运维处理'),
  (NULL, 12, 'info', 'NTP同步偏移过大', 'ntp-server', '时间偏移', '850ms', '> 500ms', '已恢复', '已恢复', 0, '2026-06-16 23:00:00+08', '2026-06-17 01:00:00+08', 'resolved', '1. 检查NTP服务状态\n2. 确认时间源可达\n3. 手动同步时间');

-- ============ Account Policies ============
INSERT INTO account_policies (name, account_type, min_len, expire_days, lock_threshold, lock_duration, timeout, mfa, scope, status) VALUES
  ('OS默认密码策略', 'OS', 12, 90, 5, 30, 600, false, '所有OS账号', 'active'),
  ('数据库密码策略', 'DB', 16, 60, 3, 60, 300, true, '所有数据库账号', 'active'),
  ('中间件密码策略', 'MW', 12, 90, 5, 30, 600, false, '所有中间件账号', 'active'),
  ('设备密码策略', 'DEVICE', 14, 120, 5, 30, 900, false, '网络设备默认', 'active'),
  ('OP平台密码策略', 'OP', 10, 90, 5, 30, 600, true, '运维平台', 'active');

-- ============ Accounts ============
INSERT INTO accounts (name, account_type, ci_id, host, port, instance, ip, os_type, db_type, mw_type, dev_type, system, status, "user", "role", location, last_login) VALUES
  ('root@server-001', 'OS', 1, 'server-001', 22, NULL, '10.0.1.10', 'CentOS 7.9', NULL, NULL, NULL, NULL, 'active', 'root', '管理员', '华北机房A', '2026-06-17 09:00:00+08'),
  ('admin@db-primary', 'DB', 4, 'db-primary', 3306, 'primary', '10.0.3.20', NULL, 'MySQL 8.0', NULL, NULL, NULL, 'active', 'admin', 'DBA', '华东机房B', '2026-06-17 08:30:00+08'),
  ('redis@redis-cluster', 'MW', 6, 'redis-cluster', 6379, 'cluster-01', '10.0.5.10', NULL, NULL, 'Redis 7.0', NULL, NULL, 'active', 'redis', '应用', '华东机房B', '2026-06-16 22:00:00+08'),
  ('admin@switch-01', 'DEVICE', 8, 'switch-01', 22, NULL, '10.0.254.1', NULL, NULL, NULL, '交换机', NULL, 'active', 'admin', '网络工程师', '华北机房A', '2026-06-15 14:00:00+08'),
  ('ops@api-gateway', 'OP', 10, 'api-gateway', 22, NULL, '10.0.0.20', NULL, NULL, 'Kong 3.4', NULL, '运维平台', 'active', 'ops', '运维工程师', '华北机房A', '2026-06-17 10:00:00+08');

-- ============ Safeboxes ============
INSERT INTO safeboxes (name, status, scope, permissions, description) VALUES
  ('核心系统保险箱', 'active', '华北区域一,华东区域一', '查看,使用,回收', '核心业务系统账号保险箱'),
  ('测试环境保险箱', 'active', '华南区域', '查看,使用', '测试环境账号保险箱');

INSERT INTO safebox_accounts (safebox_id, account_id, account_name, account_status, mgmt_status, resource_ip, resource_name, device_type, os_type, region, app, last_login) VALUES
  (1, 1, 'root@server-001', 'active', '托管', '10.0.1.10', 'server-001', '服务器', 'CentOS 7.9', '华北区域一', '核心业务', '2026-06-17 09:00:00+08'),
  (1, 2, 'admin@db-primary', 'active', '托管', '10.0.3.20', 'db-primary', '数据库', NULL, '华东区域一', '核心业务', '2026-06-17 08:30:00+08'),
  (1, 5, 'ops@api-gateway', 'active', '半托管', '10.0.0.20', 'api-gateway', '应用', NULL, '华北区域一', '核心业务', '2026-06-17 10:00:00+08'),
  (2, 3, 'redis@redis-cluster', 'active', '托管', '10.0.5.10', 'redis-cluster', '中间件', NULL, '华东区域一', '测试环境', '2026-06-16 22:00:00+08');

-- ============ Snapshots ============
INSERT INTO snapshots (name, ci_id, snap_type, size, creator, status) VALUES
  ('db-primary-20260617', 4, '全量备份', '12.5GB', '自动', 'active'),
  ('redis-cluster-20260617', 6, 'RDB快照', '2.1GB', '自动', 'active'),
  ('server-001-系统配置', 1, '配置快照', '45MB', '管理员', 'active'),
  ('api-gateway-配置备份', 10, '配置快照', '8MB', '张工', 'active'),
  ('order-svc-meta', 13, '元数据', '256KB', '自动', 'active');

-- ============ Backup Tasks ============
INSERT INTO backup_tasks (name, ci_id, backup_type, target, schedule, retention, last_backup, status) VALUES
  ('DB全量备份', 4, '全量', 's3://backup/db/', '每天 02:00', '30天', '2026-06-17 02:00:00+08', 'active'),
  ('DB增量备份', 4, '增量', 's3://backup/db/', '每6小时', '7天', '2026-06-17 06:00:00+08', 'active'),
  ('Redis RDB备份', 6, '快照', 's3://backup/redis/', '每小时', '3天', '2026-06-17 10:00:00+08', 'active'),
  ('配置文件备份', 10, '配置', 'git:ops/configs', '每天 03:00', '90天', '2026-06-17 03:00:00+08', 'active'),
  ('日志归档', NULL, '归档', 's3://backup/logs/', '每天 04:00', '180天', '2026-06-17 04:00:00+08', 'active');

-- ============ Jobs ============
INSERT INTO jobs (name, target, progress, start_time, status) VALUES
  ('数据库巡检', 'db-primary, db-replica-02', 65, '2026-06-17 10:30:00+08', 'running');

INSERT INTO job_history (job_id, name, target, start_time, end_time, duration, status) VALUES
  (NULL, '全量备份', 'db-primary', '2026-06-17 02:00:00+08', '2026-06-17 02:45:00+08', '45分钟', 'success'),
  (NULL, '日志清理', 'log-collector', '2026-06-17 03:00:00+08', '2026-06-17 03:12:00+08', '12分钟', 'success'),
  (NULL, '安全扫描', '华北区域一', '2026-06-17 01:00:00+08', '2026-06-17 04:30:00+08', '3.5小时', 'success'),
  (NULL, '配置同步', 'all', '2026-06-17 03:00:00+08', '2026-06-17 03:05:00+08', '5分钟', 'failed');

INSERT INTO inspection_plans (name, description, schedule, target_count, status) VALUES
  ('每日巡检', '数据库每日健康巡检', '每天 09:00', 5, 'active'),
  ('安全合规巡检', '安全基线检查', '每周一 10:00', 20, 'active');

-- ============ Resource Changes ============
INSERT INTO resource_changes (ci_id, type, resource, detail, operator, time) VALUES
  (1, '配置变更', 'server-001', '内存扩容 32G→64G', '张伟', '2026-06-15 22:00:00+08'),
  (10, '版本升级', 'api-gateway', 'Kong 3.3→3.4', '李娜', '2026-06-14 14:30:00+08'),
  (13, '配置变更', '订单服务中心', 'JVM参数优化', '张伟', '2026-06-13 11:00:00+08'),
  (4, '扩容', 'db-primary', '磁盘扩容 500G→1T', '赵敏', '2026-06-12 02:00:00+08'),
  (6, '版本升级', 'redis-cluster', 'Redis 6.2→7.0', '王强', '2026-06-11 23:00:00+08'),
  (7, '配置变更', 'kafka', '分区数调整', '王强', '2026-06-10 16:00:00+08');

-- ============ Log Tasks ============
INSERT INTO log_collect_tasks (name, scene, enabled, target, region, deploy_status, last_collect) VALUES
  ('应用日志采集', '应用', true, '所有应用节点', '华北区域一', 'deployed', '2026-06-17 10:30:00+08'),
  ('DB错误日志', '数据库', true, '数据库集群', '华北区域一,华东区域一', 'deployed', '2026-06-17 10:30:00+08'),
  ('安全审计日志', '安全', true, '所有节点', '全部区域', 'deployed', '2026-06-17 10:30:00+08'),
  ('中间件日志', '中间件', false, 'Redis/Kafka节点', '华南区域', 'pending', NULL),
  ('网络设备日志', '网络', true, '核心交换机', '华北区域一', 'deployed', '2026-06-17 10:25:00+08');

INSERT INTO log_forward_tasks (name, target_type, target_addr, forward_content, enabled, last_forward) VALUES
  ('应用到日志中心', 'Kafka', 'kafka-prod-01:9092', '["app-*", "nginx-*"]', true, '2026-06-17 10:30:00+08'),
  ('DB日志到ELK', 'Elasticsearch', 'es-prod-01:9200', '["mysql-slow", "mysql-error"]', true, '2026-06-17 10:28:00+08'),
  ('安全日志到SIEM', 'Syslog', 'siem-01:514', '["auth-*", "audit-*"]', true, '2026-06-17 10:30:00+08'),
  ('调试日志丢弃', 'DevNull', 'file://dev/null', '["debug-*"]', false, NULL);

INSERT INTO log_templates (name, scene, engine, sample, source_type) VALUES
  ('Nginx访问日志', '应用', 'iLogtail', '$remote_addr - $remote_user [$time_local] "$request"', '文件'),
  ('MySQL慢查询', '数据库', 'Filebeat', '# Time: $time\n# User@Host: $user', '文件'),
  ('Java应用日志', '应用', 'Logstash', '%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n', '文件'),
  ('系统日志', '系统', 'Rsyslog', '%timegenerated %hostname %syslogtag %msg', 'Syslog'),
  ('K8s容器日志', '容器', 'Fluentd', '{json结构}', '标准输出');

INSERT INTO operation_logs (hostname, detail, event, resource, level, result, "user", ip, trace, time, protocol) VALUES
  ('server-001', '用户admin登录系统', 'LOGIN', '系统', 'INFO', '成功', 'admin', '10.0.0.1', 'trace-001', '2026-06-17 10:00:00+08', 'HTTPS'),
  ('api-gateway', '更新路由配置', 'UPDATE', '路由表', 'INFO', '成功', '张伟', '10.0.0.5', 'trace-002', '2026-06-17 09:30:00+08', 'HTTPS'),
  ('db-primary', '执行ALTER TABLE', 'DDL', 'orders表', 'WARN', '成功', '赵敏', '10.0.0.8', 'trace-003', '2026-06-17 08:00:00+08', 'MySQL'),
  ('k8s-node-02', 'Pod重建', 'RESTART', 'payment-service', 'INFO', '触发', '系统', '10.0.4.12', 'trace-004', '2026-06-17 08:45:00+08', 'K8s API'),
  ('server-001', '密码修改', 'PASSWORD_CHANGE', 'root', 'WARN', '成功', 'admin', '10.0.0.1', 'trace-005', '2026-06-16 23:00:00+08', 'SSH'),
  ('server-001', '创建用户ops_deploy', 'CREATE_USER', 'ops_deploy', 'INFO', '成功', 'admin', '10.0.0.1', 'trace-006', '2026-06-16 22:00:00+08', 'SSH'),
  ('api-gateway', '限流策略更新', 'UPDATE', 'rate_limit', 'INFO', '成功', '李娜', '10.0.0.6', 'trace-007', '2026-06-16 15:00:00+08', 'HTTPS'),
  ('db-primary', '查询慢日志', 'SELECT', 'slow_log', 'INFO', '成功', '赵敏', '10.0.0.8', 'trace-008', '2026-06-16 14:00:00+08', 'MySQL');

INSERT INTO runtime_logs (time, content, source) VALUES
  ('2026-06-17 10:32:00+08', '[ERROR] cpu usage exceeds 95% on server-001', 'node-exporter'),
  ('2026-06-17 10:30:00+08', '[WARN] memory usage 82% on app-server-03', 'node-exporter'),
  ('2026-06-17 10:28:00+08', '[ERROR] disk usage 92% on db-primary', 'node-exporter'),
  ('2026-06-17 10:25:00+08', '[INFO] nginx access log rotated', 'nginx'),
  ('2026-06-17 10:20:00+08', '[ERROR] connection timeout to kafka broker 2', 'kafka-exporter'),
  ('2026-06-17 10:15:00+08', '[WARN] response time 2450ms on api-gateway', 'kong'),
  ('2026-06-17 10:00:00+08', '[INFO] backup task completed successfully', 'cron'),
  ('2026-06-17 09:55:00+08', '[ERROR] replication lag 35s on db-replica-02', 'mysql-exporter');

-- ============ App Orders ============
INSERT INTO app_orders (order_id, title, name, type, res_type, reason, handler, applicant, approver, status, status_label, created_at, finished_at) VALUES
  ('ORD-2026-0001', '申请数据库账号', 'dev1', '新建', '数据库', '开发环境需要', '张工', '李开发', '王安全', 'approved', '已通过', '2026-06-17 09:00:00+08', '2026-06-17 10:00:00+08'),
  ('ORD-2026-0002', '服务器权限变更', 'ops1', '变更', '服务器', '工作需要', '王工', '张运维', '王安全', 'pending', '待审批', '2026-06-17 10:00:00+08', NULL),
  ('ORD-2026-0003', '申请VPN账号', 'auditor', '新建', '网络', '远程审计需要', NULL, '王安全', NULL, 'pending', '待审批', '2026-06-17 11:00:00+08', NULL);

INSERT INTO todos (title, source, priority, priority_label, deadline, status, status_label) VALUES
  ('处理数据库主从延迟告警', '告警系统', 'critical', '紧急', '2026-06-17 12:00:00+08', 'pending', '待处理'),
  ('更新SSL证书', '运维计划', 'high', '高', '2026-06-20 18:00:00+08', 'pending', '待处理'),
  ('Q2机房巡检报告', '管理任务', 'normal', '普通', '2026-06-30 18:00:00+08', 'in_progress', '进行中'),
  ('安全基线合规检查', '安全组', 'high', '高', '2026-06-25 18:00:00+08', 'pending', '待处理'),
  ('升级Kong网关到3.6', '版本计划', 'low', '低', '2026-07-15 18:00:00+08', 'pending', '待处理');

-- ============ Topology ============
INSERT INTO topology_zones (name, status, icon, sort_order) VALUES
  ('华北区域一', 'normal', 'fa-cloud', 1),
  ('华东区域一', 'normal', 'fa-cloud', 2),
  ('华南区域', 'warning', 'fa-cloud', 3);

INSERT INTO topology_nodes (zone_id, label, icon_text, combo, status, style, sort_order) VALUES
  (1, 'SLB-prod', 'fa-sliders-h', 'region-beijing', 'normal', '{"x":100,"y":50}', 1),
  (2, 'SLB-east', 'fa-sliders-h', 'region-shanghai', 'normal', '{"x":600,"y":50}', 1),
  (1, 'server-001', 'fa-server', 'region-beijing', 'normal', '{"x":80,"y":200}', 2),
  (1, 'app-server-02', 'fa-server', 'region-beijing', 'warning', '{"x":200,"y":200}', 3),
  (1, 'db-master', 'fa-database', 'region-beijing', 'normal', '{"x":80,"y":350}', 4),
  (2, 'server-east-01', 'fa-server', 'region-shanghai', 'normal', '{"x":580,"y":200}', 2),
  (2, 'server-east-02', 'fa-server', 'region-shanghai', 'abnormal', '{"x":680,"y":200}', 3),
  (2, 'db-replica', 'fa-database', 'region-shanghai', 'normal', '{"x":600,"y":350}', 4);

INSERT INTO topology_edges (source_id, target_id, data, style) VALUES
  (1, 3, '{"label":"流量1Gbps"}', '{"stroke":"#52c41a"}'),
  (1, 4, '{"label":"流量500Mbps"}', '{"stroke":"#fa8c16"}'),
  (1, 2, '{"label":"跨区域1Gbps"}', '{"stroke":"#1890ff","lineDash":[5,5]}'),
  (2, 6, '{"label":"流量800Mbps"}', '{"stroke":"#52c41a"}'),
  (2, 7, '{"label":"流量200Mbps"}', '{"stroke":"#f5222d"}'),
  (3, 5, '{"label":"读写"}', '{"stroke":"#52c41a"}'),
  (4, 5, '{"label":"读写"}', '{"stroke":"#52c41a"}'),
  (5, 8, '{"label":"复制"}', '{"stroke":"#1890ff","lineDash":[5,5]}');

-- ============ Monitor Metrics ============
INSERT INTO monitor_metrics (name, type, enabled) VALUES
  ('CPU使用率', '系统指标', true),
  ('内存使用率', '系统指标', true),
  ('磁盘使用率', '系统指标', true),
  ('网络吞吐', '网络指标', true);

-- ============ Application List ============
INSERT INTO app_list (name, type, region, status, description) VALUES
  ('订单系统', '业务应用', '华北区域一', 'active', '核心订单处理系统'),
  ('支付系统', '业务应用', '华东区域一', 'active', '支付网关'),
  ('用户中心', '业务应用', '华北区域一', 'active', '统一认证和用户管理'),
  ('消息平台', '消息中间件', '华北区域一', 'active', '消息推送服务'),
  ('日志平台', '基础平台', '华北区域一', 'active', '统一日志管理平台'),
  ('监控平台', '基础平台', '华北区域一', 'active', '运维监控系统'),
  ('容器平台', '基础平台', '华北区域一', 'active', 'K8s容器管理'),
  ('DevOps平台', '基础平台', '华东区域一', 'active', 'CI/CD流水线');
