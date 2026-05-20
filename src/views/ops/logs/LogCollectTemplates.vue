<template>
  <div>
    <div class="page-header">
      <h3>日志采集模板</h3>
      <a-button type="primary">新建模板</a-button>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="scene" placeholder="场景类型" style="width: 130px" allowClear>
        <a-select-option value="异常日志">异常日志</a-select-option>
        <a-select-option value="全量日志">全量日志</a-select-option>
        <a-select-option value="自定义">自定义</a-select-option>
      </a-select>
      <a-select v-model:value="sourceType" placeholder="来源" style="width: 100px" allowClear>
        <a-select-option value="内置">内置</a-select-option>
        <a-select-option value="自定义">自定义</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="综合搜索模板名" style="width: 280px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'scene'">
          <a-tag :color="record.scene === '异常日志' ? 'red' : record.scene === '全量日志' ? 'blue' : 'orange'">{{ record.scene }}</a-tag>
        </template>
        <template v-if="column.key === 'sourceType'">
          <a-tag :color="record.sourceType === '内置' ? 'default' : 'blue'">{{ record.sourceType }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small">查看</a-button>
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
const scene = ref(null)
const sourceType = ref(null)
const data = ref([
  { id: 1, name: 'Nginx-错误日志', scene: '异常日志', engine: 'grok', sample: '2026/05/20 14:35:20 [error] ...', sourceType: '内置' },
  { id: 2, name: 'Java-应用日志', scene: '全量日志', engine: 'grok', sample: '2026-05-20 14:35:20.123 INFO ...', sourceType: '内置' },
  { id: 3, name: '交换机-syslog', scene: '自定义', engine: 'regex', sample: '<190>May 20 14:35:20 10.0.1.1 ...', sourceType: '自定义' },
  { id: 4, name: 'MySQL-慢查询', scene: '异常日志', engine: 'regex', sample: '# Time: 2026-05-20T14:35:20...', sourceType: '内置' },
  { id: 5, name: 'K8s-容器日志', scene: '全量日志', engine: 'json', sample: '{"log":"...","stream":"stdout","time":"..."}', sourceType: '内置' },
])
const columns = [
  { title: '模板名', dataIndex: 'name' },
  { title: '场景类型', key: 'scene', width: 110 },
  { title: '解析引擎', dataIndex: 'engine', width: 80 },
  { title: '样例日志', dataIndex: 'sample', ellipsis: true },
  { title: '来源', key: 'sourceType', width: 80 },
  { title: '操作', key: 'action', width: 180 },
]
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }
</style>
