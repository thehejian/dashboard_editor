<template>
  <div>
    <div class="page-header">
      <h3>日志采集任务</h3>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="scene" placeholder="场景类型" style="width: 130px" allowClear>
        <a-select-option value="异常日志">异常日志</a-select-option>
        <a-select-option value="全量日志">全量日志</a-select-option>
        <a-select-option value="自定义">自定义</a-select-option>
      </a-select>
      <a-select v-model:value="status" placeholder="状态" style="width: 100px" allowClear>
        <a-select-option value="启用">启用</a-select-option>
        <a-select-option value="停用">停用</a-select-option>
      </a-select>
      <a-select v-model:value="resourceType1" placeholder="资源类型" style="width: 130px" allowClear>
        <a-select-option value="云服务">云服务</a-select-option>
        <a-select-option value="云资源">云资源</a-select-option>
        <a-select-option value="物理资源">物理资源</a-select-option>
      </a-select>
      <a-select v-model:value="resourceType2" placeholder="资源细类" style="width: 120px" allowClear>
        <a-select-option value="微服务">微服务</a-select-option>
        <a-select-option value="虚拟机">虚拟机</a-select-option>
        <a-select-option value="交换机">交换机</a-select-option>
      </a-select>
      <a-select v-model:value="deployStatus" placeholder="下发状态" style="width: 120px" allowClear>
        <a-select-option value="待下发">待下发</a-select-option>
        <a-select-option value="下发中">下发中</a-select-option>
        <a-select-option value="已下发">已下发</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="综合搜索任务名/采集对象" style="width: 280px" />
      <a-button type="primary" style="margin-left: auto" @click="goCreate">新建任务</a-button>
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id" :scroll="{ x: 900 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'scene'">
          <a-tag :color="record.scene === '异常日志' ? 'red' : record.scene === '全量日志' ? 'blue' : 'orange'">{{ record.scene }}</a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-switch v-model:checked="record.enabled" size="small" />
        </template>
        <template v-if="column.key === 'deployStatus'">
          <a-tag :color="record.deployStatus === '已下发' ? 'green' : record.deployStatus === '下发中' ? 'blue' : 'default'">{{ record.deployStatus }}</a-tag>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const search = ref('')
const scene = ref(null)
const status = ref(null)
const resourceType1 = ref(null)
const resourceType2 = ref(null)
const deployStatus = ref(null)
const data = ref([
  { id: 1, name: '应用日志采集', scene: '应用', enabled: true, resType1: '应用', resType2: '', target: '所有应用节点', region: '华北区域一', deployStatus: 'deployed', lastCollect: '2026-06-17 10:30:00' },
  { id: 2, name: 'DB错误日志', scene: '数据库', enabled: true, resType1: '数据库', resType2: '', target: '数据库集群', region: '华北区域一,华东区域一', deployStatus: 'deployed', lastCollect: '2026-06-17 10:30:00' },
  { id: 3, name: '安全审计日志', scene: '安全', enabled: true, resType1: '安全', resType2: '', target: '所有节点', region: '全部区域', deployStatus: 'deployed', lastCollect: '2026-06-17 10:30:00' },
  { id: 4, name: '中间件日志', scene: '中间件', enabled: false, resType1: '中间件', resType2: '', target: 'Redis/Kafka节点', region: '华南区域', deployStatus: 'pending', lastCollect: null },
  { id: 5, name: '网络设备日志', scene: '网络', enabled: true, resType1: '网络', resType2: '', target: '核心交换机', region: '华北区域一', deployStatus: 'deployed', lastCollect: '2026-06-17 10:25:00' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/log_collect_tasks?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          scene: item.scene,
          enabled: item.enabled,
          resType1: item.scene,
          resType2: '',
          target: item.target,
          region: item.region,
          deployStatus: item.deploy_status,
          lastCollect: item.last_collect,
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
  { title: '任务名', dataIndex: 'name' },
  { title: '场景类型', key: 'scene', width: 110 },
  { title: '状态', key: 'status', width: 70 },
  { title: '资源类型', dataIndex: 'resType1', width: 90 },
  { title: '资源细类', dataIndex: 'resType2', width: 90 },
  { title: '采集对象', dataIndex: 'target' },
  { title: '区域', dataIndex: 'region', width: 80 },
  { title: '下发状态', key: 'deployStatus', width: 90 },
  { title: '最后采集时间', dataIndex: 'lastCollect', width: 170 },
  { title: '操作', key: 'action', width: 180 },
]
function goCreate() {
  router.push('/ops/logs/config/tasks/create')
}
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
