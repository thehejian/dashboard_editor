<template>
  <div>
    <div class="page-header"><h3>应用及中间件账号</h3></div>
    <div class="button-row">
      <a-button>创建</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="search-row">
      <a-input-search v-model:value="search" placeholder="请输入关键字搜索" />
    </div>
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a class="link-blue">{{ record.name }}</a>
        </template>
        <template v-if="column.key === 'status'">
          <span class="status-cell"><span class="status-dot" :class="'dot-' + record.status"></span>{{ record.statusLabel }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a class="link-blue" style="margin-right: 12px">修改</a>
          <a class="link-blue">删除</a>
        </template>
      </template>
    </a-table>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const search = ref('')
const selectedRowKeys = ref([])
function onSelectChange(keys) { selectedRowKeys.value = keys }
const columns = [
  { title: '账号名', dataIndex: 'name', key: 'name', sorter: true },
  { title: '中间件类型', dataIndex: 'mwType', key: 'mwType' },
  { title: '连接地址', dataIndex: 'host', key: 'host' },
  { title: '端口', dataIndex: 'port', key: 'port' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '所属应用', dataIndex: 'app', key: 'app' },
  { title: '关联用户', dataIndex: 'user', key: 'user' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', sorter: true },
  { title: '操作', key: 'action', width: 120 },
]
const data = ref([
  { id: 1, name: 'tomcat_admin', mwType: 'Tomcat 9', host: '192.168.20.10', port: 8080, status: 'green', statusLabel: '正常', app: '业务系统A', user: '张运维', createdAt: '2024/01/15 09:00:00' },
  { id: 2, name: 'nginx_ops', mwType: 'Nginx 1.24', host: '192.168.20.20', port: 443, status: 'green', statusLabel: '正常', app: '统一网关', user: '李运维', createdAt: '2024/03/20 10:30:00' },
  { id: 3, name: 'kafka_admin', mwType: 'Kafka 3.5', host: '192.168.20.30', port: 9092, status: 'red', statusLabel: '异常', app: '消息平台', user: '王运维', createdAt: '2024/06/10 14:00:00' },
  { id: 4, name: 'zk_admin', mwType: 'ZooKeeper 3.8', host: '192.168.20.40', port: 2181, status: 'green', statusLabel: '正常', app: '配置中心', user: '赵运维', createdAt: '2024/08/05 11:20:00' },
  { id: 5, name: 'rabbitmq_admin', mwType: 'RabbitMQ 3.12', host: '192.168.20.50', port: 5672, status: 'yellow', statusLabel: '警告', app: '消息队列', user: '张运维', createdAt: '2024/02/28 16:45:00' },
])
</script>
<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; color: var(--text); }
.button-row { display: flex; gap: 8px; margin-bottom: 12px; }
.search-row { margin-bottom: 16px; }
.link-blue { color: var(--brand); cursor: pointer; font-size: 13px; }
.link-blue:hover { opacity: 0.8; }
.status-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background: #52c41a; }
.dot-yellow { background: #fa8c16; }
.dot-red { background: #f5222d; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .page-header h3 { font-size: 16px; }
  .page-header .ant-btn { width: 100%; }
  .button-row { flex-wrap: wrap; }
  .button-row .ant-btn { flex: 1; min-width: 0; }
  .search-row .ant-input-search { width: 100% !important; }
  .ant-table { overflow-x: auto; }
}
</style>
