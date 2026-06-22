<template>
  <div>
    <div class="page-header">
      <h3>日志查询</h3>
    </div>
    <a-tabs v-model:activeKey="activeTab" class="log-tabs">
      <a-tab-pane key="admin" tab="管理面">
        <div class="filter-admin">
          <div class="filter-item">
            <label>日志类型</label>
            <a-select v-model:value="adminForm.logType" placeholder="请选择" style="width: 200px" allowClear>
              <a-select-option value="syslog">syslog</a-select-option>
              <a-select-option value="audit">audit</a-select-option>
            </a-select>
          </div>
          <div class="filter-item">
            <label>时间</label>
            <div class="time-btn-group">
              <a-button v-for="btn in timeBtns" :key="btn.value" :type="adminForm.timeBtn === btn.value ? 'primary' : 'default'" size="small" @click="adminForm.timeBtn = btn.value">{{ btn.label }}</a-button>
            </div>
          </div>
          <div class="filter-item">
            <label>主机名</label>
            <a-input v-model:value="adminForm.hostname" placeholder="请输入主机名" style="width: 200px" allowClear />
          </div>
          <div class="filter-item">
            <label>操作详情</label>
            <a-input v-model:value="adminForm.detail" placeholder="最大长度为25个字符" style="width: 200px" allowClear />
          </div>
          <div class="filter-actions" style="margin-bottom: 16px;">
            <a-button type="primary">查询</a-button>
            <a-button>导出<i class="fa-solid fa-caret-down" style="margin-left: 8px;"></i></a-button>
          </div>
        </div>
        <a-table :columns="adminColumns" :data-source="adminData" :pagination="adminPagination" row-key="id" :scroll="{ x: 700 }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'detail'">
              <span style="font-size: 12px; font-family: monospace;">{{ record.detail }}</span>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="tenant" tab="租户面">
        <div class="time-btn-group" style="margin-bottom: 16px;">
          <a-button v-for="btn in timeBtns" :key="btn.value" :type="tenantForm.timeBtn === btn.value ? 'primary' : 'default'" @click="tenantForm.timeBtn = btn.value">{{ btn.label }}</a-button>
        </div>
        <a-row :gutter="16" style="margin-bottom: 16px;">
          <a-col :span="8">
            <div class="filter-field"><label>服务名称</label><a-select placeholder="请选择" style="width: 100%" allowClear><a-select-option value="ecs">ECS</a-select-option><a-select-option value="rds">RDS</a-select-option><a-select-option value="slb">SLB</a-select-option></a-select></div>
          </a-col>
          <a-col :span="8">
            <div class="filter-field"><label>资源类型</label><a-select placeholder="请选择" style="width: 100%" allowClear><a-select-option value="instance">实例</a-select-option><a-select-option value="volume">云盘</a-select-option><a-select-option value="snapshot">快照</a-select-option></a-select></div>
          </a-col>
          <a-col :span="8">
            <div class="filter-field"><label>筛选类型</label><a-select placeholder="请选择" style="width: 100%" allowClear><a-select-option value="all">全部</a-select-option><a-select-option value="event">事件</a-select-option><a-select-option value="audit">审计</a-select-option></a-select></div>
          </a-col>
        </a-row>
        <a-row :gutter="16" style="margin-bottom: 16px;">
          <a-col :span="8">
            <div class="filter-field"><label>事件名称</label><a-select placeholder="请选择" style="width: 100%" allowClear><a-select-option value="login">用户登录</a-select-option><a-select-option value="upload">文件上传</a-select-option><a-select-option value="delete">删除</a-select-option></a-select></div>
          </a-col>
          <a-col :span="8">
            <div class="filter-field"><label>级别</label><a-select placeholder="请选择" style="width: 100%" allowClear><a-select-option value="info">一般</a-select-option><a-select-option value="warn">警告</a-select-option><a-select-option value="danger">危险</a-select-option></a-select></div>
          </a-col>
          <a-col :span="8">
            <div class="filter-field"><label>操作结果</label><a-select placeholder="请选择" style="width: 100%" allowClear><a-select-option value="success">成功</a-select-option><a-select-option value="fail">失败</a-select-option></a-select></div>
          </a-col>
        </a-row>
        <a-row :gutter="16" style="margin-bottom: 16px;">
          <a-col :span="8">
            <div class="filter-field"><label>Request ID</label><a-input placeholder="最大长度为25个字符" style="width: 100%" allowClear><template #suffix><i class="fa-solid fa-magnifying-glass" style="color: #999; cursor: pointer;"></i></template></a-input></div>
          </a-col>
          <a-col :span="8">
            <div class="filter-field"><label>资源空间ID</label><a-input placeholder="最大长度为25个字符" style="width: 100%" allowClear><template #suffix><i class="fa-solid fa-magnifying-glass" style="color: #999; cursor: pointer;"></i></template></a-input></div>
          </a-col>
          <a-col :span="8">
            <div class="filter-field"><label>操作日志ID</label><a-input placeholder="最大长度为25个字符" style="width: 100%" allowClear><template #suffix><i class="fa-solid fa-magnifying-glass" style="color: #999; cursor: pointer;"></i></template></a-input></div>
          </a-col>
        </a-row>
        <div class="filter-actions" style="margin-bottom: 16px;">
          <a-button type="primary">查询</a-button>
          <a-button>导出 <i class="fa-solid fa-caret-down"></i></a-button>
        </div>
        <a-table :columns="tenantColumns" :data-source="tenantData" :pagination="tenantPagination" row-key="id" :scroll="{ x: 900 }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'level'">
              <span :style="{ color: record.level === '危险' ? '#fa8c16' : '#007DFF' }">● {{ record.level }}</span>
            </template>
            <template v-if="column.key === 'result'">
              <span :style="{ color: record.result === '成功' ? '#52c41a' : '#ff4d4f' }">{{ record.result }}</span>
            </template>
            <template v-if="column.key === 'trace'">
              <span style="color: #999;">--</span>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const activeTab = ref('admin')

