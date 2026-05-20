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
      <a-button type="primary" style="margin-left: auto">新建任务</a-button>
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
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
import { ref } from 'vue'
const search = ref('')
const scene = ref(null)
const status = ref(null)
const resourceType1 = ref(null)
const resourceType2 = ref(null)
const deployStatus = ref(null)
const data = ref([
  { id: 1, name: 'ECS-异常采集', scene: '异常日志', enabled: true, resType1: '云服务', resType2: '微服务', target: 'ecs-service(4)', region: '华北2', deployStatus: '已下发', lastCollect: '2026-05-20 14:35:20' },
  { id: 2, name: 'RDS-全量采集', scene: '全量日志', enabled: true, resType1: '云服务', resType2: '微服务', target: 'rds-service(2)', region: '华东1', deployStatus: '已下发', lastCollect: '2026-05-20 14:30:00' },
  { id: 3, name: '物理机-系统日志', scene: '自定义', enabled: false, resType1: '物理资源', resType2: '虚拟机', target: '192.168.1.10(1)', region: '华北2', deployStatus: '待下发', lastCollect: '-' },
  { id: 4, name: '交换机-流量采集', scene: '全量日志', enabled: true, resType1: '云资源', resType2: '交换机', target: 'sw-core-01(1)', region: '华东1', deployStatus: '下发中', lastCollect: '2026-05-20 14:20:00' },
  { id: 5, name: 'API网关-错误日志', scene: '异常日志', enabled: true, resType1: '云服务', resType2: '微服务', target: 'api-gateway(3)', region: '华北2', deployStatus: '已下发', lastCollect: '2026-05-20 14:35:18' },
])
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
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }
</style>
