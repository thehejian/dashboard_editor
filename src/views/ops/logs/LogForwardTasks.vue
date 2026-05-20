<template>
  <div>
    <div class="page-header">
      <h3>日志转发任务</h3>
      <a-button type="primary">新建任务</a-button>
    </div>
    <div class="filter-bar">
      <a-input-search v-model:value="search" placeholder="综合搜索任务名/目标地址" style="width: 280px" />
      <a-select v-model:value="targetType" placeholder="目标类型" style="width: 130px" size="small" allowClear>
        <a-select-option value="Kafka">Kafka</a-select-option>
        <a-select-option value="Syslog">Syslog</a-select-option>
        <a-select-option value="HTTP">HTTP</a-select-option>
        <a-select-option value="ES">Elasticsearch</a-select-option>
      </a-select>
      <a-select v-model:value="enabled" placeholder="状态" style="width: 100px" size="small" allowClear>
        <a-select-option value="启用">启用</a-select-option>
        <a-select-option value="停用">停用</a-select-option>
      </a-select>
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'targetType'">
          <a-tag :color="record.targetType === 'Kafka' ? 'purple' : record.targetType === 'Syslog' ? 'blue' : record.targetType === 'ES' ? 'green' : 'orange'">{{ record.targetType }}</a-tag>
        </template>
        <template v-if="column.key === 'enabled'">
          <a-switch v-model:checked="record.enabled" size="small" />
        </template>
        <template v-if="column.key === 'forwardContent'">
          <span>{{ record.forwardContent?.join('、') }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">{{ record.enabled ? '停用' : '启用' }}</a-button>
          <a-button type="link" size="small">修改</a-button>
          <a-button type="link" size="small" danger>删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const search = ref('')
const targetType = ref(null)
const enabled = ref(null)
const data = ref([
  { id: 1, name: '异常日志-Kafka', targetType: 'Kafka', targetAddr: '10.0.2.20:9092', forwardContent: ['操作日志', '运行日志'], enabled: true, lastForward: '2026-05-20 14:35:22' },
  { id: 2, name: '安全审计-Syslog', targetType: 'Syslog', targetAddr: '192.168.1.100:514', forwardContent: ['操作日志'], enabled: true, lastForward: '2026-05-20 14:35:20' },
  { id: 3, name: '全量日志-ES', targetType: 'ES', targetAddr: '10.0.3.10:9200', forwardContent: ['运行日志', '告警'], enabled: false, lastForward: '2026-05-19 10:00:00' },
  { id: 4, name: '告警推送-HTTP', targetType: 'HTTP', targetAddr: 'https://webhook.company.com/alert', forwardContent: ['告警'], enabled: true, lastForward: '2026-05-20 14:30:00' },
])
const columns = [
  { title: '任务名', dataIndex: 'name' },
  { title: '目标类型', key: 'targetType', width: 100 },
  { title: '目标地址', dataIndex: 'targetAddr' },
  { title: '转发内容', key: 'forwardContent' },
  { title: '状态', key: 'enabled', width: 70 },
  { title: '最后转发时间', dataIndex: 'lastForward', width: 170 },
  { title: '操作', key: 'action', width: 180 },
]
</script>