const timeBtns = [
  { label: '十五分钟内', value: '15min' },
  { label: '一小时内', value: '1hour' },
  { label: '一天内', value: '1day' },
  { label: '三天内', value: '3day' },
  { label: '一周内', value: '1week' },
  { label: '三十天内', value: '30day' },
  { label: '自定义', value: 'custom' },
]

const adminForm = reactive({ logType: null, timeBtn: '1hour', hostname: '', detail: '' })
const tenantForm = reactive({ timeBtn: '1hour' })

const adminData = ref([
  { id: 1, hostname: 'server-001', detail: '用户admin登录系统', time: '2026-06-17 10:00:00', protocol: 'HTTPS' },
  { id: 2, hostname: 'api-gateway', detail: '更新路由配置', time: '2026-06-17 09:30:00', protocol: 'HTTPS' },
  { id: 3, hostname: 'db-primary', detail: '执行ALTER TABLE', time: '2026-06-17 08:00:00', protocol: 'MySQL' },
  { id: 4, hostname: 'k8s-node-02', detail: 'Pod重建', time: '2026-06-17 08:45:00', protocol: 'K8s API' },
])
const tenantData = ref([
  { id: 5, event: 'LOGIN', resource: '系统', level: 'INFO', result: '成功', user: 'admin', ip: '10.0.0.1', time: '2026-06-17 10:00:00', trace: 'trace-001' },
  { id: 6, event: 'UPDATE', resource: '路由表', level: 'INFO', result: '成功', user: '张伟', ip: '10.0.0.5', time: '2026-06-17 09:30:00', trace: 'trace-002' },
  { id: 7, event: 'DDL', resource: 'orders表', level: 'WARN', result: '成功', user: '赵敏', ip: '10.0.0.8', time: '2026-06-17 08:00:00', trace: 'trace-003' },
  { id: 8, event: 'RESTART', resource: 'payment-service', level: 'INFO', result: '触发', user: '系统', ip: '10.0.4.12', time: '2026-06-17 08:45:00', trace: 'trace-004' },
  { id: 9, event: 'PASSWORD_CHANGE', resource: 'root', level: 'WARN', result: '成功', user: 'admin', ip: '10.0.0.1', time: '2026-06-16 23:00:00', trace: 'trace-005' },
  { id: 10, event: 'CREATE_USER', resource: 'ops_deploy', level: 'INFO', result: '成功', user: 'admin', ip: '10.0.0.1', time: '2026-06-16 22:00:00', trace: 'trace-006' },
  { id: 11, event: 'UPDATE', resource: 'rate_limit', level: 'INFO', result: '成功', user: '李娜', ip: '10.0.0.6', time: '2026-06-16 15:00:00', trace: 'trace-007' },
  { id: 12, event: 'SELECT', resource: 'slow_log', level: 'INFO', result: '成功', user: '赵敏', ip: '10.0.0.8', time: '2026-06-16 14:00:00', trace: 'trace-008' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/operation_logs?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      var admin = json.data.map(function(item) {
        return {
          id: item.id,
          hostname: item.hostname,
          detail: item.detail,
          time: item.time,
          protocol: item.protocol,
        }
      })
      var tenant = json.data.map(function(item) {
        return {
          id: item.id,
          event: item.event,
          resource: item.resource,
          level: item.level,
          result: item.result,
          user: item.user,
          ip: item.ip,
          time: item.time,
          trace: item.trace,
        }
      })
      adminData.value = admin
      tenantData.value = tenant
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})

const adminColumns = [
  { title: '主机名', dataIndex: 'hostname', width: 140 },
  { title: '操作详情', key: 'detail', ellipsis: true },
  { title: '入库时间', dataIndex: 'time', width: 170, sorter: true },
  { title: '协议类型', dataIndex: 'protocol', width: 90 },
]

const adminPagination = { pageSize: 10, total: 153 }

const tenantColumns = [
  { title: '事件名称', dataIndex: 'event', width: 120, sorter: true },
  { title: '资源名称', dataIndex: 'resource', width: 160, sorter: true, ellipsis: true },
  { title: '级别', key: 'level', width: 70, sorter: true },
  { title: '操作结果', key: 'result', width: 80, sorter: true },
  { title: '操作用户', dataIndex: 'user', width: 110 },
  { title: '操作IP', dataIndex: 'ip', width: 130 },
  { title: '操作时间', dataIndex: 'time', width: 170, sorter: true },
  { title: '调用链链接', key: 'trace', width: 100 },
]

const tenantPagination = { pageSize: 10, total: 153, showTotal: total => `总条数：${total} | 已选：0`, showSizeChanger: true, current: 14 }
</script>

<style scoped>
.page-header { margin-bottom: 4px; }
.filter-admin { margin-bottom: 12px; }
.filter-item { margin-bottom: 12px; }
.filter-item label { display: block; margin-bottom: 4px; font-size: 14px; color: #333; }
.time-btn-group { display: flex; flex-wrap: wrap; gap: 6px; }
.filter-actions { display: flex; gap: 8px; margin-bottom: 0; }
.filter-field label { display: block; margin-bottom: 4px; font-size: 14px; color: #333; }
.search-bar-wrapper { border: 1px solid #d9d9d9; border-radius: 6px; background: #fff; }
.search-bar-inner { display: flex; align-items: center; padding: 4px 8px; }
.search-bar-inner :deep(.ant-input) { border: none; box-shadow: none; }
.search-bar-inner :deep(.ant-input:focus) { box-shadow: none; }
.search-icons { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
@media (max-width: 768px) {
  .filter-item label { text-align: left; }
  .filter-actions { flex-direction: column; }
  .page-header h3 { font-size: 15px; }
  .filter-field { margin-bottom: 8px; }
}
</style>
