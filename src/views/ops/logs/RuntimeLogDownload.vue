<template>
  <div>
    <div class="page-header">
      <h3>日志下载</h3>
      <a-button type="primary">新建下载任务</a-button>
    </div>
    <div class="filter-bar">
      <a-input-search v-model:value="search" placeholder="综合搜索任务名/来源" style="width: 280px" />
      <a-select v-model:value="status" placeholder="状态" style="width: 120px" size="small" allowClear>
        <a-select-option value="pending">生成中</a-select-option>
        <a-select-option value="done">已完成</a-select-option>
        <a-select-option value="fail">失败</a-select-option>
      </a-select>
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'format'">
          <a-tag>{{ record.format }}</a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'done' ? 'green' : record.status === 'fail' ? 'red' : 'blue'">
            {{ { pending: '生成中', done: '已完成', fail: '失败' }[record.status] }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" :disabled="record.status !== 'done'"><i class="fa-solid fa-download"></i> 下载</a-button>
          <a-button type="link" size="small" danger>删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const search = ref('')
const status = ref(null)
const data = ref([
  { id: 1, taskName: '20260520-运行日志', timeRange: '05-19 ~ 05-20', source: 'user-service', format: 'gz', size: '256MB', status: 'done', created: '2026-05-20 12:00' },
  { id: 2, taskName: 'API网关错误日志', timeRange: '05-18 ~ 05-20', source: 'api-gateway', format: 'txt', size: '18MB', status: 'done', created: '2026-05-20 10:30' },
  { id: 3, taskName: '全量日志导出-0520', timeRange: '05-20 00:00 ~ 14:00', source: '全部', format: 'csv', size: '1.2GB', status: 'pending', created: '2026-05-20 14:00' },
  { id: 4, taskName: '监控服务警告日志', timeRange: '05-15 ~ 05-20', source: 'monitor', format: 'txt', size: '-', status: 'fail', created: '2026-05-21 08:00' },
])
const columns = [
  { title: '任务名', dataIndex: 'taskName' },
  { title: '时间范围', dataIndex: 'timeRange' },
  { title: '来源', dataIndex: 'source', width: 110 },
  { title: '格式', key: 'format', width: 70 },
  { title: '大小', dataIndex: 'size', width: 90 },
  { title: '状态', key: 'status', width: 90 },
  { title: '创建时间', dataIndex: 'created', width: 160 },
  { title: '操作', key: 'action', width: 130 },
]
</script>
