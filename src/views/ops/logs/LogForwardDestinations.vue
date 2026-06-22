<template>
  <div>
    <div class="page-header">
      <h3>日志转发目的地</h3>
    </div>
    <div class="filter-actions-bar">
      <a-button type="primary" style="margin-left: auto">新建目的地</a-button>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="type" placeholder="目的地类型" style="width: 130px" allowClear>
        <a-select-option value="Kafka">Kafka</a-select-option>
        <a-select-option value="Syslog">Syslog</a-select-option>
        <a-select-option value="HTTP">HTTP</a-select-option>
        <a-select-option value="ES">Elasticsearch</a-select-option>
        <a-select-option value="S3">S3</a-select-option>
      </a-select>
      <a-select v-model:value="connectStatus" placeholder="连通状态" style="width: 110px" allowClear>
        <a-select-option value="可用">可用</a-select-option>
        <a-select-option value="不可用">不可用</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="综合搜索名称/地址" style="flex: 1; min-width: 200px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id" :scroll="{ x: 700 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="record.type === 'Kafka' ? 'purple' : record.type === 'Syslog' ? 'blue' : record.type === 'ES' ? 'green' : record.type === 'S3' ? 'cyan' : 'orange'">{{ record.type }}</a-tag>
        </template>
        <template v-if="column.key === 'auth'">
          <span>{{ record.auth || '无' }}</span>
        </template>
        <template v-if="column.key === 'connectStatus'">
          <a-tag :color="record.connectStatus === '可用' ? 'green' : 'red'">{{ record.connectStatus }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">修改</a-button>
          <a-button type="link" size="small" danger>删除</a-button>
          <a-button type="link" size="small">测试</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const search = ref('')
const type = ref(null)
const connectStatus = ref(null)
const data = ref([
  { id: 1, name: 'Kafka-日志集群', type: 'Kafka', addr: '10.0.2.20:9092,10.0.2.21:9092', auth: 'SASL/PLAIN', connectStatus: '可用' },
  { id: 2, name: 'Syslog-审计中心', type: 'Syslog', addr: '192.168.1.100:514', auth: null, connectStatus: '可用' },
  { id: 3, name: 'ES-日志存储', type: 'ES', addr: '10.0.3.10:9200', auth: 'SSL', connectStatus: '不可用' },
  { id: 4, name: 'S3-归档存储', type: 'S3', addr: 's3://log-archive-bucket', auth: 'AccessKey', connectStatus: '可用' },
  { id: 5, name: 'Webhook-告警', type: 'HTTP', addr: 'https://webhook.company.com/log', auth: 'Bearer Token', connectStatus: '可用' },
])
const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '类型', key: 'type', width: 95 },
  { title: '地址', dataIndex: 'addr', ellipsis: true },
  { title: '认证方式', key: 'auth', width: 110 },
  { title: '连通状态', key: 'connectStatus', width: 95 },
  { title: '操作', key: 'action', width: 170 },
]
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.filter-actions-bar { display: flex; align-items: center; margin-bottom: 8px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }
@media (max-width: 768px) {
  .filter-actions-bar { flex-wrap: wrap; }
  .filter-bar { flex-wrap: wrap; }
  .filter-bar :deep(.ant-select) { flex: 1 1 calc(50% - 4px); min-width: 0; }
  .filter-bar :deep(.ant-input-search) { flex: 1; min-width: 200px; }
  .page-header h3 { font-size: 15px; }
}
</style>
