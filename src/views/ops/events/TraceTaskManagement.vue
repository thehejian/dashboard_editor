<template>
  <div>
    <div class="breadcrumb"><span>异常事件管理</span> / <span>日志追踪</span></div>
    <h3 style="margin-bottom:16px">日志追踪任务管理</h3>
    <div class="filter-bar">
      <a-select v-model:value="filters.traceType" style="width:130px" placeholder="任务类型" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="event">事件追踪</a-select-option>
        <a-select-option value="realtime">实时追踪</a-select-option>
      </a-select>
      <a-select v-model:value="filters.status" style="width:130px" placeholder="任务状态" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="pending">待执行</a-select-option>
        <a-select-option value="running">执行中</a-select-option>
        <a-select-option value="completed">已完成</a-select-option>
        <a-select-option value="failed">失败</a-select-option>
        <a-select-option value="no_log">日志不存在</a-select-option>
        <a-select-option value="stopped">已停止</a-select-option>
      </a-select>
      <a-select v-model:value="filters.timeRange" style="width:130px" placeholder="时间范围" allowClear>
        <a-select-option value="1h">近 1 小时</a-select-option>
        <a-select-option value="6h">近 6 小时</a-select-option>
        <a-select-option value="24h">近 24 小时</a-select-option>
        <a-select-option value="7d">近 7 天</a-select-option>
      </a-select>
      <a-button type="primary" @click="handleSearch">查询</a-button>
      <a-button @click="handleReset">重置</a-button>
      <div style="flex:1;text-align:right;display:flex;gap:8px;justify-content:flex-end">
        <a-button type="primary" @click="openCreate('realtime')">+ 创建实时追踪</a-button>
        <a-button type="primary" @click="openCreate('event')">+ 创建事件追踪</a-button>
      </div>
    </div>
    <a-table :columns="columns" :data-source="filteredData" :pagination="pagination" row-key="id" :row-selection="{ selectedRowKeys, onChange: onSelectChange }" :scroll="{ x: 1100 }" @change="onTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'traceType'"><a-tag :color="record.traceType === 'event' ? '#1890ff' : '#52c41a'">{{ record.traceType === 'event' ? '事件追踪' : '实时追踪' }}</a-tag></template>
        <template v-if="column.key === 'status'"><a-tag :color="TASK_STATUS_COLORS[record.status]">{{ TASK_STATUS[record.status] }}</a-tag></template>
        <template v-if="column.key === 'ciType'">{{ CI_TYPE_MAP[record.ciType] || record.ciType }}</template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="goResult(record)">查看结果</a>
            <a v-if="record.status === 'running'" @click="stopTask(record)" style="color:#ff4d4f">停止</a>
          </a-space>
        </template>
      </template>
    </a-table>
    <a-modal v-model:open="createModalOpen" :title="createType === 'event' ? '创建事件追踪' : '创建实时追踪'" :footer="null" width="520px" destroyOnClose>
      <a-form layout="vertical">
        <a-form-item label="追踪类型"><a-tag :color="createType === 'event' ? '#1890ff' : '#52c41a'">{{ createType === 'event' ? '事件追踪' : '实时追踪' }}</a-tag></a-form-item>
        <a-form-item v-if="createType === 'event'" label="关联事件 ID"><a-input v-model:value="form.eventId" /></a-form-item>
        <a-form-item v-if="createType === 'event'" label="事件前行数" required><a-input-number v-model:value="form.beforeLines" :min="1" :max="1000" style="width:100%" /></a-form-item>
        <a-form-item v-if="createType === 'event'" label="事件后行数" required><a-input-number v-model:value="form.afterLines" :min="1" :max="1000" style="width:100%" /></a-form-item>
        <a-form-item v-if="createType === 'realtime'" label="追踪时长（分钟）" required><a-input-number v-model:value="form.duration" :min="1" :max="60" style="width:100%" /></a-form-item>
        <a-form-item label="资源类型"><a-input v-model:value="form.ciType" /></a-form-item>
        <a-form-item label="资源子类型"><a-input v-model:value="form.ciIndex" /></a-form-item>
        <a-form-item label="日志文件路径" required><a-input v-model:value="form.logFilePath" /></a-form-item>
        <a-form-item label="来源主机名"><a-input v-model:value="form.sourceHost" /></a-form-item>
        <a-form-item label="来源主机 IP"><a-input v-model:value="form.sourceIp" /></a-form-item>
      </a-form>
      <template #footer><a-space><a-button @click="createModalOpen = false">取消</a-button><a-button type="primary" @click="handleCreate">创建追踪任务</a-button></a-space></template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MOCK_TRACE_TASKS, TASK_STATUS, TASK_STATUS_COLORS } from './mockData.js'

const router = useRouter()
const CI_TYPE_MAP = { SYS_DeployComponent: '微服务', CLOUD_VM: '虚拟机', CLOUD_GAUSSDB_INSTANCE: 'GaussDB 实例', CLOUD_PM: '物理机' }

const filters = reactive({ traceType: '', status: '', timeRange: '' })
const selectedRowKeys = ref([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: t => `共 ${t} 条` })
const rawData = ref([...MOCK_TRACE_TASKS])

const filteredData = computed(() => {
  let data = [...rawData.value]
  if (filters.traceType) data = data.filter(t => t.traceType === filters.traceType)
  if (filters.status) data = data.filter(t => t.status === filters.status)
  pagination.total = data.length
  return data
})

const columns = [
  { title: '任务类型', key: 'traceType', width: 100 },
  { title: '任务状态', key: 'status', width: 90 },
  { title: '资源名称', dataIndex: 'ciName', width: 150 },
  { title: '资源类型', key: 'ciType', width: 100 },
  { title: '资源子类型', dataIndex: 'ciIndex', width: 180 },
  { title: '日志文件路径', dataIndex: 'logFilePath', width: 200, ellipsis: true },
  { title: '来源主机', key: 'host', width: 120, customRender: ({ record }) => `${record.sourceHost} / ${record.sourceIp}` },
  { title: '结果行数', dataIndex: 'resultCount', width: 100 },
  { title: '创建时间', dataIndex: 'createAt', width: 150 },
  { title: '操作', key: 'action', width: 140 },
]

const createModalOpen = ref(false)
const createType = ref('event')
const form = reactive({ eventId: '', beforeLines: 5, afterLines: 5, duration: 10, ciType: '', ciIndex: '', logFilePath: '', sourceHost: '', sourceIp: '' })

function openCreate(type) { createType.value = type; form.eventId = ''; form.logFilePath = ''; form.ciType = ''; form.ciIndex = ''; form.sourceHost = ''; form.sourceIp = ''; createModalOpen.value = true }
function handleSearch() { }
function handleReset() { Object.keys(filters).forEach(k => filters[k] = '') }
function onSelectChange(keys) { selectedRowKeys.value = keys }
function onTableChange(pag) { pagination.current = pag.current }
function goResult(task) { router.push({ path: '/ops/events/trace/result', query: { taskId: task.id } }) }
function stopTask(task) { task.status = 'stopped' }
function handleCreate() { createModalOpen.value = false }
onMounted(() => { pagination.total = filteredData.value.length })
</script>

<style scoped>
.breadcrumb { font-size: 12px; color: #999; margin-bottom: 16px; }
.breadcrumb span { color: #999; }
.breadcrumb span:last-child { color: #333; font-weight: 500; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; background: #fff; padding: 12px; border: 1px solid #e8e8e8; border-radius: 6px; }
</style>