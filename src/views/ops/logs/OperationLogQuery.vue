<template>
  <div>
    <div class="page-header">
      <h3>操作日志</h3>
    </div>
    <div class="filter-bar">
      <a-range-picker v-model:value="timeRange" style="width: 240px" />
      <a-select v-model:value="opType" placeholder="操作类型" style="width: 120px" allowClear>
        <a-select-option value="create">创建</a-select-option>
        <a-select-option value="update">修改</a-select-option>
        <a-select-option value="delete">删除</a-select-option>
        <a-select-option value="query">查询</a-select-option>
      </a-select>
      <a-select v-model:value="result" placeholder="结果" style="width: 100px" allowClear>
        <a-select-option value="success">成功</a-select-option>
        <a-select-option value="fail">失败</a-select-option>
        <a-select-option value="exception">异常</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="综合搜索操作者/资源/操作" style="width: 280px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id" :scroll="{ x: 700 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'opType'">
          <a-tag :color="record.opType === 'delete' ? 'red' : record.opType === 'create' ? 'green' : record.opType === 'update' ? 'orange' : 'blue'">{{ {create:'创建',update:'修改',delete:'删除',query:'查询'}[record.opType] }}</a-tag>
        </template>
        <template v-if="column.key === 'result'">
          <a-tag :color="record.result === 'success' ? 'green' : record.result === 'fail' ? 'red' : 'orange'">{{ {success:'成功',fail:'失败',exception:'异常'}[record.result] }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">详情</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const search = ref('')
const timeRange = ref(null)
const opType = ref(null)
const result = ref(null)
const data = ref([
  { id: 1, time: '2026-05-20 10:30:00', operator: 'admin', opType: 'create', resource: 'ecs-001', result: 'success' },
  { id: 2, time: '2026-05-20 10:25:00', operator: 'ops1', opType: 'delete', resource: 'rds-002', result: 'success' },
  { id: 3, time: '2026-05-20 10:20:00', operator: 'sys', opType: 'update', resource: 'slb-config', result: 'fail' },
  { id: 4, time: '2026-05-20 10:15:00', operator: 'admin', opType: 'query', resource: '实例列表', result: 'exception' },
  { id: 5, time: '2026-05-20 10:10:00', operator: 'ops2', opType: 'create', resource: 'disk-003', result: 'success' },
])
const columns = [
  { title: '时间', dataIndex: 'time', width: 170 },
  { title: '操作者', dataIndex: 'operator', width: 100 },
  { title: '操作类型', key: 'opType', width: 100 },
  { title: '目标资源', dataIndex: 'resource' },
  { title: '结果', key: 'result', width: 90 },
  { title: '操作', key: 'action', width: 80 },
]
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }
@media (max-width: 768px) {
  .filter-bar { flex-wrap: wrap; }
  .filter-bar :deep(.ant-select),
  .filter-bar :deep(.ant-input-search),
  .filter-bar :deep(.ant-picker) { flex: 1 1 calc(50% - 4px); min-width: 0; }
  .page-header h3 { font-size: 15px; }
}
</style>
