<template>
  <div>
    <div class="page-header">
      <h3>日志采集模板</h3>
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
      <a-button type="primary" style="margin-left: auto">新建模板</a-button>
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id" :scroll="{ x: 700 }">
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
import { ref, onMounted } from 'vue'
const search = ref('')
const scene = ref(null)
const sourceType = ref(null)
const data = ref([
  { id: 1, name: 'Nginx访问日志', scene: '应用', engine: 'iLogtail', sample: '$remote_addr - $remote_user [$time_local] "$request"', sourceType: '文件' },
  { id: 2, name: 'MySQL慢查询', scene: '数据库', engine: 'Filebeat', sample: '# Time: $time\n# User@Host: $user', sourceType: '文件' },
  { id: 3, name: 'Java应用日志', scene: '应用', engine: 'Logstash', sample: '%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n', sourceType: '文件' },
  { id: 4, name: '系统日志', scene: '系统', engine: 'Rsyslog', sample: '%timegenerated %hostname %syslogtag %msg', sourceType: 'Syslog' },
  { id: 5, name: 'K8s容器日志', scene: '容器', engine: 'Fluentd', sample: '{json结构}', sourceType: '标准输出' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/log_templates?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          scene: item.scene,
          engine: item.engine,
          sample: item.sample,
          sourceType: item.source_type,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
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
@media (max-width: 768px) {
  .filter-bar { flex-wrap: wrap; }
  .filter-bar :deep(.ant-select),
  .filter-bar :deep(.ant-input-search),
  .filter-bar :deep(.ant-btn) { flex: 1 1 calc(50% - 4px); min-width: 0; }
  .filter-bar :deep(.ant-btn[style*="margin-left"]) { margin-left: 0 !important; }
  .page-header h3 { font-size: 15px; }
}
</style>
